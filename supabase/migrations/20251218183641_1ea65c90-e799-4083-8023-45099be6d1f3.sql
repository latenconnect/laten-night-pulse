-- Data migration: Copy existing DJ profiles to professionals table
INSERT INTO public.professionals (
  user_id,
  profession_type,
  display_name,
  bio,
  profile_photo,
  city,
  country,
  price_min,
  price_max,
  currency,
  experience_level,
  genres,
  skills,
  soundcloud_url,
  mixcloud_url,
  instagram_url,
  preferred_event_types,
  rating,
  review_count,
  is_active,
  is_verified,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'dj'::profession_type,
  dj_name,
  bio,
  profile_photo,
  city,
  'Hungary',
  price_min,
  price_max,
  currency,
  experience_level,
  genres,
  ARRAY[]::text[],
  soundcloud_url,
  mixcloud_url,
  instagram_url,
  preferred_event_types,
  COALESCE(rating, 0),
  COALESCE(review_count, 0),
  COALESCE(is_active, false),
  false,
  created_at,
  updated_at
FROM public.dj_profiles
WHERE user_id NOT IN (
  SELECT user_id FROM public.professionals WHERE profession_type = 'dj'
);

-- Data migration: Copy existing Bartender profiles to professionals table
INSERT INTO public.professionals (
  user_id,
  profession_type,
  display_name,
  bio,
  profile_photo,
  city,
  country,
  price_min,
  price_max,
  currency,
  experience_level,
  skills,
  genres,
  instagram_url,
  preferred_event_types,
  rating,
  review_count,
  is_active,
  is_verified,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'bartender'::profession_type,
  bartender_name,
  bio,
  profile_photo,
  city,
  'Hungary',
  price_min,
  price_max,
  currency,
  experience_level,
  skills,
  ARRAY[]::text[],
  instagram_url,
  preferred_event_types,
  COALESCE(rating, 0),
  COALESCE(review_count, 0),
  COALESCE(is_active, false),
  false,
  created_at,
  updated_at
FROM public.bartender_profiles
WHERE user_id NOT IN (
  SELECT user_id FROM public.professionals WHERE profession_type = 'bartender'
);