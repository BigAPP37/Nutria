#!/usr/bin/env python3
"""
Genera imágenes para las recetas del bundle usando Gemini y las sube a Supabase.

Por defecto solo procesa recetas con image_url = null.
Sin --all-recipes, trabaja solo con las recetas del queue (las usadas en planes).

Ejemplos:
  scripts/.venv/bin/python3 scripts/generate_recipe_images.py --limit 10
  scripts/.venv/bin/python3 scripts/generate_recipe_images.py
  scripts/.venv/bin/python3 scripts/generate_recipe_images.py --all-recipes
  scripts/.venv/bin/python3 scripts/generate_recipe_images.py --refill --limit 5
"""

from __future__ import annotations

import argparse
import io
import json
import sys
import time
from pathlib import Path

try:
    from dotenv import dotenv_values
    from google import genai
    from google.genai import types as genai_types
    from PIL import Image
    from supabase import Client, create_client
except ImportError as exc:
    sys.exit(
        f"Falta dependencia: {exc}\n"
        "Ejecuta: pip install -r scripts/requirements_images.txt"
    )

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = REPO_ROOT / ".env.local"
QUEUE_PATH = REPO_ROOT / "scripts" / "recipe-images" / "queue.json"

BUCKET = "food-images"
STORAGE_PREFIX = "recipes"
IMAGE_SIZE = (768, 768)
WEBP_QUALITY = 90
SLEEP_BETWEEN = 1.5

PROMPT_TEMPLATE = (
    "Food photography of a plated dish, professional, soft natural light, "
    "slightly top-down angle, appetizing, hyper-realistic. "
    "Spanish / Hispanic cuisine style if applicable. "
    "No text, no labels, no watermarks, no hands. "
    "Dish: {title}. {description}"
)


def load_env() -> dict:
    if not ENV_PATH.exists():
        sys.exit(f"No se encontró .env.local en {ENV_PATH}")
    return dotenv_values(ENV_PATH)


def get_supabase(env: dict) -> Client:
    url = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
    key = (env.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        sys.exit("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
    return create_client(url, key)


def get_ai_client(env: dict):
    key = (env.get("GEMINI_API_KEY") or env.get("GOOGLE_AI_KEY") or "").strip()
    if not key:
        sys.exit(
            "Falta GEMINI_API_KEY en .env.local\n"
            "Obtén tu clave en: https://aistudio.google.com/apikey"
        )
    return genai.Client(api_key=key)


def generate_image(ai_client, title: str, description: str) -> Image.Image:
    prompt = PROMPT_TEMPLATE.format(
        title=title,
        description=(description or "").strip(),
    )
    result = ai_client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )
    for part in result.candidates[0].content.parts:
        if part.inline_data is not None:
            return Image.open(io.BytesIO(part.inline_data.data))
    raise RuntimeError("Gemini no devolvió imagen")


def to_webp(pil_image: Image.Image) -> bytes:
    pil_image = pil_image.convert("RGB").resize(IMAGE_SIZE, Image.LANCZOS)
    buf = io.BytesIO()
    pil_image.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
    return buf.getvalue()


def upload(sb: Client, bundle_id: str, slug: str, webp_bytes: bytes) -> str:
    path = f"{STORAGE_PREFIX}/{bundle_id}/{slug}.webp"
    sb.storage.from_(BUCKET).upload(
        path=path,
        file=webp_bytes,
        file_options={"content-type": "image/webp", "upsert": "true"},
    )
    return sb.storage.from_(BUCKET).get_public_url(path)


def fetch_pending_recipes(sb: Client, bundle_id: str, slugs: list[str] | None, refill: bool) -> list[dict]:
    query = sb.table("recipes").select("id, source_url, title, description, image_url")
    query = query.like("source_url", f"bundle://{bundle_id}/recipe/%")
    if not refill:
        query = query.is_("image_url", "null")
    res = query.order("source_url").execute()
    rows = res.data or []
    if slugs is not None:
        slug_set = set(slugs)
        rows = [r for r in rows if r["source_url"].split("/recipe/")[-1] in slug_set]
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera imágenes de recetas con Gemini")
    parser.add_argument("--limit", type=int, default=None, help="Máximo de recetas a procesar")
    parser.add_argument("--refill", action="store_true", help="Re-generar aunque ya tengan imagen")
    parser.add_argument(
        "--all-recipes",
        action="store_true",
        help="Procesar todas las recetas del bundle (por defecto solo las del queue/planes)",
    )
    args = parser.parse_args()

    env = load_env()
    ai_client = get_ai_client(env)
    sb = get_supabase(env)

    if not QUEUE_PATH.exists():
        sys.exit(
            f"No existe {QUEUE_PATH}\n"
            "Genera la cola primero con:\n"
            "  python3 scripts/build_recipe_image_queue.py <bundle_dir>"
        )
    queue = json.loads(QUEUE_PATH.read_text(encoding="utf-8"))
    bundle_id = queue["bundle_id"]

    plan_slugs = None if args.all_recipes else [e["slug"] for e in queue["entries"]]

    recipes = fetch_pending_recipes(sb, bundle_id, plan_slugs, args.refill)
    if args.limit:
        recipes = recipes[: args.limit]

    if not recipes:
        print("No hay recetas pendientes de imagen.")
        return

    total = len(recipes)
    ok = fail = 0
    print(f"\nGenerando imágenes para {total} recetas...\n{'─' * 50}")

    for i, recipe in enumerate(recipes, 1):
        slug = recipe["source_url"].split("/recipe/")[-1]
        prefix = f"[{i:>{len(str(total))}}/{total}]"
        try:
            pil_img = generate_image(ai_client, recipe["title"], recipe.get("description") or "")
            webp_bytes = to_webp(pil_img)
            url = upload(sb, bundle_id, slug, webp_bytes)
            sb.table("recipes").update({"image_url": url}).eq("id", recipe["id"]).execute()
            print(f"{prefix} ✅  {recipe['title']}")
            ok += 1
        except Exception as exc:
            print(f"{prefix} ❌  {recipe['title']} → {str(exc)[:120]}")
            fail += 1

        if i < total:
            time.sleep(SLEEP_BETWEEN)

    print(f"\n{'─' * 50}")
    print(f"Generadas: {ok}   Fallidas: {fail}   Total: {total}\n")


if __name__ == "__main__":
    main()
