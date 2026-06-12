-- Canonical journal tag namespaces (Devyn item 7): event / symptom / trigger /
-- place / context (plus mood and med). Remap legacy tags that used the wrong
-- namespace: sleep-like states tagged as discrete events, and locations
-- tagged as context. The UI renders chips with human labels from these.

UPDATE public.journal_entries
SET ai_tags = (
  SELECT array_agg(
    CASE t
      WHEN 'event:sleep' THEN 'context:sleep'
      WHEN 'event:awake' THEN 'context:awake'
      WHEN 'event:bedtime' THEN 'context:bedtime'
      WHEN 'event:morning' THEN 'context:morning'
      WHEN 'event:nap' THEN 'context:nap'
      WHEN 'context:hospital' THEN 'place:hospital'
      WHEN 'context:er' THEN 'place:er'
      WHEN 'context:emergency_room' THEN 'place:er'
      WHEN 'context:home' THEN 'place:home'
      WHEN 'context:work' THEN 'place:work'
      WHEN 'context:school' THEN 'place:school'
      WHEN 'context:gym' THEN 'place:gym'
      WHEN 'context:clinic' THEN 'place:clinic'
      ELSE t
    END
  )
  FROM unnest(ai_tags) AS t
)
WHERE ai_tags && ARRAY[
  'event:sleep','event:awake','event:bedtime','event:morning','event:nap',
  'context:hospital','context:er','context:emergency_room','context:home',
  'context:work','context:school','context:gym','context:clinic'
];
