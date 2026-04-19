#!/usr/bin/env python3
"""
Generador local y determinista de bundles de recetas Nutria.

No usa APIs de IA. Construye recetas por bloques (proteína, base, vegetal, grasa)
y exporta un manifest.json compatible con validate_recipe_bundle.py/import_recipe_bundle.py.

Uso:
  python3 scripts/generate_recipe_bundle_local.py --count 500
  python3 scripts/generate_recipe_bundle_local.py --count 500 --seed 17 --output-dir scripts/generated
  python3 scripts/generate_recipe_bundle_local.py --count 500 --seed 17 --bundle-suffix v2
"""

from __future__ import annotations

import argparse
import json
import random
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable


VALID_MEAL_TYPES = ("breakfast", "lunch", "dinner", "snack")
MEAL_TYPE_LABELS_ES = {
    "breakfast": "desayuno",
    "lunch": "comida",
    "dinner": "cena",
    "snack": "picoteo",
}
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_DIR = REPO_ROOT / "scripts" / "generated_bundles"


@dataclass(frozen=True)
class Ingredient:
    name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float


DIET_DEFAULTS = {
    "sodium_mg": 0.0,
    "saturated_fat_g": 0.0,
    "added_sugars_g": 0.0,
    "potassium_mg": 0.0,
    "phosphorus_mg": 0.0,
    "gluten_free": True,
}


INGREDIENTS: dict[str, Ingredient] = {
    "avena": Ingredient("Avena en copos", 389, 16.9, 66.3, 6.9, 10.6),
    "yogur_griego": Ingredient("Yogur griego natural", 97, 9.0, 3.6, 5.0, 0.0),
    "queso_fresco_batido": Ingredient("Queso fresco batido", 64, 10.0, 3.6, 0.2, 0.0),
    "requeson": Ingredient("Requesón", 98, 11.1, 3.4, 4.3, 0.0),
    "chia": Ingredient("Semillas de chía", 486, 16.5, 42.1, 30.7, 34.4),
    "almendras": Ingredient("Almendras", 579, 21.2, 21.6, 49.9, 12.5),
    "nueces": Ingredient("Nueces", 654, 15.2, 13.7, 65.2, 6.7),
    "platano": Ingredient("Plátano", 89, 1.1, 22.8, 0.3, 2.6),
    "fresas": Ingredient("Fresas", 32, 0.7, 7.7, 0.3, 2.0),
    "arandanos": Ingredient("Arándanos", 57, 0.7, 14.5, 0.3, 2.4),
    "manzana": Ingredient("Manzana", 52, 0.3, 13.8, 0.2, 2.4),
    "pan_integral": Ingredient("Pan integral", 247, 12.4, 41.2, 4.2, 6.9),
    "tortilla_trigo": Ingredient("Tortilla de trigo integral", 310, 8.5, 52.0, 7.0, 5.0),
    "huevo": Ingredient("Huevo", 143, 12.6, 0.7, 9.5, 0.0),
    "claras": Ingredient("Claras de huevo", 52, 10.9, 0.7, 0.2, 0.0),
    "pavo": Ingredient("Pechuga de pavo", 110, 24.0, 1.0, 1.0, 0.0),
    "atun": Ingredient("Atún al natural", 116, 26.0, 0.0, 1.0, 0.0),
    "tomate": Ingredient("Tomate", 18, 0.9, 3.9, 0.2, 1.2),
    "espinaca": Ingredient("Espinaca", 23, 2.9, 3.6, 0.4, 2.2),
    "aguacate": Ingredient("Aguacate", 160, 2.0, 8.5, 14.7, 6.7),
    "aove": Ingredient("Aceite de oliva virgen extra", 884, 0.0, 0.0, 100.0, 0.0),
    "queso_cabra": Ingredient("Queso de cabra", 364, 22.0, 2.0, 30.0, 0.0),
    "arroz": Ingredient("Arroz cocido", 130, 2.7, 28.0, 0.3, 0.4),
    "arroz_integral": Ingredient("Arroz integral cocido", 123, 2.7, 25.6, 1.0, 1.8),
    "quinoa": Ingredient("Quinoa cocida", 120, 4.4, 21.3, 1.9, 2.8),
    "cuscus": Ingredient("Cuscús cocido", 112, 3.8, 23.2, 0.2, 1.4),
    "pasta_integral": Ingredient("Pasta integral cocida", 149, 5.8, 29.0, 1.0, 3.9),
    "patata": Ingredient("Patata cocida", 87, 1.9, 20.1, 0.1, 1.8),
    "boniato": Ingredient("Boniato asado", 90, 2.0, 20.7, 0.1, 3.3),
    "garbanzos": Ingredient("Garbanzos cocidos", 164, 8.9, 27.4, 2.6, 7.6),
    "lentejas": Ingredient("Lentejas cocidas", 116, 9.0, 20.1, 0.4, 7.9),
    "pollo": Ingredient("Pechuga de pollo", 165, 31.0, 0.0, 3.6, 0.0),
    "salmon": Ingredient("Salmón", 208, 20.0, 0.0, 13.0, 0.0),
    "merluza": Ingredient("Merluza", 90, 18.0, 0.0, 1.5, 0.0),
    "tofu": Ingredient("Tofu firme", 144, 17.3, 2.8, 8.7, 2.3),
    "brocoli": Ingredient("Brócoli", 35, 2.8, 7.0, 0.4, 3.3),
    "calabacin": Ingredient("Calabacín", 17, 1.2, 3.1, 0.3, 1.0),
    "pimiento_rojo": Ingredient("Pimiento rojo", 31, 1.0, 6.0, 0.3, 2.1),
    "pimiento_verde": Ingredient("Pimiento verde", 20, 0.9, 4.6, 0.2, 1.7),
    "cebolla_morada": Ingredient("Cebolla morada", 40, 1.1, 9.3, 0.1, 1.7),
    "pepino": Ingredient("Pepino", 15, 0.7, 3.6, 0.1, 0.5),
    "zanahoria": Ingredient("Zanahoria", 41, 0.9, 9.6, 0.2, 2.8),
    "champinones": Ingredient("Champiñones", 22, 3.1, 3.3, 0.3, 1.0),
    "esparragos": Ingredient("Espárragos", 20, 2.2, 3.9, 0.1, 2.1),
    "rucula": Ingredient("Rúcula", 25, 2.6, 3.7, 0.7, 1.6),
    "hummus": Ingredient("Hummus", 166, 7.9, 14.3, 9.6, 6.0),
    "queso_batido": Ingredient("Skyr natural", 63, 11.0, 3.8, 0.2, 0.0),
    "cacahuete": Ingredient("Cacahuete tostado", 585, 25.8, 16.1, 49.2, 8.5),
}


