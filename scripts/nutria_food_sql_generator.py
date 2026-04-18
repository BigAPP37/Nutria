#!/usr/bin/env python3
"""
Nutria Food SQL Generator
Genera archivos SQL con INSERT de alimentos españoles para ejecutar
directamente en el SQL Editor de Supabase. Sin APIs externas.

USO:
  python3 nutria_food_sql_generator.py

RESULTADO:
  Genera archivos SQL en ./sql_batches/ listos para pegar en:
  Supabase Dashboard → SQL Editor → New Query → pegar → Run
"""

import uuid
import os
import json

OUTPUT_DIR = "sql_batches"

# Datos nutricionales por 100g, basados en tablas BEDCA/USDA
# Formato: (nombre, cal, prot, carbs, fat, fiber, category, food_source, servings)
# servings: [(nombre_porcion, gramos), ...]

FOODS = [
    # ===== FRUTAS =====
    ("Manzana", 52, 0.3, 13.8, 0.2, 2.4, "fruit", "packaged", [("1 pieza mediana", 180), ("100 g", 100)]),
    ("Plátano", 89, 1.1, 22.8, 0.3, 2.6, "fruit", "packaged", [("1 pieza mediana", 120), ("100 g", 100)]),
    ("Naranja", 47, 0.9, 11.7, 0.1, 2.4, "fruit", "packaged", [("1 pieza mediana", 200), ("100 g", 100)]),
    ("Mandarina", 53, 0.8, 13.3, 0.3, 1.8, "fruit", "packaged", [("1 pieza", 80), ("100 g", 100)]),
    ("Fresa", 32, 0.7, 7.7, 0.3, 2.0, "fruit", "packaged", [("1 ración (8 fresas)", 150), ("100 g", 100)]),
    ("Cereza", 63, 1.1, 16.0, 0.2, 2.1, "fruit", "packaged", [("1 ración", 120), ("100 g", 100)]),
    ("Melocotón", 39, 0.9, 9.5, 0.3, 1.5, "fruit", "packaged", [("1 pieza mediana", 170), ("100 g", 100)]),
    ("Nectarina", 44, 1.1, 10.5, 0.3, 1.7, "fruit", "packaged", [("1 pieza", 150), ("100 g", 100)]),
    ("Pera", 57, 0.4, 15.2, 0.1, 3.1, "fruit", "packaged", [("1 pieza mediana", 180), ("100 g", 100)]),
    ("Uva blanca", 69, 0.7, 18.1, 0.2, 0.9, "fruit", "packaged", [("1 racimo pequeño", 150), ("100 g", 100)]),
    ("Uva negra", 67, 0.6, 17.2, 0.4, 0.9, "fruit", "packaged", [("1 racimo pequeño", 150), ("100 g", 100)]),
    ("Sandía", 30, 0.6, 7.6, 0.2, 0.4, "fruit", "packaged", [("1 tajada", 300), ("100 g", 100)]),
    ("Melón", 34, 0.8, 8.2, 0.2, 0.9, "fruit", "packaged", [("1 tajada", 250), ("100 g", 100)]),
    ("Kiwi", 61, 1.1, 14.7, 0.5, 3.0, "fruit", "packaged", [("1 pieza", 75), ("100 g", 100)]),
    ("Piña", 50, 0.5, 13.1, 0.1, 1.4, "fruit", "packaged", [("1 rodaja", 120), ("100 g", 100)]),
    ("Mango", 60, 0.8, 15.0, 0.4, 1.6, "fruit", "packaged", [("1 pieza mediana", 200), ("100 g", 100)]),
    ("Papaya", 43, 0.5, 10.8, 0.3, 1.7, "fruit", "packaged", [("1 ración", 200), ("100 g", 100)]),
    ("Higo", 74, 0.8, 19.2, 0.3, 2.9, "fruit", "packaged", [("2 higos", 100), ("100 g", 100)]),
    ("Granada", 83, 1.7, 18.7, 1.2, 4.0, "fruit", "packaged", [("1 pieza", 200), ("100 g", 100)]),
    ("Ciruela", 46, 0.7, 11.4, 0.3, 1.4, "fruit", "packaged", [("2 ciruelas", 130), ("100 g", 100)]),
    ("Albaricoque", 48, 1.4, 11.1, 0.4, 2.0, "fruit", "packaged", [("2 albaricoques", 100), ("100 g", 100)]),
    ("Frambuesa", 52, 1.2, 11.9, 0.7, 6.5, "fruit", "packaged", [("1 ración", 125), ("100 g", 100)]),
    ("Arándano", 57, 0.7, 14.5, 0.3, 2.4, "fruit", "packaged", [("1 ración", 125), ("100 g", 100)]),
    ("Mora", 43, 1.4, 9.6, 0.5, 5.3, "fruit", "packaged", [("1 ración", 125), ("100 g", 100)]),
    ("Limón", 29, 1.1, 9.3, 0.3, 2.8, "fruit", "packaged", [("1 pieza", 60), ("100 g", 100)]),
    ("Pomelo", 42, 0.8, 10.7, 0.1, 1.6, "fruit", "packaged", [("1 mitad", 150), ("100 g", 100)]),
    ("Caqui", 70, 0.6, 18.6, 0.2, 3.6, "fruit", "packaged", [("1 pieza", 170), ("100 g", 100)]),
    ("Chirimoya", 75, 1.6, 17.7, 0.7, 3.0, "fruit", "packaged", [("1 pieza", 250), ("100 g", 100)]),
    ("Níspero", 47, 0.4, 12.1, 0.2, 1.7, "fruit", "packaged", [("3 nísperos", 120), ("100 g", 100)]),
    ("Membrillo", 57, 0.4, 15.3, 0.1, 1.9, "fruit", "packaged", [("1 pieza", 200), ("100 g", 100)]),
    ("Aguacate", 160, 2.0, 8.5, 14.7, 6.7, "fruit", "packaged", [("1 mitad", 100), ("100 g", 100)]),
    ("Coco", 354, 3.3, 15.2, 33.5, 9.0, "fruit", "packaged", [("1 trozo", 50), ("100 g", 100)]),
    ("Dátil", 277, 1.8, 75.0, 0.2, 6.7, "fruit", "packaged", [("3 dátiles", 30), ("100 g", 100)]),
    ("Maracuyá", 97, 2.2, 23.4, 0.7, 10.4, "fruit", "packaged", [("2 piezas", 60), ("100 g", 100)]),
    ("Lichi", 66, 0.8, 16.5, 0.4, 1.3, "fruit", "packaged", [("5 lichis", 80), ("100 g", 100)]),

    # ===== VERDURAS =====
    ("Tomate", 18, 0.9, 3.9, 0.2, 1.2, "vegetable", "packaged", [("1 pieza mediana", 150), ("100 g", 100)]),
    ("Lechuga", 15, 1.4, 2.9, 0.2, 1.3, "vegetable", "packaged", [("1 ración", 80), ("100 g", 100)]),
    ("Cebolla", 40, 1.1, 9.3, 0.1, 1.7, "vegetable", "packaged", [("1 pieza mediana", 120), ("100 g", 100)]),
    ("Ajo", 149, 6.4, 33.1, 0.5, 2.1, "vegetable", "packaged", [("1 diente", 5), ("100 g", 100)]),
    ("Zanahoria", 41, 0.9, 9.6, 0.2, 2.8, "vegetable", "packaged", [("1 pieza mediana", 80), ("100 g", 100)]),
    ("Pimiento rojo", 31, 1.0, 6.0, 0.3, 2.1, "vegetable", "packaged", [("1 pieza", 160), ("100 g", 100)]),
    ("Pimiento verde", 20, 0.9, 4.6, 0.2, 1.7, "vegetable", "packaged", [("1 pieza", 160), ("100 g", 100)]),
    ("Calabacín", 17, 1.2, 3.1, 0.3, 1.0, "vegetable", "packaged", [("1 pieza mediana", 200), ("100 g", 100)]),
    ("Berenjena", 25, 1.0, 5.9, 0.2, 3.0, "vegetable", "packaged", [("1 pieza mediana", 250), ("100 g", 100)]),
    ("Pepino", 15, 0.7, 3.6, 0.1, 0.5, "vegetable", "packaged", [("1 pieza mediana", 200), ("100 g", 100)]),
    ("Espinacas", 23, 2.9, 3.6, 0.4, 2.2, "vegetable", "packaged", [("1 ración", 100), ("100 g", 100)]),
    ("Brócoli", 34, 2.8, 7.0, 0.4, 2.6, "vegetable", "packaged", [("1 ración", 150), ("100 g", 100)]),
    ("Coliflor", 25, 1.9, 5.0, 0.3, 2.0, "vegetable", "packaged", [("1 ración", 150), ("100 g", 100)]),
    ("Alcachofa", 47, 3.3, 10.5, 0.2, 5.4, "vegetable", "packaged", [("1 pieza mediana", 120), ("100 g", 100)]),
    ("Judía verde", 31, 1.8, 7.0, 0.1, 3.4, "vegetable", "packaged", [("1 ración", 150), ("100 g", 100)]),
    ("Guisante", 81, 5.4, 14.5, 0.4, 5.7, "vegetable", "packaged", [("1 ración", 80), ("100 g", 100)]),
    ("Espárrago verde", 20, 2.2, 3.9, 0.1, 2.1, "vegetable", "packaged", [("5 espárragos", 100), ("100 g", 100)]),
    ("Espárrago blanco", 20, 2.2, 3.1, 0.2, 1.5, "vegetable", "packaged", [("5 espárragos", 100), ("100 g", 100)]),
    ("Champiñón", 22, 3.1, 3.3, 0.3, 1.0, "vegetable", "packaged", [("1 ración", 100), ("100 g", 100)]),
    ("Seta", 28, 2.5, 4.3, 0.3, 1.5, "vegetable", "packaged", [("1 ración", 100), ("100 g", 100)]),
    ("Puerro", 61, 1.5, 14.2, 0.3, 1.8, "vegetable", "packaged", [("1 pieza", 150), ("100 g", 100)]),
    ("Apio", 16, 0.7, 3.0, 0.2, 1.6, "vegetable", "packaged", [("2 tallos", 80), ("100 g", 100)]),
    ("Remolacha", 43, 1.6, 9.6, 0.2, 2.8, "vegetable", "packaged", [("1 pieza mediana", 120), ("100 g", 100)]),
    ("Rábano", 16, 0.7, 3.4, 0.1, 1.6, "vegetable", "packaged", [("5 rabanitos", 50), ("100 g", 100)]),
    ("Col", 25, 1.3, 5.8, 0.1, 2.5, "vegetable", "packaged", [("1 ración", 100), ("100 g", 100)]),
    ("Col lombarda", 31, 1.4, 7.4, 0.2, 2.1, "vegetable", "packaged", [("1 ración", 100), ("100 g", 100)]),
    ("Coles de Bruselas", 43, 3.4, 9.0, 0.3, 3.8, "vegetable", "packaged", [("6 coles", 100), ("100 g", 100)]),
    ("Acelga", 19, 1.8, 3.7, 0.2, 1.6, "vegetable", "packaged", [("1 ración", 150), ("100 g", 100)]),
    ("Boniato", 86, 1.6, 20.1, 0.1, 3.0, "vegetable", "packaged", [("1 pieza mediana", 150), ("100 g", 100)]),
    ("Patata", 77, 2.0, 17.5, 0.1, 2.2, "vegetable", "packaged", [("1 pieza mediana", 170), ("100 g", 100)]),
    ("Calabaza", 26, 1.0, 6.5, 0.1, 0.5, "vegetable", "packaged", [("1 ración", 200), ("100 g", 100)]),
    ("Nabo", 28, 0.9, 6.4, 0.1, 1.8, "vegetable", "packaged", [("1 pieza", 120), ("100 g", 100)]),
    ("Endibia", 17, 1.3, 3.4, 0.1, 3.1, "vegetable", "packaged", [("1 pieza", 100), ("100 g", 100)]),
    ("Canónigos", 21, 2.0, 3.6, 0.4, 1.5, "vegetable", "packaged", [("1 ración", 60), ("100 g", 100)]),
    ("Rúcula", 25, 2.6, 3.7, 0.7, 1.6, "vegetable", "packaged", [("1 ración", 40), ("100 g", 100)]),
    ("Berro", 11, 2.3, 1.3, 0.1, 0.5, "vegetable", "packaged", [("1 manojo", 50), ("100 g", 100)]),

    # ===== CEREALES =====
    ("Arroz blanco", 360, 6.6, 79.3, 0.6, 1.3, "grain", "packaged", [("1 ración cocido", 180), ("100 g crudo", 100)]),
    ("Arroz integral", 350, 7.5, 74.0, 2.7, 3.5, "grain", "packaged", [("1 ración cocido", 180), ("100 g crudo", 100)]),
    ("Pan blanco", 265, 9.0, 49.0, 3.2, 2.7, "grain", "packaged", [("1 rebanada", 30), ("100 g", 100)]),
    ("Pan integral", 247, 10.0, 43.0, 3.4, 6.0, "grain", "packaged", [("1 rebanada", 35), ("100 g", 100)]),
    ("Pan de centeno", 259, 8.5, 48.3, 3.3, 5.8, "grain", "packaged", [("1 rebanada", 35), ("100 g", 100)]),
    ("Baguette", 274, 9.0, 53.0, 2.0, 2.4, "grain", "packaged", [("1 trozo (15 cm)", 60), ("100 g", 100)]),
    ("Pan de molde", 250, 8.0, 47.0, 3.5, 2.5, "grain", "packaged", [("1 rebanada", 28), ("100 g", 100)]),
    ("Pasta (espaguetis)", 355, 12.5, 72.0, 1.5, 3.2, "grain", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Pasta (macarrones)", 355, 12.5, 72.0, 1.5, 3.2, "grain", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Pasta integral", 348, 14.6, 66.3, 2.9, 8.0, "grain", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Avena en copos", 389, 16.9, 66.3, 6.9, 10.6, "grain", "packaged", [("3 cucharadas", 40), ("100 g", 100)]),
    ("Quinoa", 368, 14.1, 64.2, 6.1, 7.0, "grain", "packaged", [("1 ración cocida", 180), ("100 g crudo", 100)]),
    ("Cuscús", 376, 12.8, 77.4, 0.6, 5.0, "grain", "packaged", [("1 ración cocida", 180), ("100 g crudo", 100)]),
    ("Bulgur", 342, 12.3, 75.9, 1.3, 12.5, "grain", "packaged", [("1 ración cocida", 180), ("100 g crudo", 100)]),
    ("Harina de trigo", 364, 10.3, 76.3, 1.0, 2.7, "grain", "packaged", [("1 cucharada", 15), ("100 g", 100)]),
    ("Harina integral", 340, 13.2, 72.0, 2.5, 10.7, "grain", "packaged", [("1 cucharada", 15), ("100 g", 100)]),
    ("Maíz dulce", 86, 3.3, 19.0, 1.4, 2.7, "grain", "packaged", [("1 mazorca", 150), ("100 g", 100)]),
    ("Palomitas de maíz", 387, 12.9, 77.8, 4.5, 14.5, "grain", "packaged", [("1 ración", 30), ("100 g", 100)]),
    ("Tortilla de trigo (wrap)", 312, 8.0, 52.0, 8.0, 2.0, "grain", "packaged", [("1 wrap", 65), ("100 g", 100)]),
    ("Cereales de desayuno", 378, 7.0, 84.0, 1.5, 3.5, "grain", "packaged", [("1 ración", 30), ("100 g", 100)]),
    ("Muesli", 370, 9.5, 66.0, 7.5, 7.5, "grain", "packaged", [("1 ración", 50), ("100 g", 100)]),
    ("Galletas María", 456, 7.0, 74.0, 14.0, 2.0, "grain", "packaged", [("4 galletas", 25), ("100 g", 100)]),
    ("Galletas integrales", 440, 8.0, 68.0, 15.0, 5.5, "grain", "packaged", [("4 galletas", 30), ("100 g", 100)]),
    ("Tostada", 290, 9.5, 55.0, 3.5, 3.0, "grain", "packaged", [("1 tostada", 10), ("100 g", 100)]),
    ("Rosquilla", 403, 7.0, 52.0, 18.0, 1.5, "grain", "packaged", [("1 pieza", 50), ("100 g", 100)]),
    ("Bizcocho casero", 370, 5.5, 55.0, 14.0, 1.0, "grain", "packaged", [("1 porción", 70), ("100 g", 100)]),
    ("Magdalena", 390, 5.0, 52.0, 18.0, 0.8, "grain", "packaged", [("1 pieza", 35), ("100 g", 100)]),
    ("Croissant", 406, 8.2, 45.8, 21.0, 2.3, "grain", "packaged", [("1 pieza", 60), ("100 g", 100)]),
    ("Pan de pita", 275, 9.1, 55.7, 1.2, 2.2, "grain", "packaged", [("1 pieza", 65), ("100 g", 100)]),

    # ===== LEGUMBRES =====
    ("Lentejas", 352, 24.6, 60.1, 1.1, 10.7, "legume", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Garbanzos", 364, 19.3, 60.6, 6.0, 17.4, "legume", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Alubias blancas", 333, 21.4, 60.3, 1.5, 15.2, "legume", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Alubias rojas", 337, 22.5, 60.0, 1.1, 15.2, "legume", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Alubias negras", 341, 21.6, 62.4, 0.9, 15.5, "legume", "packaged", [("1 ración cocida", 200), ("100 g crudo", 100)]),
    ("Habas", 341, 26.1, 58.3, 1.5, 25.0, "legume", "packaged", [("1 ración cocida", 150), ("100 g crudo", 100)]),
    ("Guisantes secos", 352, 24.6, 63.7, 1.2, 25.5, "legume", "packaged", [("1 ración cocida", 180), ("100 g crudo", 100)]),
    ("Soja", 446, 36.5, 30.2, 19.9, 9.3, "legume", "packaged", [("1 ración cocida", 180), ("100 g crudo", 100)]),
    ("Edamame", 122, 11.9, 8.9, 5.2, 5.2, "legume", "packaged", [("1 ración", 100), ("100 g", 100)]),
    ("Cacahuete", 567, 25.8, 16.1, 49.2, 8.5, "legume", "packaged", [("1 puñado", 30), ("100 g", 100)]),
    ("Hummus", 166, 7.9, 14.3, 9.6, 6.0, "legume", "homemade", [("2 cucharadas", 50), ("100 g", 100)]),

    # ===== LÁCTEOS =====
    ("Leche entera", 61, 3.2, 4.7, 3.3, 0.0, "dairy", "packaged", [("1 vaso", 200), ("100 ml", 100)]),
    ("Leche semidesnatada", 46, 3.3, 4.8, 1.6, 0.0, "dairy", "packaged", [("1 vaso", 200), ("100 ml", 100)]),
    ("Leche desnatada", 35, 3.4, 5.0, 0.1, 0.0, "dairy", "packaged", [("1 vaso", 200), ("100 ml", 100)]),
    ("Yogur natural", 61, 3.5, 4.7, 3.3, 0.0, "dairy", "packaged", [("1 unidad", 125), ("100 g", 100)]),
    ("Yogur griego", 97, 9.0, 3.6, 5.0, 0.0, "dairy", "packaged", [("1 unidad", 125), ("100 g", 100)]),
    ("Yogur desnatado", 40, 4.3, 5.6, 0.2, 0.0, "dairy", "packaged", [("1 unidad", 125), ("100 g", 100)]),
    ("Queso manchego curado", 392, 32.0, 0.5, 28.7, 0.0, "dairy", "packaged", [("2 lonchas", 40), ("100 g", 100)]),
    ("Queso manchego semicurado", 370, 28.0, 0.5, 28.0, 0.0, "dairy", "packaged", [("2 lonchas", 40), ("100 g", 100)]),
    ("Queso fresco de Burgos", 174, 11.0, 2.5, 13.5, 0.0, "dairy", "packaged", [("1 ración", 80), ("100 g", 100)]),
    ("Queso de cabra", 364, 21.6, 0.1, 30.5, 0.0, "dairy", "packaged", [("1 ración", 40), ("100 g", 100)]),
    ("Queso Idiazábal", 385, 25.0, 0.5, 31.5, 0.0, "dairy", "packaged", [("2 lonchas", 40), ("100 g", 100)]),
    ("Queso Cabrales", 370, 21.0, 2.0, 31.0, 0.0, "dairy", "packaged", [("1 cuña", 30), ("100 g", 100)]),
    ("Queso Tetilla", 327, 20.0, 0.8, 27.0, 0.0, "dairy", "packaged", [("1 ración", 40), ("100 g", 100)]),
    ("Mozzarella", 280, 22.2, 2.2, 20.3, 0.0, "dairy", "packaged", [("1 bola pequeña", 125), ("100 g", 100)]),
    ("Parmesano", 431, 38.5, 4.1, 28.6, 0.0, "dairy", "packaged", [("1 cucharada rallado", 10), ("100 g", 100)]),
    ("Queso en lonchas", 310, 22.0, 2.0, 24.0, 0.0, "dairy", "packaged", [("1 loncha", 20), ("100 g", 100)]),
    ("Queso crema", 342, 5.9, 4.1, 34.2, 0.0, "dairy", "packaged", [("1 cucharada", 30), ("100 g", 100)]),
    ("Requesón", 98, 11.1, 3.4, 4.3, 0.0, "dairy", "packaged", [("1 ración", 80), ("100 g", 100)]),
    ("Cuajada", 86, 5.3, 7.5, 4.0, 0.0, "dairy", "packaged", [("1 tarrina", 130), ("100 g", 100)]),
    ("Nata líquida", 195, 2.1, 3.7, 19.3, 0.0, "dairy", "packaged", [("1 cucharada", 15), ("100 ml", 100)]),
    ("Nata montada", 257, 2.2, 12.5, 22.2, 0.0, "dairy", "packaged", [("2 cucharadas", 30), ("100 g", 100)]),
    ("Mantequilla", 717, 0.9, 0.1, 81.1, 0.0, "dairy", "packaged", [("1 porción", 12), ("100 g", 100)]),
    ("Kéfir", 65, 3.3, 4.5, 3.5, 0.0, "dairy", "packaged", [("1 vaso", 200), ("100 ml", 100)]),
    ("Leche condensada", 321, 7.9, 54.4, 8.7, 0.0, "dairy", "packaged", [("1 cucharada", 20), ("100 g", 100)]),
    ("Batido de chocolate", 80, 3.0, 12.5, 1.8, 0.5, "dairy", "packaged", [("1 brick", 200), ("100 ml", 100)]),
    ("Helado de vainilla", 207, 3.5, 23.6, 11.0, 0.0, "dairy", "packaged", [("1 bola", 70), ("100 g", 100)]),
    ("Helado de chocolate", 216, 3.8, 28.0, 10.0, 1.5, "dairy", "packaged", [("1 bola", 70), ("100 g", 100)]),
    ("Flan de huevo", 145, 4.5, 22.0, 4.5, 0.0, "dairy", "packaged", [("1 flan", 110), ("100 g", 100)]),
    ("Natillas", 122, 3.8, 17.5, 4.2, 0.0, "dairy", "packaged", [("1 tarrina", 125), ("100 g", 100)]),

    # ===== CARNES =====
    ("Ternera (solomillo)", 129, 21.0, 0.0, 4.5, 0.0, "meat", "packaged", [("1 filete", 150), ("100 g", 100)]),
    ("Ternera (entrecot)", 199, 19.5, 0.0, 13.0, 0.0, "meat", "packaged", [("1 pieza", 200), ("100 g", 100)]),
    ("Ternera picada", 176, 19.0, 0.0, 10.5, 0.0, "meat", "packaged", [("1 ración", 150), ("100 g", 100)]),
    ("Cerdo (lomo)", 143, 22.2, 0.0, 5.7, 0.0, "meat", "packaged", [("1 filete", 120), ("100 g", 100)]),
    ("Cerdo (costilla)", 277, 15.5, 0.0, 23.4, 0.0, "meat", "packaged", [("1 ración", 200), ("100 g", 100)]),
    ("Cerdo (solomillo)", 120, 21.5, 0.0, 3.5, 0.0, "meat", "packaged", [("1 pieza", 150), ("100 g", 100)]),
    ("Cerdo picado", 212, 17.0, 0.0, 15.5, 0.0, "meat", "packaged", [("1 ración", 150), ("100 g", 100)]),
    ("Cordero (chuleta)", 225, 17.0, 0.0, 17.0, 0.0, "meat", "packaged", [("2 chuletas", 150), ("100 g", 100)]),
    ("Cordero (pierna)", 195, 19.0, 0.0, 13.0, 0.0, "meat", "packaged", [("1 ración", 180), ("100 g", 100)]),
    ("Conejo", 136, 21.0, 0.0, 5.5, 0.0, "meat", "packaged", [("1 ración", 200), ("100 g", 100)]),
    ("Jamón serrano", 241, 31.0, 0.0, 12.5, 0.0, "meat", "packaged", [("2 lonchas", 30), ("100 g", 100)]),
    ("Jamón ibérico", 350, 28.0, 0.0, 26.0, 0.0, "meat", "packaged", [("2 lonchas", 30), ("100 g", 100)]),
    ("Lomo embuchado", 208, 33.0, 1.0, 8.0, 0.0, "meat", "packaged", [("4 lonchas", 30), ("100 g", 100)]),
    ("Chorizo", 455, 22.0, 2.0, 40.0, 0.0, "meat", "packaged", [("3 rodajas", 30), ("100 g", 100)]),
    ("Salchichón", 454, 25.8, 1.8, 38.1, 0.0, "meat", "packaged", [("3 rodajas", 30), ("100 g", 100)]),
    ("Morcilla", 306, 14.5, 12.0, 23.0, 0.5, "meat", "packaged", [("1 rodaja gruesa", 60), ("100 g", 100)]),
    ("Fuet", 460, 26.0, 3.0, 38.0, 0.0, "meat", "packaged", [("5 rodajas", 25), ("100 g", 100)]),
    ("Sobrasada", 480, 17.0, 3.5, 45.0, 0.0, "meat", "packaged", [("1 cucharada", 20), ("100 g", 100)]),
    ("Bacon", 458, 12.0, 0.5, 45.0, 0.0, "meat", "packaged", [("2 lonchas", 30), ("100 g", 100)]),
    ("Salchicha de cerdo", 301, 12.0, 2.0, 27.0, 0.0, "meat", "packaged", [("1 salchicha", 50), ("100 g", 100)]),
    ("Salchicha de pollo", 176, 15.0, 3.0, 11.5, 0.0, "meat", "packaged", [("1 salchicha", 50), ("100 g", 100)]),
    ("Chistorra", 385, 18.0, 2.5, 34.0, 0.0, "meat", "packaged", [("1 ración", 80), ("100 g", 100)]),
    ("Cecina", 215, 37.0, 0.0, 7.0, 0.0, "meat", "packaged", [("3 lonchas", 30), ("100 g", 100)]),
    ("Butifarra", 310, 15.0, 1.5, 27.0, 0.0, "meat", "packaged", [("1 pieza", 120), ("100 g", 100)]),

    # ===== AVES =====
    ("Pollo (pechuga)", 165, 31.0, 0.0, 3.6, 0.0, "poultry", "packaged", [("1 pechuga", 200), ("100 g", 100)]),
    ("Pollo (muslo)", 209, 20.0, 0.0, 14.0, 0.0, "poultry", "packaged", [("1 muslo", 150), ("100 g", 100)]),
    ("Pollo (ala)", 203, 18.3, 0.0, 14.0, 0.0, "poultry", "packaged", [("2 alas", 100), ("100 g", 100)]),
    ("Pollo entero asado", 190, 25.0, 0.0, 9.5, 0.0, "poultry", "homemade", [("1 ración", 200), ("100 g", 100)]),
    ("Pavo (pechuga)", 135, 30.0, 0.0, 1.0, 0.0, "poultry", "packaged", [("1 filete", 150), ("100 g", 100)]),
    ("Pavo (muslo)", 170, 27.0, 0.0, 6.5, 0.0, "poultry", "packaged", [("1 ración", 180), ("100 g", 100)]),
    ("Fiambre de pavo", 104, 17.0, 2.5, 2.8, 0.0, "poultry", "packaged", [("2 lonchas", 40), ("100 g", 100)]),
    ("Fiambre de pollo", 120, 16.0, 3.0, 4.5, 0.0, "poultry", "packaged", [("2 lonchas", 40), ("100 g", 100)]),
    ("Codorniz", 192, 25.0, 0.0, 10.0, 0.0, "poultry", "packaged", [("1 pieza", 120), ("100 g", 100)]),

    # ===== PESCADO Y MARISCO =====
    ("Merluza", 86, 17.2, 0.0, 1.8, 0.0, "fish_seafood", "packaged", [("1 rodaja", 150), ("100 g", 100)]),
    ("Bacalao fresco", 82, 17.8, 0.0, 0.7, 0.0, "fish_seafood", "packaged", [("1 lonja", 150), ("100 g", 100)]),
    ("Bacalao salado", 136, 29.0, 0.0, 1.2, 0.0, "fish_seafood", "packaged", [("1 trozo desalado", 150), ("100 g", 100)]),
    ("Salmón", 208, 20.4, 0.0, 13.4, 0.0, "fish_seafood", "packaged", [("1 filete", 150), ("100 g", 100)]),
    ("Atún fresco", 130, 29.0, 0.0, 1.0, 0.0, "fish_seafood", "packaged", [("1 rodaja", 150), ("100 g", 100)]),
    ("Atún en lata (aceite)", 198, 29.1, 0.0, 8.2, 0.0, "fish_seafood", "packaged", [("1 lata escurrida", 80), ("100 g", 100)]),
    ("Atún en lata (natural)", 103, 23.6, 0.0, 0.8, 0.0, "fish_seafood", "packaged", [("1 lata escurrida", 80), ("100 g", 100)]),
    ("Sardina fresca", 174, 20.9, 0.0, 9.4, 0.0, "fish_seafood", "packaged", [("3 sardinas", 120), ("100 g", 100)]),
    ("Sardina en lata", 208, 24.6, 0.0, 11.5, 0.0, "fish_seafood", "packaged", [("1 lata", 85), ("100 g", 100)]),
    ("Boquerón", 131, 17.6, 0.0, 6.3, 0.0, "fish_seafood", "packaged", [("6 boquerones", 100), ("100 g", 100)]),
    ("Anchoa", 210, 28.9, 0.0, 9.7, 0.0, "fish_seafood", "packaged", [("5 filetes", 25), ("100 g", 100)]),
    ("Dorada", 96, 19.7, 0.0, 1.6, 0.0, "fish_seafood", "packaged", [("1 pieza", 250), ("100 g", 100)]),
    ("Lubina", 97, 18.4, 0.0, 2.5, 0.0, "fish_seafood", "packaged", [("1 pieza", 250), ("100 g", 100)]),
    ("Rape", 76, 16.5, 0.0, 0.7, 0.0, "fish_seafood", "packaged", [("1 rodaja", 150), ("100 g", 100)]),
    ("Lenguado", 86, 17.5, 0.0, 1.4, 0.0, "fish_seafood", "packaged", [("1 pieza", 200), ("100 g", 100)]),
    ("Trucha", 148, 20.5, 0.0, 6.6, 0.0, "fish_seafood", "packaged", [("1 pieza", 200), ("100 g", 100)]),
    ("Caballa", 205, 18.6, 0.0, 13.9, 0.0, "fish_seafood", "packaged", [("1 pieza", 200), ("100 g", 100)]),
    ("Pez espada", 121, 19.7, 0.0, 4.4, 0.0, "fish_seafood", "packaged", [("1 rodaja", 150), ("100 g", 100)]),
    ("Rodaballo", 95, 16.3, 0.0, 3.6, 0.0, "fish_seafood", "packaged", [("1 ración", 200), ("100 g", 100)]),
    ("Sepia", 79, 16.2, 0.8, 0.7, 0.0, "fish_seafood", "packaged", [("1 pieza", 200), ("100 g", 100)]),
    ("Calamar", 92, 15.6, 3.1, 1.4, 0.0, "fish_seafood", "packaged", [("1 ración", 150), ("100 g", 100)]),
    ("Pulpo", 82, 14.9, 2.2, 1.0, 0.0, "fish_seafood", "packaged", [("1 ración", 200), ("100 g", 100)]),
    ("Mejillón", 86, 11.9, 3.7, 2.2, 0.0, "fish_seafood", "packaged", [("12 mejillones", 150), ("100 g", 100)]),
    ("Gamba", 106, 20.3, 1.5, 1.7, 0.0, "fish_seafood", "packaged", [("8 gambas", 100), ("100 g", 100)]),
    ("Langostino", 90, 18.0, 0.9, 1.3, 0.0, "fish_seafood", "packaged", [("6 langostinos", 120), ("100 g", 100)]),
    ("Cigala", 90, 18.5, 0.5, 1.5, 0.0, "fish_seafood", "packaged", [("3 cigalas", 120), ("100 g", 100)]),
    ("Almeja", 74, 12.8, 2.6, 1.0, 0.0, "fish_seafood", "packaged", [("12 almejas", 100), ("100 g", 100)]),
    ("Berberecho", 79, 13.5, 3.0, 1.0, 0.0, "fish_seafood", "packaged", [("1 lata", 80), ("100 g", 100)]),
    ("Surimi (palitos de cangrejo)", 95, 7.0, 13.0, 1.0, 0.0, "fish_seafood", "packaged", [("4 palitos", 60), ("100 g", 100)]),

    # ===== HUEVOS =====
    ("Huevo de gallina (entero)", 155, 12.6, 1.1, 11.3, 0.0, "egg", "packaged", [("1 huevo (L)", 60), ("100 g", 100)]),
    ("Huevo de gallina (clara)", 52, 10.9, 0.7, 0.2, 0.0, "egg", "packaged", [("1 clara", 33), ("100 g", 100)]),
    ("Huevo de gallina (yema)", 322, 16.0, 3.6, 27.0, 0.0, "egg", "packaged", [("1 yema", 17), ("100 g", 100)]),
    ("Huevo de codorniz", 158, 13.1, 0.4, 11.1, 0.0, "egg", "packaged", [("3 huevos", 30), ("100 g", 100)]),

    # ===== FRUTOS SECOS =====
    ("Almendra", 579, 21.2, 21.6, 49.9, 12.5, "nut_seed", "packaged", [("1 puñado", 25), ("100 g", 100)]),
    ("Nuez", 654, 15.2, 13.7, 65.2, 6.7, "nut_seed", "packaged", [("5 nueces", 25), ("100 g", 100)]),
    ("Avellana", 628, 15.0, 16.7, 60.8, 9.7, "nut_seed", "packaged", [("1 puñado", 25), ("100 g", 100)]),
    ("Pistacho", 562, 20.2, 27.2, 45.3, 10.6, "nut_seed", "packaged", [("1 puñado", 30), ("100 g", 100)]),
    ("Anacardo", 553, 18.2, 30.2, 43.9, 3.3, "nut_seed", "packaged", [("1 puñado", 30), ("100 g", 100)]),
    ("Piñón", 673, 13.7, 13.1, 68.4, 3.7, "nut_seed", "packaged", [("1 cucharada", 10), ("100 g", 100)]),
    ("Semilla de girasol", 584, 20.8, 20.0, 51.5, 8.6, "nut_seed", "packaged", [("1 puñado", 20), ("100 g", 100)]),
    ("Semilla de calabaza", 559, 30.2, 10.7, 49.1, 6.0, "nut_seed", "packaged", [("1 puñado", 20), ("100 g", 100)]),
    ("Semilla de chía", 486, 16.5, 42.1, 30.7, 34.4, "nut_seed", "packaged", [("1 cucharada", 12), ("100 g", 100)]),
    ("Semilla de lino", 534, 18.3, 28.9, 42.2, 27.3, "nut_seed", "packaged", [("1 cucharada", 10), ("100 g", 100)]),
    ("Semilla de sésamo", 573, 17.7, 23.5, 49.7, 11.8, "nut_seed", "packaged", [("1 cucharada", 9), ("100 g", 100)]),
    ("Nuez de macadamia", 718, 7.9, 13.8, 75.8, 8.6, "nut_seed", "packaged", [("5 nueces", 15), ("100 g", 100)]),
    ("Nuez de Brasil", 659, 14.3, 11.7, 67.1, 7.5, "nut_seed", "packaged", [("3 nueces", 15), ("100 g", 100)]),
    ("Mix de frutos secos", 607, 17.0, 21.0, 54.0, 7.0, "nut_seed", "packaged", [("1 puñado", 30), ("100 g", 100)]),

    # ===== ACEITES =====
    ("Aceite de oliva virgen extra", 884, 0.0, 0.0, 100.0, 0.0, "oil_fat", "packaged", [("1 cucharada", 13), ("100 ml", 100)]),
    ("Aceite de oliva suave", 884, 0.0, 0.0, 100.0, 0.0, "oil_fat", "packaged", [("1 cucharada", 13), ("100 ml", 100)]),
    ("Aceite de girasol", 884, 0.0, 0.0, 100.0, 0.0, "oil_fat", "packaged", [("1 cucharada", 13), ("100 ml", 100)]),
    ("Aceite de coco", 862, 0.0, 0.0, 99.1, 0.0, "oil_fat", "packaged", [("1 cucharada", 14), ("100 ml", 100)]),
    ("Margarina", 717, 0.2, 0.7, 80.7, 0.0, "oil_fat", "packaged", [("1 porción", 12), ("100 g", 100)]),
    ("Manteca de cerdo", 902, 0.0, 0.0, 100.0, 0.0, "oil_fat", "packaged", [("1 cucharada", 13), ("100 g", 100)]),

    # ===== DULCES =====
    ("Chocolate negro 70%", 530, 7.8, 46.3, 34.0, 7.0, "sweet", "packaged", [("2 onzas", 20), ("100 g", 100)]),
    ("Chocolate con leche", 535, 7.6, 59.4, 29.7, 2.0, "sweet", "packaged", [("2 onzas", 20), ("100 g", 100)]),
    ("Chocolate blanco", 539, 5.9, 59.2, 32.1, 0.0, "sweet", "packaged", [("2 onzas", 20), ("100 g", 100)]),
    ("Azúcar blanco", 387, 0.0, 100.0, 0.0, 0.0, "sweet", "packaged", [("1 cucharadita", 5), ("100 g", 100)]),
    ("Azúcar moreno", 380, 0.1, 98.1, 0.0, 0.0, "sweet", "packaged", [("1 cucharadita", 5), ("100 g", 100)]),
    ("Miel", 304, 0.3, 82.4, 0.0, 0.0, "sweet", "packaged", [("1 cucharada", 21), ("100 g", 100)]),
    ("Mermelada de fresa", 250, 0.4, 60.0, 0.1, 1.0, "sweet", "packaged", [("1 cucharada", 20), ("100 g", 100)]),
    ("Mermelada de naranja", 246, 0.3, 59.5, 0.1, 0.8, "sweet", "packaged", [("1 cucharada", 20), ("100 g", 100)]),
    ("Nocilla/Nutella", 539, 6.3, 57.5, 31.6, 3.4, "sweet", "packaged", [("1 cucharada", 15), ("100 g", 100)]),
    ("Turrón blando", 490, 13.0, 42.0, 31.0, 4.0, "sweet", "packaged", [("1 porción", 30), ("100 g", 100)]),
    ("Turrón duro", 530, 14.0, 40.0, 36.0, 4.0, "sweet", "packaged", [("1 porción", 30), ("100 g", 100)]),
    ("Polvorón", 480, 7.0, 55.0, 26.0, 1.5, "sweet", "packaged", [("1 pieza", 30), ("100 g", 100)]),
    ("Churros", 362, 4.6, 40.0, 20.0, 1.5, "sweet", "homemade", [("4 churros", 100), ("100 g", 100)]),
    ("Donut", 421, 5.0, 48.0, 23.0, 1.5, "sweet", "packaged", [("1 pieza", 55), ("100 g", 100)]),
    ("Palmera de chocolate", 450, 5.0, 50.0, 25.0, 1.5, "sweet", "packaged", [("1 pieza", 90), ("100 g", 100)]),
    ("Arroz con leche", 130, 3.5, 20.0, 3.8, 0.2, "sweet", "homemade", [("1 ración", 200), ("100 g", 100)]),
    ("Torrija", 280, 5.5, 35.0, 13.0, 0.5, "sweet", "homemade", [("1 pieza", 80), ("100 g", 100)]),
    ("Crema catalana", 225, 4.0, 25.0, 12.0, 0.0, "sweet", "homemade", [("1 ración", 150), ("100 g", 100)]),
    ("Tarta de queso", 321, 6.0, 25.0, 22.0, 0.3, "sweet", "homemade", [("1 porción", 120), ("100 g", 100)]),
    ("Brownie", 405, 5.0, 50.0, 21.0, 2.0, "sweet", "homemade", [("1 trozo", 60), ("100 g", 100)]),

    # ===== BEBIDAS =====
    ("Café solo", 2, 0.1, 0.0, 0.0, 0.0, "beverage", "packaged", [("1 taza", 40), ("100 ml", 100)]),
    ("Café con leche", 22, 1.2, 1.8, 1.0, 0.0, "beverage", "packaged", [("1 taza", 200), ("100 ml", 100)]),
    ("Cortado", 12, 0.8, 0.9, 0.5, 0.0, "beverage", "packaged", [("1 cortado", 100), ("100 ml", 100)]),
    ("Té verde", 1, 0.0, 0.2, 0.0, 0.0, "beverage", "packaged", [("1 taza", 240), ("100 ml", 100)]),
    ("Té negro", 1, 0.0, 0.3, 0.0, 0.0, "beverage", "packaged", [("1 taza", 240), ("100 ml", 100)]),
    ("Manzanilla", 1, 0.0, 0.2, 0.0, 0.0, "beverage", "packaged", [("1 taza", 240), ("100 ml", 100)]),
    ("Zumo de naranja natural", 45, 0.7, 10.4, 0.2, 0.2, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Zumo de manzana", 46, 0.1, 11.3, 0.1, 0.2, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Zumo de piña", 53, 0.4, 12.9, 0.1, 0.2, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Zumo de tomate", 17, 0.8, 3.5, 0.1, 0.5, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Coca-Cola", 42, 0.0, 10.6, 0.0, 0.0, "beverage", "packaged", [("1 lata", 330), ("100 ml", 100)]),
    ("Coca-Cola Zero", 0, 0.0, 0.0, 0.0, 0.0, "beverage", "packaged", [("1 lata", 330), ("100 ml", 100)]),
    ("Fanta naranja", 38, 0.0, 9.3, 0.0, 0.0, "beverage", "packaged", [("1 lata", 330), ("100 ml", 100)]),
    ("Agua con gas", 0, 0.0, 0.0, 0.0, 0.0, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Cerveza (caña)", 43, 0.5, 3.6, 0.0, 0.0, "beverage", "packaged", [("1 caña", 200), ("100 ml", 100)]),
    ("Cerveza sin alcohol", 24, 0.3, 5.3, 0.0, 0.0, "beverage", "packaged", [("1 botellín", 330), ("100 ml", 100)]),
    ("Vino tinto", 85, 0.1, 2.6, 0.0, 0.0, "beverage", "packaged", [("1 copa", 150), ("100 ml", 100)]),
    ("Vino blanco", 82, 0.1, 2.6, 0.0, 0.0, "beverage", "packaged", [("1 copa", 150), ("100 ml", 100)]),
    ("Tinto de verano", 45, 0.1, 6.5, 0.0, 0.0, "beverage", "packaged", [("1 vaso", 300), ("100 ml", 100)]),
    ("Sangría", 72, 0.1, 9.0, 0.0, 0.1, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Horchata", 68, 0.8, 12.0, 2.0, 0.5, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Leche de almendras", 17, 0.6, 0.6, 1.1, 0.3, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Leche de avena", 44, 0.3, 9.0, 0.5, 0.8, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Leche de soja", 33, 2.8, 1.2, 1.8, 0.4, "beverage", "packaged", [("1 vaso", 250), ("100 ml", 100)]),
    ("Batido de fresa", 70, 2.8, 11.0, 1.5, 0.2, "beverage", "packaged", [("1 brick", 200), ("100 ml", 100)]),
    ("Aquarius", 24, 0.0, 5.8, 0.0, 0.0, "beverage", "packaged", [("1 botella", 500), ("100 ml", 100)]),
    ("Red Bull", 45, 0.0, 11.0, 0.0, 0.0, "beverage", "packaged", [("1 lata", 250), ("100 ml", 100)]),
    ("Gazpacho (bebido)", 35, 0.7, 3.5, 2.0, 0.5, "beverage", "homemade", [("1 vaso", 250), ("100 ml", 100)]),
    ("Caldo de pollo", 7, 0.5, 0.8, 0.2, 0.0, "beverage", "homemade", [("1 tazón", 300), ("100 ml", 100)]),

    # ===== CONDIMENTOS =====
    ("Sal", 0, 0.0, 0.0, 0.0, 0.0, "condiment", "packaged", [("1 pizca", 1), ("100 g", 100)]),
    ("Pimienta negra", 251, 10.4, 63.9, 3.3, 25.3, "condiment", "packaged", [("1 pizca", 0.5), ("100 g", 100)]),
    ("Pimentón de la Vera (dulce)", 282, 14.1, 53.9, 13.0, 34.9, "condiment", "packaged", [("1 cucharadita", 3), ("100 g", 100)]),
    ("Pimentón picante", 282, 14.1, 53.9, 13.0, 34.9, "condiment", "packaged", [("1 cucharadita", 3), ("100 g", 100)]),
    ("Comino", 375, 17.8, 44.2, 22.3, 10.5, "condiment", "packaged", [("1 cucharadita", 2), ("100 g", 100)]),
    ("Azafrán", 310, 11.4, 65.4, 5.9, 3.9, "condiment", "packaged", [("1 pizca", 0.1), ("100 g", 100)]),
    ("Orégano", 265, 9.0, 68.9, 4.3, 42.5, "condiment", "packaged", [("1 cucharadita", 1.5), ("100 g", 100)]),
    ("Perejil fresco", 36, 3.0, 6.3, 0.8, 3.3, "condiment", "packaged", [("1 cucharada picado", 4), ("100 g", 100)]),
    ("Cilantro fresco", 23, 2.1, 3.7, 0.5, 2.8, "condiment", "packaged", [("1 cucharada picado", 4), ("100 g", 100)]),
    ("Albahaca fresca", 23, 3.2, 2.7, 0.6, 1.6, "condiment", "packaged", [("5 hojas", 3), ("100 g", 100)]),
    ("Vinagre de vino", 19, 0.0, 0.3, 0.0, 0.0, "condiment", "packaged", [("1 cucharada", 15), ("100 ml", 100)]),
    ("Vinagre de Jerez", 20, 0.1, 0.8, 0.0, 0.0, "condiment", "packaged", [("1 cucharada", 15), ("100 ml", 100)]),
    ("Salsa de tomate frito", 75, 1.3, 9.5, 3.5, 1.5, "condiment", "packaged", [("2 cucharadas", 40), ("100 g", 100)]),
    ("Mayonesa", 680, 1.0, 0.6, 75.0, 0.0, "condiment", "packaged", [("1 cucharada", 15), ("100 g", 100)]),
    ("Ketchup", 112, 1.7, 27.4, 0.1, 0.3, "condiment", "packaged", [("1 cucharada", 17), ("100 g", 100)]),
    ("Mostaza", 60, 4.4, 5.3, 3.3, 4.0, "condiment", "packaged", [("1 cucharadita", 5), ("100 g", 100)]),
    ("Alioli", 680, 1.5, 1.0, 74.0, 0.0, "condiment", "homemade", [("1 cucharada", 15), ("100 g", 100)]),
    ("Romesco", 190, 3.5, 8.0, 16.0, 2.5, "condiment", "homemade", [("2 cucharadas", 40), ("100 g", 100)]),
    ("Salsa brava", 70, 1.0, 8.0, 3.5, 1.0, "condiment", "homemade", [("2 cucharadas", 40), ("100 g", 100)]),
    ("Mojo picón", 120, 1.5, 6.0, 10.0, 2.0, "condiment", "homemade", [("2 cucharadas", 30), ("100 g", 100)]),
    ("Sofrito casero", 65, 1.2, 6.5, 3.8, 1.5, "condiment", "homemade", [("2 cucharadas", 40), ("100 g", 100)]),

    # ===== PLATOS PREPARADOS =====
    ("Tortilla española (patata)", 120, 6.5, 9.0, 6.5, 1.0, "prepared_meal", "homemade", [("1 pincho", 120), ("100 g", 100)]),
    ("Tortilla francesa", 153, 11.0, 0.5, 12.0, 0.0, "prepared_meal", "homemade", [("1 tortilla (2 huevos)", 100), ("100 g", 100)]),
    ("Paella valenciana", 145, 8.5, 17.0, 4.5, 1.0, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
    ("Paella mixta", 150, 9.0, 17.5, 5.0, 1.0, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
    ("Paella de marisco", 130, 10.0, 16.0, 3.0, 0.5, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
    ("Arroz negro", 140, 8.0, 18.0, 4.0, 0.5, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Arroz a banda", 155, 7.0, 20.0, 5.5, 0.5, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Arroz caldoso con bogavante", 110, 8.0, 12.0, 3.5, 0.3, "prepared_meal", "homemade", [("1 plato", 400), ("100 g", 100)]),
    ("Fideuá", 160, 8.5, 19.0, 5.5, 1.0, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Gazpacho andaluz", 44, 0.8, 4.2, 2.8, 0.7, "prepared_meal", "homemade", [("1 tazón", 300), ("100 g", 100)]),
    ("Salmorejo cordobés", 85, 2.5, 6.0, 5.5, 0.8, "prepared_meal", "homemade", [("1 tazón", 300), ("100 g", 100)]),
    ("Ajoblanco", 95, 2.0, 5.0, 7.5, 1.0, "prepared_meal", "homemade", [("1 tazón", 300), ("100 g", 100)]),
    ("Cocido madrileño", 115, 8.0, 8.5, 5.5, 2.5, "prepared_meal", "homemade", [("1 plato", 400), ("100 g", 100)]),
    ("Fabada asturiana", 150, 9.0, 12.0, 7.5, 4.5, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
    ("Pote gallego", 95, 5.5, 8.0, 4.5, 3.0, "prepared_meal", "homemade", [("1 plato", 400), ("100 g", 100)]),
    ("Lentejas con chorizo", 130, 8.5, 14.0, 4.5, 4.0, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
    ("Potaje de garbanzos", 115, 6.5, 13.5, 3.5, 4.5, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
    ("Migas", 230, 5.0, 28.0, 11.0, 1.5, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Pisto manchego", 55, 1.5, 6.5, 2.5, 2.0, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Escalivada", 45, 1.0, 5.5, 2.0, 2.0, "prepared_meal", "homemade", [("1 ración", 200), ("100 g", 100)]),
    ("Patatas bravas", 170, 2.5, 22.0, 8.0, 2.0, "prepared_meal", "homemade", [("1 ración", 200), ("100 g", 100)]),
    ("Patatas a lo pobre", 145, 2.0, 18.0, 7.5, 1.8, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Croquetas de jamón", 225, 7.5, 18.0, 13.5, 0.5, "prepared_meal", "homemade", [("3 croquetas", 90), ("100 g", 100)]),
    ("Croquetas de bacalao", 210, 8.0, 17.0, 12.0, 0.5, "prepared_meal", "homemade", [("3 croquetas", 90), ("100 g", 100)]),
    ("Empanada gallega", 260, 8.0, 28.0, 13.0, 1.0, "prepared_meal", "homemade", [("1 trozo", 150), ("100 g", 100)]),
    ("Ensaladilla rusa", 155, 3.5, 10.0, 11.0, 1.5, "prepared_meal", "homemade", [("1 ración", 200), ("100 g", 100)]),
    ("Ensalada mixta", 35, 1.5, 3.5, 1.5, 1.5, "prepared_meal", "homemade", [("1 plato", 250), ("100 g", 100)]),
    ("Ensalada César", 127, 7.0, 5.0, 9.0, 1.0, "prepared_meal", "homemade", [("1 plato", 250), ("100 g", 100)]),
    ("Pimientos de padrón", 75, 1.5, 4.0, 5.5, 1.5, "prepared_meal", "homemade", [("1 ración", 120), ("100 g", 100)]),
    ("Calamares a la romana", 195, 9.0, 15.0, 10.5, 0.5, "prepared_meal", "homemade", [("1 ración", 200), ("100 g", 100)]),
    ("Gambas al ajillo", 145, 15.0, 2.0, 8.5, 0.0, "prepared_meal", "homemade", [("1 ración", 150), ("100 g", 100)]),
    ("Pulpo a la gallega", 110, 14.0, 4.0, 4.5, 0.5, "prepared_meal", "homemade", [("1 ración", 200), ("100 g", 100)]),
    ("Huevos rotos con jamón", 185, 11.0, 12.0, 10.5, 1.5, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Revuelto de setas", 135, 8.5, 2.5, 10.0, 1.0, "prepared_meal", "homemade", [("1 ración", 180), ("100 g", 100)]),
    ("Pimientos rellenos", 110, 6.5, 7.5, 6.0, 1.5, "prepared_meal", "homemade", [("2 pimientos", 250), ("100 g", 100)]),
    ("Berenjenas rellenas", 95, 4.5, 8.0, 5.0, 2.5, "prepared_meal", "homemade", [("1 berenjena", 250), ("100 g", 100)]),
    ("Albóndigas en salsa", 165, 12.0, 8.0, 9.5, 1.0, "prepared_meal", "homemade", [("5 albóndigas", 200), ("100 g", 100)]),
    ("Pollo al ajillo", 170, 22.0, 2.0, 8.0, 0.3, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Pollo asado con patatas", 155, 16.0, 10.0, 5.5, 1.0, "prepared_meal", "homemade", [("1 ración", 300), ("100 g", 100)]),
    ("Estofado de ternera", 120, 13.0, 5.5, 5.0, 1.5, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Rabo de toro", 180, 18.0, 3.0, 10.5, 0.5, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Callos a la madrileña", 110, 12.0, 3.5, 5.5, 0.5, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Merluza en salsa verde", 95, 14.0, 3.0, 3.0, 0.3, "prepared_meal", "homemade", [("1 rodaja con salsa", 250), ("100 g", 100)]),
    ("Bacalao al pil-pil", 160, 17.0, 1.5, 9.5, 0.0, "prepared_meal", "homemade", [("1 lonja con salsa", 200), ("100 g", 100)]),
    ("Bacalao a la vizcaína", 135, 15.0, 5.0, 6.0, 1.0, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Salmón a la plancha", 200, 20.0, 0.0, 13.0, 0.0, "prepared_meal", "homemade", [("1 filete", 150), ("100 g", 100)]),
    ("Sardinas asadas", 185, 21.0, 0.0, 10.5, 0.0, "prepared_meal", "homemade", [("4 sardinas", 160), ("100 g", 100)]),
    ("Sepia a la plancha", 85, 17.0, 0.5, 1.5, 0.0, "prepared_meal", "homemade", [("1 pieza", 200), ("100 g", 100)]),
    ("Flamenquín cordobés", 280, 16.0, 15.0, 18.0, 0.5, "prepared_meal", "homemade", [("1 pieza", 150), ("100 g", 100)]),
    ("Bocadillo de jamón serrano", 245, 13.0, 30.0, 8.0, 1.5, "prepared_meal", "homemade", [("1 bocadillo", 170), ("100 g", 100)]),
    ("Bocadillo de tortilla", 220, 8.0, 28.0, 8.5, 1.0, "prepared_meal", "homemade", [("1 bocadillo", 200), ("100 g", 100)]),
    ("Bocadillo de calamares", 235, 8.5, 30.0, 9.0, 1.0, "prepared_meal", "homemade", [("1 bocadillo", 220), ("100 g", 100)]),
    ("Bocadillo de lomo con pimientos", 230, 14.0, 27.0, 7.5, 1.5, "prepared_meal", "homemade", [("1 bocadillo", 200), ("100 g", 100)]),
    ("Pincho de tortilla", 130, 6.5, 10.0, 7.0, 0.8, "prepared_meal", "homemade", [("1 pincho", 80), ("100 g", 100)]),
    ("Pan con tomate (pa amb tomàquet)", 180, 4.5, 27.0, 6.5, 2.0, "prepared_meal", "homemade", [("1 rebanada", 60), ("100 g", 100)]),
    ("Tostada con aceite y tomate", 200, 4.5, 25.0, 9.5, 2.0, "prepared_meal", "homemade", [("1 tostada", 80), ("100 g", 100)]),
    ("Tostada con aguacate", 210, 4.0, 18.0, 13.5, 3.5, "prepared_meal", "homemade", [("1 tostada", 100), ("100 g", 100)]),
    ("Sandwich mixto", 260, 12.0, 25.0, 12.5, 1.0, "prepared_meal", "homemade", [("1 sandwich", 130), ("100 g", 100)]),
    ("Bikini (sandwich catalán)", 270, 13.0, 24.0, 13.5, 1.0, "prepared_meal", "homemade", [("1 bikini", 130), ("100 g", 100)]),
    ("Pizza margarita", 240, 10.0, 30.0, 9.0, 2.0, "prepared_meal", "packaged", [("1 porción", 150), ("100 g", 100)]),
    ("Pizza jamón y queso", 255, 12.0, 28.0, 11.0, 1.5, "prepared_meal", "packaged", [("1 porción", 150), ("100 g", 100)]),
    ("Hamburguesa con pan", 265, 14.0, 24.0, 13.0, 1.5, "prepared_meal", "homemade", [("1 hamburguesa", 200), ("100 g", 100)]),
    ("Nuggets de pollo", 296, 15.0, 18.0, 18.0, 1.0, "prepared_meal", "packaged", [("6 nuggets", 100), ("100 g", 100)]),
    ("Patatas fritas", 312, 3.4, 41.4, 15.0, 3.8, "prepared_meal", "homemade", [("1 ración", 150), ("100 g", 100)]),
    ("Wrap de pollo", 195, 12.0, 20.0, 7.5, 1.5, "prepared_meal", "homemade", [("1 wrap", 200), ("100 g", 100)]),
    ("Sopa castellana (sopa de ajo)", 65, 2.5, 7.5, 2.5, 0.5, "prepared_meal", "homemade", [("1 tazón", 350), ("100 g", 100)]),
    ("Sopa de cocido", 35, 2.0, 3.5, 1.5, 0.3, "prepared_meal", "homemade", [("1 tazón", 350), ("100 g", 100)]),
    ("Crema de calabacín", 40, 1.5, 4.0, 2.0, 1.0, "prepared_meal", "homemade", [("1 tazón", 300), ("100 g", 100)]),
    ("Crema de calabaza", 45, 1.0, 6.0, 2.0, 1.0, "prepared_meal", "homemade", [("1 tazón", 300), ("100 g", 100)]),
    ("Crema de zanahoria", 42, 1.0, 5.5, 1.8, 1.5, "prepared_meal", "homemade", [("1 tazón", 300), ("100 g", 100)]),
    ("Vichyssoise", 55, 1.5, 6.0, 2.8, 0.5, "prepared_meal", "homemade", [("1 tazón", 300), ("100 g", 100)]),
    ("Macarrones con tomate", 148, 5.5, 22.0, 4.0, 1.5, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Espaguetis carbonara", 190, 8.0, 22.0, 8.0, 1.0, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Espaguetis boloñesa", 160, 8.5, 18.0, 6.0, 1.5, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Lasaña de carne", 175, 10.0, 14.0, 9.0, 1.0, "prepared_meal", "homemade", [("1 ración", 300), ("100 g", 100)]),
    ("Canelones de carne", 165, 9.5, 15.0, 7.5, 0.8, "prepared_meal", "homemade", [("3 canelones", 250), ("100 g", 100)]),
    ("Arroz cubano", 180, 5.5, 28.0, 5.0, 1.0, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Arroz tres delicias", 155, 5.0, 23.0, 4.5, 1.0, "prepared_meal", "homemade", [("1 plato", 300), ("100 g", 100)]),
    ("Gachas manchegas", 200, 4.0, 22.0, 10.5, 1.0, "prepared_meal", "homemade", [("1 ración", 250), ("100 g", 100)]),
    ("Marmitako", 110, 10.0, 7.5, 4.5, 1.5, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
    ("Suquet de peix", 95, 9.5, 5.5, 4.0, 1.0, "prepared_meal", "homemade", [("1 plato", 350), ("100 g", 100)]),
]


def escape_sql(s: str) -> str:
    return s.replace("'", "''")


def generate_sql_files():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    batch_size = 50  # alimentos por archivo SQL
    total = len(FOODS)
    file_count = 0

    for i in range(0, total, batch_size):
        batch = FOODS[i:i + batch_size]
        file_count += 1
        filename = f"{OUTPUT_DIR}/batch_{file_count:02d}.sql"

        lines = []
        lines.append(f"-- Nutria Food Batch {file_count} ({len(batch)} alimentos)")
        lines.append(f"-- Generado: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append("-- Ejecutar en Supabase Dashboard → SQL Editor → New Query → Pegar → Run")
        lines.append("")
        lines.append("BEGIN;")
        lines.append("")

        for name, cal, prot, carbs, fat, fiber, category, source, servings in batch:
            food_id = str(uuid.uuid4())
            safe_name = escape_sql(name)

            lines.append(f"-- {name}")
            lines.append(
                f"INSERT INTO public.foods (id, name, category, food_source, calories_kcal, "
                f"protein_g, carbs_g, fat_g, fiber_g, origin_country, is_active, is_verified, "
                f"data_source, moderation_status) VALUES ("
                f"'{food_id}', '{safe_name}', '{category}', '{source}', {cal}, "
                f"{prot}, {carbs}, {fat}, {fiber}, 'ES', true, true, "
                f"'nutria-seed', 'approved') "
                f"ON CONFLICT (name) DO NOTHING;"
            )

            for j, (srv_name, srv_grams) in enumerate(servings):
                srv_id = str(uuid.uuid4())
                safe_srv = escape_sql(srv_name)
                is_default = "true" if j == 0 else "false"
                lines.append(
                    f"INSERT INTO public.food_servings (id, food_id, serving_name, serving_grams, "
                    f"is_default, sort_order) VALUES ("
                    f"'{srv_id}', '{food_id}', '{safe_srv}', {srv_grams}, "
                    f"{is_default}, {j}) "
                    f"ON CONFLICT DO NOTHING;"
                )

            lines.append("")

        lines.append("COMMIT;")

        with open(filename, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        print(f"✅ {filename} — {len(batch)} alimentos")

    print(f"\n🏁 {file_count} archivos generados en ./{OUTPUT_DIR}/")
    print(f"   Total: {total} alimentos con {sum(len(f[8]) for f in FOODS)} porciones")
    print(f"\n📋 Para insertar:")
    print(f"   1. Ve a Supabase Dashboard → SQL Editor")
    print(f"   2. Abre cada archivo .sql en orden")
    print(f"   3. Copia el contenido, pégalo en el editor, pulsa Run")
    print(f"   4. Repite para cada batch")

from datetime import datetime

if __name__ == "__main__":
    generate_sql_files()
