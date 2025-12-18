-- Deactivate non-nightlife venues (gas stations, stores, churches, etc.)
UPDATE public.clubs 
SET is_active = false
WHERE is_active = true 
AND (
  -- Gas stations
  LOWER(name) LIKE '%shell%' OR
  -- Stores
  LOWER(name) LIKE '%ikea%' OR
  -- Hairdressers
  LOWER(name) LIKE '%fodrász%' OR
  -- Churches/Religious
  LOWER(name) LIKE '%theological%' OR
  LOWER(name) LIKE '%cathedral%' OR
  LOWER(name) LIKE '%church%' OR
  -- Sports/Karting
  LOWER(name) LIKE '%karting%' OR
  LOWER(name) LIKE '%stadium%' OR
  -- Restaurants/Buffets (not nightlife)
  LOWER(name) LIKE '%büfé%' OR
  LOWER(name) LIKE '%vendéglő%' OR
  LOWER(name) LIKE '%kisvendéglő%'
)