INGREDIENT_DIET_META: dict[str, dict[str, float | bool]] = {
    "avena": {"sodium_mg": 2, "saturated_fat_g": 1.2, "added_sugars_g": 0, "potassium_mg": 429, "phosphorus_mg": 523, "gluten_free": False},
    "yogur_griego": {"sodium_mg": 36, "saturated_fat_g": 3.3, "added_sugars_g": 0, "potassium_mg": 141, "phosphorus_mg": 135, "gluten_free": True},
    "queso_fresco_batido": {"sodium_mg": 45, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 150, "phosphorus_mg": 120, "gluten_free": True},
    "requeson": {"sodium_mg": 360, "saturated_fat_g": 2.0, "added_sugars_g": 0, "potassium_mg": 104, "phosphorus_mg": 159, "gluten_free": True},
    "chia": {"sodium_mg": 16, "saturated_fat_g": 3.3, "added_sugars_g": 0, "potassium_mg": 407, "phosphorus_mg": 860, "gluten_free": True},
    "almendras": {"sodium_mg": 1, "saturated_fat_g": 3.8, "added_sugars_g": 0, "potassium_mg": 733, "phosphorus_mg": 481, "gluten_free": True},
    "nueces": {"sodium_mg": 2, "saturated_fat_g": 6.1, "added_sugars_g": 0, "potassium_mg": 441, "phosphorus_mg": 346, "gluten_free": True},
    "platano": {"sodium_mg": 1, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 358, "phosphorus_mg": 22, "gluten_free": True},
    "fresas": {"sodium_mg": 1, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 153, "phosphorus_mg": 24, "gluten_free": True},
    "arandanos": {"sodium_mg": 1, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 77, "phosphorus_mg": 12, "gluten_free": True},
    "manzana": {"sodium_mg": 1, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 107, "phosphorus_mg": 11, "gluten_free": True},
    "pan_integral": {"sodium_mg": 467, "saturated_fat_g": 0.8, "added_sugars_g": 3.6, "potassium_mg": 230, "phosphorus_mg": 210, "gluten_free": False},
    "tortilla_trigo": {"sodium_mg": 520, "saturated_fat_g": 1.8, "added_sugars_g": 1.8, "potassium_mg": 126, "phosphorus_mg": 165, "gluten_free": False},
    "huevo": {"sodium_mg": 140, "saturated_fat_g": 3.1, "added_sugars_g": 0, "potassium_mg": 138, "phosphorus_mg": 198, "gluten_free": True},
    "claras": {"sodium_mg": 166, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 163, "phosphorus_mg": 15, "gluten_free": True},
    "pavo": {"sodium_mg": 390, "saturated_fat_g": 0.3, "added_sugars_g": 0, "potassium_mg": 239, "phosphorus_mg": 210, "gluten_free": True},
    "atun": {"sodium_mg": 247, "saturated_fat_g": 0.2, "added_sugars_g": 0, "potassium_mg": 237, "phosphorus_mg": 250, "gluten_free": True},
    "tomate": {"sodium_mg": 5, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 237, "phosphorus_mg": 24, "gluten_free": True},
    "espinaca": {"sodium_mg": 79, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 558, "phosphorus_mg": 49, "gluten_free": True},
    "aguacate": {"sodium_mg": 7, "saturated_fat_g": 2.1, "added_sugars_g": 0, "potassium_mg": 485, "phosphorus_mg": 52, "gluten_free": True},
    "aove": {"sodium_mg": 0, "saturated_fat_g": 14.0, "added_sugars_g": 0, "potassium_mg": 1, "phosphorus_mg": 0, "gluten_free": True},
    "queso_cabra": {"sodium_mg": 515, "saturated_fat_g": 21.0, "added_sugars_g": 0, "potassium_mg": 160, "phosphorus_mg": 407, "gluten_free": True},
    "arroz": {"sodium_mg": 1, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 35, "phosphorus_mg": 43, "gluten_free": True},
    "arroz_integral": {"sodium_mg": 4, "saturated_fat_g": 0.2, "added_sugars_g": 0, "potassium_mg": 86, "phosphorus_mg": 83, "gluten_free": True},
    "quinoa": {"sodium_mg": 7, "saturated_fat_g": 0.2, "added_sugars_g": 0, "potassium_mg": 172, "phosphorus_mg": 152, "gluten_free": True},
    "cuscus": {"sodium_mg": 5, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 58, "phosphorus_mg": 22, "gluten_free": False},
    "pasta_integral": {"sodium_mg": 5, "saturated_fat_g": 0.2, "added_sugars_g": 0, "potassium_mg": 44, "phosphorus_mg": 84, "gluten_free": False},
    "patata": {"sodium_mg": 4, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 379, "phosphorus_mg": 44, "gluten_free": True},
    "boniato": {"sodium_mg": 36, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 337, "phosphorus_mg": 47, "gluten_free": True},
    "garbanzos": {"sodium_mg": 24, "saturated_fat_g": 0.3, "added_sugars_g": 0, "potassium_mg": 291, "phosphorus_mg": 168, "gluten_free": True},
    "lentejas": {"sodium_mg": 2, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 369, "phosphorus_mg": 180, "gluten_free": True},
    "pollo": {"sodium_mg": 74, "saturated_fat_g": 1.0, "added_sugars_g": 0, "potassium_mg": 256, "phosphorus_mg": 220, "gluten_free": True},
    "salmon": {"sodium_mg": 59, "saturated_fat_g": 3.1, "added_sugars_g": 0, "potassium_mg": 363, "phosphorus_mg": 252, "gluten_free": True},
    "merluza": {"sodium_mg": 90, "saturated_fat_g": 0.3, "added_sugars_g": 0, "potassium_mg": 315, "phosphorus_mg": 210, "gluten_free": True},
    "tofu": {"sodium_mg": 14, "saturated_fat_g": 1.3, "added_sugars_g": 0, "potassium_mg": 237, "phosphorus_mg": 287, "gluten_free": True},
    "brocoli": {"sodium_mg": 41, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 316, "phosphorus_mg": 66, "gluten_free": True},
    "calabacin": {"sodium_mg": 8, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 261, "phosphorus_mg": 38, "gluten_free": True},
    "pimiento_rojo": {"sodium_mg": 4, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 211, "phosphorus_mg": 26, "gluten_free": True},
    "pimiento_verde": {"sodium_mg": 3, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 175, "phosphorus_mg": 20, "gluten_free": True},
    "cebolla_morada": {"sodium_mg": 4, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 146, "phosphorus_mg": 29, "gluten_free": True},
    "pepino": {"sodium_mg": 2, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 147, "phosphorus_mg": 24, "gluten_free": True},
    "zanahoria": {"sodium_mg": 69, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 320, "phosphorus_mg": 35, "gluten_free": True},
    "champinones": {"sodium_mg": 5, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 318, "phosphorus_mg": 86, "gluten_free": True},
    "esparragos": {"sodium_mg": 2, "saturated_fat_g": 0.0, "added_sugars_g": 0, "potassium_mg": 202, "phosphorus_mg": 52, "gluten_free": True},
    "rucula": {"sodium_mg": 27, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 369, "phosphorus_mg": 52, "gluten_free": True},
    "hummus": {"sodium_mg": 240, "saturated_fat_g": 1.4, "added_sugars_g": 0, "potassium_mg": 228, "phosphorus_mg": 176, "gluten_free": True},
    "queso_batido": {"sodium_mg": 55, "saturated_fat_g": 0.1, "added_sugars_g": 0, "potassium_mg": 150, "phosphorus_mg": 120, "gluten_free": True},
    "cacahuete": {"sodium_mg": 6, "saturated_fat_g": 6.8, "added_sugars_g": 0, "potassium_mg": 705, "phosphorus_mg": 376, "gluten_free": True},
}


