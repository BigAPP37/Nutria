#!/usr/bin/env python3
"""
seed_meal_plans.py
==================
Genera planes de dieta semanales usando la API de Spoonacular
y los almacena en Supabase para que la app los sirva sin llamadas
adicionales a la API.

SETUP (una sola vez):
---------------------
1. Obtén una API key gratuita en https://spoonacular.com/food-api
   → Crea cuenta → Dashboard → "My API Key"

2. Añade al .env.local:
   SPOONACULAR_API_KEY=tu_clave_aqui

3. Asegúrate de haber ejecutado la migración SQL:
   supabase/migrations/add_meal_plans.sql

4. Instala dependencias:
   scripts/.venv/bin/pip install -r scripts/requirements_plans.txt

EJECUCIÓN:
----------
   # Genera 1 plan de pérdida de peso (1500 kcal, 7 días)
   scripts/.venv/bin/python3 scripts/seed_meal_plans.py --goal lose_weight

   # Genera los 3 tipos de plan
   scripts/.venv/bin/python3 scripts/seed_meal_plans.py --all

   # Vista previa sin insertar en BD
   scripts/.venv/bin/python3 scripts/seed_meal_plans.py --goal maintain --dry-run

   # Solo 3 días (ahorra puntos de API en dev)
   scripts/.venv/bin/python3 scripts/seed_meal_plans.py --goal lose_weight --days 3
"""

import argparse
import sys
import time
from pathlib import Path

try:
    import requests
    from dotenv import dotenv_values
    from supabase import create_client, Client
except ImportError as e:
    sys.exit(f"❌  Falta dependencia: {e}\n   Ejecuta: scripts/.venv/bin/pip install -r scripts/requirements_plans.txt")

# ── Config ──────────────────────────────────────────────────────────────────
SPOONACULAR_BASE = "https://api.spoonacular.com"
SLEEP_BETWEEN    = 0.5   # segundos entre llamadas (rate limit: 1 req/s free)

PLAN_CONFIGS = {
    "lose_weight": {
        "title":           "Plan Pérdida de Peso · 7 días",
        "description":     "Plan equilibrado con déficit calórico moderado. Alto en proteína para preservar músculo, bajo en azúcares simples. Cocina mediterránea.",
        "target_calories": 1500,
        "diet":            "mediterranean",
        # kcal por tipo de comida: breakfast, lunch, dinner, snack
        "meal_calories":   {"breakfast": (300, 420), "lunch": (500, 620), "dinner": (430, 560), "snack": (130, 200)},
    },
    "maintain": {
        "title":           "Plan Mantenimiento · 7 días",
        "description":     "Plan variado y equilibrado para mantener el peso. Macros distribuidos para energía constante durante el día.",
        "target_calories": 2000,
        "diet":            "mediterranean",
        "meal_calories":   {"breakfast": (400, 520), "lunch": (650, 780), "dinner": (580, 700), "snack": (180, 260)},
    },
    "gain_muscle": {
        "title":           "Plan Ganancia Muscular · 7 días",
        "description":     "Plan hipercalórico con alto aporte proteico. Diseñado para maximizar la síntesis proteica y la recuperación muscular.",
        "target_calories": 2500,
        "diet":            "",
        "meal_calories":   {"breakfast": (500, 650), "lunch": (800, 950), "dinner": (750, 880), "snack": (280, 370)},
    },
}

DAY_LABELS    = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
MEAL_TYPES    = ["breakfast", "lunch", "dinner", "snack"]
MEAL_TYPE_API = {"breakfast": "breakfast", "lunch": "main course", "dinner": "main course", "snack": "snack"}
CUISINES      = ["mediterranean", "italian", "spanish", "greek", "french", ""]


# ── Env / Clientes ──────────────────────────────────────────────────────────
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


def get_api_key(env: dict) -> str:
    key = env.get("SPOONACULAR_API_KEY", "").strip()
    if not key:
        sys.exit(
            "❌  Falta SPOONACULAR_API_KEY en .env.local\n"
            "   Obtén tu clave gratis en: https://spoonacular.com/food-api\n"
            "   Luego añade: SPOONACULAR_API_KEY=tu_clave"
        )
    return key


