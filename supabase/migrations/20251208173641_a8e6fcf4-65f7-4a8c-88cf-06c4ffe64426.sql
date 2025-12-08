-- Mark famous Budapest clubs as featured
UPDATE clubs SET is_featured = true WHERE id IN (
  'd4278170-2cac-43cb-8228-be9a5b3ce662',  -- Romkert
  '3605e801-3dcb-4194-b317-e4183b32ccc9',  -- Szimpla Kert
  '99304239-a22c-4b1f-bdd0-da3d0505a8e4',  -- Instant-Fogas Complex
  '3cbd09f2-cd68-4682-911b-5f8a4ff0e582',  -- Morrison's 2
  '5491fc30-5a89-485a-8345-fe86e0da3ee8',  -- Akvárium Klub
  'fa21435a-eb1d-405b-bd87-b170e4cdc094',  -- Ötkert
  '5c2e9210-8aa3-4918-a335-11823b96fbf3'   -- Doboz
);