def slugify(value: str) -> str:
    text = value.lower().strip()
    text = text.replace("ñ", "n")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def round1(value: float) -> float:
    return round(value, 1)


def sum_macros(items: list[tuple[str, float]]) -> dict[str, float]:
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
    gluten_free = True
    for ingredient_key, grams in items:
        ingredient = INGREDIENTS[ingredient_key]
        diet_meta = {**DIET_DEFAULTS, **INGREDIENT_DIET_META.get(ingredient_key, {})}
        ratio = grams / 100
        totals["calories_kcal"] += ingredient.calories * ratio
        totals["protein_g"] += ingredient.protein * ratio
        totals["carbs_g"] += ingredient.carbs * ratio
        totals["fat_g"] += ingredient.fat * ratio
        totals["fiber_g"] += ingredient.fiber * ratio
        totals["sodium_mg"] += float(diet_meta["sodium_mg"]) * ratio
        totals["saturated_fat_g"] += float(diet_meta["saturated_fat_g"]) * ratio
        totals["added_sugars_g"] += float(diet_meta["added_sugars_g"]) * ratio
        totals["potassium_mg"] += float(diet_meta["potassium_mg"]) * ratio
        totals["phosphorus_mg"] += float(diet_meta["phosphorus_mg"]) * ratio
        gluten_free = gluten_free and bool(diet_meta["gluten_free"])

    return {
        "calories_kcal": round(totals["calories_kcal"]),
        "protein_g": round1(totals["protein_g"]),
        "carbs_g": round1(totals["carbs_g"]),
        "fat_g": round1(totals["fat_g"]),
        "fiber_g": round1(totals["fiber_g"]),
        "sodium_mg": round(totals["sodium_mg"]),
        "saturated_fat_g": round1(totals["saturated_fat_g"]),
        "added_sugars_g": round1(totals["added_sugars_g"]),
        "potassium_mg": round(totals["potassium_mg"]),
        "phosphorus_mg": round(totals["phosphorus_mg"]),
        "gluten_free": gluten_free,
    }


def ingredient_line(ingredient_key: str, grams: float, *, notes: str | None = None) -> dict:
    ingredient = INGREDIENTS[ingredient_key]
    item = {
        "ingredient_name": ingredient.name,
        "quantity": round(grams),
        "unit": "g",
    }
    if notes:
        item["notes"] = notes
    return item


def build_steps(lines: list[str]) -> list[dict]:
    return [{"instruction": line} for line in lines]


def choose(rng: random.Random, options: list[str]) -> str:
    return rng.choice(options)


def make_recipe(
    *,
    meal_type: str,
    title: str,
    description: str,
    cuisine: str,
    tags: list[str],
    prep_time_min: int,
    cook_time_min: int,
    servings: int,
    items: list[tuple[str, float]],
    steps: list[str],
    template_key: str,
    canonical_keys: list[str],
    accent_keys: list[str] | None = None,
) -> dict:
    totals = sum_macros(items)
    ingredient_rows = [ingredient_line(key, grams) for key, grams in items]
    return {
        "slug": slugify(title),
        "title": title,
        "description": description,
        "meal_type": meal_type,
        "cuisine": cuisine,
        "prep_time_min": prep_time_min,
        "cook_time_min": cook_time_min,
        "ready_in_min": prep_time_min + cook_time_min,
        "servings": servings,
        **totals,
        "tags": tags,
        "ingredients": ingredient_rows,
        "steps": build_steps(steps),
        "_template_key": template_key,
        "_canonical_keys": canonical_keys,
        "_accent_keys": accent_keys or [],
    }


def breakfast_oats(rng: random.Random) -> dict:
    fruit = rng.choice(["platano", "fresas", "arandanos", "manzana"])
    cream = rng.choice(["yogur_griego", "queso_fresco_batido", "queso_batido"])
    seed = rng.choice(["chia", "almendras", "nueces"])
    items = [
        ("avena", rng.randint(45, 65)),
        (cream, rng.randint(140, 220)),
        (fruit, rng.randint(70, 140)),
        (seed, rng.randint(8, 16)),
    ]
    fruit_name = INGREDIENTS[fruit].name.lower()
    cream_name = INGREDIENTS[cream].name.lower()
    seed_name = INGREDIENTS[seed].name.lower()
    title = choose(
        rng,
        [
            f"Bowl de avena con {fruit_name} y {seed_name}",
            f"Bol cremoso de avena, {fruit_name} y {seed_name}",
            f"Avena suave con {fruit_name} y toque de {seed_name}",
            f"Desayuno de avena con {fruit_name} y {seed_name}",
        ],
    )
    return make_recipe(
        meal_type="breakfast",
        title=title,
        description=choose(
            rng,
            [
                f"Desayuno cremoso con avena, {fruit_name} y topping crujiente.",
                f"Bol suave y saciante con avena, {fruit_name} y un remate crujiente.",
                f"Receta rápida de cuchara con avena y {fruit_name}, pensada para empezar con calma.",
            ],
        ),
        cuisine="mediterranean",
        tags=["desayuno", "bowl", "rapido", "avena"],
        prep_time_min=8,
        cook_time_min=0,
        servings=1,
        items=items,
        steps=[
            f"Pon {items[0][1]}g de avena en un bol amplio. Añade {items[1][1]}g de {cream_name} y mezcla con una cuchara hasta que la avena quede completamente integrada en la base cremosa.",
            "Deja reposar 2 minutos para que la avena absorba la humedad y la textura se asiente.",
            f"Prepara {items[2][1]}g de {fruit_name}: si es plátano, córtalo en rodajas de 1 cm; si son fresas, en cuartos; si es manzana, en dados pequeños; los arándanos van enteros.",
            f"Coloca la fruta sobre la mezcla de avena cubriendo bien la superficie.",
            f"Distribuye {items[3][1]}g de {seed_name} por encima como topping crujiente. Sirve al momento sin remover para conservar las texturas.",
        ],
        template_key="breakfast_oats",
        canonical_keys=["avena", cream, fruit],
        accent_keys=[seed],
    )