# ── Llamadas a Spoonacular ───────────────────────────────────────────────────
def spoonacular_get(path: str, api_key: str, params: dict = None) -> dict:
    """GET a Spoonacular con manejo de errores."""
    url = f"{SPOONACULAR_BASE}{path}"
    p = {"apiKey": api_key, **(params or {})}
    resp = requests.get(url, params=p, timeout=45)
    if resp.status_code == 402:
        raise RuntimeError("QUOTA_EXCEEDED")
    if resp.status_code == 401:
        sys.exit("❌  API key inválida (401). Comprueba SPOONACULAR_API_KEY en .env.local")
    resp.raise_for_status()
    return resp.json()


def search_recipes(api_key: str, meal_type: str, diet: str,
                   min_cal: int, max_cal: int, offset: int = 0) -> list:
    """Busca recetas por tipo de comida y rango calórico."""
    time.sleep(SLEEP_BETWEEN)
    params = {
        "type":           MEAL_TYPE_API[meal_type],
        "minCalories":    min_cal,
        "maxCalories":    max_cal,
        "number":         10,
        "offset":         offset,
        "sort":           "popularity",
        "instructionsRequired": "true",
    }
    if diet:
        params["diet"] = diet
    data = spoonacular_get("/recipes/complexSearch", api_key, params)
    return data.get("results", [])


def fetch_recipe(api_key: str, recipe_id: int) -> dict:
    """Obtiene información completa de una receta."""
    time.sleep(SLEEP_BETWEEN)
    return spoonacular_get(
        f"/recipes/{recipe_id}/information",
        api_key,
        {"includeNutrition": "true"},
    )


# ── Parseo ──────────────────────────────────────────────────────────────────
def parse_nutrition(nutrient_list: list, name: str) -> float:
    """Extrae el valor de un nutriente por nombre."""
    for n in nutrient_list:
        if n.get("name", "").lower() == name.lower():
            return round(n.get("amount", 0), 1)
    return 0.0


def parse_recipe(raw: dict, meal_type: str) -> dict:
    """Transforma la respuesta de Spoonacular en nuestro modelo."""
    nutrients = []
    if raw.get("nutrition") and raw["nutrition"].get("nutrients"):
        nutrients = raw["nutrition"]["nutrients"]

    # Ingredientes
    ingredients = []
    for i, ing in enumerate(raw.get("extendedIngredients", [])):
        ingredients.append({
            "order_index":     i,
            "ingredient_name": ing.get("name", ing.get("originalName", "")),
            "quantity":        round(ing.get("amount", 0), 2),
            "unit":            ing.get("unit", ""),
            "notes":           ing.get("meta", [""])[0] if ing.get("meta") else None,
        })

    # Pasos de preparación
    steps = []
    instructions = raw.get("analyzedInstructions", [])
    if instructions and instructions[0].get("steps"):
        for s in instructions[0]["steps"]:
            steps.append({
                "step_number": s["number"],
                "instruction": s["step"],
                "duration_min": None,
            })

    return {
        "spoonacular_id": raw["id"],
        "title":          raw.get("title", ""),
        "description":    raw.get("summary", "")[:500] if raw.get("summary") else None,
        "meal_type":      meal_type,
        "cuisine":        raw.get("cuisines", [""])[0] if raw.get("cuisines") else None,
        "prep_time_min":  raw.get("preparationMinutes") or None,
        "cook_time_min":  raw.get("cookingMinutes") or None,
        "ready_in_min":   raw.get("readyInMinutes") or None,
        "servings":       raw.get("servings", 1),
        "calories_kcal":  parse_nutrition(nutrients, "Calories"),
        "protein_g":      parse_nutrition(nutrients, "Protein"),
        "carbs_g":        parse_nutrition(nutrients, "Carbohydrates"),
        "fat_g":          parse_nutrition(nutrients, "Fat"),
        "fiber_g":        parse_nutrition(nutrients, "Fiber"),
        "image_url":      raw.get("image"),
        "source_url":     raw.get("sourceUrl"),
        "tags":           raw.get("dishTypes", []),
        "ingredients":    ingredients,
        "steps":          steps,
    }


