-- 20 alimentos españoles comunes con datos nutricionales reales
-- Ejecutar en Supabase SQL Editor
-- Valores nutricionales por 100g

INSERT INTO foods (name, brand, category, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, is_active)
VALUES
  ('Tortilla española',         NULL,          'Platos',       150, 7.0,  8.0,  10.0, 0.5,  true),
  ('Pan blanco de barra',       NULL,          'Cereales',     265, 8.0,  53.0,  2.0, 2.5,  true),
  ('Arroz blanco cocido',       NULL,          'Cereales',     130, 2.5,  28.0,  0.3, 0.4,  true),
  ('Pechuga de pollo a la plancha', NULL,      'Carnes',       165, 31.0,  0.0,  3.6, 0.0,  true),
  ('Ensalada mixta',            NULL,          'Verduras',      20, 1.2,   3.0,  0.3, 1.5,  true),
  ('Café con leche',            NULL,          'Bebidas',       40, 2.0,   4.0,  1.5, 0.0,  true),
  ('Tostada con aguacate',      NULL,          'Desayuno',     185, 4.0,  18.0, 11.0, 4.0,  true),
  ('Lentejas cocidas',          NULL,          'Legumbres',    116, 9.0,  20.0,  0.4, 7.9,  true),
  ('Salmón a la plancha',       NULL,          'Pescados',     208, 20.0,  0.0, 13.0, 0.0,  true),
  ('Huevo cocido',              NULL,          'Huevos',       155, 13.0,  1.1, 11.0, 0.0,  true),
  ('Leche entera',              NULL,          'Lácteos',       61, 3.2,   4.8,  3.3, 0.0,  true),
  ('Plátano',                   NULL,          'Frutas',        89, 1.1,  23.0,  0.3, 2.6,  true),
  ('Manzana',                   NULL,          'Frutas',        52, 0.3,  14.0,  0.2, 2.4,  true),
  ('Aceite de oliva virgen',    NULL,          'Grasas',       884, 0.0,   0.0, 100.0, 0.0, true),
  ('Atún en lata al natural',   NULL,          'Pescados',     116, 26.0,  0.0,  1.0, 0.0,  true),
  ('Patata cocida',             NULL,          'Verduras',      87, 1.9,  20.0,  0.1, 1.8,  true),
  ('Tomate natural',            NULL,          'Verduras',      18, 0.9,   3.9,  0.2, 1.2,  true),
  ('Jamón serrano',             NULL,          'Carnes',       241, 30.0,  0.0, 13.0, 0.0,  true),
  ('Queso manchego curado',     NULL,          'Lácteos',      392, 26.0,  0.5, 32.0, 0.0,  true),
  ('Yogur natural desnatado',   NULL,          'Lácteos',       59, 3.8,   4.7,  3.3, 0.0,  true)
ON CONFLICT DO NOTHING;