def breakfast_toast(rng: random.Random) -> dict:
    protein = rng.choice(["pavo", "atun", "huevo"])
    fresh = rng.choice(["tomate", "espinaca", "aguacate"])
    fat = "aove" if fresh != "aguacate" else rng.choice(["queso_cabra", "aove"])
    items = [
        ("pan_integral", rng.randint(70, 100)),
        (protein, rng.randint(70, 120)),
        (fresh, rng.randint(50, 90)),
        (fat, rng.randint(8, 18)),
    ]
    fat_name = INGREDIENTS[fat].name.lower()
    protein_name = INGREDIENTS[protein].name.lower()
    fresh_name = INGREDIENTS[fresh].name.lower()
    title = choose(
        rng,
        [
            f"Tostadas de {protein_name} con {fresh_name} y {fat_name}",
            f"Tostas integrales con {protein_name}, {fresh_name} y {fat_name}",
            f"Pan tostado con {protein_name} y {fresh_name}",
            f"Desayuno tostado de {protein_name} con {fresh_name}",
        ],
    )
    return make_recipe(
        meal_type="breakfast",
        title=title,
        description=choose(
            rng,
            [
                "Desayuno salado de montaje rápido con pan tostado y topping fresco.",
                "Tostadas completas para un desayuno salado sin complicarte.",
                "Receta rápida de pan tostado con contraste entre base crujiente y topping fresco.",
            ],
        ),
        cuisine="spanish",
        tags=["desayuno", "tostadas", "salado", "rapido"],
        prep_time_min=6,
        cook_time_min=4 if protein == "huevo" else 0,
        servings=1,
        items=items,
        steps=[
            f"Tuesta {items[0][1]}g de pan integral en la tostadora o en una sartén seca a fuego medio-alto 2-3 minutos hasta que quede crujiente y bien dorado.",
            f"Si la proteína es huevo: bate {items[1][1]}g en un bol con una pizca de sal y cocina en sartén antiadherente a fuego medio 3-4 min removiendo suave hasta cuajar. Si es pechuga de pavo: coloca las lonchas directamente. Si es atún: escúrrelo bien antes de emplatar.",
            f"Prepara {items[2][1]}g de {fresh_name}: si es tomate, córtalo en rodajas de 5 mm; si es aguacate, aplástalo con un tenedor y sazónalo con sal; si son espinacas, ponlas en la sartén del huevo 1 min hasta que se marchiten.",
            f"Monta las tostadas: extiende primero {fresh_name} sobre el pan crujiente, luego coloca la proteína encima.",
            f"Termina con {items[3][1]}g de {fat_name}: si es AOVE, un hilo fino; si es queso de cabra, desmígalo encima. Sirve al momento mientras el pan aún cruje.",
        ],
        template_key="breakfast_toast",
        canonical_keys=["pan_integral", protein, fresh],
        accent_keys=[fat],
    )


def breakfast_wrap(rng: random.Random) -> dict:
    protein = rng.choice(["huevo", "claras", "pavo"])
    veg = rng.choice(["espinaca", "tomate", "pimiento_rojo"])
    extra = rng.choice(["aguacate", "queso_cabra"])
    items = [
        ("tortilla_trigo", rng.randint(60, 75)),
        (protein, rng.randint(90, 140)),
        (veg, rng.randint(45, 80)),
        (extra, rng.randint(18, 35)),
    ]
    protein_name = INGREDIENTS[protein].name.lower()
    veg_name = INGREDIENTS[veg].name.lower()
    extra_name = INGREDIENTS[extra].name.lower()
    title = choose(
        rng,
        [
            f"Wrap de desayuno con {protein_name} y {veg_name}",
            f"Wrap caliente de {protein_name} con {veg_name}",
            f"Tortilla rellena de {protein_name}, {veg_name} y {extra_name}",
            f"Desayuno enrollado de {protein_name} con {veg_name}",
        ],
    )
    return make_recipe(
        meal_type="breakfast",
        title=title,
        description=choose(
            rng,
            [
                "Wrap caliente para desayunos con hambre real y poco tiempo.",
                "Formato enrollado, rápido y fácil de llevar si desayunas con prisas.",
                "Opción salada de desayuno con relleno jugoso y montaje sencillo.",
            ],
        ),
        cuisine="mediterranean",
        tags=["desayuno", "wrap", "alto-en-proteina"],
        prep_time_min=8,
        cook_time_min=6,
        servings=1,
        items=items,
        steps=[
            f"Calienta una sartén antiadherente a fuego medio con unas gotas de aceite. Añade {items[2][1]}g de {veg_name}: si es pimiento rojo, saltea 4 min hasta que se ablande; si es espinaca, 1-2 min hasta que se marchite; si es tomate, 2 min hasta que suelte algo de jugo.",
            f"Sube a fuego medio-alto. Añade {items[1][1]}g de {protein_name}: si es huevo o claras, bate con una pizca de sal y vierte en la sartén, remueve suave 2-3 min hasta cuajar cremoso; si es pechuga de pavo, saltea en tiras 2-3 min hasta que pierdan el rosa.",
            f"Calienta {items[0][1]}g de tortilla de trigo integral directamente sobre la llama 10 seg por cara, o en la misma sartén 30 seg por cara, hasta que esté flexible y con toques tostados.",
            f"Distribuye el relleno en el centro de la tortilla dejando 3 cm libre en los bordes. Añade {items[3][1]}g de {extra_name}: si es aguacate, en lonchas finas; si es queso de cabra, desmigado.",
            "Dobla los laterales hacia el centro y enrolla firme desde abajo hacia arriba. Sirve con el pliegue hacia abajo para que no se abra.",
        ],
        template_key="breakfast_wrap",
        canonical_keys=["tortilla_trigo", protein, veg, extra],
        accent_keys=[],
    )