# ── Inserción en Supabase ───────────────────────────────────────────────────
def upsert_recipe(sb: Client, recipe_data: dict) -> str:
    """Inserta o actualiza una receta y devuelve su UUID."""
    payload = {k: v for k, v in recipe_data.items() if k not in ("ingredients", "steps")}

    # Upsert por spoonacular_id
    res = sb.table("recipes").upsert(payload, on_conflict="spoonacular_id").execute()
    recipe_id = res.data[0]["id"]

    # Borrar y reinsertar ingredientes y pasos (idempotente)
    sb.table("recipe_ingredients").delete().eq("recipe_id", recipe_id).execute()
    sb.table("recipe_steps").delete().eq("recipe_id", recipe_id).execute()

    if recipe_data["ingredients"]:
        for ing in recipe_data["ingredients"]:
            ing["recipe_id"] = recipe_id
        sb.table("recipe_ingredients").insert(recipe_data["ingredients"]).execute()

    if recipe_data["steps"]:
        for step in recipe_data["steps"]:
            step["recipe_id"] = recipe_id
        sb.table("recipe_steps").insert(recipe_data["steps"]).execute()

    return recipe_id


def insert_plan(sb: Client, goal: str, config: dict, days_data: list) -> str:
    """Inserta el plan completo en BD. Devuelve el plan ID."""
    # Crear plan
    plan_res = sb.table("meal_plans").insert({
        "title":          config["title"],
        "description":    config["description"],
        "goal_type":      goal,
        "duration_days":  len(days_data),
        "target_calories": config["target_calories"],
        "is_premium":     True,
        "is_sample":      False,
    }).execute()
    plan_id = plan_res.data[0]["id"]

    for day_data in days_data:
        # Crear día
        day_res = sb.table("meal_plan_days").insert({
            "plan_id":        plan_id,
            "day_number":     day_data["day_number"],
            "day_label":      day_data["day_label"],
            "total_calories": day_data["total_calories"],
            "total_protein_g": day_data["total_protein_g"],
            "total_carbs_g":  day_data["total_carbs_g"],
            "total_fat_g":    day_data["total_fat_g"],
        }).execute()
        day_id = day_res.data[0]["id"]

        # Crear comidas del día
        for meal in day_data["meals"]:
            sb.table("meal_plan_meals").insert({
                "day_id":      day_id,
                "meal_type":   meal["meal_type"],
                "recipe_id":   meal["recipe_id"],
                "order_index": meal["order_index"],
            }).execute()

    return plan_id


# ── Selección de recetas sin repetir ────────────────────────────────────────
def pick_recipe(api_key: str, meal_type: str, diet: str,
                cal_range: tuple, used_ids: set) -> dict | None:
    """Busca y devuelve una receta no usada aún."""
    for offset in [0, 10, 20]:
        results = search_recipes(api_key, meal_type, diet,
                                 cal_range[0], cal_range[1], offset)
        for r in results:
            if r["id"] not in used_ids:
                used_ids.add(r["id"])
                return r
    return None


