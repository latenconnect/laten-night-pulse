-- Remove wine bars, lounges, and festivals from the clubs table
DELETE FROM clubs WHERE venue_type IN ('wine_bar', 'lounge', 'festival');