def lunch_bowl(rng: random.Random, meal_type: str = "lunch") -> dict:
    protein = rng.choice(["pollo", "pavo", "salmon", "tofu", "garbanzos", "lentejas"])
    base = rng.choice(["arroz", "arroz_integral", "quinoa", "cuscus", "patata", "boniato"])
    veg1, veg2 = rng.sample(["brocoli", "calabacin", "pimiento_rojo", "pimiento_verde", "cebolla_morada", "zanahoria", "espinaca"], 2)
    fat = rng.choice(["aove", "aguacate", "almendras"])
    items = [
        (protein, rng.randint(110, 180)),
        (base, rng.randint(130, 220)),
        (veg1, rng.randint(70, 120)),
        (veg2, rng.randint(60, 110)),
        (fat, rng.randint(10, 25)),
    ]
    protein_name = INGREDIENTS[protein].name.lower()
    base_name = INGREDIENTS[base].name.lower()
    veg1_name = INGREDIENTS[veg1].name.lower()
    veg2_name = INGREDIENTS[veg2].name.lower()
    title = choose(
        rng,
        [
            f"Bowl de {protein_name} con {base_name} y {veg1_name}",
            f"Bol completo de {protein_name}, {base_name} y {veg1_name}",
            f"Plato de {protein_name} con {base_name} y salteado de {veg1_name}",
            f"{protein_name.capitalize()} con {base_name} y {veg1_name}",
            f"Bowl templado de {protein_name} con {veg1_name} y {veg2_name}",
        ],
    )
    return make_recipe(
        meal_type=meal_type,
        title=title,
        description=choose(
            rng,
            [
                "Plato completo por bloques con base saciante, proteína y verduras.",
                "Receta equilibrada de diario con una estructura clara: base, proteína y verdura.",
                "Bol templado pensado para dejarte saciado sin hacerse pesado.",
            ],
        ),
        cuisine="mediterranean",
        tags=[meal_type, "bowl", "batch-friendly", "equilibrado"],
        prep_time_min=12,
        cook_time_min=18,
        servings=1,
        items=items,
        steps=[
            f"Prepara {items[1][1]}g de {base_name}: si es arroz, quinoa o cuscús, ponlos en cazo con el doble de agua y sal, lleva a ebullición, baja el fuego y cuece tapado 15-18 min hasta absorber toda el agua; si es boniato o patata, córtalo en dados de 2 cm y asa a 200°C 22-25 min hasta dorar.",
            f"Cocina {items[0][1]}g de {protein_name}: si es pollo o pavo, fíletea y saltea en sartén con aceite a fuego alto 3-4 min por lado hasta que quede dorado; si es salmón, 3 min por cara; si es tofu, córtalo en dados y dóralo 5-6 min removiendo; si son garbanzos o lentejas, caliéntalos directamente.",
            f"En la misma sartén, añade {items[2][1]}g de {veg1_name} y {items[3][1]}g de {veg2_name}. Saltea a fuego alto 4-5 min removiendo hasta que estén tiernos pero con algo de mordida y los bordes ligeramente tostados.",
            f"Monta el bowl: base al fondo, proteína a un lado, verduras al otro. Añade {items[4][1]}g de {INGREDIENTS[fat].name.lower()}: si es AOVE, un hilo fino; si es aguacate, en dados de 1 cm; si son almendras, enteras o groseramente troceadas.",
            "Salpimienta al gusto y sirve caliente. Si lo preparas para el día siguiente, guarda la base, la proteína y las verduras por separado.",
        ],
        template_key=f"{meal_type}_bowl",
        canonical_keys=[protein, base, veg1],
        accent_keys=[veg2, fat],
    )


def lunch_pasta(rng: random.Random, meal_type: str = "lunch") -> dict:
    protein = rng.choice(["pollo", "atun", "tofu", "garbanzos"])
    veg1, veg2 = rng.sample(["tomate", "espinaca", "calabacin", "champinones", "pimiento_rojo"], 2)
    fat = rng.choice(["aove", "queso_cabra"])
    items = [
        ("pasta_integral", rng.randint(150, 220)),
        (protein, rng.randint(90, 150)),
        (veg1, rng.randint(70, 120)),
        (veg2, rng.randint(70, 120)),
        (fat, rng.randint(8, 20)),
    ]
    protein_name = INGREDIENTS[protein].name.lower()
    veg1_name = INGREDIENTS[veg1].name.lower()
    veg2_name = INGREDIENTS[veg2].name.lower()
    title = choose(
        rng,
        [
            f"Pasta integral con {protein_name}, {veg1_name} y {veg2_name}",
            f"Pasta rápida de {protein_name} con {veg1_name} y {veg2_name}",
            f"Pasta salteada con {protein_name} y verduras",
            f"Plato de pasta integral con {protein_name} y {veg1_name}",
        ],
    )
    return make_recipe(
        meal_type=meal_type,
        title=title,
        description=choose(
            rng,
            [
                "Pasta rápida de diario con verduras y una proteína clara.",
                "Plato completo de pasta para comer bien sin alargar la cocina.",
                "Receta de sartén y olla con sabor reconocible y montaje fácil.",
            ],
        ),
        cuisine="mediterranean",
        tags=[meal_type, "pasta", "rapido"],
        prep_time_min=10,
        cook_time_min=15,
        servings=1,
        items=items,
        steps=[
            f"Cuece {items[0][1]}g de pasta integral en agua hirviendo con sal generosa — sigue el tiempo del paquete menos 1 minuto para que quede al dente. Reserva un vaso del agua de cocción antes de escurrir.",
            f"Calienta una sartén amplia con un hilo de aceite a fuego medio-alto. Si la proteína es pollo o tofu, córtalo en dados de 2 cm y dóralo 4-5 min hasta que quede sellado; si es atún, añádelo al final fuera del fuego; si son garbanzos, saltéalos 3-4 min hasta que crujeen.",
            f"Añade {items[2][1]}g de {veg1_name} a la sartén: si es tomate, aplástalo ligeramente con la espátula; si son champiñones, sube el fuego para evaporar el agua 4-5 min; si es calabacín o pimiento, saltea 4 min. A los 2-3 min incorpora {items[3][1]}g de {veg2_name}.",
            f"Incorpora la pasta escurrida a la sartén con las verduras y la proteína. Añade {items[4][1]}g de {INGREDIENTS[fat].name.lower()}: si es AOVE, un hilo generoso; si es queso de cabra, desmígalo encima. Si la pasta queda seca, añade un chorrito del agua de cocción reservada.",
            "Saltea todo junto a fuego alto 1-2 min removiendo para que la pasta absorba los jugos. Sirve inmediatamente, el plato pierde textura en frío.",
        ],
        template_key=f"{meal_type}_pasta",
        canonical_keys=["pasta_integral", protein, veg1, veg2],
        accent_keys=[fat],
    )


