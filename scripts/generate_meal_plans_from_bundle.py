#!/usr/bin/env python3
"""
Genera planes automáticos a partir de un bundle existente de recetas.

No toca Supabase. Reescribe el `manifest.json` del bundle con planes
deterministas usando el mismo `bundle_id`, para que luego pueda importarse
sin duplicar recetas.

Uso:
  python3 scripts/generate_meal_plans_from_bundle.py scripts/generated_bundles/local-recipes-500-seed-17-v2
"""

from __future__ import annotations

import argparse
import itertools
import json
import random
import sys
from pathlib import Path


MEAL_ORDER = ("breakfast", "lunch", "dinner", "snack")
WEEKDAY_LABELS = ("Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo")

THERAPEUTIC_PROFILE_REQUIREMENTS = {
    "dash": {"sodium_mg"},
    "diabetes_friendly": {"added_sugars_g", "sodium_mg"},
    "low_sodium": {"sodium_mg"},
    "renal": {"sodium_mg", "potassium_mg", "phosphorus_mg"},
    "low_fodmap": {"fodmap_profile"},
    "gluten_free": {"gluten_free"},
}

PLAN_CONFIGS = (
    {
        "slug": "plan-ligero-7d-muestra",
        "title": "Plan Ligero · 7 días · Muestra",
        "description": "Semana de referencia con platos saciantes y fáciles de repetir en una rutina real.",
        "goal_type": "lose_weight",
        "duration_days": 7,
        "target_calories": 1500,
        "macro_targets_pct": {"protein": 0.28, "carbs": 0.37, "fat": 0.35},
        "macro_tolerance_pct": {"protein": 0.16, "carbs": 0.18, "fat": 0.16},
        "fiber_floor": 28,
        "meal_protein_floor": {"breakfast": 18, "lunch": 28, "dinner": 26, "snack": 10},
        "is_premium": False,
        "is_sample": True,
        "meal_targets": {"breakfast": 320, "lunch": 500, "dinner": 440, "snack": 220},
    },
    {
        "slug": "plan-equilibrio-7d-muestra",
        "title": "Plan Equilibrio · 7 días · Muestra",
        "description": "Semana equilibrada para comer con más orden sin sentir que todo gira alrededor de la comida.",
        "goal_type": "maintain",
        "duration_days": 7,
        "target_calories": 2000,
        "macro_targets_pct": {"protein": 0.24, "carbs": 0.46, "fat": 0.30},
        "macro_tolerance_pct": {"protein": 0.15, "carbs": 0.16, "fat": 0.14},
        "fiber_floor": 30,
        "meal_protein_floor": {"breakfast": 20, "lunch": 30, "dinner": 28, "snack": 12},
        "is_premium": False,
        "is_sample": True,
        "meal_targets": {"breakfast": 420, "lunch": 660, "dinner": 620, "snack": 260},
    },
    {
        "slug": "plan-fuerza-7d-muestra",
        "title": "Plan Fuerza · 7 días · Muestra",
        "description": "Semana pensada para entrenar con energía y mantener una estructura simple de seguir.",
        "goal_type": "gain_muscle",
        "duration_days": 7,
        "target_calories": 2500,
        "macro_targets_pct": {"protein": 0.26, "carbs": 0.49, "fat": 0.25},
        "macro_tolerance_pct": {"protein": 0.14, "carbs": 0.14, "fat": 0.12},
        "fiber_floor": 32,
        "meal_protein_floor": {"breakfast": 24, "lunch": 34, "dinner": 32, "snack": 14},
        "is_premium": False,
        "is_sample": True,
        "meal_targets": {"breakfast": 520, "lunch": 820, "dinner": 800, "snack": 360},
    },
    {
        "slug": "plan-ligero-14d",
        "title": "Plan Ligero · 14 días",
        "description": "Quincena completa con estructura estable, buena rotación de platos y margen real para sostener el ritmo.",
        "goal_type": "lose_weight",
        "duration_days": 14,
        "target_calories": 1500,
        "macro_targets_pct": {"protein": 0.28, "carbs": 0.37, "fat": 0.35},
        "macro_tolerance_pct": {"protein": 0.16, "carbs": 0.18, "fat": 0.16},
        "fiber_floor": 28,
        "meal_protein_floor": {"breakfast": 18, "lunch": 28, "dinner": 26, "snack": 10},
        "is_premium": True,
        "is_sample": False,
        "meal_targets": {"breakfast": 320, "lunch": 500, "dinner": 440, "snack": 220},
    },
    {
        "slug": "plan-equilibrio-14d",
        "title": "Plan Equilibrio · 14 días",
        "description": "Quincena variada para mantenerte estable con comidas reconocibles, saciantes y sencillas de organizar.",
        "goal_type": "maintain",
        "duration_days": 14,
        "target_calories": 2000,
        "macro_targets_pct": {"protein": 0.24, "carbs": 0.46, "fat": 0.30},
        "macro_tolerance_pct": {"protein": 0.15, "carbs": 0.16, "fat": 0.14},
        "fiber_floor": 30,
        "meal_protein_floor": {"breakfast": 20, "lunch": 30, "dinner": 28, "snack": 12},
        "is_premium": True,
        "is_sample": False,
        "meal_targets": {"breakfast": 420, "lunch": 660, "dinner": 620, "snack": 260},
    },
    {
        "slug": "plan-fuerza-14d",
        "title": "Plan Fuerza · 14 días",
        "description": "Quincena con más energía y mejor reparto diario para entrenamientos exigentes y semanas largas.",
        "goal_type": "gain_muscle",
        "duration_days": 14,
        "target_calories": 2500,
        "macro_targets_pct": {"protein": 0.26, "carbs": 0.49, "fat": 0.25},
        "macro_tolerance_pct": {"protein": 0.14, "carbs": 0.14, "fat": 0.12},
        "fiber_floor": 32,
        "meal_protein_floor": {"breakfast": 24, "lunch": 34, "dinner": 32, "snack": 14},
        "is_premium": True,
        "is_sample": False,
        "meal_targets": {"breakfast": 520, "lunch": 820, "dinner": 800, "snack": 360},
    },
)


