#!/usr/bin/env python3
"""
Valida un bundle editorial de recetas/planes antes de importarlo.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}
VALID_GOALS = {"lose_weight", "maintain", "gain_muscle"}


def fail(message: str) -> None:
    print(f"❌  {message}")
    raise SystemExit(1)


def load_manifest(bundle_dir: Path) -> dict:
    manifest_path = bundle_dir / "manifest.json"
    if not manifest_path.exists():
        fail(f"No existe manifest.json en {bundle_dir}")

    try:
        return json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"manifest.json inválido: {exc}")


def validate_recipe(recipe: dict, bundle_dir: Path, seen_slugs: set[str]) -> list[str]:
    errors: list[str] = []

    slug = recipe.get("slug")
    if not slug:
        errors.append("recipe.slug es obligatorio")
    elif slug in seen_slugs:
        errors.append(f"recipe.slug duplicado: {slug}")
    else:
        seen_slugs.add(slug)

    if not recipe.get("title"):
        errors.append(f"{slug or 'recipe'}: falta title")

    if recipe.get("meal_type") not in VALID_MEAL_TYPES:
        errors.append(f"{slug or 'recipe'}: meal_type inválido")

    for field in ["calories_kcal", "protein_g", "carbs_g", "fat_g"]:
        value = recipe.get(field)
        if value is None:
            errors.append(f"{slug or 'recipe'}: falta {field}")

    ingredients = recipe.get("ingredients") or []
    steps = recipe.get("steps") or []

    if not ingredients:
        errors.append(f"{slug or 'recipe'}: faltan ingredients")
    if not steps:
        errors.append(f"{slug or 'recipe'}: faltan steps")

    for index, ing in enumerate(ingredients, 1):
        if not ing.get("ingredient_name"):
            errors.append(f"{slug or 'recipe'}: ingredient #{index} sin ingredient_name")

    for index, step in enumerate(steps, 1):
        if not step.get("instruction"):
            errors.append(f"{slug or 'recipe'}: step #{index} sin instruction")

    image_file = recipe.get("image_file")
    if image_file:
        image_path = bundle_dir / image_file
        if not image_path.exists():
            errors.append(f"{slug or 'recipe'}: no existe image_file {image_file}")

    return errors


def validate_plan(plan: dict, recipe_slugs: set[str]) -> list[str]:
    errors: list[str] = []
    slug = plan.get("slug") or "plan"

    if not plan.get("title"):
        errors.append(f"{slug}: falta title")

    if plan.get("goal_type") not in VALID_GOALS:
        errors.append(f"{slug}: goal_type inválido")

    days = plan.get("days") or []
    if not days:
        errors.append(f"{slug}: faltan days")
        return errors

    expected_numbers = list(range(1, len(days) + 1))
    actual_numbers = [day.get("day_number") for day in days]
    if actual_numbers != expected_numbers:
        errors.append(f"{slug}: day_number debe ser secuencial empezando en 1")

    for day in days:
        meals = day.get("meals") or []
        if not meals:
            errors.append(f"{slug}: día {day.get('day_number')} sin meals")
            continue
        for meal in meals:
            if meal.get("meal_type") not in VALID_MEAL_TYPES:
                errors.append(f"{slug}: meal_type inválido en día {day.get('day_number')}")
            recipe_slug = meal.get("recipe_slug")
            if recipe_slug not in recipe_slugs:
                errors.append(f"{slug}: recipe_slug desconocido en día {day.get('day_number')}: {recipe_slug}")

    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Valida un bundle editorial de recetas")
    parser.add_argument("bundle_dir", help="Ruta de la carpeta del bundle")
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir).resolve()
    manifest = load_manifest(bundle_dir)

    bundle_id = manifest.get("bundle_id")
    if not bundle_id:
        fail("bundle_id es obligatorio")

    recipes = manifest.get("recipes") or []
    plans = manifest.get("plans") or []

    if not recipes:
        fail("El bundle no contiene recipes")

    errors: list[str] = []
    seen_slugs: set[str] = set()

    for recipe in recipes:
        errors.extend(validate_recipe(recipe, bundle_dir, seen_slugs))

    for plan in plans:
        errors.extend(validate_plan(plan, seen_slugs))

    if errors:
        print("\n❌  Bundle inválido:\n")
        for error in errors:
            print(f"  • {error}")
        raise SystemExit(1)

    print("\n✅  Bundle válido")
    print(f"  • bundle_id: {bundle_id}")
    print(f"  • recipes:   {len(recipes)}")
    print(f"  • plans:     {len(plans)}\n")


if __name__ == "__main__":
    main()