def lunch_salad(rng: random.Random, meal_type: str = "lunch") -> dict:
    protein = rng.choice(["atun", "pollo", "garbanzos", "tofu", "salmon"])
    base = rng.choice(["quinoa", "arroz_integral", "patata"])
    veg1, veg2, veg3 = rng.sample(["tomate", "pepino", "rucula", "espinaca", "zanahoria", "cebolla_morada"], 3)
    fat = rng.choice(["aove", "aguacate", "nueces"])
    items = [
        (protein, rng.randint(100, 160)),
        (base, rng.randint(100, 180)),
        (veg1, rng.randint(50, 100)),
        (veg2, rng.randint(40, 90)),
        (veg3, rng.randint(30, 70)),
        (fat, rng.randint(10, 25)),
    ]
    protein_name = INGREDIENTS[protein].name.lower()
    veg1_name = INGREDIENTS[veg1].name.lower()
    veg2_name = INGREDIENTS[veg2].name.lower()
    veg3_name = INGREDIENTS[veg3].name.lower()
    title = choose(
        rng,
        [
            f"Ensalada completa de {protein_name} con {veg1_name} y {veg2_name}",
            f"Ensalada saciante de {protein_name} con {veg1_name} y {veg3_name}",
            f"Bol fresco de {protein_name} con {veg2_name} y {veg3_name}",
            f"Ensalada templada de {protein_name} con base y vegetales crujientes",
        ],
    )
    return make_recipe(
        meal_type=meal_type,
        title=title,
        description=choose(
            rng,
            [
                "Ensalada completa con base saciante y textura fresca.",
                "Bol fresco pensado para comer ligero sin quedarte corto.",
                "Receta fría o templada con buena mezcla de base, proteína y crujiente.",
            ],
        ),
        cuisine="mediterranean",
        tags=[meal_type, "ensalada", "frio", "rapido"],
        prep_time_min=14,
        cook_time_min=10,
        servings=1,
        items=items,
        steps=[
            f"Cuece {items[1][1]}g de {INGREDIENTS[base].name.lower()}: si es quinoa o arroz integral, en cazo con el doble de agua y sal 15-18 min a fuego bajo tapado; si es patata, en agua con sal 12-15 min hasta que el tenedor entre sin resistencia. Escurre y deja enfriar 5 min.",
            f"Prepara {items[0][1]}g de {protein_name}: si es atún, escúrrelo y desmígalo; si es pollo o salmón, fíletea y saltea en sartén a fuego alto 3-4 min por lado; si son garbanzos o tofu, escúrrelos y sécalos con papel.",
            f"Corta {items[2][1]}g de {veg1_name} en trozos de bocado de 2-3 cm. Lamina o corta {items[3][1]}g de {veg2_name} en formas finas. Ralla o trocea {items[4][1]}g de {veg3_name}.",
            "Dispón la base templada en una fuente amplia. Coloca las verduras y la proteína encima en secciones separadas para que cada bocado tenga diferente textura.",
            f"Aliña con {items[5][1]}g de {INGREDIENTS[fat].name.lower()}: si es AOVE, emulsiona con una cucharadita de vinagre; si es aguacate, córtalo en dados de 1.5 cm; si son nueces, desmenúzalas encima. Sazona con sal y pimienta, mezcla justo antes de comer.",
        ],
        template_key=f"{meal_type}_salad",
        canonical_keys=[protein, base, veg1],
        accent_keys=[veg2, veg3, fat],
    )


def dinner_tray_bake(rng: random.Random) -> dict:
    protein = rng.choice(["pollo", "salmon", "merluza", "tofu"])
    base = rng.choice(["boniato", "patata", "quinoa"])
    veg1, veg2 = rng.sample(["brocoli", "calabacin", "pimiento_rojo", "cebolla_morada", "esparragos"], 2)
    items = [
        (protein, rng.randint(120, 180)),
        (base, rng.randint(130, 210)),
        (veg1, rng.randint(80, 130)),
        (veg2, rng.randint(70, 120)),
        ("aove", rng.randint(10, 18)),
    ]
    protein_name = INGREDIENTS[protein].name.lower()
    veg1_name = INGREDIENTS[veg1].name.lower()
    veg2_name = INGREDIENTS[veg2].name.lower()
    title = choose(
        rng,
        [
            f"Bandeja al horno de {protein_name} con {veg1_name}",
            f"Asado rápido de {protein_name} con {veg1_name} y {veg2_name}",
            f"{protein_name.capitalize()} al horno con verduras",
            f"Cena al horno de {protein_name} con {veg2_name}",
        ],
    )
    return make_recipe(
        meal_type="dinner",
        title=title,
        description=choose(
            rng,
            [
                "Cena de horno en una sola bandeja, cómoda y fácil de repetir.",
                "Formato de bandeja único para cocinar, recoger y volver a hacer sin pensar demasiado.",
                "Receta de horno simple con base, proteína y verduras en la misma cocción.",
            ],
        ),
        cuisine="mediterranean",
        tags=["cena", "horno", "batch-friendly"],
        prep_time_min=12,
        cook_time_min=24,
        servings=1,
        items=items,
        steps=[
            "Precalienta el horno a 200°C (calor arriba y abajo) al menos 10 minutos.",
            f"Corta {items[1][1]}g de {INGREDIENTS[base].name.lower()} en dados de 2-3 cm. Coloca en bandeja de horno, riega con la mitad de {items[4][1]}g de aceite de oliva virgen extra, añade sal, pimienta y orégano. Mezcla bien.",
            f"Hornea la base 15 minutos a 200°C hasta que los bordes empiecen a dorarse. Añade {items[2][1]}g de {veg1_name} y {items[3][1]}g de {veg2_name} cortados en trozos similares a la base; riega con el aceite restante y hornea 10 minutos más.",
            f"Saca la bandeja. Coloca {items[0][1]}g de {protein_name} encima de la base: si es pollo, sazona con sal, pimentón y ajo; si es merluza o salmón, añade unas gotas de limón; si es tofu, presiónalo ligeramente sobre las verduras. Hornea 10-12 minutos más hasta que la proteína esté cocinada y dorada.",
            "Deja reposar 2 minutos antes de servir. La bandeja debe salir con los bordes crujientes y la proteína jugosa por dentro. Sirve directamente.",
        ],
        template_key="dinner_tray_bake",
        canonical_keys=[protein, base, veg1],
        accent_keys=[veg2],
    )


def dinner_scramble(rng: random.Random) -> dict:
    veg1, veg2 = rng.sample(["espinaca", "champinones", "tomate", "pimiento_verde", "cebolla_morada"], 2)
    side = rng.choice(["pan_integral", "patata", "boniato"])
    items = [
        ("huevo", rng.randint(110, 170)),
        ("claras", rng.randint(80, 140)),
        (veg1, rng.randint(70, 120)),
        (veg2, rng.randint(70, 120)),
        (side, rng.randint(80, 150)),
        ("aove", rng.randint(8, 15)),
    ]
    veg1_name = INGREDIENTS[veg1].name.lower()
    veg2_name = INGREDIENTS[veg2].name.lower()
    side_name = INGREDIENTS[side].name.lower()
    title = choose(
        rng,
        [
            f"Revuelto de {veg1_name} y {veg2_name} con {side_name}",
            f"Huevos revueltos con {veg1_name} y guarnición de {side_name}",
            f"Sartén rápida de huevo con {veg2_name} y {veg1_name}",
            f"Revuelto caliente con {veg1_name}, {veg2_name} y {side_name}",
        ],
    )
    return make_recipe(
        meal_type="dinner",
        title=title,
        description=choose(
            rng,
            [
                "Cena rápida de sartén con huevo y guarnición sencilla.",
                "Receta de última hora con sartén única y pocos pasos.",
                "Plato rápido y caliente para cenar sin liarte.",
            ],
        ),
        cuisine="spanish",
        tags=["cena", "revuelto", "rapido"],
        prep_time_min=8,
        cook_time_min=10,
        servings=1,
        items=items,
        steps=[
            f"Si la guarnición es patata o boniato: córtala en dados de 1.5 cm y cocina en sartén con {items[5][1]}g de AOVE a fuego medio 10-12 min removiendo hasta dorar. Si es pan integral: tuesta directamente. Reserva.",
            f"En la misma sartén (o una nueva con unas gotas de aceite), saltea {items[2][1]}g de {veg1_name} y {items[3][1]}g de {veg2_name} a fuego alto: si son champiñones, 4-5 min hasta evaporar el agua; si es espinaca, 1-2 min; si es pimiento o cebolla, 5-6 min hasta ablandar; si es tomate, 3 min.",
            f"Bate {items[0][1]}g de huevo con {items[1][1]}g de claras en un bol. Sazona con sal y pimienta. Baja el fuego a medio-bajo y vierte sobre las verduras en la sartén.",
            "Remueve lentamente con espátula de silicona trazando círculos amplios desde los bordes hacia el centro. Retira del fuego mientras el huevo aún esté ligeramente cremoso — el calor residual termina la cocción. No debe quedar seco ni grumoso.",
            f"Emplata el revuelto junto a {items[4][1]}g de {side_name}. Sirve inmediatamente: el revuelto se endurece rápidamente si espera.",
        ],
        template_key="dinner_scramble",
        canonical_keys=["huevo", "claras", veg1, veg2, side],
        accent_keys=[],
    )


