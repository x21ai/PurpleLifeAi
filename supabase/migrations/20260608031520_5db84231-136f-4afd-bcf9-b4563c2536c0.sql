
WITH fingerprints AS (
  SELECT
    d.id,
    d.user_id,
    d.report_date,
    d.created_at,
    COUNT(m.id) AS metric_count,
    md5(string_agg(m.metric_key || ':' || COALESCE(m.value::text, m.value_text, ''), '|' ORDER BY m.metric_key, m.value, m.value_text)) AS sig
  FROM public.report_documents d
  LEFT JOIN public.report_metrics m ON m.report_id = d.id
  WHERE d.duplicate_of IS NULL AND d.report_date IS NOT NULL
  GROUP BY d.id, d.user_id, d.report_date, d.created_at
),
ranked AS (
  SELECT
    id, user_id, report_date, sig, created_at,
    FIRST_VALUE(id) OVER (PARTITION BY user_id, report_date, sig ORDER BY created_at, id) AS keeper_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, report_date, sig ORDER BY created_at, id) AS rn
  FROM fingerprints
  WHERE metric_count > 0
)
UPDATE public.report_documents d
SET duplicate_of = r.keeper_id
FROM ranked r
WHERE d.id = r.id
  AND r.rn > 1
  AND d.duplicate_of IS NULL;
