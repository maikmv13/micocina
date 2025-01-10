-- Insertar datos de ejemplo en recipes
INSERT INTO recipes (
  name,
  side_dish,
  meal_type,
  category,
  servings,
  calories,
  energy_kj,
  fats,
  saturated_fats,
  carbohydrates,
  sugars,
  fiber,
  proteins,
  sodium,
  instructions,
  url,
  pdf_url
) VALUES 
(
  'Albóndigas caseras de cerdo a la barbacoa',
  'con puré de patatas y brócoli salteado',
  'comida',
  'Carnes',
  2,
  '612',
  '2559',
  '24.1',
  '7',
  '58.8',
  '11.4',
  '0.1',
  '32.3',
  '2.36',
  '{"Paso 1": "¡Asegúrate de utilizar las cantidades indicadas!", "Paso 2": "En un bol, agrega la carne de cerdo..."}'::jsonb,
  'https://www.hellofresh.es/recipes/albondigas-caseras-de-cerdo-con-salsa-barbacoa-650192f1786cce2df0e0839c',
  'https://www.hellofresh.es/recipecards/card/650192f1786cce2df0e0839c.pdf'
),
(
  'Pollo al limón con tomillo',
  'y Arroz',
  'comida',
  'Carnes',
  2,
  '531',
  '2223',
  '6.68',
  '1.55',
  '79.21',
  '10.73',
  '0.49',
  '38.46',
  '400',
  '{"1": "Precalienta el horno a 180ºC", "2": "Pela la cebolla y córtala por la mitad", "3": "Corta el limón y exprime", "4": "Agrega los muslos de pollo", "5": "Cocina el arroz", "6": "Sirve todo junto"}'::jsonb,
  'https://www.hellofresh.es/recipes/pollo-limon-arroz-verduras-6373c35108cf0b02479225cf',
  'https://www.hellofresh.es/recipecards/card/pollo-limon-arroz-verduras-6373c35108cf0b02479225cf-39969b5d.pdf'
),
(
  'Pollo al ajillo',
  'con Arroz y Perejil',
  'comida',
  'Carnes',
  2,
  '539',
  '2256',
  '5',
  '1.4',
  '71.1',
  '4.2',
  '0.4',
  '30.4',
  '400',
  '{"1": "Llena un cazo con el agua para el arroz", "2": "Pela y corta a láminas el ajo", "3": "Cuando el pollo esté listo", "4": "Pica finamente la mitad del perejil"}'::jsonb,
  'https://www.hellofresh.es/recipes/pollo-al-ajillo-640f51570565a60137055b72',
  'https://www.hellofresh.es/recipecards/card/pollo-al-ajillo-640f51570565a60137055b72-1d98e696.pdf'
),
(
  'Pollo asado al horno',
  'con Patatas y Pimiento rojo',
  'comida',
  'Carnes',
  2,
  '620',
  '2595',
  '35',
  '10',
  '35',
  '7',
  '6',
  '45',
  '500',
  '{"1": "Precalienta el horno a 200ºC", "2": "Pela las Patatas y córtalas", "3": "Corta los Pimiento rojo", "4": "Pela y pica los ajos", "5": "Coloca el pollo en una bandeja", "6": "Mezcla las Patatas y los Pimiento rojo"}'::jsonb,
  '',
  ''
) ON CONFLICT (name) DO NOTHING;

-- Actualizar la lista de ingredientes
INSERT INTO ingredients (name) VALUES 
  ('Muslos de pollo'),
  ('Limón'),
  ('Mostaza'),
  ('Miel'),
  ('Arroz'),
  ('Brócoli'),
  ('Tomillo'),
  ('Cebolla roja'),
  ('Harina'),
  ('Ajo'),
  ('Perejil'),
  ('Cebolla'),
  ('Vinagre balsámico'),
  ('Pollo entero'),
  ('Patatas'),
  ('Pimiento rojo'),
  ('Pimiento verde'),
  ('Romero'),
  ('Salsa barbacoa'),
  ('Sazonador barbacoa'),
  ('Caldo de pollo'),
  ('Panko'),
  ('Carne de cerdo picada')
ON CONFLICT (name) DO NOTHING;

-- Relacionar todos los ingredientes con sus recetas
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
SELECT 
  r.id,
  i.id,
  CASE i.name
    WHEN 'Salsa barbacoa' THEN 2
    WHEN 'Sazonador barbacoa' THEN 1
    WHEN 'Caldo de pollo' THEN 1
    WHEN 'Panko' THEN 25
    WHEN 'Carne de cerdo picada' THEN 250
    ELSE 1 -- Valor por defecto para evitar NULLs
  END,
  CASE i.name
    WHEN 'Salsa barbacoa' THEN 'sobre'
    WHEN 'Sazonador barbacoa' THEN 'sobre'
    WHEN 'Caldo de pollo' THEN 'sobre'
    WHEN 'Panko' THEN 'gramo'
    WHEN 'Carne de cerdo picada' THEN 'gramo'
    ELSE 'unidad' -- Valor por defecto para evitar NULLs
  END::unit_type
FROM recipes r, ingredients i
WHERE r.name = 'Albóndigas caseras de cerdo a la barbacoa'
  AND i.name IN ('Salsa barbacoa', 'Sazonador barbacoa', 'Caldo de pollo', 'Panko', 'Carne de cerdo picada')
ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;
