#!/usr/bin/env python3
"""
generate_food_images.py
=======================
Genera imágenes de alimentos con Google Imagen 3 y las sube a Supabase Storage.

SETUP (una sola vez):
---------------------
1. Añade GOOGLE_AI_KEY o GEMINI_API_KEY a .env.local (obtener en https://aistudio.google.com/apikey)

2. Crea el bucket 'food-images' en Supabase Dashboard:
   Storage → New bucket → Name: food-images → Public: ON → Create

3. Aplica la migración SQL en Supabase Dashboard → SQL Editor:
   ALTER TABLE foods ADD COLUMN IF NOT EXISTS image_url text;

4. Instala dependencias:
   pip install -r scripts/requirements_images.txt

EJECUCIÓN:
----------
   cd /Users/alex/Desktop/Nutria
   python3 scripts/generate_food_images.py

   # Solo un alimento concreto (para test):
   python3 scripts/generate_food_images.py --name "Manzana"

   # Límite de N imágenes:
   python3 scripts/generate_food_images.py --limit 10
"""

import argparse
import io
import os
import re
import sys
import time
from pathlib import Path

# ── Dependencias ─────────────────────────────────────────────────────────────
try:
    from dotenv import dotenv_values
    from google import genai
    from google.genai import types as genai_types
    from PIL import Image
    from supabase import create_client, Client
except ImportError as e:
    sys.exit(f"❌  Falta dependencia: {e}\n   Ejecuta: pip install -r scripts/requirements_images.txt")

# ── Config ────────────────────────────────────────────────────────────────────
BUCKET = "food-images"
STORAGE_PATH_PREFIX = "foods"
SLEEP_BETWEEN = 1.2          # segundos entre llamadas a la API
IMAGE_SIZE = (512, 512)       # resolución final en WebP
WEBP_QUALITY = 88

PROMPT_TEMPLATE = (
    "Food photography, professional studio shot, pure white background, "
    "soft natural diffused lighting, slight top-down angle, appetizing, "
    "hyper-realistic photo of: {name}. "
    "Spanish / Hispanic cuisine style if applicable. "
    "No text, no labels, no watermarks, no hands, no utensils, isolated food only."
)


# ── Cargar .env.local ─────────────────────────────────────────────────────────
def load_env() -> dict:
    env_path = Path(__file__).parent.parent / ".env.local"
    if not env_path.exists():
        sys.exit(f"❌  No se encontró .env.local en {env_path}")
    return dotenv_values(env_path)


# ── Supabase client ───────────────────────────────────────────────────────────
def get_supabase(env: dict) -> Client:
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        sys.exit("❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
    return create_client(url, key)


# ── Generar imagen con Gemini Flash Image ────────────────────────────────────
def generate_image_bytes(client, food_name: str):
    prompt = PROMPT_TEMPLATE.format(name=food_name)
    result = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )
    for part in result.candidates[0].content.parts:
        if part.inline_data is not None:
            return Image.open(io.BytesIO(part.inline_data.data))
    raise RuntimeError("La API no devolvió ninguna imagen en la respuesta")


# ── Convertir PIL → WebP bytes ────────────────────────────────────────────────
def to_webp(pil_image) -> bytes:
    pil_image = pil_image.convert("RGB").resize(IMAGE_SIZE, Image.LANCZOS)
    buf = io.BytesIO()
    pil_image.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
    return buf.getvalue()


# ── Subir a Supabase Storage ──────────────────────────────────────────────────
def upload_to_storage(sb: Client, food_id: str, webp_bytes: bytes) -> str:
    path = f"{STORAGE_PATH_PREFIX}/{food_id}.webp"
    sb.storage.from_(BUCKET).upload(
        path=path,
        file=webp_bytes,
        file_options={"content-type": "image/webp", "upsert": "true"},
    )
    # URL pública
    public = sb.storage.from_(BUCKET).get_public_url(path)
    return public


# ── Actualizar image_url en la tabla ─────────────────────────────────────────
def update_image_url(sb: Client, food_id: str, url: str) -> None:
    sb.table("foods").update({"image_url": url}).eq("id", food_id).execute()


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Genera imágenes de alimentos con IA")
    parser.add_argument("--limit",  type=int, default=None, help="Máximo de alimentos a procesar")
    parser.add_argument("--name",   type=str, default=None, help="Procesar solo este alimento (búsqueda exacta)")
    parser.add_argument("--refill", action="store_true",    help="Re-generar aunque ya tengan imagen")
    args = parser.parse_args()

    env = load_env()

    # Google AI / Gemini
    google_key = env.get("GOOGLE_AI_KEY", "").strip() or env.get("GEMINI_API_KEY", "").strip()
    if not google_key:
        sys.exit(
            "❌  Falta GOOGLE_AI_KEY o GEMINI_API_KEY en .env.local\n"
            "   Obtén tu clave en: https://aistudio.google.com/apikey\n"
            "   Luego añade: GEMINI_API_KEY=tu_clave"
        )
    ai_client = genai.Client(api_key=google_key)

    # Supabase
    sb = get_supabase(env)

    # Obtener alimentos
    query = sb.table("foods").select("id, name, category, image_url")
    if args.name:
        query = query.eq("name", args.name)
    elif not args.refill:
        query = query.is_("image_url", "null")
    if args.limit:
        query = query.limit(args.limit)

    response = query.order("name").execute()
    foods = response.data

    if not foods:
        print("✅  No hay alimentos pendientes de imagen.")
        return

    total = len(foods)
    ok = 0
    fail = 0

    print(f"\n🍽  Procesando {total} alimentos...\n{'─'*45}")

    for i, food in enumerate(foods, 1):
        fid   = food["id"]
        fname = food["name"]
        cat   = food.get("category", "")
        prefix = f"[{i:>3}/{total}]"

        try:
            pil_img  = generate_image_bytes(ai_client, fname)
            webp_buf = to_webp(pil_img)
            url      = upload_to_storage(sb, fid, webp_buf)
            update_image_url(sb, fid, url)
            print(f"{prefix} ✅  {fname}  ({cat})")
            ok += 1
        except Exception as e:
            err = str(e)[:120]
            print(f"{prefix} ❌  {fname}  → {err}")
            fail += 1

        if i < total:
            time.sleep(SLEEP_BETWEEN)

    print(f"\n{'─'*45}")
    print(f"✅  Generadas: {ok}   ❌  Fallidas: {fail}   Total: {total}\n")


if __name__ == "__main__":
    main()
