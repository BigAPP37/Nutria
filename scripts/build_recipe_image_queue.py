#!/usr/bin/env python3
"""
Genera la cola de imágenes pendientes para un bundle.

Lee manifest.json, se queda solo con las recetas que aparecen en los planes
(las que de verdad hay que fotografiar primero), y escribe:

  scripts/recipe-images/queue.json   — usada por upload_recipe_images.py
  scripts/recipe-images/queue.md     — lista humana con prompts para la Gem
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = REPO_ROOT / "scripts" / "recipe-images"

PROMPT_TEMPLATE = (
    "Food photography of a plated dish, professional, soft natural light, "
    "top-down view, appetizing, realistic. No text, no labels, no watermarks. "
    "Dish: {title}."
)


def build_prompt(recipe: dict) -> str:
    prompt = PROMPT_TEMPLATE.format(title=recipe["title"])
    description = (recipe.get("description") or "").strip()
    if description:
        prompt += f" {description}"
    return prompt


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera la cola de imágenes de un bundle")
    parser.add_argument("bundle_dir", help="Ruta de la carpeta del bundle")
    parser.add_argument(
        "--include-unused",
        action="store_true",
        help="Incluye también recetas que no aparecen en ningún plan",
    )
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir).resolve()
    manifest_path = bundle_dir / "manifest.json"
    if not manifest_path.exists():
        sys.exit(f"No existe {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    bundle_id = manifest["bundle_id"]

    used_slugs: set[str] = set()
    for plan in manifest.get("plans") or []:
        for day in plan.get("days") or []:
            for meal in day.get("meals") or []:
                used_slugs.add(meal["recipe_slug"])

    recipes_by_slug = {r["slug"]: r for r in manifest.get("recipes") or []}

    if args.include_unused:
        target_slugs = list(recipes_by_slug.keys())
    else:
        target_slugs = [s for s in recipes_by_slug if s in used_slugs]

    target_slugs.sort(key=lambda s: (
        recipes_by_slug[s].get("meal_type") or "",
        recipes_by_slug[s].get("title") or "",
    ))

    entries = []
    for index, slug in enumerate(target_slugs, 1):
        recipe = recipes_by_slug[slug]
        entries.append({
            "index": f"{index:03d}",
            "slug": slug,
            "title": recipe["title"],
            "meal_type": recipe.get("meal_type"),
            "prompt": build_prompt(recipe),
        })

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    queue_json = {
        "bundle_id": bundle_id,
        "generated_from": str(bundle_dir.relative_to(REPO_ROOT)),
        "include_unused": args.include_unused,
        "count": len(entries),
        "entries": entries,
    }
    (OUTPUT_DIR / "queue.json").write_text(
        json.dumps(queue_json, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    md_lines: list[str] = []
    md_lines.append(f"# Cola de imágenes — `{bundle_id}`\n")
    md_lines.append(f"Total: **{len(entries)}** recetas\n")
    md_lines.append("Descarga cada imagen de la Gem con el número del índice como nombre ")
    md_lines.append("(ej: `001.png`) y déjala en `scripts/recipe-images/`.\n")
    md_lines.append("Luego lanza:\n")
    md_lines.append("```bash\npython3 scripts/upload_recipe_images.py\n```\n")
    md_lines.append("---\n")

    current_meal = None
    for entry in entries:
        meal = entry.get("meal_type") or "otros"
        if meal != current_meal:
            md_lines.append(f"\n## {meal}\n")
            current_meal = meal
        md_lines.append(f"### {entry['index']} — {entry['title']}")
        md_lines.append(f"slug: `{entry['slug']}`")
        md_lines.append("```")
        md_lines.append(entry["prompt"])
        md_lines.append("```\n")

    (OUTPUT_DIR / "queue.md").write_text("\n".join(md_lines), encoding="utf-8")

    print(f"Queue generada con {len(entries)} entradas")
    print(f"  - {OUTPUT_DIR / 'queue.json'}")
    print(f"  - {OUTPUT_DIR / 'queue.md'}")


if __name__ == "__main__":
    main()
