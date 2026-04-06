#!/usr/bin/env python3
"""
upload_food_images.py
=====================
Sube imágenes de alimentos generadas manualmente a Supabase Storage
y actualiza la columna image_url en la tabla foods.

FLUJO:
------
1. Genera la imagen en Google AI Studio (https://aistudio.google.com)
   Prompt sugerido:
   "Food photography, professional studio shot, white background, soft natural
    lighting, top-down view, appetizing, realistic photo of: [alimento].
    No text, no labels, no watermarks."

2. Descarga la imagen y guárdala en scripts/food-images/
   El nombre del archivo debe coincidir exactamente con el nombre del alimento en BD:
     Manzana.png  →  busca foods WHERE name = 'Manzana'
     Pollo asado.jpg  →  busca foods WHERE name = 'Pollo asado'
   Formatos soportados: .png .jpg .jpeg .webp

3. Ejecuta:
   scripts/.venv/bin/python3 scripts/upload_food_images.py

   # Vista previa sin subir nada:
   scripts/.venv/bin/python3 scripts/upload_food_images.py --dry-run

   # Ver qué alimentos faltan imagen:
   scripts/.venv/bin/python3 scripts/upload_food_images.py --pending
"""

import argparse
import io
import sys
from pathlib import Path

try:
    from dotenv import dotenv_values
    from PIL import Image
    from supabase import create_client, Client
except ImportError as e:
    sys.exit(f"❌  Falta dependencia: {e}\n   Ejecuta: pip install -r scripts/requirements_images.txt")

# ── Config ─────────────────────────────────────────────────────────────────────
IMAGES_DIR = Path(__file__).parent / "food-images"
BUCKET = "food-images"
STORAGE_PREFIX = "foods"
WEBP_QUALITY = 88
OUTPUT_SIZE = (512, 512)
SUPPORTED_EXT = {".png", ".jpg", ".jpeg", ".webp"}


# ── Helpers ────────────────────────────────────────────────────────────────────
def load_env() -> dict:
    env_path = Path(__file__).parent.parent / ".env.local"
    if not env_path.exists():
        sys.exit(f"❌  No se encontró .env.local en {env_path}")
    return dotenv_values(env_path)


def get_supabase(env: dict) -> Client:
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        sys.exit("❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
    return create_client(url, key)


def to_webp(path: Path) -> bytes:
    img = Image.open(path).convert("RGB").resize(OUTPUT_SIZE, Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
    return buf.getvalue()


def upload(sb: Client, food_id: str, webp_bytes: bytes) -> str:
    storage_path = f"{STORAGE_PREFIX}/{food_id}.webp"
    sb.storage.from_(BUCKET).upload(
        path=storage_path,
        file=webp_bytes,
        file_options={"content-type": "image/webp", "upsert": "true"},
    )
    return sb.storage.from_(BUCKET).get_public_url(storage_path)


# ── Comandos ────────────────────────────────────────────────────────────────────
def cmd_pending(sb: Client):
    """Lista alimentos sin imagen en la BD."""
    res = sb.table("foods").select("name, category").is_("image_url", "null").order("name").execute()
    items = res.data
    if not items:
        print("✅  Todos los alimentos tienen imagen.")
        return
    print(f"\n📋  {len(items)} alimentos sin imagen:\n{'─'*40}")
    for f in items:
        print(f"  • {f['name']}  ({f.get('category', '—')})")
    print()


def cmd_upload(sb: Client, dry_run: bool):
    """Sube todas las imágenes de la carpeta food-images/."""
    if not IMAGES_DIR.exists():
        IMAGES_DIR.mkdir(parents=True)
        print(f"📁  Carpeta creada: {IMAGES_DIR}")
        print("    Guarda aquí las imágenes con el nombre exacto del alimento.")
        return

    image_files = [f for f in IMAGES_DIR.iterdir() if f.suffix.lower() in SUPPORTED_EXT]
    if not image_files:
        print(f"📭  No hay imágenes en {IMAGES_DIR}")
        print("    Guarda imágenes con nombres como: Manzana.png, Pollo asado.jpg")
        return

    print(f"\n🍽  {len(image_files)} imagen(es) encontrada(s){'  [DRY RUN]' if dry_run else ''}...\n{'─'*45}")

    ok = fail = skip = 0

    for img_path in sorted(image_files):
        food_name = img_path.stem  # nombre sin extensión

        # Buscar en BD por nombre exacto
        res = sb.table("foods").select("id, name").eq("name", food_name).maybeSingle().execute()
        food = res.data

        if not food:
            print(f"  ⚠️   '{food_name}' — no encontrado en BD (¿nombre exacto?)")
            skip += 1
            continue

        if dry_run:
            print(f"  🔍  '{food_name}' → se subiría como {food['id']}.webp")
            ok += 1
            continue

        try:
            webp_bytes = to_webp(img_path)
            url = upload(sb, food["id"], webp_bytes)
            sb.table("foods").update({"image_url": url}).eq("id", food["id"]).execute()
            print(f"  ✅  {food_name}")
            ok += 1
        except Exception as e:
            print(f"  ❌  {food_name} → {str(e)[:100]}")
            fail += 1

    print(f"\n{'─'*45}")
    if dry_run:
        print(f"  DRY RUN: {ok} se subirían, {skip} sin coincidencia en BD\n")
    else:
        print(f"  ✅ Subidas: {ok}   ❌ Fallidas: {fail}   ⚠️ Sin BD: {skip}\n")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Sube imágenes de alimentos a Supabase")
    parser.add_argument("--pending",  action="store_true", help="Lista alimentos sin imagen")
    parser.add_argument("--dry-run",  action="store_true", help="Vista previa sin subir nada")
    args = parser.parse_args()

    env = load_env()
    sb = get_supabase(env)

    if args.pending:
        cmd_pending(sb)
    else:
        cmd_upload(sb, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
