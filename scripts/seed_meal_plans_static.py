#!/usr/bin/env python3
"""
seed_meal_plans_static.py
=========================
Inserta planes de dieta con recetas españolas/mediterráneas directamente
en Supabase. No requiere ninguna API externa.

EJECUCIÓN:
----------
   scripts/.venv/bin/python3 scripts/seed_meal_plans_static.py
   scripts/.venv/bin/python3 scripts/seed_meal_plans_static.py --dry-run
"""

import argparse
import sys
from pathlib import Path

try:
    from dotenv import dotenv_values
    from supabase import create_client, Client
except ImportError as e:
    sys.exit(f"❌  Falta dependencia: {e}\n   Ejecuta: scripts/.venv/bin/pip install -r scripts/requirements_plans.txt")


# ══════════════════════════════════════════════════════════════════════════════
# RECETAS  (28 recetas · cocina española/mediterránea)
# ══════════════════════════════════════════════════════════════════════════════

RECIPES = {

  # ── DESAYUNOS ────────────────────────────────────────────────────────────

  "tostadas_tomate": {
    "title": "Tostadas con tomate y aceite de oliva",
    "meal_type": "breakfast", "cuisine": "española",
    "prep_time_min": 5, "cook_time_min": 3, "ready_in_min": 8, "servings": 1,
    "calories_kcal": 315, "protein_g": 9.0, "carbs_g": 43.0, "fat_g": 11.0, "fiber_g": 5.5,
    "ingredients": [
      {"ingredient_name": "pan de centeno integral", "quantity": 80, "unit": "g"},
      {"ingredient_name": "tomate maduro grande",    "quantity": 200,"unit": "g"},
      {"ingredient_name": "aceite de oliva virgen extra", "quantity": 10, "unit": "ml"},
      {"ingredient_name": "ajo",  "quantity": 1,  "unit": "diente"},
      {"ingredient_name": "sal",  "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Tuesta el pan en la tostadora o en una sartén sin aceite hasta que esté dorado y crujiente."},
      {"step_number": 2, "instruction": "Corta el tomate por la mitad y rállalo sobre un plato hondo; desecha la piel."},
      {"step_number": 3, "instruction": "Frota cada tostada con el diente de ajo partido para aromatizarla."},
      {"step_number": 4, "instruction": "Extiende generosamente el tomate rallado sobre las tostadas y riégalas con el aceite de oliva. Sala al gusto y sirve inmediatamente."},
    ],
  },

  "yogur_granola_frutos": {
    "title": "Bol de yogur griego con granola y frutos rojos",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 5, "cook_time_min": 0, "ready_in_min": 5, "servings": 1,
    "calories_kcal": 320, "protein_g": 18.0, "carbs_g": 38.0, "fat_g": 8.5, "fiber_g": 4.0,
    "ingredients": [
      {"ingredient_name": "yogur griego natural 0%",  "quantity": 200, "unit": "g"},
      {"ingredient_name": "granola de avena",          "quantity": 40,  "unit": "g"},
      {"ingredient_name": "fresas",                    "quantity": 80,  "unit": "g"},
      {"ingredient_name": "arándanos",                 "quantity": 40,  "unit": "g"},
      {"ingredient_name": "miel",                      "quantity": 10,  "unit": "g"},
      {"ingredient_name": "canela molida",             "quantity": 1,   "unit": "pizca"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Vierte el yogur griego en un bol amplio."},
      {"step_number": 2, "instruction": "Lava y trocea las fresas en cuartos; añádelas al bol junto con los arándanos."},
      {"step_number": 3, "instruction": "Esparce la granola por encima para que quede crujiente."},
      {"step_number": 4, "instruction": "Rocía con la miel y espolvorea una pizca de canela. Sirve de inmediato."},
    ],
  },

  "tortilla_claras_espinacas": {
    "title": "Tortilla de claras con espinacas y queso fresco",
    "meal_type": "breakfast", "cuisine": "española",
    "prep_time_min": 5, "cook_time_min": 8, "ready_in_min": 13, "servings": 1,
    "calories_kcal": 290, "protein_g": 26.0, "carbs_g": 6.0, "fat_g": 17.0, "fiber_g": 2.5,
    "ingredients": [
      {"ingredient_name": "claras de huevo",      "quantity": 200, "unit": "g", "notes": "unas 6 claras"},
      {"ingredient_name": "espinacas frescas",    "quantity": 60,  "unit": "g"},
      {"ingredient_name": "queso fresco light",   "quantity": 40,  "unit": "g"},
      {"ingredient_name": "cebollino",            "quantity": 5,   "unit": "g"},
      {"ingredient_name": "aceite de oliva",      "quantity": 5,   "unit": "ml"},
      {"ingredient_name": "sal y pimienta negra", "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Bate las claras con sal y pimienta hasta que estén bien mezcladas pero sin montar."},
      {"step_number": 2, "instruction": "Calienta el aceite en una sartén antiadherente a fuego medio. Saltea las espinacas 1-2 minutos hasta que se marchiten."},
      {"step_number": 3, "instruction": "Vierte las claras sobre las espinacas. Cocina a fuego medio-bajo, moviendo el borde hacia el centro con una espátula."},
      {"step_number": 4, "instruction": "Cuando la tortilla esté casi cuajada, añade el queso fresco desmenuzado y dobla por la mitad. Espolvorea con cebollino picado y sirve."},
    ],
  },

  "porridge_avena_platano": {
    "title": "Porridge de avena con plátano y canela",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 2, "cook_time_min": 5, "ready_in_min": 7, "servings": 1,
    "calories_kcal": 330, "protein_g": 11.0, "carbs_g": 55.0, "fat_g": 7.0, "fiber_g": 6.0,
    "ingredients": [
      {"ingredient_name": "copos de avena integrales", "quantity": 60,  "unit": "g"},
      {"ingredient_name": "leche semidesnatada",        "quantity": 200, "unit": "ml"},
      {"ingredient_name": "plátano maduro",             "quantity": 100, "unit": "g", "notes": "½ plátano mediano"},
      {"ingredient_name": "canela molida",              "quantity": 1,   "unit": "cucharadita"},
      {"ingredient_name": "nueces",                     "quantity": 10,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pon los copos de avena con la leche en un cazo a fuego medio-bajo. Remueve constantemente."},
      {"step_number": 2, "instruction": "Cocina 4-5 minutos hasta que la avena absorba la leche y adquiera una textura cremosa. Si queda demasiado espeso, añade un poco más de leche."},
      {"step_number": 3, "instruction": "Vierte en un bol. Corta el medio plátano en rodajas y colócalas encima."},
      {"step_number": 4, "instruction": "Espolvorea generosamente con canela y añade las nueces troceadas. Sirve caliente."},
    ],
  },

  "pan_aguacate_huevo": {
    "title": "Pan integral con aguacate y huevo poché",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 5, "cook_time_min": 4, "ready_in_min": 9, "servings": 1,
    "calories_kcal": 340, "protein_g": 14.0, "carbs_g": 30.0, "fat_g": 18.0, "fiber_g": 7.0,
    "ingredients": [
      {"ingredient_name": "pan integral en rebanadas", "quantity": 60,  "unit": "g", "notes": "2 rebanadas"},
      {"ingredient_name": "aguacate maduro",           "quantity": 80,  "unit": "g", "notes": "½ aguacate"},
      {"ingredient_name": "huevo",                     "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "zumo de limón",             "quantity": 5,   "unit": "ml"},
      {"ingredient_name": "copos de chile",            "quantity": 1,   "unit": "pizca"},
      {"ingredient_name": "sal marina",                "quantity": None,"unit": "al gusto"},
      {"ingredient_name": "vinagre blanco",            "quantity": 15,  "unit": "ml", "notes": "para el agua del huevo"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Tuesta el pan. Mientras tanto, machaca el aguacate con el zumo de limón y sal hasta obtener una crema gruesa."},
      {"step_number": 2, "instruction": "Calienta agua en un cazo pequeño. Cuando hierva, baja a fuego suave y añade el vinagre. Remueve para crear un remolino."},
      {"step_number": 3, "instruction": "Casca el huevo en un cuenco pequeño y deslízalo suavemente en el centro del remolino. Cuece 3 minutos para yema líquida."},
      {"step_number": 4, "instruction": "Extiende el aguacate sobre las tostadas, coloca el huevo poché encima y termina con copos de chile y sal marina."},
    ],
  },

  "revuelto_salmon_ahumado": {
    "title": "Revuelto de huevo con salmón ahumado y eneldo",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 5, "cook_time_min": 5, "ready_in_min": 10, "servings": 1,
    "calories_kcal": 300, "protein_g": 22.0, "carbs_g": 4.0, "fat_g": 21.0, "fiber_g": 0.5,
    "ingredients": [
      {"ingredient_name": "huevos",              "quantity": 2,  "unit": "unidades"},
      {"ingredient_name": "salmón ahumado",      "quantity": 50, "unit": "g"},
      {"ingredient_name": "crème fraîche light", "quantity": 20, "unit": "g"},
      {"ingredient_name": "eneldo fresco",       "quantity": 5,  "unit": "g"},
      {"ingredient_name": "aceite de oliva",     "quantity": 5,  "unit": "ml"},
      {"ingredient_name": "pimienta negra",      "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Bate los huevos con la crème fraîche, pimienta y la mitad del eneldo picado."},
      {"step_number": 2, "instruction": "Calienta el aceite a fuego muy suave en una sartén. Vierte la mezcla de huevos."},
      {"step_number": 3, "instruction": "Remueve continuamente con una espátula desde el borde hacia el centro durante 3-4 minutos, manteniendo el fuego bajo. El revuelto debe quedar cremoso, no seco."},
      {"step_number": 4, "instruction": "Retira del fuego cuando aún esté ligeramente líquido (el calor residual terminará de cuajarlo). Sirve con el salmón ahumado encima y el eneldo restante."},
    ],
  },

  "smoothie_proteinas_frutos": {
    "title": "Smoothie de proteínas con espinacas y mango",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 5, "cook_time_min": 0, "ready_in_min": 5, "servings": 1,
    "calories_kcal": 295, "protein_g": 22.0, "carbs_g": 40.0, "fat_g": 4.5, "fiber_g": 4.5,
    "ingredients": [
      {"ingredient_name": "leche de avena",             "quantity": 250, "unit": "ml"},
      {"ingredient_name": "proteína de suero de leche vanilla", "quantity": 25, "unit": "g"},
      {"ingredient_name": "espinacas frescas",          "quantity": 30,  "unit": "g"},
      {"ingredient_name": "mango congelado",            "quantity": 100, "unit": "g"},
      {"ingredient_name": "semillas de chía",           "quantity": 10,  "unit": "g"},
      {"ingredient_name": "jengibre fresco",            "quantity": 3,   "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Añade todos los ingredientes a la batidora: primero el líquido, luego las espinacas, el mango congelado y finalmente la proteína y las semillas."},
      {"step_number": 2, "instruction": "Tritura a velocidad alta durante 60 segundos hasta obtener una textura completamente lisa y sin grumos."},
      {"step_number": 3, "instruction": "Sirve inmediatamente en un vaso alto. Si queda muy espeso, añade un poco más de leche de avena."},
    ],
  },

  # ── ALMUERZOS ────────────────────────────────────────────────────────────

  "ensalada_pollo_quinoa": {
    "title": "Ensalada de pollo a la plancha con quinoa y vegetales",
    "meal_type": "lunch", "cuisine": "mediterránea",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 490, "protein_g": 42.0, "carbs_g": 40.0, "fat_g": 14.0, "fiber_g": 6.0,
    "ingredients": [
      {"ingredient_name": "pechuga de pollo",         "quantity": 150, "unit": "g"},
      {"ingredient_name": "quinoa cocida",            "quantity": 120, "unit": "g", "notes": "unos 50g en crudo"},
      {"ingredient_name": "tomates cherry",          "quantity": 100, "unit": "g"},
      {"ingredient_name": "pepino",                  "quantity": 80,  "unit": "g"},
      {"ingredient_name": "cebolla roja",            "quantity": 40,  "unit": "g"},
      {"ingredient_name": "aceitunas negras",        "quantity": 20,  "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen",  "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "zumo de limón",           "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "orégano seco",            "quantity": 2,   "unit": "g"},
      {"ingredient_name": "sal y pimienta",          "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Enjuaga la quinoa bajo agua fría y cocínala en el doble de agua con sal durante 15 minutos. Escurre y deja enfriar."},
      {"step_number": 2, "instruction": "Salpimienta la pechuga y cocínala en una plancha o sartén bien caliente 4-5 minutos por cada lado. Deja reposar 3 minutos y córtala en tiras."},
      {"step_number": 3, "instruction": "Corta los tomates cherry por la mitad, el pepino en medias lunas y la cebolla roja en juliana fina."},
      {"step_number": 4, "instruction": "Mezcla en un bol la quinoa con todas las verduras y las aceitunas. Aliña con el aceite, el limón, el orégano, sal y pimienta. Coloca el pollo encima y sirve."},
    ],
  },

  "merluza_verduras_horno": {
    "title": "Merluza al horno con verduras asadas",
    "meal_type": "lunch", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 25, "ready_in_min": 35, "servings": 1,
    "calories_kcal": 420, "protein_g": 38.0, "carbs_g": 22.0, "fat_g": 18.0, "fiber_g": 5.5,
    "ingredients": [
      {"ingredient_name": "lomo de merluza fresca",  "quantity": 200, "unit": "g"},
      {"ingredient_name": "calabacín",              "quantity": 150, "unit": "g"},
      {"ingredient_name": "pimiento rojo",          "quantity": 100, "unit": "g"},
      {"ingredient_name": "cebolla",                "quantity": 80,  "unit": "g"},
      {"ingredient_name": "tomate pera",            "quantity": 100, "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen", "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "ajo en polvo",           "quantity": 2,   "unit": "g"},
      {"ingredient_name": "pimentón dulce",         "quantity": 2,   "unit": "g"},
      {"ingredient_name": "perejil fresco",         "quantity": 5,   "unit": "g"},
      {"ingredient_name": "sal y pimienta",         "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Precalienta el horno a 200°C con calor arriba y abajo. Corta todas las verduras en trozos de 2-3 cm."},
      {"step_number": 2, "instruction": "Coloca las verduras en una bandeja de horno. Aliña con el aceite, ajo en polvo, pimentón, sal y pimienta. Hornea 15 minutos."},
      {"step_number": 3, "instruction": "Salpimienta el lomo de merluza y colócalo sobre las verduras a medio cocinar. Riega con un chorrito de aceite."},
      {"step_number": 4, "instruction": "Hornea 10 minutos más hasta que el pescado esté opaco y se desmigue fácilmente. Espolvorea con perejil picado y sirve en la misma bandeja."},
    ],
  },

  "lentejas_verduras": {
    "title": "Lentejas estofadas con verduras de temporada",
    "meal_type": "lunch", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 30, "ready_in_min": 40, "servings": 2,
    "calories_kcal": 480, "protein_g": 24.0, "carbs_g": 62.0, "fat_g": 12.0, "fiber_g": 14.0,
    "ingredients": [
      {"ingredient_name": "lentejas pardinas",      "quantity": 160, "unit": "g", "notes": "en seco, para 2 raciones"},
      {"ingredient_name": "zanahoria grande",       "quantity": 150, "unit": "g"},
      {"ingredient_name": "patata mediana",         "quantity": 150, "unit": "g"},
      {"ingredient_name": "pimiento verde",        "quantity": 80,  "unit": "g"},
      {"ingredient_name": "cebolla",                "quantity": 100, "unit": "g"},
      {"ingredient_name": "ajo",                   "quantity": 2,   "unit": "dientes"},
      {"ingredient_name": "tomate triturado",       "quantity": 100, "unit": "g"},
      {"ingredient_name": "aceite de oliva",        "quantity": 20,  "unit": "ml"},
      {"ingredient_name": "pimentón de la Vera",    "quantity": 4,   "unit": "g"},
      {"ingredient_name": "laurel",                "quantity": 1,   "unit": "hoja"},
      {"ingredient_name": "comino molido",          "quantity": 2,   "unit": "g"},
      {"ingredient_name": "sal",                   "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pica la cebolla, el ajo y el pimiento en daditos. Pela y trocea la zanahoria y la patata en cubos de 2 cm."},
      {"step_number": 2, "instruction": "Calienta el aceite en una olla a fuego medio. Sofríe la cebolla y el ajo 5 minutos. Añade el pimiento y cocina 3 minutos más."},
      {"step_number": 3, "instruction": "Incorpora el tomate triturado, el pimentón y el comino. Remueve y cocina 2 minutos. Añade las lentejas (sin necesidad de remojo previo), la zanahoria, la patata y el laurel."},
      {"step_number": 4, "instruction": "Cubre con agua (unos 700 ml) y cocina a fuego medio 25-30 minutos hasta que las lentejas estén tiernas. Rectifica de sal y sirve caliente."},
    ],
  },

  "pollo_limon_arroz": {
    "title": "Pechuga de pollo al limón con arroz integral",
    "meal_type": "lunch", "cuisine": "mediterránea",
    "prep_time_min": 10, "cook_time_min": 25, "ready_in_min": 35, "servings": 1,
    "calories_kcal": 510, "protein_g": 45.0, "carbs_g": 50.0, "fat_g": 12.0, "fiber_g": 3.5,
    "ingredients": [
      {"ingredient_name": "pechuga de pollo",      "quantity": 180, "unit": "g"},
      {"ingredient_name": "arroz integral cocido", "quantity": 150, "unit": "g", "notes": "60g en seco"},
      {"ingredient_name": "zumo de limón",         "quantity": 30,  "unit": "ml"},
      {"ingredient_name": "ralladura de limón",    "quantity": 3,   "unit": "g"},
      {"ingredient_name": "ajo",                   "quantity": 2,   "unit": "dientes"},
      {"ingredient_name": "romero fresco",         "quantity": 3,   "unit": "g"},
      {"ingredient_name": "aceite de oliva",       "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "caldo de pollo bajo en sal","quantity": 50,"unit": "ml"},
      {"ingredient_name": "sal y pimienta",        "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Marina la pechuga 10 minutos en el zumo de limón, la ralladura, el ajo laminado y el romero."},
      {"step_number": 2, "instruction": "Cuece el arroz integral según las instrucciones (unos 25 min con doble de agua). Reserva."},
      {"step_number": 3, "instruction": "Calienta el aceite en una sartén a fuego alto. Escurre el pollo de la marinada y dóralo 3-4 minutos por cada lado."},
      {"step_number": 4, "instruction": "Baja el fuego, añade la marinada reservada y el caldo. Cocina 5 minutos más hasta que el pollo esté jugoso. Sirve sobre el arroz con la salsa de limón."},
    ],
  },

  "salmon_vapor_brocoli": {
    "title": "Salmón al vapor con brócoli y patata cocida",
    "meal_type": "lunch", "cuisine": "mediterránea",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 460, "protein_g": 36.0, "carbs_g": 30.0, "fat_g": 20.0, "fiber_g": 6.0,
    "ingredients": [
      {"ingredient_name": "lomo de salmón fresco",  "quantity": 160, "unit": "g"},
      {"ingredient_name": "brócoli en ramilletes",  "quantity": 200, "unit": "g"},
      {"ingredient_name": "patata mediana",         "quantity": 150, "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen", "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "zumo de limón",          "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "ajo en polvo",           "quantity": 2,   "unit": "g"},
      {"ingredient_name": "eneldo seco",            "quantity": 2,   "unit": "g"},
      {"ingredient_name": "sal y pimienta",         "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pela y trocea la patata en cubos. Cuécela en agua salada 15-18 minutos hasta que esté tierna. En los últimos 7 minutos, añade el brócoli al agua."},
      {"step_number": 2, "instruction": "Sazona el salmón con sal, pimienta, ajo en polvo y eneldo. Colócalo en una vaporera sobre agua hirviendo."},
      {"step_number": 3, "instruction": "Cuece el salmón al vapor 8-10 minutos hasta que esté opaco por fuera pero todavía rosado en el centro."},
      {"step_number": 4, "instruction": "Escurre la patata y el brócoli. Sirve el salmón con la guarnición, riega todo con el aceite de oliva y el zumo de limón."},
    ],
  },

  "garbanzos_espinacas": {
    "title": "Garbanzos salteados con espinacas y huevo escalfado",
    "meal_type": "lunch", "cuisine": "española",
    "prep_time_min": 5, "cook_time_min": 15, "ready_in_min": 20, "servings": 1,
    "calories_kcal": 470, "protein_g": 24.0, "carbs_g": 45.0, "fat_g": 20.0, "fiber_g": 12.0,
    "ingredients": [
      {"ingredient_name": "garbanzos cocidos en bote","quantity": 200, "unit": "g", "notes": "escurridos"},
      {"ingredient_name": "espinacas frescas",       "quantity": 150, "unit": "g"},
      {"ingredient_name": "huevo",                   "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "cebolla",                 "quantity": 70,  "unit": "g"},
      {"ingredient_name": "ajo",                    "quantity": 2,   "unit": "dientes"},
      {"ingredient_name": "tomate triturado",        "quantity": 80,  "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen",  "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "comino molido",           "quantity": 2,   "unit": "g"},
      {"ingredient_name": "pimentón",               "quantity": 2,   "unit": "g"},
      {"ingredient_name": "sal",                    "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pica la cebolla y el ajo. Calienta el aceite en una sartén amplia y sofríelos a fuego medio 5 minutos."},
      {"step_number": 2, "instruction": "Añade el tomate, el comino y el pimentón. Cocina 3 minutos removiendo."},
      {"step_number": 3, "instruction": "Incorpora los garbanzos escurridos y las espinacas. Saltea 3-4 minutos hasta que las espinacas se integren y los garbanzos se doren ligeramente."},
      {"step_number": 4, "instruction": "Haz un hueco en el centro y casca el huevo. Tapa la sartén y cocina 3 minutos para un huevo con yema líquida. Sirve directamente en la sartén."},
    ],
  },

  "pavo_pimientos_arroz": {
    "title": "Salteado de pavo con pimientos y arroz basmati",
    "meal_type": "lunch", "cuisine": "mediterránea",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 500, "protein_g": 43.0, "carbs_g": 48.0, "fat_g": 11.0, "fiber_g": 4.0,
    "ingredients": [
      {"ingredient_name": "pechuga de pavo en tiras","quantity": 170, "unit": "g"},
      {"ingredient_name": "arroz basmati cocido",   "quantity": 150, "unit": "g", "notes": "60g en seco"},
      {"ingredient_name": "pimiento rojo",          "quantity": 100, "unit": "g"},
      {"ingredient_name": "pimiento verde",         "quantity": 80,  "unit": "g"},
      {"ingredient_name": "cebolla",                "quantity": 80,  "unit": "g"},
      {"ingredient_name": "salsa de soja baja en sodio","quantity": 15,"unit": "ml"},
      {"ingredient_name": "aceite de oliva",        "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "ajo",                   "quantity": 2,   "unit": "dientes"},
      {"ingredient_name": "jengibre en polvo",      "quantity": 1,   "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Cuece el arroz basmati según instrucciones. Reserva."},
      {"step_number": 2, "instruction": "Corta los pimientos en tiras y la cebolla en juliana. Lamina el ajo."},
      {"step_number": 3, "instruction": "Calienta el aceite en un wok o sartén grande a fuego alto. Saltea el pavo 4-5 minutos hasta dorar. Retira y reserva."},
      {"step_number": 4, "instruction": "En el mismo wok, saltea el ajo 30 segundos, añade la cebolla y los pimientos. Cocina 4 minutos a fuego alto. Vuelve el pavo, añade la salsa de soja y el jengibre. Mezcla bien y sirve sobre el arroz."},
    ],
  },

  # ── CENAS ────────────────────────────────────────────────────────────────

  "crema_calabacin_pollo": {
    "title": "Crema de calabacín con pollo a la plancha",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 400, "protein_g": 36.0, "carbs_g": 18.0, "fat_g": 19.0, "fiber_g": 4.5,
    "ingredients": [
      {"ingredient_name": "calabacín grande",         "quantity": 300, "unit": "g"},
      {"ingredient_name": "pechuga de pollo",         "quantity": 130, "unit": "g"},
      {"ingredient_name": "cebolla",                  "quantity": 80,  "unit": "g"},
      {"ingredient_name": "caldo de verduras",        "quantity": 300, "unit": "ml"},
      {"ingredient_name": "queso crema light",        "quantity": 30,  "unit": "g"},
      {"ingredient_name": "aceite de oliva",          "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "nuez moscada",             "quantity": 1,   "unit": "pizca"},
      {"ingredient_name": "sal y pimienta",           "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pica la cebolla y trocea el calabacín con piel en cubos. Sofríelos en una olla con el aceite a fuego medio 8 minutos hasta que estén tiernos."},
      {"step_number": 2, "instruction": "Añade el caldo caliente y cocina 10 minutos más. Incorpora el queso crema y la nuez moscada."},
      {"step_number": 3, "instruction": "Tritura con la batidora hasta obtener una crema lisa y homogénea. Rectifica de sal y mantén caliente."},
      {"step_number": 4, "instruction": "Salpimienta el pollo y cocínalo en una plancha caliente 4 min por lado. Laminado en tiras y servido sobre la crema con un hilo de aceite de oliva."},
    ],
  },

  "revuelto_champinones_gambas": {
    "title": "Revuelto de champiñones, gambas y ajo",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 8, "cook_time_min": 10, "ready_in_min": 18, "servings": 1,
    "calories_kcal": 360, "protein_g": 30.0, "carbs_g": 8.0, "fat_g": 22.0, "fiber_g": 2.5,
    "ingredients": [
      {"ingredient_name": "huevos",                  "quantity": 3,   "unit": "unidades"},
      {"ingredient_name": "gambas peladas",          "quantity": 100, "unit": "g"},
      {"ingredient_name": "champiñones",             "quantity": 150, "unit": "g"},
      {"ingredient_name": "ajo",                    "quantity": 2,   "unit": "dientes"},
      {"ingredient_name": "aceite de oliva",         "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "perejil fresco",          "quantity": 5,   "unit": "g"},
      {"ingredient_name": "guindilla",               "quantity": None,"unit": "opcional, al gusto"},
      {"ingredient_name": "sal y pimienta",          "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Limpia y lamina los champiñones. Lamina los ajos. Bate los huevos ligeramente con sal y pimienta."},
      {"step_number": 2, "instruction": "Calienta el aceite en una sartén amplia y sofríe el ajo laminado con la guindilla (opcional) a fuego medio 1 minuto sin que se dore."},
      {"step_number": 3, "instruction": "Sube el fuego y añade las gambas y los champiñones. Saltea 4-5 minutos hasta que las gambas estén rosadas y los champiñones hayan soltado su agua."},
      {"step_number": 4, "instruction": "Baja el fuego al mínimo, vierte los huevos batidos y remueve suavemente con una espátula de madera durante 2 minutos para un revuelto cremoso. Espolvorea perejil y sirve inmediatamente."},
    ],
  },

  "dorada_horno_ensalada": {
    "title": "Dorada al horno con ensalada mediterránea",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 390, "protein_g": 35.0, "carbs_g": 12.0, "fat_g": 22.0, "fiber_g": 3.5,
    "ingredients": [
      {"ingredient_name": "dorada entera limpia",   "quantity": 350, "unit": "g", "notes": "~200g de carne limpia"},
      {"ingredient_name": "limón",                  "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "ajo",                   "quantity": 3,   "unit": "dientes"},
      {"ingredient_name": "romero y tomillo fresco","quantity": 5,   "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen", "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "tomate",                "quantity": 150, "unit": "g"},
      {"ingredient_name": "lechuga romana",        "quantity": 80,  "unit": "g"},
      {"ingredient_name": "aceitunas",             "quantity": 20,  "unit": "g"},
      {"ingredient_name": "sal y pimienta",        "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Precalienta el horno a 200°C. Haz 3 cortes diagonales en cada lado de la dorada. Rellena el interior con rodajas de limón, los ajos machacados y las hierbas."},
      {"step_number": 2, "instruction": "Coloca la dorada en una bandeja, riégala con el aceite y salpimiéntala por dentro y por fuera."},
      {"step_number": 3, "instruction": "Hornea 18-20 minutos hasta que la piel esté dorada y la carne se separe fácilmente de la espina."},
      {"step_number": 4, "instruction": "Mientras hornea, prepara la ensalada con la lechuga troceada, los tomates y las aceitunas. Aliña con aceite y sal. Sirve la dorada junto con la ensalada."},
    ],
  },

  "sopa_verduras_huevo": {
    "title": "Sopa de verduras con huevo cocido y pan integral",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 350, "protein_g": 18.0, "carbs_g": 38.0, "fat_g": 13.0, "fiber_g": 7.0,
    "ingredients": [
      {"ingredient_name": "caldo de verduras bajo en sal","quantity": 600,"unit": "ml"},
      {"ingredient_name": "zanahoria",              "quantity": 100, "unit": "g"},
      {"ingredient_name": "puerro",                 "quantity": 80,  "unit": "g"},
      {"ingredient_name": "apio",                  "quantity": 50,  "unit": "g"},
      {"ingredient_name": "judías verdes",          "quantity": 80,  "unit": "g"},
      {"ingredient_name": "fideos finos integrales","quantity": 40,  "unit": "g"},
      {"ingredient_name": "huevo",                  "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "aceite de oliva",        "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "pan integral",           "quantity": 30,  "unit": "g", "notes": "1 rebanada"},
      {"ingredient_name": "sal y perejil",          "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Cuece el huevo en agua hirviendo 10 minutos. Reserva en agua fría, pela y reserva."},
      {"step_number": 2, "instruction": "Corta todas las verduras en trozos pequeños. Calienta el aceite en una olla y sofríe el puerro y la zanahoria 5 minutos."},
      {"step_number": 3, "instruction": "Añade el caldo y las judías verdes. Cuando hierva, incorpora los fideos y cocina según tiempo de paquete (unos 7 min)."},
      {"step_number": 4, "instruction": "Sirve la sopa caliente en un bol, coloca el huevo cocido cortado a la mitad por encima y acompaña con la tostada de pan integral untada con aceite de oliva."},
    ],
  },

  "lubina_esparragos": {
    "title": "Lubina a la plancha con espárragos y salsa de yogur",
    "meal_type": "dinner", "cuisine": "mediterránea",
    "prep_time_min": 10, "cook_time_min": 12, "ready_in_min": 22, "servings": 1,
    "calories_kcal": 380, "protein_g": 38.0, "carbs_g": 8.0, "fat_g": 21.0, "fiber_g": 3.0,
    "ingredients": [
      {"ingredient_name": "filetes de lubina",     "quantity": 200, "unit": "g"},
      {"ingredient_name": "espárragos verdes",      "quantity": 150, "unit": "g"},
      {"ingredient_name": "yogur griego 0%",        "quantity": 80,  "unit": "g"},
      {"ingredient_name": "pepino",                "quantity": 50,  "unit": "g"},
      {"ingredient_name": "ajo",                   "quantity": 1,   "unit": "diente"},
      {"ingredient_name": "menta fresca",          "quantity": 5,   "unit": "g"},
      {"ingredient_name": "zumo de limón",         "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "aceite de oliva",       "quantity": 12,  "unit": "ml"},
      {"ingredient_name": "sal y pimienta",        "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Prepara la salsa tzatziki rápida: ralla el pepino, exprímelo bien para quitar el agua y mézclalo con el yogur, el ajo rallado, la menta picada, el zumo de limón y sal. Reserva en frío."},
      {"step_number": 2, "instruction": "Elimina la parte dura de los espárragos. Calienta una plancha o sartén con un poco de aceite a fuego alto. Asa los espárragos 4-5 minutos removiendo. Reserva."},
      {"step_number": 3, "instruction": "En la misma plancha, seca bien el pescado con papel de cocina, salpimienta y añade el aceite restante. Cocina la lubina a fuego alto 4 minutos por el lado de la piel hasta que esté crujiente."},
      {"step_number": 4, "instruction": "Da la vuelta y cocina 2 minutos más. Sirve con los espárragos y la salsa tzatziki al lado."},
    ],
  },

  "tortilla_española_ensalada": {
    "title": "Tortilla española con ensalada verde",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 420, "protein_g": 20.0, "carbs_g": 32.0, "fat_g": 24.0, "fiber_g": 3.5,
    "ingredients": [
      {"ingredient_name": "patatas medianas",       "quantity": 200, "unit": "g"},
      {"ingredient_name": "huevos",                 "quantity": 2,   "unit": "unidades"},
      {"ingredient_name": "cebolla dulce",          "quantity": 80,  "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen", "quantity": 20,  "unit": "ml"},
      {"ingredient_name": "lechuga variada",        "quantity": 80,  "unit": "g"},
      {"ingredient_name": "tomate",                "quantity": 100, "unit": "g"},
      {"ingredient_name": "vinagre de manzana",    "quantity": 5,   "unit": "ml"},
      {"ingredient_name": "sal",                   "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pela y corta las patatas en láminas finas (3 mm). Pela y pica la cebolla. Confita ambas en aceite caliente a fuego medio-bajo 15 minutos sin que se doren."},
      {"step_number": 2, "instruction": "Escurre bien el aceite de las patatas y la cebolla. Bate los huevos con sal en un bol grande y mezcla con las patatas."},
      {"step_number": 3, "instruction": "Calienta una cucharada de aceite en una sartén de 18 cm a fuego medio-alto. Vierte la mezcla y cuaja 3 minutos. Dale la vuelta con un plato y cocina 2 minutos más (cuajada pero jugosa por dentro)."},
      {"step_number": 4, "instruction": "Prepara la ensalada aliñando la lechuga y los tomates con el vinagre, aceite y sal. Sirve junto a la tortilla."},
    ],
  },

  "pollo_ajillo_judias": {
    "title": "Pollo al ajillo con judías verdes salteadas",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 8, "cook_time_min": 20, "ready_in_min": 28, "servings": 1,
    "calories_kcal": 430, "protein_g": 40.0, "carbs_g": 10.0, "fat_g": 25.0, "fiber_g": 5.0,
    "ingredients": [
      {"ingredient_name": "muslo de pollo sin piel deshuesado","quantity": 200,"unit": "g"},
      {"ingredient_name": "ajo",                    "quantity": 5,   "unit": "dientes"},
      {"ingredient_name": "vino blanco seco",       "quantity": 50,  "unit": "ml"},
      {"ingredient_name": "judías verdes",          "quantity": 200, "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen", "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "guindilla seca",         "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "perejil fresco",         "quantity": 5,   "unit": "g"},
      {"ingredient_name": "sal y pimienta",         "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Corta el pollo en trozos medianos. Lamina los ajos en láminas no muy finas."},
      {"step_number": 2, "instruction": "Calienta el aceite a fuego medio-alto y dora el pollo 5-6 minutos por cada lado hasta que esté bien dorado. Retira y reserva."},
      {"step_number": 3, "instruction": "En el mismo aceite, dora el ajo laminado con la guindilla 1 minuto. Vuelve el pollo, añade el vino y sube el fuego. Cocina 8 minutos hasta que el vino reduzca. Espolvorea perejil."},
      {"step_number": 4, "instruction": "Saltea las judías verdes (limpias y troceadas) en una sartén aparte con un poco de aceite y sal durante 6-7 minutos. Sirve junto al pollo."},
    ],
  },

  # ── SNACKS ───────────────────────────────────────────────────────────────

  "manzana_mantequilla_cacahuete": {
    "title": "Manzana con mantequilla de cacahuete natural",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 2, "cook_time_min": 0, "ready_in_min": 2, "servings": 1,
    "calories_kcal": 190, "protein_g": 5.0, "carbs_g": 22.0, "fat_g": 9.5, "fiber_g": 3.5,
    "ingredients": [
      {"ingredient_name": "manzana verde",                   "quantity": 150, "unit": "g"},
      {"ingredient_name": "mantequilla de cacahuete natural","quantity": 15,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Lava la manzana y córtala en gajos sin pelar."},
      {"step_number": 2, "instruction": "Sirve los gajos junto a la mantequilla de cacahuete en un cuenco pequeño para mojar."},
    ],
  },

  "yogur_griego_miel": {
    "title": "Yogur griego con miel y nueces",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 2, "cook_time_min": 0, "ready_in_min": 2, "servings": 1,
    "calories_kcal": 175, "protein_g": 11.0, "carbs_g": 15.0, "fat_g": 7.5, "fiber_g": 0.5,
    "ingredients": [
      {"ingredient_name": "yogur griego natural 0%","quantity": 150, "unit": "g"},
      {"ingredient_name": "miel de flores",         "quantity": 10,  "unit": "g"},
      {"ingredient_name": "nueces",                 "quantity": 15,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Vierte el yogur en un bol."},
      {"step_number": 2, "instruction": "Añade las nueces ligeramente troceadas y rocía con la miel. Sirve frío."},
    ],
  },

  "almendras_datil": {
    "title": "Almendras tostadas con un dátil",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 1, "cook_time_min": 0, "ready_in_min": 1, "servings": 1,
    "calories_kcal": 165, "protein_g": 5.0, "carbs_g": 14.0, "fat_g": 10.5, "fiber_g": 3.0,
    "ingredients": [
      {"ingredient_name": "almendras tostadas sin sal","quantity": 25, "unit": "g"},
      {"ingredient_name": "dátil medjool",             "quantity": 20, "unit": "g", "notes": "1 dátil grande"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Sirve las almendras y el dátil en un bol pequeño. Consume como snack saciante."},
    ],
  },

  "zanahoria_hummus": {
    "title": "Palitos de zanahoria con hummus casero",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 5, "cook_time_min": 0, "ready_in_min": 5, "servings": 1,
    "calories_kcal": 160, "protein_g": 6.0, "carbs_g": 18.0, "fat_g": 7.0, "fiber_g": 5.5,
    "ingredients": [
      {"ingredient_name": "zanahoria",              "quantity": 150, "unit": "g"},
      {"ingredient_name": "hummus",                 "quantity": 60,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pela las zanahorias y córtalas en palitos."},
      {"step_number": 2, "instruction": "Sirve los palitos con el hummus en un cuenco aparte para dipear."},
    ],
  },

  "pera_queso_fresco": {
    "title": "Pera con queso fresco y nueces",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 3, "cook_time_min": 0, "ready_in_min": 3, "servings": 1,
    "calories_kcal": 170, "protein_g": 7.0, "carbs_g": 18.0, "fat_g": 7.5, "fiber_g": 3.5,
    "ingredients": [
      {"ingredient_name": "pera conferencia",    "quantity": 150, "unit": "g"},
      {"ingredient_name": "queso fresco light",  "quantity": 60,  "unit": "g"},
      {"ingredient_name": "nueces",              "quantity": 10,  "unit": "g"},
      {"ingredient_name": "canela",              "quantity": None,"unit": "opcional"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Corta la pera en gajos. Desmenúza el queso fresco."},
      {"step_number": 2, "instruction": "Sirve la pera con el queso y las nueces. Opcionalmente, espolvorea un poco de canela."},
    ],
  },

  "batido_proteinas_postentrenamiento": {
    "title": "Batido de proteínas post-entreno con leche y plátano",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 3, "cook_time_min": 0, "ready_in_min": 3, "servings": 1,
    "calories_kcal": 200, "protein_g": 22.0, "carbs_g": 24.0, "fat_g": 3.0, "fiber_g": 1.5,
    "ingredients": [
      {"ingredient_name": "leche desnatada",              "quantity": 200, "unit": "ml"},
      {"ingredient_name": "proteína en polvo (chocolate)","quantity": 25,  "unit": "g"},
      {"ingredient_name": "plátano pequeño",              "quantity": 80,  "unit": "g"},
      {"ingredient_name": "cubitos de hielo",             "quantity": 4,   "unit": "unidades"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Añade todos los ingredientes a la batidora."},
      {"step_number": 2, "instruction": "Bate 30 segundos hasta obtener un batido cremoso. Bebe inmediatamente después del ejercicio."},
    ],
  },

  "tortita_arroz_aguacate": {
    "title": "Tortitas de arroz con aguacate y semillas",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 3, "cook_time_min": 0, "ready_in_min": 3, "servings": 1,
    "calories_kcal": 180, "protein_g": 3.5, "carbs_g": 20.0, "fat_g": 9.5, "fiber_g": 4.0,
    "ingredients": [
      {"ingredient_name": "tortitas de arroz integrales","quantity": 20,  "unit": "g", "notes": "2 tortitas"},
      {"ingredient_name": "aguacate",                   "quantity": 60,  "unit": "g"},
      {"ingredient_name": "semillas de sésamo",         "quantity": 5,   "unit": "g"},
      {"ingredient_name": "zumo de limón",              "quantity": 5,   "unit": "ml"},
      {"ingredient_name": "sal en escamas",             "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Machaca el aguacate con el zumo de limón y sal hasta obtener una crema rústica."},
      {"step_number": 2, "instruction": "Extiende el aguacate sobre las tortitas de arroz y espolvorea las semillas de sésamo. Sirve inmediatamente."},
    ],
  },

  # ── RECETAS ADICIONALES: MANTENIMIENTO Y GANANCIA ────────────────────────

  # Desayunos ~450-500 kcal
  "tostada_francesa_frutos": {
    "title": "Tostada francesa con canela y frutos del bosque",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 5, "cook_time_min": 8, "ready_in_min": 13, "servings": 1,
    "calories_kcal": 460, "protein_g": 18.0, "carbs_g": 58.0, "fat_g": 16.0, "fiber_g": 4.5,
    "ingredients": [
      {"ingredient_name": "pan de molde integral grueso", "quantity": 80,  "unit": "g", "notes": "2 rebanadas"},
      {"ingredient_name": "huevos",                       "quantity": 2,   "unit": "unidades"},
      {"ingredient_name": "leche semidesnatada",          "quantity": 60,  "unit": "ml"},
      {"ingredient_name": "canela molida",                "quantity": 2,   "unit": "g"},
      {"ingredient_name": "vainilla en pasta",            "quantity": 2,   "unit": "ml"},
      {"ingredient_name": "mantequilla",                  "quantity": 8,   "unit": "g"},
      {"ingredient_name": "frutos del bosque mixtos",     "quantity": 100, "unit": "g"},
      {"ingredient_name": "sirope de arce",               "quantity": 15,  "unit": "ml"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Bate los huevos con la leche, la canela y la vainilla en un plato hondo."},
      {"step_number": 2, "instruction": "Sumerge cada rebanada de pan en la mezcla de huevo durante 20 segundos por cada lado."},
      {"step_number": 3, "instruction": "Derrite la mantequilla en una sartén a fuego medio y dora las tostadas 3-4 minutos por lado hasta que estén doradas."},
      {"step_number": 4, "instruction": "Sirve con los frutos del bosque encima y el sirope de arce. Consume caliente."},
    ],
  },

  "pancakes_avena_proteina": {
    "title": "Pancakes de avena y proteína con plátano",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 5, "cook_time_min": 10, "ready_in_min": 15, "servings": 1,
    "calories_kcal": 480, "protein_g": 28.0, "carbs_g": 60.0, "fat_g": 12.0, "fiber_g": 6.0,
    "ingredients": [
      {"ingredient_name": "copos de avena finos",         "quantity": 70,  "unit": "g"},
      {"ingredient_name": "proteína en polvo vainilla",   "quantity": 20,  "unit": "g"},
      {"ingredient_name": "huevo",                        "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "leche de avena",               "quantity": 120, "unit": "ml"},
      {"ingredient_name": "levadura en polvo",            "quantity": 3,   "unit": "g"},
      {"ingredient_name": "plátano maduro",               "quantity": 80,  "unit": "g"},
      {"ingredient_name": "aceite de coco",               "quantity": 5,   "unit": "ml"},
      {"ingredient_name": "miel",                         "quantity": 10,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Tritura los copos de avena hasta convertirlos en harina fina. Mezcla con la proteína en polvo y la levadura."},
      {"step_number": 2, "instruction": "Añade el huevo y la leche de avena y bate hasta obtener una masa homogénea sin grumos. Deja reposar 5 minutos."},
      {"step_number": 3, "instruction": "Calienta el aceite de coco en una sartén antiadherente. Vierte 2-3 cucharadas de masa por pancake. Cocina 2-3 min a fuego medio hasta que aparezcan burbujas; da la vuelta y 1 min más."},
      {"step_number": 4, "instruction": "Sirve apilados con el plátano en rodajas y la miel por encima."},
    ],
  },

  "bol_avena_frutos_secos": {
    "title": "Bol de avena caliente con frutos secos y miel",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 3, "cook_time_min": 5, "ready_in_min": 8, "servings": 1,
    "calories_kcal": 495, "protein_g": 14.0, "carbs_g": 62.0, "fat_g": 20.0, "fiber_g": 7.0,
    "ingredients": [
      {"ingredient_name": "copos de avena integrales",    "quantity": 80,  "unit": "g"},
      {"ingredient_name": "leche entera",                 "quantity": 250, "unit": "ml"},
      {"ingredient_name": "nueces",                       "quantity": 20,  "unit": "g"},
      {"ingredient_name": "almendras laminadas",          "quantity": 10,  "unit": "g"},
      {"ingredient_name": "pasas sultanas",               "quantity": 20,  "unit": "g"},
      {"ingredient_name": "miel",                         "quantity": 15,  "unit": "g"},
      {"ingredient_name": "canela",                       "quantity": 1,   "unit": "cucharadita"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Calienta la leche en un cazo. Cuando esté caliente, añade la avena y remueve a fuego medio-bajo durante 4-5 minutos hasta que esté cremosa."},
      {"step_number": 2, "instruction": "Vierte en un bol y añade las nueces, las almendras laminadas y las pasas."},
      {"step_number": 3, "instruction": "Termina con la miel y la canela. Sirve caliente."},
    ],
  },

  # Desayunos ~550-600 kcal (ganancia)
  "tortilla_jamon_queso": {
    "title": "Tortilla de 3 huevos con jamón serrano y queso manchego",
    "meal_type": "breakfast", "cuisine": "española",
    "prep_time_min": 5, "cook_time_min": 8, "ready_in_min": 13, "servings": 1,
    "calories_kcal": 560, "protein_g": 38.0, "carbs_g": 4.0, "fat_g": 43.0, "fiber_g": 0.5,
    "ingredients": [
      {"ingredient_name": "huevos",                       "quantity": 3,   "unit": "unidades"},
      {"ingredient_name": "jamón serrano en lonchas",     "quantity": 40,  "unit": "g"},
      {"ingredient_name": "queso manchego curado",        "quantity": 30,  "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen",       "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "cebollino fresco",             "quantity": 5,   "unit": "g"},
      {"ingredient_name": "sal y pimienta",               "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Bate los huevos con sal y pimienta. Ralla o corta el queso manchego en trocitos pequeños."},
      {"step_number": 2, "instruction": "Calienta el aceite en una sartén antiadherente a fuego medio. Vierte los huevos."},
      {"step_number": 3, "instruction": "Cuando estén casi cuajados por abajo, distribuye el jamón y el queso sobre la mitad de la tortilla."},
      {"step_number": 4, "instruction": "Dobla la tortilla por la mitad y sirve inmediatamente con el cebollino picado por encima."},
    ],
  },

  "bol_avena_proteina_mantequilla": {
    "title": "Bol de avena con proteína, mantequilla de almendras y plátano",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 3, "cook_time_min": 5, "ready_in_min": 8, "servings": 1,
    "calories_kcal": 580, "protein_g": 30.0, "carbs_g": 70.0, "fat_g": 17.0, "fiber_g": 8.0,
    "ingredients": [
      {"ingredient_name": "copos de avena integrales",       "quantity": 90,  "unit": "g"},
      {"ingredient_name": "leche semidesnatada",             "quantity": 300, "unit": "ml"},
      {"ingredient_name": "proteína en polvo chocolate",     "quantity": 20,  "unit": "g"},
      {"ingredient_name": "mantequilla de almendras",        "quantity": 20,  "unit": "g"},
      {"ingredient_name": "plátano mediano",                 "quantity": 100, "unit": "g"},
      {"ingredient_name": "semillas de cáñamo",              "quantity": 10,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Cuece la avena con la leche a fuego medio-bajo durante 5 minutos, removiendo constantemente."},
      {"step_number": 2, "instruction": "Retira del fuego y añade la proteína en polvo; remueve bien hasta integrar completamente."},
      {"step_number": 3, "instruction": "Vierte en un bol. Cubre con el plátano en rodajas, la mantequilla de almendras y las semillas de cáñamo."},
    ],
  },

  "tostadas_salmon_aguacate": {
    "title": "Tostadas de centeno con salmón ahumado y aguacate",
    "meal_type": "breakfast", "cuisine": "mediterránea",
    "prep_time_min": 7, "cook_time_min": 3, "ready_in_min": 10, "servings": 1,
    "calories_kcal": 555, "protein_g": 26.0, "carbs_g": 42.0, "fat_g": 30.0, "fiber_g": 8.0,
    "ingredients": [
      {"ingredient_name": "pan de centeno integral",      "quantity": 100, "unit": "g", "notes": "3 rebanadas"},
      {"ingredient_name": "salmón ahumado",               "quantity": 80,  "unit": "g"},
      {"ingredient_name": "aguacate maduro",              "quantity": 100, "unit": "g"},
      {"ingredient_name": "queso crema light",            "quantity": 30,  "unit": "g"},
      {"ingredient_name": "alcaparras",                   "quantity": 10,  "unit": "g"},
      {"ingredient_name": "cebolla morada",               "quantity": 20,  "unit": "g"},
      {"ingredient_name": "zumo de limón",                "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "eneldo fresco",                "quantity": 3,   "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Tuesta el pan. Machaca el aguacate con el zumo de limón y sal."},
      {"step_number": 2, "instruction": "Unta cada tostada con queso crema y cubre con el aguacate machacado."},
      {"step_number": 3, "instruction": "Distribuye el salmón ahumado por encima. Termina con la cebolla morada en aros finos, las alcaparras y el eneldo."},
    ],
  },

  # Almuerzos ~680-720 kcal (mantenimiento)
  "pasta_boloñesa_pavo": {
    "title": "Pasta integral con boloñesa de pavo y albahaca",
    "meal_type": "lunch", "cuisine": "mediterránea",
    "prep_time_min": 10, "cook_time_min": 25, "ready_in_min": 35, "servings": 1,
    "calories_kcal": 690, "protein_g": 45.0, "carbs_g": 72.0, "fat_g": 20.0, "fiber_g": 8.5,
    "ingredients": [
      {"ingredient_name": "pasta integral (rigatoni o penne)", "quantity": 90, "unit": "g", "notes": "en seco"},
      {"ingredient_name": "carne picada de pavo",              "quantity": 150,"unit": "g"},
      {"ingredient_name": "tomate triturado",                  "quantity": 200,"unit": "g"},
      {"ingredient_name": "cebolla",                           "quantity": 80, "unit": "g"},
      {"ingredient_name": "ajo",                               "quantity": 2,  "unit": "dientes"},
      {"ingredient_name": "zanahoria",                         "quantity": 60, "unit": "g"},
      {"ingredient_name": "apio",                              "quantity": 40, "unit": "g"},
      {"ingredient_name": "vino tinto",                        "quantity": 50, "unit": "ml"},
      {"ingredient_name": "aceite de oliva virgen",            "quantity": 12, "unit": "ml"},
      {"ingredient_name": "albahaca fresca",                   "quantity": 5,  "unit": "g"},
      {"ingredient_name": "queso parmesano rallado",           "quantity": 15, "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pica finamente la cebolla, el ajo, la zanahoria y el apio. Sofríelos en el aceite a fuego medio 8 minutos."},
      {"step_number": 2, "instruction": "Añade la carne de pavo y dórala desmenuzándola con una cuchara. Vierte el vino y deja evaporar 2 minutos."},
      {"step_number": 3, "instruction": "Incorpora el tomate triturado. Cocina a fuego suave 15 minutos removiendo de vez en cuando. Salpimenta."},
      {"step_number": 4, "instruction": "Cuece la pasta al dente según instrucciones. Escurre, mezcla con la salsa. Sirve con la albahaca fresca y el parmesano."},
    ],
  },

  "arroz_pollo_verduras_horno": {
    "title": "Arroz con pollo y verduras al horno",
    "meal_type": "lunch", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 35, "ready_in_min": 45, "servings": 2,
    "calories_kcal": 680, "protein_g": 40.0, "carbs_g": 72.0, "fat_g": 22.0, "fiber_g": 5.0,
    "ingredients": [
      {"ingredient_name": "arroz redondo",                "quantity": 160, "unit": "g", "notes": "en seco, para 2 raciones"},
      {"ingredient_name": "muslos de pollo sin piel",     "quantity": 300, "unit": "g"},
      {"ingredient_name": "pimiento rojo y verde",        "quantity": 200, "unit": "g"},
      {"ingredient_name": "cebolla",                      "quantity": 100, "unit": "g"},
      {"ingredient_name": "ajo",                          "quantity": 3,   "unit": "dientes"},
      {"ingredient_name": "tomate maduro",                "quantity": 150, "unit": "g"},
      {"ingredient_name": "caldo de pollo",               "quantity": 400, "unit": "ml"},
      {"ingredient_name": "aceite de oliva",              "quantity": 20,  "unit": "ml"},
      {"ingredient_name": "pimentón dulce",               "quantity": 3,   "unit": "g"},
      {"ingredient_name": "azafrán",                      "quantity": 1,   "unit": "pizca"},
      {"ingredient_name": "sal, pimienta y romero",       "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Precalienta el horno a 180°C. Salpimenta el pollo y dóralo en una cazuela apta para horno con el aceite 5 minutos por lado. Retira."},
      {"step_number": 2, "instruction": "En la misma cazuela, sofríe la cebolla, el ajo y los pimientos 6 minutos. Añade el tomate picado y el pimentón; cocina 3 minutos."},
      {"step_number": 3, "instruction": "Incorpora el arroz y remueve 1 minuto. Vierte el caldo caliente con el azafrán disuelto. Coloca el pollo encima y el romero."},
      {"step_number": 4, "instruction": "Tapa y hornea 25-28 minutos hasta que el arroz haya absorbido el caldo. Deja reposar 5 minutos antes de servir."},
    ],
  },

  "ensalada_pasta_atun": {
    "title": "Ensalada de pasta integral con atún, olivas y tomate",
    "meal_type": "lunch", "cuisine": "mediterránea",
    "prep_time_min": 10, "cook_time_min": 12, "ready_in_min": 22, "servings": 1,
    "calories_kcal": 660, "protein_g": 38.0, "carbs_g": 68.0, "fat_g": 22.0, "fiber_g": 7.0,
    "ingredients": [
      {"ingredient_name": "pasta integral (fusilli)",    "quantity": 85,  "unit": "g", "notes": "en seco"},
      {"ingredient_name": "atún en aceite de oliva",     "quantity": 120, "unit": "g", "notes": "escurrido"},
      {"ingredient_name": "tomates cherry",             "quantity": 120, "unit": "g"},
      {"ingredient_name": "aceitunas kalamata",         "quantity": 30,  "unit": "g"},
      {"ingredient_name": "pimiento rojo asado",        "quantity": 60,  "unit": "g"},
      {"ingredient_name": "rúcula",                     "quantity": 40,  "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen",     "quantity": 12,  "unit": "ml"},
      {"ingredient_name": "vinagre balsámico",          "quantity": 8,   "unit": "ml"},
      {"ingredient_name": "alcaparras",                 "quantity": 10,  "unit": "g"},
      {"ingredient_name": "sal y orégano",              "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Cuece la pasta en agua salada al dente. Escurre y enfría bajo el grifo."},
      {"step_number": 2, "instruction": "Corta los tomates cherry por la mitad. Mezcla la pasta con el atún escurrido, los tomates, las aceitunas, el pimiento y las alcaparras."},
      {"step_number": 3, "instruction": "Aliña con el aceite de oliva, el vinagre balsámico, sal y orégano. Añade la rúcula justo antes de servir."},
    ],
  },

  # Almuerzos ~830-870 kcal (ganancia)
  "arroz_pollo_abundante": {
    "title": "Arroz blanco con pollo guisado y judías",
    "meal_type": "lunch", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 30, "ready_in_min": 40, "servings": 1,
    "calories_kcal": 840, "protein_g": 55.0, "carbs_g": 88.0, "fat_g": 25.0, "fiber_g": 6.0,
    "ingredients": [
      {"ingredient_name": "arroz blanco cocido",           "quantity": 200, "unit": "g", "notes": "80g en seco"},
      {"ingredient_name": "contramuslo de pollo sin piel", "quantity": 220, "unit": "g"},
      {"ingredient_name": "judías blancas cocidas",        "quantity": 100, "unit": "g"},
      {"ingredient_name": "pimiento verde",               "quantity": 80,  "unit": "g"},
      {"ingredient_name": "cebolla",                       "quantity": 80,  "unit": "g"},
      {"ingredient_name": "tomate triturado",              "quantity": 100, "unit": "g"},
      {"ingredient_name": "caldo de pollo",                "quantity": 150, "unit": "ml"},
      {"ingredient_name": "aceite de oliva",               "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "pimentón, comino y laurel",     "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Dora el pollo troceado en el aceite caliente a fuego alto 5 min. Retira y reserva."},
      {"step_number": 2, "instruction": "Sofríe la cebolla y el pimiento 5 minutos. Añade el tomate, el pimentón y el comino; cocina 3 minutos."},
      {"step_number": 3, "instruction": "Devuelve el pollo, añade el caldo y el laurel. Cocina tapado 18 minutos a fuego suave."},
      {"step_number": 4, "instruction": "Incorpora las judías blancas y cocina 5 minutos más. Sirve sobre el arroz blanco."},
    ],
  },

  "pasta_carbonara_ligera": {
    "title": "Pasta con carbonara ligera de pavo y parmesano",
    "meal_type": "lunch", "cuisine": "mediterránea",
    "prep_time_min": 8, "cook_time_min": 15, "ready_in_min": 23, "servings": 1,
    "calories_kcal": 860, "protein_g": 52.0, "carbs_g": 82.0, "fat_g": 32.0, "fiber_g": 4.0,
    "ingredients": [
      {"ingredient_name": "pasta spaghetti",              "quantity": 100, "unit": "g", "notes": "en seco"},
      {"ingredient_name": "pechuga de pavo en taquitos",  "quantity": 150, "unit": "g"},
      {"ingredient_name": "huevos",                       "quantity": 2,   "unit": "unidades"},
      {"ingredient_name": "yema de huevo",                "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "queso parmesano rallado",      "quantity": 30,  "unit": "g"},
      {"ingredient_name": "aceite de oliva",              "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "ajo",                          "quantity": 1,   "unit": "diente"},
      {"ingredient_name": "pimienta negra molida",        "quantity": None,"unit": "generosa"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Cuece la pasta al dente reservando 100 ml del agua de cocción. Bate los huevos con la yema extra y el parmesano; añade pimienta negra generosa."},
      {"step_number": 2, "instruction": "Dora el pavo en el aceite con el ajo a fuego medio-alto 5 minutos hasta que esté dorado."},
      {"step_number": 3, "instruction": "Retira del fuego. Añade la pasta escurrida y mezcla con el pavo. El fuego debe estar apagado para que los huevos no cuajen."},
      {"step_number": 4, "instruction": "Vierte la mezcla de huevo y queso sobre la pasta, añade un par de cucharadas del agua de cocción y remueve rápidamente hasta crear una salsa cremosa. Sirve inmediatamente."},
    ],
  },

  "cocido_madrileno": {
    "title": "Cocido madrileño completo (sopa, garbanzos y carne)",
    "meal_type": "lunch", "cuisine": "española",
    "prep_time_min": 15, "cook_time_min": 90, "ready_in_min": 105, "servings": 2,
    "calories_kcal": 850, "protein_g": 52.0, "carbs_g": 70.0, "fat_g": 35.0, "fiber_g": 10.0,
    "ingredients": [
      {"ingredient_name": "garbanzos secos",             "quantity": 150, "unit": "g", "notes": "remojados la noche anterior, para 2 raciones"},
      {"ingredient_name": "morcillo de ternera",         "quantity": 200, "unit": "g"},
      {"ingredient_name": "muslo de pollo",              "quantity": 150, "unit": "g"},
      {"ingredient_name": "chorizo fresco",              "quantity": 60,  "unit": "g"},
      {"ingredient_name": "tocino salado",               "quantity": 30,  "unit": "g"},
      {"ingredient_name": "zanahoria",                   "quantity": 100, "unit": "g"},
      {"ingredient_name": "patata mediana",              "quantity": 200, "unit": "g"},
      {"ingredient_name": "repollo",                     "quantity": 150, "unit": "g"},
      {"ingredient_name": "fideos finos",                "quantity": 40,  "unit": "g"},
      {"ingredient_name": "sal y pimienta",              "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pon en la olla exprés los garbanzos remojados, la carne, el pollo, el chorizo y el tocino. Cubre con agua fría abundante y sal. Cierra y cuece 35-40 minutos desde que sube la presión."},
      {"step_number": 2, "instruction": "Abre la olla, retira las carnes y el chorizo. Añade las zanahorias, las patatas y el repollo al caldo con los garbanzos. Cuece 20 minutos a fuego suave."},
      {"step_number": 3, "instruction": "Cuela parte del caldo en otro cazo y cuece los fideos 5 minutos para hacer la sopa de primer plato."},
      {"step_number": 4, "instruction": "Sirve primero la sopa de fideos. Después presenta los garbanzos con la verdura y las carnes cortadas como segundo plato."},
    ],
  },

  # Cenas ~580-620 kcal (mantenimiento)
  "bacalao_pil_pil": {
    "title": "Bacalao al pil-pil con patatas panaderas",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 15, "cook_time_min": 30, "ready_in_min": 45, "servings": 1,
    "calories_kcal": 590, "protein_g": 40.0, "carbs_g": 30.0, "fat_g": 32.0, "fiber_g": 3.5,
    "ingredients": [
      {"ingredient_name": "lomo de bacalao desalado",     "quantity": 200, "unit": "g"},
      {"ingredient_name": "patatas",                      "quantity": 180, "unit": "g"},
      {"ingredient_name": "ajo",                          "quantity": 4,   "unit": "dientes"},
      {"ingredient_name": "guindilla seca",               "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "aceite de oliva virgen extra", "quantity": 60,  "unit": "ml"},
      {"ingredient_name": "perejil fresco",               "quantity": 5,   "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Lamina las patatas finas y confítalas en aceite de oliva con los ajos laminados a fuego muy suave 20 minutos. Retira patatas y ajos."},
      {"step_number": 2, "instruction": "Sube ligeramente el fuego. Añade el bacalao con la piel hacia arriba y cocina 3-4 minutos. Da la vuelta, cocina 3 minutos más. Retira el bacalao."},
      {"step_number": 3, "instruction": "Deja enfriar el aceite hasta 60°C. Mueve la cazuela en círculos constantemente para emulsionar la gelatina del bacalao con el aceite hasta obtener una salsa blanca y espesa."},
      {"step_number": 4, "instruction": "Sirve el bacalao sobre las patatas y cúbrelo con la salsa pil-pil. Decora con los ajos y el perejil."},
    ],
  },

  "berenjenas_rellenas_carne": {
    "title": "Berenjenas rellenas de carne y queso gratinado",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 15, "cook_time_min": 40, "ready_in_min": 55, "servings": 1,
    "calories_kcal": 580, "protein_g": 36.0, "carbs_g": 22.0, "fat_g": 36.0, "fiber_g": 7.0,
    "ingredients": [
      {"ingredient_name": "berenjena grande",             "quantity": 300, "unit": "g"},
      {"ingredient_name": "carne picada mixta",           "quantity": 150, "unit": "g"},
      {"ingredient_name": "tomate triturado",             "quantity": 100, "unit": "g"},
      {"ingredient_name": "cebolla",                      "quantity": 80,  "unit": "g"},
      {"ingredient_name": "ajo",                          "quantity": 2,   "unit": "dientes"},
      {"ingredient_name": "queso mozzarella rallado",     "quantity": 40,  "unit": "g"},
      {"ingredient_name": "aceite de oliva",              "quantity": 15,  "unit": "ml"},
      {"ingredient_name": "orégano y albahaca",           "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Precalienta el horno a 200°C. Corta la berenjena por la mitad a lo largo y haz cortes en la pulpa en forma de cuadrícula sin llegar a la piel. Asa 20 minutos. Extrae la pulpa con cuchara."},
      {"step_number": 2, "instruction": "Sofríe la cebolla y el ajo picados en el aceite 5 minutos. Añade la carne picada y dórala bien 5 minutos más."},
      {"step_number": 3, "instruction": "Incorpora el tomate, la pulpa de berenjena picada y las especias. Cocina 8 minutos a fuego medio."},
      {"step_number": 4, "instruction": "Rellena las mitades de berenjena con la mezcla de carne. Cubre con el queso rallado y gratina en el horno 8-10 minutos hasta dorar."},
    ],
  },

  "carne_guisada_patatas": {
    "title": "Carne guisada con patatas y zanahoria",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 45, "ready_in_min": 55, "servings": 2,
    "calories_kcal": 610, "protein_g": 38.0, "carbs_g": 40.0, "fat_g": 28.0, "fiber_g": 5.0,
    "ingredients": [
      {"ingredient_name": "ternera para guisar",          "quantity": 300, "unit": "g", "notes": "para 2 raciones"},
      {"ingredient_name": "patatas medianas",             "quantity": 300, "unit": "g"},
      {"ingredient_name": "zanahoria",                    "quantity": 150, "unit": "g"},
      {"ingredient_name": "cebolla",                      "quantity": 100, "unit": "g"},
      {"ingredient_name": "ajo",                          "quantity": 3,   "unit": "dientes"},
      {"ingredient_name": "vino tinto",                   "quantity": 100, "unit": "ml"},
      {"ingredient_name": "caldo de carne",               "quantity": 300, "unit": "ml"},
      {"ingredient_name": "aceite de oliva",              "quantity": 20,  "unit": "ml"},
      {"ingredient_name": "laurel y tomillo",             "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Salpimienta la carne. Dórala en el aceite caliente a fuego alto 6 minutos por todos los lados. Retira."},
      {"step_number": 2, "instruction": "Sofríe la cebolla y el ajo picados 5 minutos en la misma cazuela. Vierte el vino y raspa el fondo para soltar los jugos. Deja reducir 3 minutos."},
      {"step_number": 3, "instruction": "Devuelve la carne, añade el caldo, las zanahorias troceadas, el laurel y el tomillo. Tapa y cuece a fuego suave 30 minutos."},
      {"step_number": 4, "instruction": "Añade las patatas peladas y troceadas. Cocina 15 minutos más hasta que estén tiernas. Rectifica de sal y sirve."},
    ],
  },

  # Cenas ~760-800 kcal (ganancia)
  "chuleta_pure_patatas": {
    "title": "Chuleta de cerdo a la plancha con puré de patatas y ensalada",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 20, "ready_in_min": 30, "servings": 1,
    "calories_kcal": 770, "protein_g": 45.0, "carbs_g": 48.0, "fat_g": 42.0, "fiber_g": 4.5,
    "ingredients": [
      {"ingredient_name": "chuleta de cerdo sin hueso",   "quantity": 220, "unit": "g"},
      {"ingredient_name": "patatas",                      "quantity": 250, "unit": "g"},
      {"ingredient_name": "mantequilla",                  "quantity": 20,  "unit": "g"},
      {"ingredient_name": "leche entera",                 "quantity": 80,  "unit": "ml"},
      {"ingredient_name": "lechuga",                      "quantity": 80,  "unit": "g"},
      {"ingredient_name": "tomate",                       "quantity": 100, "unit": "g"},
      {"ingredient_name": "aceite de oliva",              "quantity": 10,  "unit": "ml"},
      {"ingredient_name": "romero, sal y pimienta",       "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Cuece las patatas peladas en agua salada 20 minutos hasta que estén tiernas. Escurre y machaca con la mantequilla y la leche caliente hasta obtener un puré liso. Salpimienta."},
      {"step_number": 2, "instruction": "Salpimienta la chuleta con romero. Calienta una plancha bien caliente y cocina 4 minutos por cada lado hasta que esté dorada."},
      {"step_number": 3, "instruction": "Prepara la ensalada con la lechuga troceada y el tomate, aliñada con aceite y sal."},
      {"step_number": 4, "instruction": "Sirve la chuleta sobre el puré de patatas, con la ensalada al lado."},
    ],
  },

  "merluza_patatas_ajillo": {
    "title": "Merluza al pil-pil con patatas al ajillo",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 25, "ready_in_min": 35, "servings": 1,
    "calories_kcal": 760, "protein_g": 46.0, "carbs_g": 48.0, "fat_g": 38.0, "fiber_g": 4.5,
    "ingredients": [
      {"ingredient_name": "lomo de merluza",              "quantity": 240, "unit": "g"},
      {"ingredient_name": "patatas",                      "quantity": 250, "unit": "g"},
      {"ingredient_name": "ajo",                          "quantity": 5,   "unit": "dientes"},
      {"ingredient_name": "aceite de oliva virgen extra", "quantity": 40,  "unit": "ml"},
      {"ingredient_name": "perejil fresco",               "quantity": 8,   "unit": "g"},
      {"ingredient_name": "guindilla",                    "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "sal y pimentón dulce",         "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Cuece las patatas con piel en agua salada 20 minutos. Pela y corta en rodajas gruesas."},
      {"step_number": 2, "instruction": "Calienta el aceite en una cazuela y sofríe los ajos laminados con la guindilla a fuego suave sin que se doren, 3 minutos."},
      {"step_number": 3, "instruction": "Añade la merluza salada, con la piel hacia arriba. Cocina a fuego suave 5 minutos. Da la vuelta y 4 minutos más."},
      {"step_number": 4, "instruction": "Saltea las patatas en una sartén con un poco del aceite aromatizado al ajo hasta dorarlas ligeramente. Sirve la merluza sobre las patatas con el aceite de ajos y perejil abundante."},
    ],
  },

  "pollo_asado_arroz": {
    "title": "Cuartos de pollo asado con arroz blanco y pimientos",
    "meal_type": "dinner", "cuisine": "española",
    "prep_time_min": 10, "cook_time_min": 50, "ready_in_min": 60, "servings": 2,
    "calories_kcal": 780, "protein_g": 52.0, "carbs_g": 58.0, "fat_g": 32.0, "fiber_g": 3.0,
    "ingredients": [
      {"ingredient_name": "cuartos de pollo con piel",    "quantity": 400, "unit": "g", "notes": "para 2 raciones"},
      {"ingredient_name": "arroz blanco cocido",          "quantity": 200, "unit": "g", "notes": "80g en seco"},
      {"ingredient_name": "pimiento rojo",                "quantity": 150, "unit": "g"},
      {"ingredient_name": "ajo",                          "quantity": 4,   "unit": "dientes"},
      {"ingredient_name": "aceite de oliva",              "quantity": 20,  "unit": "ml"},
      {"ingredient_name": "limón",                        "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "romero y tomillo",             "quantity": 5,   "unit": "g"},
      {"ingredient_name": "pimentón ahumado",             "quantity": 3,   "unit": "g"},
      {"ingredient_name": "sal y pimienta",               "quantity": None,"unit": "al gusto"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Precalienta el horno a 200°C. Mezcla el aceite con el ajo prensado, el pimentón, el zumo de medio limón, sal, pimienta y las hierbas. Unta bien el pollo con esta mezcla."},
      {"step_number": 2, "instruction": "Coloca el pollo en una bandeja de horno junto con los pimientos cortados en tiras. Añade las rodajas del limón restante."},
      {"step_number": 3, "instruction": "Hornea 45-50 minutos, regando el pollo con sus jugos a mitad de cocción, hasta que la piel esté dorada y crujiente."},
      {"step_number": 4, "instruction": "Sirve el pollo con el arroz blanco y los pimientos asados del fondo de la bandeja."},
    ],
  },

  # Snacks ~250-300 kcal (mantenimiento)
  "tostada_queso_membrillo": {
    "title": "Tostada de pan con queso manchego y membrillo",
    "meal_type": "snack", "cuisine": "española",
    "prep_time_min": 3, "cook_time_min": 2, "ready_in_min": 5, "servings": 1,
    "calories_kcal": 270, "protein_g": 8.5, "carbs_g": 32.0, "fat_g": 11.5, "fiber_g": 1.5,
    "ingredients": [
      {"ingredient_name": "pan de payés integral",       "quantity": 50,  "unit": "g"},
      {"ingredient_name": "queso manchego semicurado",   "quantity": 30,  "unit": "g"},
      {"ingredient_name": "membrillo",                   "quantity": 30,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Tuesta el pan y córtalo en rebanadas."},
      {"step_number": 2, "instruction": "Coloca el queso manchego laminado sobre el pan y añade un trozo de membrillo encima. La combinación dulce-salado es perfecta."},
    ],
  },

  "mix_frutos_secos_chocolate": {
    "title": "Mix de frutos secos y chocolate negro 85%",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 1, "cook_time_min": 0, "ready_in_min": 1, "servings": 1,
    "calories_kcal": 255, "protein_g": 6.0, "carbs_g": 14.0, "fat_g": 20.0, "fiber_g": 3.5,
    "ingredients": [
      {"ingredient_name": "nueces",                      "quantity": 15,  "unit": "g"},
      {"ingredient_name": "almendras",                   "quantity": 15,  "unit": "g"},
      {"ingredient_name": "avellanas",                   "quantity": 10,  "unit": "g"},
      {"ingredient_name": "chocolate negro 85%",         "quantity": 15,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Mezcla todos los frutos secos con el chocolate negro troceado en un bol pequeño. Un snack saciante rico en grasas saludables y antioxidantes."},
    ],
  },

  "batido_platano_avena": {
    "title": "Batido saciante de plátano, avena y leche",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 4, "cook_time_min": 0, "ready_in_min": 4, "servings": 1,
    "calories_kcal": 280, "protein_g": 9.0, "carbs_g": 48.0, "fat_g": 6.0, "fiber_g": 4.0,
    "ingredients": [
      {"ingredient_name": "leche semidesnatada",         "quantity": 250, "unit": "ml"},
      {"ingredient_name": "plátano maduro",              "quantity": 100, "unit": "g"},
      {"ingredient_name": "copos de avena",              "quantity": 30,  "unit": "g"},
      {"ingredient_name": "miel",                        "quantity": 8,   "unit": "g"},
      {"ingredient_name": "canela",                      "quantity": 1,   "unit": "pizca"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pon todos los ingredientes en la batidora."},
      {"step_number": 2, "instruction": "Tritura 45 segundos hasta obtener un batido cremoso y homogéneo. Sirve frío."},
    ],
  },

  # Snacks ~340-380 kcal (ganancia)
  "batido_hipercalorico": {
    "title": "Batido hipercalórico de avena, plátano y proteína",
    "meal_type": "snack", "cuisine": "mediterránea",
    "prep_time_min": 4, "cook_time_min": 0, "ready_in_min": 4, "servings": 1,
    "calories_kcal": 380, "protein_g": 28.0, "carbs_g": 52.0, "fat_g": 8.0, "fiber_g": 5.5,
    "ingredients": [
      {"ingredient_name": "leche entera",                       "quantity": 300, "unit": "ml"},
      {"ingredient_name": "proteína en polvo (vainilla)",       "quantity": 30,  "unit": "g"},
      {"ingredient_name": "plátano maduro",                     "quantity": 100, "unit": "g"},
      {"ingredient_name": "copos de avena integrales",          "quantity": 30,  "unit": "g"},
      {"ingredient_name": "mantequilla de cacahuete natural",   "quantity": 10,  "unit": "g"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Añade todos los ingredientes a la batidora."},
      {"step_number": 2, "instruction": "Tritura a velocidad alta 60 segundos. Si queda muy espeso añade un poco más de leche. Consume inmediatamente o en los 30 minutos siguientes al entrenamiento."},
    ],
  },

  "pan_jamon_queso": {
    "title": "Bocadillo de jamón serrano y queso con tomate",
    "meal_type": "snack", "cuisine": "española",
    "prep_time_min": 5, "cook_time_min": 0, "ready_in_min": 5, "servings": 1,
    "calories_kcal": 360, "protein_g": 18.0, "carbs_g": 38.0, "fat_g": 15.0, "fiber_g": 3.0,
    "ingredients": [
      {"ingredient_name": "pan de barra integral",       "quantity": 70,  "unit": "g"},
      {"ingredient_name": "jamón serrano",               "quantity": 40,  "unit": "g"},
      {"ingredient_name": "queso fresco",                "quantity": 40,  "unit": "g"},
      {"ingredient_name": "tomate maduro",               "quantity": 80,  "unit": "g"},
      {"ingredient_name": "aceite de oliva virgen",      "quantity": 5,   "unit": "ml"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Abre el pan por la mitad. Frota el interior con el tomate cortado por la mitad, exprimiendo bien."},
      {"step_number": 2, "instruction": "Añade un chorrito de aceite de oliva, el queso fresco y el jamón serrano. Cierra y sirve."},
    ],
  },

  "arroz_leche": {
    "title": "Arroz con leche casero al estilo asturiano",
    "meal_type": "snack", "cuisine": "española",
    "prep_time_min": 5, "cook_time_min": 40, "ready_in_min": 45, "servings": 2,
    "calories_kcal": 350, "protein_g": 8.0, "carbs_g": 58.0, "fat_g": 9.5, "fiber_g": 0.5,
    "ingredients": [
      {"ingredient_name": "arroz redondo",               "quantity": 80,  "unit": "g", "notes": "para 2 raciones"},
      {"ingredient_name": "leche entera",                "quantity": 700, "unit": "ml"},
      {"ingredient_name": "azúcar",                      "quantity": 50,  "unit": "g"},
      {"ingredient_name": "piel de limón",               "quantity": 1,   "unit": "tira"},
      {"ingredient_name": "rama de canela",              "quantity": 1,   "unit": "unidad"},
      {"ingredient_name": "canela molida",               "quantity": None,"unit": "para decorar"},
    ],
    "steps": [
      {"step_number": 1, "instruction": "Pon la leche a calentar con la rama de canela y la piel de limón. Cuando hierva, añade el arroz."},
      {"step_number": 2, "instruction": "Baja el fuego al mínimo y cocina 35-40 minutos removiendo frecuentemente hasta que el arroz esté muy tierno y la leche haya espesado."},
      {"step_number": 3, "instruction": "Retira la canela y el limón. Añade el azúcar y remueve 2 minutos más. Sirve templado o frío espolvoreado con canela molida."},
    ],
  },

}


# ══════════════════════════════════════════════════════════════════════════════
# ESTRUCTURA DEL PLAN  (7 días × 4 comidas)
# ══════════════════════════════════════════════════════════════════════════════

PLAN_LOSE_WEIGHT = {
  "meta": {
    "title":           "Plan Pérdida de Peso · 7 días",
    "description":     "Plan mediterráneo con déficit calórico moderado (~1500 kcal/día). Alto en proteína para preservar masa muscular, rico en fibra y grasas saludables. Basado en la dieta mediterránea española.",
    "goal_type":       "lose_weight",
    "duration_days":   7,
    "target_calories": 1500,
    "is_premium":      True,
    "is_sample":       False,
  },
  "days": [
    {
      "day_number": 1, "day_label": "Día 1 · Lunes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tostadas_tomate"},
        {"meal_type": "lunch",     "recipe": "ensalada_pollo_quinoa"},
        {"meal_type": "dinner",    "recipe": "crema_calabacin_pollo"},
        {"meal_type": "snack",     "recipe": "yogur_griego_miel"},
      ],
    },
    {
      "day_number": 2, "day_label": "Día 2 · Martes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "yogur_granola_frutos"},
        {"meal_type": "lunch",     "recipe": "merluza_verduras_horno"},
        {"meal_type": "dinner",    "recipe": "revuelto_champinones_gambas"},
        {"meal_type": "snack",     "recipe": "manzana_mantequilla_cacahuete"},
      ],
    },
    {
      "day_number": 3, "day_label": "Día 3 · Miércoles",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tortilla_claras_espinacas"},
        {"meal_type": "lunch",     "recipe": "lentejas_verduras"},
        {"meal_type": "dinner",    "recipe": "dorada_horno_ensalada"},
        {"meal_type": "snack",     "recipe": "zanahoria_hummus"},
      ],
    },
    {
      "day_number": 4, "day_label": "Día 4 · Jueves",
      "meals": [
        {"meal_type": "breakfast", "recipe": "porridge_avena_platano"},
        {"meal_type": "lunch",     "recipe": "pollo_limon_arroz"},
        {"meal_type": "dinner",    "recipe": "sopa_verduras_huevo"},
        {"meal_type": "snack",     "recipe": "almendras_datil"},
      ],
    },
    {
      "day_number": 5, "day_label": "Día 5 · Viernes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "pan_aguacate_huevo"},
        {"meal_type": "lunch",     "recipe": "salmon_vapor_brocoli"},
        {"meal_type": "dinner",    "recipe": "lubina_esparragos"},
        {"meal_type": "snack",     "recipe": "pera_queso_fresco"},
      ],
    },
    {
      "day_number": 6, "day_label": "Día 6 · Sábado",
      "meals": [
        {"meal_type": "breakfast", "recipe": "revuelto_salmon_ahumado"},
        {"meal_type": "lunch",     "recipe": "garbanzos_espinacas"},
        {"meal_type": "dinner",    "recipe": "tortilla_española_ensalada"},
        {"meal_type": "snack",     "recipe": "batido_proteinas_postentrenamiento"},
      ],
    },
    {
      "day_number": 7, "day_label": "Día 7 · Domingo",
      "meals": [
        {"meal_type": "breakfast", "recipe": "smoothie_proteinas_frutos"},
        {"meal_type": "lunch",     "recipe": "pavo_pimientos_arroz"},
        {"meal_type": "dinner",    "recipe": "pollo_ajillo_judias"},
        {"meal_type": "snack",     "recipe": "tortita_arroz_aguacate"},
      ],
    },
  ],
}


# ══════════════════════════════════════════════════════════════════════════════
# INSERCIÓN EN SUPABASE
# ══════════════════════════════════════════════════════════════════════════════

def load_env() -> dict:
    env_path = Path(__file__).parent.parent / ".env.local"
    if not env_path.exists():
        sys.exit(f"❌  No se encontró .env.local en {env_path}")
    return dotenv_values(env_path)


def get_supabase(env: dict) -> Client:
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        sys.exit("❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def insert_recipe(sb: Client, key: str, data: dict) -> str:
    """Inserta una receta y sus ingredientes/pasos. Devuelve el UUID."""
    payload = {k: v for k, v in data.items() if k not in ("ingredients", "steps")}
    res = sb.table("recipes").insert(payload).execute()
    recipe_id = res.data[0]["id"]

    if data.get("ingredients"):
        for i, ing in enumerate(data["ingredients"]):
            ing = dict(ing)
            ing["recipe_id"]   = recipe_id
            ing["order_index"] = i
            sb.table("recipe_ingredients").insert(ing).execute()

    if data.get("steps"):
        for step in data["steps"]:
            step = dict(step)
            step["recipe_id"] = recipe_id
            sb.table("recipe_steps").insert(step).execute()

    return recipe_id


def seed_plan(sb: Client, plan_def: dict, dry_run: bool) -> None:
    meta = plan_def["meta"]
    print(f"\n{'─'*55}")
    print(f"  🥗  {meta['title']}")
    print(f"  🎯  {meta['target_calories']} kcal/día | {meta['duration_days']} días")
    print(f"{'─'*55}")

    if dry_run:
        for day in plan_def["days"]:
            print(f"\n  📅  {day['day_label']}")
            for m in day["meals"]:
                r = RECIPES[m["recipe"]]
                icon = {"breakfast":"🍳","lunch":"🥗","dinner":"🍽️","snack":"🍎"}.get(m["meal_type"],"🍽")
                print(f"      {icon} [{m['meal_type']}] {r['title']}  ({r['calories_kcal']} kcal)")
        total = sum(
            RECIPES[m["recipe"]]["calories_kcal"]
            for day in plan_def["days"]
            for m in day["meals"]
        ) / len(plan_def["days"])
        print(f"\n  📊  Media kcal/día: {total:.0f}")
        print(f"  DRY RUN — no se insertó nada\n")
        return

    # 1. Insertar recetas únicas
    recipe_ids: dict[str, str] = {}
    used_keys = {m["recipe"] for day in plan_def["days"] for m in day["meals"]}
    print(f"\n  📥  Insertando {len(used_keys)} recetas...")
    for key in sorted(used_keys):
        print(f"      ➕ {RECIPES[key]['title'][:55]}", end=" ", flush=True)
        recipe_ids[key] = insert_recipe(sb, key, RECIPES[key])
        print("✅")

    # 2. Insertar plan
    plan_res = sb.table("meal_plans").insert({
        "title":           meta["title"],
        "description":     meta["description"],
        "goal_type":       meta["goal_type"],
        "duration_days":   meta["duration_days"],
        "target_calories": meta["target_calories"],
        "is_premium":      meta["is_premium"],
        "is_sample":       meta["is_sample"],
    }).execute()
    plan_id = plan_res.data[0]["id"]
    print(f"\n  📋  Plan creado: {plan_id}")

    # 3. Insertar días y comidas
    for day in plan_def["days"]:
        recipes_in_day = [RECIPES[m["recipe"]] for m in day["meals"]]
        total_kcal   = sum(r["calories_kcal"] or 0 for r in recipes_in_day)
        total_prot   = sum(r["protein_g"]     or 0 for r in recipes_in_day)
        total_carbs  = sum(r["carbs_g"]       or 0 for r in recipes_in_day)
        total_fat    = sum(r["fat_g"]         or 0 for r in recipes_in_day)

        day_res = sb.table("meal_plan_days").insert({
            "plan_id":         plan_id,
            "day_number":      day["day_number"],
            "day_label":       day["day_label"],
            "total_calories":  round(total_kcal),
            "total_protein_g": round(total_prot, 1),
            "total_carbs_g":   round(total_carbs, 1),
            "total_fat_g":     round(total_fat, 1),
        }).execute()
        day_id = day_res.data[0]["id"]

        for i, m in enumerate(day["meals"]):
            sb.table("meal_plan_meals").insert({
                "day_id":      day_id,
                "meal_type":   m["meal_type"],
                "recipe_id":   recipe_ids[m["recipe"]],
                "order_index": i,
            }).execute()

        print(f"  📅  {day['day_label']}  →  {round(total_kcal)} kcal  ✅")

    print(f"\n  ✅  Plan completo insertado.\n")


PLAN_MAINTAIN = {
  "meta": {
    "title":           "Plan Mantenimiento · 7 días",
    "description":     "Plan mediterráneo equilibrado para mantener el peso (~2000 kcal/día). Variado y sabroso, con platos tradicionales españoles y abundante proteína, fibra y grasas saludables.",
    "goal_type":       "maintain",
    "duration_days":   7,
    "target_calories": 2000,
    "is_premium":      True,
    "is_sample":       False,
  },
  "days": [
    {
      "day_number": 1, "day_label": "Día 1 · Lunes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tostada_francesa_frutos"},
        {"meal_type": "lunch",     "recipe": "pasta_boloñesa_pavo"},
        {"meal_type": "dinner",    "recipe": "bacalao_pil_pil"},
        {"meal_type": "snack",     "recipe": "tostada_queso_membrillo"},
      ],
    },
    {
      "day_number": 2, "day_label": "Día 2 · Martes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "pancakes_avena_proteina"},
        {"meal_type": "lunch",     "recipe": "arroz_pollo_verduras_horno"},
        {"meal_type": "dinner",    "recipe": "berenjenas_rellenas_carne"},
        {"meal_type": "snack",     "recipe": "mix_frutos_secos_chocolate"},
      ],
    },
    {
      "day_number": 3, "day_label": "Día 3 · Miércoles",
      "meals": [
        {"meal_type": "breakfast", "recipe": "bol_avena_frutos_secos"},
        {"meal_type": "lunch",     "recipe": "ensalada_pasta_atun"},
        {"meal_type": "dinner",    "recipe": "dorada_horno_ensalada"},
        {"meal_type": "snack",     "recipe": "batido_platano_avena"},
      ],
    },
    {
      "day_number": 4, "day_label": "Día 4 · Jueves",
      "meals": [
        {"meal_type": "breakfast", "recipe": "yogur_granola_frutos"},
        {"meal_type": "lunch",     "recipe": "lentejas_verduras"},
        {"meal_type": "dinner",    "recipe": "carne_guisada_patatas"},
        {"meal_type": "snack",     "recipe": "pera_queso_fresco"},
      ],
    },
    {
      "day_number": 5, "day_label": "Día 5 · Viernes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "pan_aguacate_huevo"},
        {"meal_type": "lunch",     "recipe": "salmon_vapor_brocoli"},
        {"meal_type": "dinner",    "recipe": "pollo_ajillo_judias"},
        {"meal_type": "snack",     "recipe": "almendras_datil"},
      ],
    },
    {
      "day_number": 6, "day_label": "Día 6 · Sábado",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tortilla_claras_espinacas"},
        {"meal_type": "lunch",     "recipe": "arroz_pollo_verduras_horno"},
        {"meal_type": "dinner",    "recipe": "tortilla_española_ensalada"},
        {"meal_type": "snack",     "recipe": "yogur_griego_miel"},
      ],
    },
    {
      "day_number": 7, "day_label": "Día 7 · Domingo",
      "meals": [
        {"meal_type": "breakfast", "recipe": "revuelto_salmon_ahumado"},
        {"meal_type": "lunch",     "recipe": "garbanzos_espinacas"},
        {"meal_type": "dinner",    "recipe": "lubina_esparragos"},
        {"meal_type": "snack",     "recipe": "batido_platano_avena"},
      ],
    },
  ],
}


PLAN_GAIN_MUSCLE = {
  "meta": {
    "title":           "Plan Ganancia Muscular · 7 días",
    "description":     "Plan hipercalórico con alto aporte proteico (~2500 kcal/día). Diseñado para maximizar la síntesis proteica, optimizar la recuperación muscular y proporcionar energía suficiente para entrenamientos intensos.",
    "goal_type":       "gain_muscle",
    "duration_days":   7,
    "target_calories": 2500,
    "is_premium":      True,
    "is_sample":       False,
  },
  "days": [
    {
      "day_number": 1, "day_label": "Día 1 · Lunes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tortilla_jamon_queso"},
        {"meal_type": "lunch",     "recipe": "arroz_pollo_abundante"},
        {"meal_type": "dinner",    "recipe": "chuleta_pure_patatas"},
        {"meal_type": "snack",     "recipe": "batido_hipercalorico"},
      ],
    },
    {
      "day_number": 2, "day_label": "Día 2 · Martes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "bol_avena_proteina_mantequilla"},
        {"meal_type": "lunch",     "recipe": "pasta_carbonara_ligera"},
        {"meal_type": "dinner",    "recipe": "merluza_patatas_ajillo"},
        {"meal_type": "snack",     "recipe": "pan_jamon_queso"},
      ],
    },
    {
      "day_number": 3, "day_label": "Día 3 · Miércoles",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tostadas_salmon_aguacate"},
        {"meal_type": "lunch",     "recipe": "cocido_madrileno"},
        {"meal_type": "dinner",    "recipe": "pollo_asado_arroz"},
        {"meal_type": "snack",     "recipe": "arroz_leche"},
      ],
    },
    {
      "day_number": 4, "day_label": "Día 4 · Jueves",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tortilla_jamon_queso"},
        {"meal_type": "lunch",     "recipe": "arroz_pollo_abundante"},
        {"meal_type": "dinner",    "recipe": "berenjenas_rellenas_carne"},
        {"meal_type": "snack",     "recipe": "batido_hipercalorico"},
      ],
    },
    {
      "day_number": 5, "day_label": "Día 5 · Viernes",
      "meals": [
        {"meal_type": "breakfast", "recipe": "bol_avena_proteina_mantequilla"},
        {"meal_type": "lunch",     "recipe": "pasta_carbonara_ligera"},
        {"meal_type": "dinner",    "recipe": "chuleta_pure_patatas"},
        {"meal_type": "snack",     "recipe": "pan_jamon_queso"},
      ],
    },
    {
      "day_number": 6, "day_label": "Día 6 · Sábado",
      "meals": [
        {"meal_type": "breakfast", "recipe": "tostadas_salmon_aguacate"},
        {"meal_type": "lunch",     "recipe": "cocido_madrileno"},
        {"meal_type": "dinner",    "recipe": "pollo_asado_arroz"},
        {"meal_type": "snack",     "recipe": "arroz_leche"},
      ],
    },
    {
      "day_number": 7, "day_label": "Día 7 · Domingo",
      "meals": [
        {"meal_type": "breakfast", "recipe": "pancakes_avena_proteina"},
        {"meal_type": "lunch",     "recipe": "arroz_pollo_abundante"},
        {"meal_type": "dinner",    "recipe": "merluza_patatas_ajillo"},
        {"meal_type": "snack",     "recipe": "batido_hipercalorico"},
      ],
    },
  ],
}


def main():
    parser = argparse.ArgumentParser(description="Inserta planes de dieta estáticos en Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Vista previa sin insertar")
    parser.add_argument("--plan", choices=["lose_weight", "maintain", "gain_muscle", "all"],
                        default="all", help="Qué plan(es) insertar (default: all)")
    args = parser.parse_args()

    env = load_env()
    sb  = get_supabase(env)

    plans = {
        "lose_weight":  PLAN_LOSE_WEIGHT,
        "maintain":     PLAN_MAINTAIN,
        "gain_muscle":  PLAN_GAIN_MUSCLE,
    }

    to_run = list(plans.values()) if args.plan == "all" else [plans[args.plan]]

    for plan in to_run:
        seed_plan(sb, plan, dry_run=args.dry_run)

    print("✅  Proceso completado.\n")


if __name__ == "__main__":
    main()