def snack_yogurt(rng: random.Random) -> dict:
    fruit = rng.choice(["platano", "fresas", "arandanos", "manzana"])
    crunch = rng.choice(["almendras", "nueces", "chia", "cacahuete"])
    dairy = rng.choice(["yogur_griego", "queso_batido", "queso_fresco_batido"])
    items = [
        (dairy, rng.randint(140, 220)),
        (fruit, rng.randint(70, 140)),
        (crunch, rng.randint(10, 18)),
    ]
    dairy_name = INGREDIENTS[dairy].name.lower()
    fruit_name = INGREDIENTS[fruit].name.lower()
    crunch_name = INGREDIENTS[crunch].name.lower()
    title = choose(
        rng,
        [
            f"Vaso de {dairy_name} con {fruit_name} y {crunch_name}",
            f"Copa rápida de {dairy_name} con {fruit_name}",
            f"Snack cremoso de {dairy_name} con {crunch_name} y {fruit_name}",
            f"Bol frío de {dairy_name} con {fruit_name} y topping crujiente",
        ],
    )
    return make_recipe(
        meal_type="snack",
        title=title,
        description=choose(
            rng,
            [
                "Snack frío, rápido y con textura crujiente al final.",
                "Formato de cuchara sencillo para una pausa corta entre horas.",
                "Receta fría de montaje exprés con fruta y contraste de texturas.",
            ],
        ),
        cuisine="mediterranean",
        tags=["snack", "frio", "rapido"],
        prep_time_min=4,
        cook_time_min=0,
        servings=1,
        items=items,
        steps=[
            f"Saca {items[0][1]}g de {dairy_name} de la nevera 2 minutos antes para que no esté demasiado frío. Viértelo en un vaso ancho o cuenco — debe quedar denso y sin grumos.",
            f"Prepara {items[1][1]}g de {fruit_name}: si es plátano, córtalo en rodajas de 8-10 mm; si son fresas, en cuartos; si es manzana, en daditos de 1 cm; los arándanos van enteros. Distribuye la fruta sobre la base cremosa.",
            f"Añade {items[2][1]}g de {crunch_name} como última capa: si son semillas de chía, dispersa uniformemente; si son almendras o nueces, trocéalas grosso modo; si son cacahuetes, colócalos enteros. Come enseguida para conservar el contraste de texturas.",
        ],
        template_key="snack_yogurt",
        canonical_keys=[dairy, fruit],
        accent_keys=[crunch],
    )


def snack_hummus_plate(rng: random.Random) -> dict:
    veg1, veg2 = rng.sample(["pepino", "zanahoria", "pimiento_rojo", "tomate"], 2)
    extra = rng.choice(["pan_integral", "aguacate"])
    items = [
        ("hummus", rng.randint(80, 120)),
        (veg1, rng.randint(60, 100)),
        (veg2, rng.randint(60, 100)),
        (extra, rng.randint(40, 80)),
    ]
    veg1_name = INGREDIENTS[veg1].name.lower()
    veg2_name = INGREDIENTS[veg2].name.lower()
    extra_name = INGREDIENTS[extra].name.lower()
    title = choose(
        rng,
        [
            f"Plato rápido de hummus con {veg1_name} y {veg2_name}",
            f"Hummus con crudités de {veg1_name} y {veg2_name}",
            f"Snack salado de hummus con {veg1_name} y toque de {extra_name}",
            f"Bol de hummus con {veg2_name} y {veg1_name}",
        ],
    )
    return make_recipe(
        meal_type="snack",
        title=title,
        description=choose(
            rng,
            [
                "Snack salado de montaje inmediato con base cremosa y crudités.",
                "Pausa salada, rápida y fácil de preparar con verduras para mojar.",
                "Receta fría de picoteo limpio con hummus y acompañamiento fresco.",
            ],
        ),
        cuisine="mediterranean",
        tags=["snack", "salado", "rapido"],
        prep_time_min=6,
        cook_time_min=0,
        servings=1,
        items=items,
        steps=[
            f"Saca {items[0][1]}g de hummus de la nevera unos minutos antes. Extiéndelo en un plato pequeño con el dorso de una cuchara haciendo un círculo amplio — deja un pequeño pozo en el centro para acabar con un hilo de aceite.",
            f"Corta {items[1][1]}g de {veg1_name} y {items[2][1]}g de {veg2_name} en bastones de 8-10 cm de largo y 1 cm de grosor, bien secos. Colócalos alrededor del hummus.",
            f"Prepara {items[3][1]}g de {extra_name}: si es pan integral, córtalo en triángulos o bastones y tuéstalos ligeramente; si es aguacate, córtalo en láminas de 5 mm con un toque de sal y unas gotas de limón. Añade un hilo fino de aceite de oliva sobre el hummus y sirve al momento.",
        ],
        template_key="snack_hummus_plate",
        canonical_keys=["hummus", veg1, veg2, extra],
        accent_keys=[],
    )


TEMPLATES_BY_MEAL: dict[str, list[Callable[[random.Random], dict]]] = {
    "breakfast": [breakfast_oats, breakfast_toast, breakfast_wrap],
    "lunch": [lambda rng: lunch_bowl(rng, "lunch"), lambda rng: lunch_pasta(rng, "lunch"), lambda rng: lunch_salad(rng, "lunch")],
    "dinner": [lambda rng: lunch_bowl(rng, "dinner"), dinner_tray_bake, dinner_scramble],
    "snack": [snack_yogurt, snack_hummus_plate],
}


def meal_distribution(total: int) -> dict[str, int]:
    base = {
        "breakfast": round(total * 0.24),
        "lunch": round(total * 0.28),
        "dinner": round(total * 0.28),
        "snack": round(total * 0.20),
    }
    diff = total - sum(base.values())
    order = ["lunch", "dinner", "breakfast", "snack"]
    idx = 0
    while diff != 0:
        key = order[idx % len(order)]
        base[key] += 1 if diff > 0 else -1
        diff += -1 if diff > 0 else 1
        idx += 1
    return base


