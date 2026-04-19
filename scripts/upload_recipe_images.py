#!/usr/bin/env python3
"""
Sube a Supabase las imágenes descargadas manualmente desde una Gem.

Flujo:
  1. Generar queue con build_recipe_image_queue.py.
  2. Descargar cada imagen con el índice como nombre (001.png, 002.jpg, ...)
     y dejarla en scripts/recipe-images/.
  3. Ejecutar este script — convierte a webp, sube al bucket y actualiza
     recipes.image_url.

Idempotente: salta recetas que ya tienen image_url salvo --refill.
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
from pathlib import Path

INDEX_RE = re.compile(r"(\d{3})")

try:
    from dotenv import dotenv_values
    from PIL import Image
    from supabase import Client, create_client
except ImportError as exc:
    sys.exit(
        f"Falta dependencia: {exc}\n"
        "Ejecuta: pip install -r scripts/requirements_images.txt"
    )


REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = REPO_ROOT / ".env.local"
IMAGES_DIR = REPO_ROOT / "scripts" / "recipe-images"
QUEUE_PATH = IMAGES_DIR / "queue.json"
BUCKET = "food-images"
STORAGE_PREFIX = "recipes"
OUTPUT_SIZE = (768, 768)
WEBP_QUALITY = 90
SUPPORTED_EXT = {".png", ".jpg", ".jpeg", ".webp"}


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


def load_queue() -> dict:
    if not QUEUE_PATH.exists():
        sys.exit(
            f"No existe {QUEUE_PATH}. Genera la cola primero con:\n"
            "  python3 scripts/build_recipe_image_queue.py <bundle_dir>"
        )
    return json.loads(QUEUE_PATH.read_text(encoding="utf-8"))


def to_webp(path: Path) -> bytes:
    img = Image.open(path).convert("RGB").resize(OUTPUT_SIZE, Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
    return buf.getvalue()


def upload(sb: Client, bundle_id: str, slug: str, webp_bytes: bytes) -> str:
    storage_path = f"{STORAGE_PREFIX}/{bundle_id}/{slug}.webp"
    sb.storage.from_(BUCKET).upload(
        path=storage_path,
        file=webp_bytes,
        file_options={"content-type": "image/webp", "upsert": "true"},
    )
    return sb.storage.from_(BUCKET).get_public_url(storage_path)


def find_recipe(sb: Client, bundle_id: str, slug: str) -> dict | None:
    source_url = f"bundle://{bundle_id}/recipe/{slug}"
    res = (
        sb.table("recipes")
        .select("id, image_url")
        .eq("source_url", source_url)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def cmd_pending(queue: dict, sb: Client) -> None:
    bundle_id = queue["bundle_id"]
    missing = []
    for entry in queue["entries"]:
        recipe = find_recipe(sb, bundle_id, entry["slug"])
        if recipe and not recipe.get("image_url"):
            missing.append(entry)
    if not missing:
        print("Todas las recetas del queue tienen imagen.")
        return
    print(f"{len(missing)} recetas sin imagen:\n")
    for entry in missing:
        print(f"  {entry['index']} — {entry['title']}")


def extract_index(stem: str, valid_indices: set[str]) -> str | None:
    if stem in valid_indices:
        return stem
    for candidate in INDEX_RE.findall(stem):
        if candidate in valid_indices:
            return candidate
    return None


def cmd_upload(
    queue: dict,
    sb: Client,
    *,
    dry_run: bool,
    refill: bool,
    only: set[str] | None,
    auto_index_start: str | None,
) -> None:
    bundle_id = queue["bundle_id"]

    index_to_entry = {entry["index"]: entry for entry in queue["entries"]}
    valid_indices = set(index_to_entry.keys())

    if not IMAGES_DIR.exists():
        IMAGES_DIR.mkdir(parents=True)

    image_files = sorted(
        (f for f in IMAGES_DIR.iterdir()
         if f.is_file() and f.suffix.lower() in SUPPORTED_EXT),
    )
    if not image_files:
        print(f"No hay imágenes en {IMAGES_DIR}")
        return

    auto_assignments: dict[Path, str] = {}
    if auto_index_start is not None:
        if not (auto_index_start.isdigit() and len(auto_index_start) == 3):
            sys.exit("--auto-index requiere un valor de 3 dígitos (ej: 001)")
        unindexed = sorted(
            (f for f in image_files if extract_index(f.stem, valid_indices) is None),
            key=lambda p: p.stat().st_mtime,
        )
        start = int(auto_index_start)
        for offset, path in enumerate(unindexed):
            candidate = f"{start + offset:03d}"
            if candidate not in valid_indices:
                sys.exit(f"Índice {candidate} no existe en queue.json — bajá el --auto-index")
            auto_assignments[path] = candidate

    ok = fail = skip = 0

    for img_path in image_files:
        index = extract_index(img_path.stem, valid_indices)
        if index is None:
            index = auto_assignments.get(img_path)
        if index is None:
            print(f"  [skip] {img_path.name}: no se detecta índice (usa --auto-index)")
            skip += 1
            continue
        if only and index not in only:
            continue

        entry = index_to_entry[index]

        slug = entry["slug"]
        recipe = find_recipe(sb, bundle_id, slug)
        if not recipe:
            print(f"  [skip] {index} {slug}: receta no encontrada en BD")
            skip += 1
            continue

        if recipe.get("image_url") and not refill:
            print(f"  [skip] {index} {slug}: ya tiene image_url (usa --refill para sobrescribir)")
            skip += 1
            continue

        if dry_run:
            print(f"  [dry]  {index} {slug} → se subiría")
            ok += 1
            continue

        try:
            webp_bytes = to_webp(img_path)
            url = upload(sb, bundle_id, slug, webp_bytes)
            sb.table("recipes").update({"image_url": url}).eq("id", recipe["id"]).execute()
            if img_path in auto_assignments:
                new_path = img_path.with_name(f"{index}{img_path.suffix.lower()}")
                if not new_path.exists():
                    img_path.rename(new_path)
            print(f"  [ok]   {index} {slug}")
            ok += 1
        except Exception as exc:
            print(f"  [fail] {index} {slug}: {str(exc)[:120]}")
            fail += 1

    tag = "dry-run" if dry_run else "subidas"
    print(f"\n{tag}: {ok}   fallos: {fail}   saltadas: {skip}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sube imágenes de recetas desde scripts/recipe-images/")
    parser.add_argument("--pending", action="store_true", help="Lista las recetas del queue que siguen sin imagen")
    parser.add_argument("--dry-run", action="store_true", help="Vista previa sin escribir")
    parser.add_argument("--refill", action="store_true", help="Sobrescribe aunque ya haya imagen")
    parser.add_argument("--only", nargs="+", help="Sube solo estos índices (ej: 001 004 010)")
    parser.add_argument(
        "--auto-index",
        metavar="START",
        help="Asigna índices por orden de fecha de descarga a los archivos sin índice en el nombre (ej: 001)",
    )
    args = parser.parse_args()

    env = load_env()
    sb = get_supabase(env)
    queue = load_queue()

    if args.pending:
        cmd_pending(queue, sb)
    else:
        only = set(args.only) if args.only else None
        cmd_upload(
            queue,
            sb,
            dry_run=args.dry_run,
            refill=args.refill,
            only=only,
            auto_index_start=args.auto_index,
        )


if __name__ == "__main__":
    main()