# ── Comando principal ────────────────────────────────────────────────────────
def generate_plan(goal: str, config: dict, api_key: str, sb: Client,
                  days: int, dry_run: bool):
    print(f"\n{'─'*55}")
    print(f"  🥗  Generando: {config['title']}")
    print(f"  🎯  Objetivo: {config['target_calories']} kcal/día | {days} días")
    print(f"{'─'*55}")

    diet     = config["diet"]
    cal_map  = config["meal_calories"]
    used_ids: set = set()
    days_data     = []
    total_ok = total_fail = 0

    MEAL_ICON = {"breakfast": "🍳", "lunch": "🥗", "dinner": "🍽", "snack": "🍎"}

    for day_idx in range(days):
        day_num   = day_idx + 1
        day_label = f"Día {day_num} · {DAY_LABELS[day_idx]}"
        print(f"\n  📅  {day_label}")

        meals_for_day  = []
        day_cals = day_prot = day_carbs = day_fat = 0.0

        for meal_order, meal_type in enumerate(MEAL_TYPES):
            cal_range = cal_map[meal_type]

            result = pick_recipe(api_key, meal_type, diet, cal_range, used_ids)
            if not result:
                print(f"      ⚠️   [{meal_type}] Sin resultados")
                total_fail += 1
                continue

            title = result.get("title", "")
            spoon_id = result["id"]

            if dry_run:
                icon = MEAL_ICON.get(meal_type, "🍽")
                # Nutrition viene incluida en complexSearch con addRecipeNutrition=true
                nutr = {n["name"]: n["amount"] for n in
                        result.get("nutrition", {}).get("nutrients", [])}
                kcal = round(nutr.get("Calories", 0))
                print(f"      {icon} [{meal_type}] {title[:55]} (~{kcal} kcal)")
                total_ok += 1
                continue

            try:
                print(f"      ⬇  {title[:50]}", end=" ", flush=True)
                raw_recipe = fetch_recipe(api_key, spoon_id)
                recipe_data = parse_recipe(raw_recipe, meal_type)
                recipe_uuid = upsert_recipe(sb, recipe_data)
                meals_for_day.append({
                    "meal_type":   meal_type,
                    "recipe_id":   recipe_uuid,
                    "order_index": meal_order,
                })
                day_cals  += recipe_data["calories_kcal"] or 0
                day_prot  += recipe_data["protein_g"] or 0
                day_carbs += recipe_data["carbs_g"] or 0
                day_fat   += recipe_data["fat_g"] or 0
                print("✅")
                total_ok += 1
            except RuntimeError as e:
                if "QUOTA_EXCEEDED" in str(e):
                    print(f"❌  Cuota agotada — guardando lo obtenido hasta aquí")
                    total_fail += 1
                    break  # salir del bucle de meals, continuar con días ya completados
                print(f"❌  {str(e)[:80]}")
                total_fail += 1
            except Exception as e:
                print(f"❌  {str(e)[:80]}")
                total_fail += 1

        if not dry_run:
            days_data.append({
                "day_number":      day_num,
                "day_label":       day_label,
                "total_calories":  round(day_cals),
                "total_protein_g": round(day_prot, 1),
                "total_carbs_g":   round(day_carbs, 1),
                "total_fat_g":     round(day_fat, 1),
                "meals":           meals_for_day,
            })

    if dry_run:
        print(f"\n  DRY RUN: {total_ok} recetas se procesarían, {total_fail} sin resultado\n")
        return

    print(f"\n  💾  Guardando plan en Supabase...")
    plan_id = insert_plan(sb, goal, config, days_data)
    print(f"  ✅  Plan creado: {plan_id}")
    print(f"  📊  Recetas OK: {total_ok}  Fallos: {total_fail}\n")


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Genera planes de dieta con Spoonacular → Supabase")
    parser.add_argument("--goal",    choices=["lose_weight", "maintain", "gain_muscle"],
                        help="Tipo de objetivo")
    parser.add_argument("--all",     action="store_true",  help="Genera los 3 tipos de plan")
    parser.add_argument("--days",    type=int, default=7,  help="Número de días (default: 7)")
    parser.add_argument("--dry-run", action="store_true",  help="Vista previa sin insertar en BD")
    args = parser.parse_args()

    if not args.goal and not args.all:
        parser.print_help()
        print("\n  Ejemplo: python3 scripts/seed_meal_plans.py --goal lose_weight --days 3 --dry-run\n")
        sys.exit(0)

    env     = load_env()
    api_key = get_api_key(env)
    sb      = get_supabase(env)

    goals = list(PLAN_CONFIGS.keys()) if args.all else [args.goal]

    for goal in goals:
        config = PLAN_CONFIGS[goal]
        generate_plan(goal, config, api_key, sb, args.days, args.dry_run)

    print("✅  Proceso completado.\n")


if __name__ == "__main__":
    main()