def recipe_signature(recipe: dict) -> str:
    ingredient_signature = sorted(
        f"{ingredient['ingredient_name']}:{ingredient['quantity']}"
        for ingredient in recipe["ingredients"]
    )
    return f"{recipe['meal_type']}::{recipe.get('_template_key')}::{','.join(ingredient_signature)}"


def recipe_concept_signature(recipe: dict) -> str:
    canonical = ",".join(sorted(recipe.get("_canonical_keys", [])))
    return f"{recipe['meal_type']}::{recipe.get('_template_key')}::{canonical}"


STRICT_CONCEPT_TEMPLATES = {
    "breakfast_wrap",
    "lunch_pasta",
    "dinner_scramble",
    "snack_hummus_plate",
}


def template_repeat_limit(meal_type: str, template_key: str, target_count: int) -> int:
    if meal_type == "breakfast" and template_key == "breakfast_wrap":
        return 18
    if meal_type == "breakfast" and template_key in {"breakfast_oats", "breakfast_toast"}:
        return 60
    if meal_type == "lunch" and template_key in {"lunch_bowl", "lunch_salad"}:
        return 60
    if meal_type == "dinner" and template_key in {"dinner_bowl", "dinner_tray_bake"}:
        return 70
    if meal_type == "snack" and template_key == "snack_yogurt":
        return 88
    if meal_type == "snack" and template_key == "snack_hummus_plate":
        return max(16, target_count // 5)
    if meal_type == "snack" and template_key == "snack_yogurt":
        return max(16, target_count // 5)
    return max(20, target_count // 4)


def public_recipe(recipe: dict) -> dict:
    return {key: value for key, value in recipe.items() if not key.startswith("_")}


def ensure_unique_slug(recipe: dict, used_slugs: set[str]) -> None:
    base_slug = recipe["slug"]
    slug = base_slug
    suffix = 2
    while slug in used_slugs:
        slug = f"{base_slug}-{suffix}"
        suffix += 1
    recipe["slug"] = slug
    used_slugs.add(slug)


def generate_recipes(total: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    distribution = meal_distribution(total)
    recipes: list[dict] = []
    seen_signatures: set[str] = set()
    seen_concepts: set[str] = set()
    used_slugs: set[str] = set()
    title_counts: dict[str, int] = {}
    template_counts: dict[str, int] = {}
    title_soft_limits = {
        "breakfast": 2,
        "lunch": 2,
        "dinner": 2,
        "snack": 2,
    }

    for meal_type, target_count in distribution.items():
        templates = TEMPLATES_BY_MEAL[meal_type]
        template_index = 0
        attempts = 0

        while sum(1 for recipe in recipes if recipe["meal_type"] == meal_type) < target_count:
            template = templates[template_index % len(templates)]
            candidate = template(rng)
            signature = recipe_signature(candidate)
            concept_signature = recipe_concept_signature(candidate)
            template_key = candidate["_template_key"]
            attempts += 1
            template_index += 1

            if signature in seen_signatures:
                if attempts > target_count * 25:
                    raise RuntimeError(f"No pude generar suficiente variedad para {meal_type}")
                continue

            if template_key in STRICT_CONCEPT_TEMPLATES and concept_signature in seen_concepts:
                if attempts > target_count * 35:
                    raise RuntimeError(f"No pude evitar duplicados semánticos para {meal_type}")
                continue

            if template_counts.get(template_key, 0) >= template_repeat_limit(meal_type, template_key, target_count):
                if attempts > target_count * 40:
                    raise RuntimeError(f"No pude equilibrar plantillas para {meal_type}")
                continue

            title_limit = title_soft_limits[meal_type]
            if title_counts.get(candidate["title"], 0) >= title_limit:
                if attempts > target_count * 30:
                    raise RuntimeError(f"No pude diversificar suficientes títulos para {meal_type}")
                continue

            ensure_unique_slug(candidate, used_slugs)
            seen_signatures.add(signature)
            if template_key in STRICT_CONCEPT_TEMPLATES:
                seen_concepts.add(concept_signature)
            title_counts[candidate["title"]] = title_counts.get(candidate["title"], 0) + 1
            template_counts[template_key] = template_counts.get(template_key, 0) + 1
            recipes.append(candidate)

    recipes.sort(key=lambda item: (VALID_MEAL_TYPES.index(item["meal_type"]), item["title"]))
    return recipes


def write_bundle(recipes: list[dict], output_root: Path, bundle_id: str, seed: int) -> Path:
    bundle_dir = output_root / bundle_id
    bundle_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "bundle_id": bundle_id,
        "generator": {
            "type": "local-block-generator",
            "seed": seed,
            "recipe_count": len(recipes),
        },
        "recipes": [public_recipe(recipe) for recipe in recipes],
        "plans": [],
    }

    (bundle_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    summary = {
        "bundle_id": bundle_id,
        "recipes": len(recipes),
        "by_meal_type": {
            MEAL_TYPE_LABELS_ES[meal_type]: sum(1 for recipe in recipes if recipe["meal_type"] == meal_type)
            for meal_type in VALID_MEAL_TYPES
        },
        "sample_titles": [recipe["title"] for recipe in recipes[:12]],
    }
    (bundle_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return bundle_dir


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera un bundle local de recetas Nutria")
    parser.add_argument("--count", type=int, default=500, help="Número de recetas a generar")
    parser.add_argument("--seed", type=int, default=17, help="Seed para generación reproducible")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directorio base de salida")
    parser.add_argument("--bundle-suffix", type=str, default="", help="Sufijo opcional para versionar el bundle_id")
    args = parser.parse_args()

    if args.count < 10:
        raise SystemExit("❌ count debe ser al menos 10")

    recipes = generate_recipes(args.count, args.seed)
    bundle_id = f"local-recipes-{args.count}-seed-{args.seed}"
    if args.bundle_suffix:
        suffix = slugify(args.bundle_suffix)
        if not suffix:
            raise SystemExit("❌ bundle-suffix no puede quedar vacío tras normalizarse")
        bundle_id = f"{bundle_id}-{suffix}"
    bundle_dir = write_bundle(recipes, args.output_dir.resolve(), bundle_id, args.seed)

    distribution = meal_distribution(args.count)
    print(f"\n✅ Bundle generado en: {bundle_dir}")
    print(f"   • recetas: {len(recipes)}")
    print(f"   • seed:    {args.seed}")
    print("   • reparto:")
    for meal_type in VALID_MEAL_TYPES:
        print(f"     - {MEAL_TYPE_LABELS_ES[meal_type]}: {distribution[meal_type]}")
    print("\nSiguiente paso sugerido:")
    print(f"  python3 scripts/validate_recipe_bundle.py {bundle_dir}\n")


if __name__ == "__main__":
    main()
