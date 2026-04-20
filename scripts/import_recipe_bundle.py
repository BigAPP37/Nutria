#!/usr/bin/env python3
"""
Importa un bundle editorial validado a Supabase.
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path

try:
    from dotenv import dotenv_values
    from supabase import Client, create_client
except ImportError as e:
    sys.exit(
        f"❌  Falta dependencia: {e}\n"
        "   Ejecuta:\n"
        "   pip install -r scripts/requirements_images.txt\n"
    )


REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = REPO_ROOT / ".env.local"
BUCKET = "food-images"
STORAGE_PREFIX = "recipes"
OPTIONAL_RECIPE_FIELDS = (
    "sodium_mg",
    "saturated_fat_g",
    "added_sugars_g",
    "potassium_mg",
    "phosphorus_mg",
    "gluten_free",
    "fodmap_profile",
)


def load_env() -> dict:
    if not ENV_PATH.exists():
        sys.exit(f"❌  No se encontró .env.local en {ENV_PATH}")
    return dotenv_values(ENV_PATH)


def get_supabase(env: dict) -> Client:
    url = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
    key = (env.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        sys.exit("❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
    return create_client(url, key)


def load_manifest(bundle_dir: Path) -> dict:
    manifest_path = bundle_dir / "manifest.json"
    if not manifest_path.exists():
        sys.exit(f"❌  No existe {manifest_path}")
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def image_to_webp(path: Path) -> bytes:
    try:
        from PIL import Image
    except ImportError as exc:
        sys.exit(
            "❌  Pillow es obligatorio solo cuando el bundle usa image_file locales.\n"
            f"   Error: {exc}\n"
            "   Ejecuta:\n"
            "   pip install -r scripts/requirements_images.txt\n"
        )
    img = Image.open(path).convert("RGB").resize((768, 768), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=90, method=6)
    return buf.getvalue()


def upload_recipe_image(sb: Client, bundle_id: str, recipe_slug: str, image_path: Path) -> str:
    storage_path = f"{STORAGE_PREFIX}/{bundle_id}/{recipe_slug}.webp"
    sb.storage.from_(BUCKET).upload(
        path=storage_path,
        file=image_to_webp(image_path),
        file_options={"content-type": "image/webp", "upsert": "true"},
    )
    return sb.storage.from_(BUCKET).get_public_url(storage_path)


def extract_data(response):
    return None if response is None else response.data


def require_single_row(response, context: str) -> dict:
    data = extract_data(response)
    if not data:
        sys.exit(f"❌  Supabase no devolvió filas para: {context}")
    if isinstance(data, list):
        return data[0]
    return data


def detect_supported_recipe_fields(sb: Client) -> set[str]:
    supported: set[str] = set()
    for field in OPTIONAL_RECIPE_FIELDS:
        try:
            sb.table("recipes").select(f"id,{field}").limit(1).execute()
            supported.add(field)
        except Exception:
            continue
    return supported


def upsert_recipe(
    sb: Client,
    bundle_id: str,
    bundle_dir: Path,
    recipe: dict,
    supported_recipe_fields: set[str],
) -> str:
    external_source = f"bundle://{bundle_id}/recipe/{recipe['slug']}"
    image_url = recipe.get("image_url")

    if recipe.get("image_file"):
        image_url = upload_recipe_image(sb, bundle_id, recipe["slug"], bundle_dir / recipe["image_file"])

    payload = {
        "spoonacular_id": None,
        "title": recipe["title"],
        "description": recipe.get("description"),
        "meal_type": recipe.get("meal_type"),
        "cuisine": recipe.get("cuisine"),
        "prep_time_min": recipe.get("prep_time_min"),
        "cook_time_min": recipe.get("cook_time_min"),
        "ready_in_min": recipe.get("ready_in_min"),
        "servings": recipe.get("servings", 1),
        "calories_kcal": recipe.get("calories_kcal"),
        "protein_g": recipe.get("protein_g"),
        "carbs_g": recipe.get("carbs_g"),
        "fat_g": recipe.get("fat_g"),
        "fiber_g": recipe.get("fiber_g"),
        "image_url": image_url,
        "source_url": external_source,
        "tags": recipe.get("tags") or [],
    }
    for field in supported_recipe_fields:
        payload[field] = recipe.get(field)

    existing_response = (
        sb.table("recipes")
        .select("id, image_url")
        .eq("source_url", external_source)
        .maybe_single()
        .execute()
    )
    existing = extract_data(existing_response)
    if existing:
        recipe_id = existing["id"]
        # Preserve image_url already set in DB (e.g. by generate_recipe_images.py)
        if image_url is None and existing.get("image_url"):
            payload["image_url"] = existing["image_url"]
        sb.table("recipes").update(payload).eq("id", recipe_id).execute()
        sb.table("recipe_ingredients").delete().eq("recipe_id", recipe_id).execute()
        sb.table("recipe_steps").delete().eq("recipe_id", recipe_id).execute()
    else:
        inserted = sb.table("recipes").insert(payload).execute()
        recipe_id = require_single_row(inserted, f"insert recipe {recipe['slug']}")["id"]

    ingredients = []
    for index, ingredient in enumerate(recipe.get("ingredients") or []):
        ingredients.append({
            "recipe_id": recipe_id,
            "order_index": index,
            "ingredient_name": ingredient["ingredient_name"],
            "quantity": ingredient.get("quantity"),
            "unit": ingredient.get("unit"),
            "notes": ingredient.get("notes"),
        })

    steps = []
    for index, step in enumerate(recipe.get("steps") or [], 1):
        steps.append({
            "recipe_id": recipe_id,
            "step_number": index,
            "instruction": step["instruction"],
            "duration_min": step.get("duration_min"),
        })

    if ingredients:
        sb.table("recipe_ingredients").insert(ingredients).execute()
    if steps:
        sb.table("recipe_steps").insert(steps).execute()

    return recipe_id


def replace_plan_if_exists(sb: Client, plan: dict) -> None:
    existing = extract_data(
        sb.table("meal_plans")
        .select("id")
        .eq("title", plan["title"])
        .eq("goal_type", plan["goal_type"])
        .execute()
    ) or []
    for row in existing:
        sb.table("meal_plans").delete().eq("id", row["id"]).execute()


def insert_plan(
    sb: Client,
    plan: dict,
    recipe_ids_by_slug: dict[str, str],
    recipe_rows_by_slug: dict[str, dict],
) -> str:
    plan_row = require_single_row(sb.table("meal_plans").insert({
        "title": plan["title"],
        "description": plan.get("description"),
        "goal_type": plan["goal_type"],
        "duration_days": plan.get("duration_days", len(plan["days"])),
        "target_calories": plan["target_calories"],
        "is_premium": plan.get("is_premium", True),
        "is_sample": plan.get("is_sample", False),
    }).execute(), f"insert plan {plan['title']}")

    plan_id = plan_row["id"]

    for day in plan["days"]:
        meals = day["meals"]
        total_calories = sum(plan_recipe_metric(recipe_rows_by_slug, meals, "calories_kcal"))
        total_protein = sum(plan_recipe_metric(recipe_rows_by_slug, meals, "protein_g"))
        total_carbs = sum(plan_recipe_metric(recipe_rows_by_slug, meals, "carbs_g"))
        total_fat = sum(plan_recipe_metric(recipe_rows_by_slug, meals, "fat_g"))

        day_row = require_single_row(sb.table("meal_plan_days").insert({
            "plan_id": plan_id,
            "day_number": day["day_number"],
            "day_label": day.get("day_label"),
            "total_calories": round(total_calories),
            "total_protein_g": round(total_protein, 1),
            "total_carbs_g": round(total_carbs, 1),
            "total_fat_g": round(total_fat, 1),
        }).execute(), f"insert plan day {plan['title']} #{day['day_number']}")

        for index, meal in enumerate(meals):
            sb.table("meal_plan_meals").insert({
                "day_id": day_row["id"],
                "meal_type": meal["meal_type"],
                "recipe_id": recipe_ids_by_slug[meal["recipe_slug"]],
                "order_index": index,
            }).execute()

    return plan_id


def plan_recipe_metric(recipe_rows_by_slug: dict[str, dict], meals: list[dict], metric: str) -> list[float]:
    values: list[float] = []
    for meal in meals:
        row = recipe_rows_by_slug[meal["recipe_slug"]]
        values.append(float(row.get(metric) or 0))
    return values


def main() -> None:
    parser = argparse.ArgumentParser(description="Importa un bundle editorial a Supabase")
    parser.add_argument("bundle_dir", help="Ruta de la carpeta del bundle")
    parser.add_argument("--replace-existing-plans", action="store_true", help="Borra y recrea planes con mismo title+goal_type")
    parser.add_argument("--skip-recipes", action="store_true", help="Reutiliza recetas ya importadas y solo sincroniza planes")
    parser.add_argument("--skip-plans", action="store_true", help="Sincroniza recetas pero no toca meal_plans")
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir).resolve()
    manifest = load_manifest(bundle_dir)
    bundle_id = manifest["bundle_id"]

    env = load_env()
    sb = get_supabase(env)
    supported_recipe_fields = detect_supported_recipe_fields(sb)
    missing_recipe_fields = [field for field in OPTIONAL_RECIPE_FIELDS if field not in supported_recipe_fields]

    recipe_ids_by_slug: dict[str, str] = {}
    recipe_rows_by_slug: dict[str, dict] = {}

    print(f"\n📦  Importando bundle {bundle_id}\n")
    if missing_recipe_fields:
        print(
            "  ⚠️  El proyecto remoto todavía no expone estas columnas en public.recipes: "
            + ", ".join(missing_recipe_fields)
        )
        print("     Se importará el bundle sin esos campos hasta aplicar la migración nueva.\n")

    for recipe in manifest.get("recipes") or []:
        recipe_rows_by_slug[recipe["slug"]] = {
            "calories_kcal": recipe.get("calories_kcal"),
            "protein_g": recipe.get("protein_g"),
            "carbs_g": recipe.get("carbs_g"),
            "fat_g": recipe.get("fat_g"),
        }

        if args.skip_recipes:
            existing = extract_data(
                sb.table("recipes")
                .select("id")
                .eq("source_url", f"bundle://{bundle_id}/recipe/{recipe['slug']}")
                .maybe_single()
                .execute()
            )
            if not existing:
                sys.exit(
                    "❌  --skip-recipes requiere que todas las recetas del bundle ya existan en Supabase. "
                    f"Falta: {recipe['slug']}"
                )
            recipe_ids_by_slug[recipe["slug"]] = existing["id"]
            continue

        recipe_id = upsert_recipe(sb, bundle_id, bundle_dir, recipe, supported_recipe_fields)
        recipe_ids_by_slug[recipe["slug"]] = recipe_id
        print(f"  ✅ recipe: {recipe['slug']}")

    if not args.skip_plans:
        for plan in manifest.get("plans") or []:
            if args.replace_existing_plans:
                replace_plan_if_exists(sb, plan)
            plan_id = insert_plan(sb, plan, recipe_ids_by_slug, recipe_rows_by_slug)
            print(f"  ✅ plan:   {plan['title']} ({plan_id})")

    print("\n✅  Importación completada\n")


if __name__ == "__main__":
    main()
