-- Update existing club photos to use higher resolution (1200px instead of 400px)
UPDATE clubs 
SET photos = (
  SELECT array_agg(regexp_replace(photo, 'maxWidthPx=400', 'maxWidthPx=1200'))
  FROM unnest(photos) AS photo
)
WHERE photos IS NOT NULL 
AND array_to_string(photos, '') LIKE '%maxWidthPx=400%';