def fail(message: str) -> None:
    print(f"❌  {message}")
    raise SystemExit(1)


def load_manifest(bundle_dir: Path) -> dict:
    manifest_path = bundle_dir / "manifest.json"
    if not manifest_path.exists():
        fail(f"No existe {manifest_path}")
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def write_manifest(bundle_dir: Path, manifest: dict) -> None:
    (bundle_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def write_summary(bundle_dir: Path, manifest: dict) -> None:
    recipes = manifest.get("recipes") or []
    plans = manifest.get("plans") or []
    meal_type_labels = {
        "breakfast": "desayuno",
        "lunch": "comida",
        "dinner": "cena",
        "snack": "picoteo",
    }
    summary = {
        "bundle_id": manifest["bundle_id"],
        "recipes": len(recipes),
        "plans": len(plans),
        "sample_plans": sum(1 for plan in plans if plan.get("is_sample")),
        "premium_plans": sum(1 for plan in plans if plan.get("is_premium")),
        "by_meal_type": {
            meal_type_labels[meal_type]: sum(1 for recipe in recipes if recipe["meal_type"] == meal_type)
            for meal_type in MEAL_ORDER
        },
        "plan_titles": [plan["title"] for plan in plans],
    }
    (bundle_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def pool_by_meal_type(recipes: list[dict]) -> dict[str, list[dict]]:
    pools = {meal_type: [] for meal_type in MEAL_ORDER}
    for recipe in recipes:
        meal_type = recipe.get("meal_type")
        if meal_type in pools:
            pools[meal_type].append(recipe)
    for meal_type, rows in pools.items():
        if not rows:
            fail(f"El bundle no tiene recetas para {meal_type}")
    return pools


def bundle_recipe_fields(recipes: list[dict]) -> set[str]:
    fields: set[str] = set()
    for recipe in recipes:
        fields.update(recipe.keys())
    return fields


def validate_therapeutic_profile(therapeutic_profile: str | None, recipes: list[dict]) -> None:
    if not therapeutic_profile:
        return
    requirements = THERAPEUTIC_PROFILE_REQUIREMENTS.get(therapeutic_profile)
    if not requirements:
        fail(f"Perfil terapéutico desconocido: {therapeutic_profile}")
    available_fields = bundle_recipe_fields(recipes)
    missing = sorted(requirements - available_fields)
    if missing:
        fail(
            "El bundle no puede sostener un perfil terapéutico fiable todavía. "
            f"Faltan campos nutricionales obligatorios para '{therapeutic_profile}': {', '.join(missing)}"
        )


def macro_targets_in_grams(config: dict) -> dict[str, float]:
    kcal = float(config["target_calories"])
    targets_pct = config["macro_targets_pct"]
    return {
        "protein_g": (kcal * targets_pct["protein"]) / 4,
        "carbs_g": (kcal * targets_pct["carbs"]) / 4,
        "fat_g": (kcal * targets_pct["fat"]) / 9,
    }


def meal_totals(combo: tuple[dict, dict, dict, dict]) -> dict[str, float]:
    totals = {
        "calories_kcal": 0.0,
        "protein_g": 0.0,
        "carbs_g": 0.0,
        "fat_g": 0.0,
        "fiber_g": 0.0,
        "sodium_mg": 0.0,
        "saturated_fat_g": 0.0,
        "added_sugars_g": 0.0,
        "potassium_mg": 0.0,
        "phosphorus_mg": 0.0,
    }
    for recipe in combo:
        for key in totals:
            totals[key] += float(recipe.get(key) or 0)
    return totals


def recipe_score(recipe: dict, target_kcal: int, used_slugs: set[str], rng: random.Random) -> tuple[float, float, float]:
    return (
        1.0 if recipe["slug"] in used_slugs else 0.0,
        abs(float(recipe.get("calories_kcal") or 0) - target_kcal),
        rng.random(),
    )


def top_candidates(
    recipes: list[dict],
    target_kcal: int,
    used_slugs: set[str],
    rng: random.Random,
    limit: int = 10,
) -> list[dict]:
    shuffled = list(recipes)
    rng.shuffle(shuffled)
    return sorted(shuffled, key=lambda recipe: recipe_score(recipe, target_kcal, used_slugs, rng))[:limit]


def therapeutic_score(
    combo: tuple[dict, dict, dict, dict],
    config: dict,
    totals: dict[str, float],
    meals: dict[str, dict],
    therapeutic_profile: str | None,
) -> float:
    if not therapeutic_profile:
        return 0.0

    score = 0.0

    if therapeutic_profile == "dash":
        sodium_ceiling = 1800
        potassium_floor = 3200
        sat_fat_ceiling = (config["target_calories"] * 0.08) / 9
        if totals["sodium_mg"] > sodium_ceiling:
            score += (totals["sodium_mg"] - sodium_ceiling) * 0.08
        if totals["potassium_mg"] < potassium_floor:
            score += (potassium_floor - totals["potassium_mg"]) * 0.03
        if totals["saturated_fat_g"] > sat_fat_ceiling:
            score += (totals["saturated_fat_g"] - sat_fat_ceiling) * 10

    if therapeutic_profile == "low_sodium":
        sodium_ceiling = 1600
        if totals["sodium_mg"] > sodium_ceiling:
            score += (totals["sodium_mg"] - sodium_ceiling) * 0.11

    if therapeutic_profile == "diabetes_friendly":
        added_sugars_ceiling = 20
        carb_targets = macro_targets_in_grams(config)
        carb_day_target = carb_targets["carbs_g"]
        for meal_type in MEAL_ORDER:
            desired = carb_day_target * (config["meal_targets"][meal_type] / config["target_calories"])
            actual = float(meals[meal_type].get("carbs_g") or 0)
            score += abs(actual - desired) * 0.7
        if totals["added_sugars_g"] > added_sugars_ceiling:
            score += (totals["added_sugars_g"] - added_sugars_ceiling) * 16
        if totals["fiber_g"] < max(config["fiber_floor"], 30):
            score += (max(config["fiber_floor"], 30) - totals["fiber_g"]) * 8

    if therapeutic_profile == "gluten_free":
        if not all(bool(recipe.get("gluten_free")) for recipe in combo):
            score += 10000

    if therapeutic_profile == "renal":
        sodium_ceiling = 1700
        potassium_ceiling = 2600
        phosphorus_ceiling = 900
        if totals["sodium_mg"] > sodium_ceiling:
            score += (totals["sodium_mg"] - sodium_ceiling) * 0.1
        if totals["potassium_mg"] > potassium_ceiling:
            score += (totals["potassium_mg"] - potassium_ceiling) * 0.06
        if totals["phosphorus_mg"] > phosphorus_ceiling:
            score += (totals["phosphorus_mg"] - phosphorus_ceiling) * 0.08

    return score


def combo_score(
    combo: tuple[dict, dict, dict, dict],
    config: dict,
    therapeutic_profile: str | None = None,
) -> float:
    meals = dict(zip(MEAL_ORDER, combo, strict=True))
    totals = meal_totals(combo)
    macro_targets = macro_targets_in_grams(config)
    score = abs(totals["calories_kcal"] - config["target_calories"])
    score += 0.35 * sum(
        abs(float(meals[meal_type].get("calories_kcal") or 0) - config["meal_targets"][meal_type])
        for meal_type in MEAL_ORDER
    )

    for macro_key, macro_target in macro_targets.items():
        tolerance = macro_target * config["macro_tolerance_pct"][macro_key.removesuffix("_g")]
        delta = abs(totals[macro_key] - macro_target)
        if delta > tolerance:
            score += (delta - tolerance) * 4.5
        else:
            score += delta * 0.35

    if totals["fiber_g"] < config["fiber_floor"]:
        score += (config["fiber_floor"] - totals["fiber_g"]) * 6

    for meal_type, floor in config["meal_protein_floor"].items():
        meal_protein = float(meals[meal_type].get("protein_g") or 0)
        if meal_protein < floor:
            score += (floor - meal_protein) * 5

    lunch_dinner_gap = abs(
        float(meals["lunch"].get("calories_kcal") or 0) - float(meals["dinner"].get("calories_kcal") or 0)
    )
    score += lunch_dinner_gap * 0.08
    score += therapeutic_score(combo, config, totals, meals, therapeutic_profile)

    return score


def choose_day_combo(
    pools: dict[str, list[dict]],
    config: dict,
    used_slugs: set[str],
    rng: random.Random,
    therapeutic_profile: str | None = None,
) -> list[dict]:
    candidates = {
        meal_type: top_candidates(pools[meal_type], config["meal_targets"][meal_type], used_slugs, rng)
        for meal_type in MEAL_ORDER
    }
    best_combo: tuple[dict, dict, dict, dict] | None = None
    best_score: float | None = None

    for combo in itertools.product(*(candidates[meal_type] for meal_type in MEAL_ORDER)):
        slugs = [recipe["slug"] for recipe in combo]
        if len(set(slugs)) != len(slugs):
            continue
        if any(slug in used_slugs for slug in slugs):
            continue
        score = combo_score(combo, config, therapeutic_profile)
        if best_score is None or score < best_score:
            best_combo = combo
            best_score = score

    if best_combo is None:
        fail(f"No pude construir un día válido para {config['title']}")

    return list(best_combo)


def day_label(day_number: int) -> str:
    weekday = WEEKDAY_LABELS[(day_number - 1) % len(WEEKDAY_LABELS)]
    return f"Día {day_number} · {weekday}"


def generate_plans(recipes: list[dict], seed: int, therapeutic_profile: str | None = None) -> list[dict]:
    validate_therapeutic_profile(therapeutic_profile, recipes)
    pools = pool_by_meal_type(recipes)
    plans: list[dict] = []

    for index, config in enumerate(PLAN_CONFIGS):
        rng = random.Random(seed + (index + 1) * 101)
        used_slugs: set[str] = set()
        days: list[dict] = []

        for day_number in range(1, config["duration_days"] + 1):
            meals = choose_day_combo(pools, config, used_slugs, rng, therapeutic_profile)
            used_slugs.update(recipe["slug"] for recipe in meals)
            days.append({
                "day_number": day_number,
                "day_label": day_label(day_number),
                "meals": [
                    {"meal_type": meal_type, "recipe_slug": recipe["slug"]}
                    for meal_type, recipe in zip(MEAL_ORDER, meals, strict=True)
                ],
            })

        plans.append({
            "slug": config["slug"],
            "title": config["title"],
            "description": config["description"],
            "goal_type": config["goal_type"],
            "duration_days": config["duration_days"],
            "target_calories": config["target_calories"],
            "is_premium": config["is_premium"],
            "is_sample": config["is_sample"],
            "nutrition_logic": {
                "target_calories": config["target_calories"],
                "macro_targets_g": {
                    key: round(value, 1) for key, value in macro_targets_in_grams(config).items()
                },
                "fiber_floor_g": config["fiber_floor"],
                "meal_protein_floor_g": config["meal_protein_floor"],
                "therapeutic_profile": therapeutic_profile,
            },
            "days": days,
        })

    return plans


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera planes automáticos desde un bundle existente")
    parser.add_argument("bundle_dir", help="Ruta de la carpeta del bundle")
    parser.add_argument("--seed", type=int, default=17, help="Seed para generación reproducible")
    parser.add_argument(
        "--therapeutic-profile",
        choices=sorted(THERAPEUTIC_PROFILE_REQUIREMENTS.keys()),
        default=None,
        help="Perfil terapéutico opcional. Solo se activa si el bundle tiene los campos nutricionales necesarios.",
    )
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir).resolve()
    manifest = load_manifest(bundle_dir)
    recipes = manifest.get("recipes") or []
    if not recipes:
        fail("El bundle no contiene recetas")

    plans = generate_plans(recipes, args.seed, args.therapeutic_profile)
    manifest["plans"] = plans
    write_manifest(bundle_dir, manifest)
    write_summary(bundle_dir, manifest)

    print(f"\n✅ Planes generados en: {bundle_dir}")
    print(f"   • bundle_id: {manifest['bundle_id']}")
    print(f"   • planes:    {len(plans)}")
    for plan in plans:
        print(f"     - {plan['title']} ({plan['duration_days']} días)")
    print("\nSiguiente paso sugerido:")
    print(f"  python3 scripts/validate_recipe_bundle.py {bundle_dir}\n")


if __name__ == "__main__":
    main()
