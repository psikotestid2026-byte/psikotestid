-- 0021_wpt_q7_images_q4_rsvp.sql
-- Two live WPT rows only. Idempotent UPDATE. No INSERT, DELETE, or answer-key change.
-- Ids confirmed on production and staging question_banks (WPT order 4 and 7).

UPDATE question_banks
SET question_data = jsonb_set(
  question_data,
  '{text}',
  '"Pada sebuah undangan, apakah singkatan RSVP berarti ''tidak perlu membalas''?"'::jsonb
)
WHERE id = 1309
  AND order_number = 4
  AND question_data->>'text' LIKE '%RSVP%';

UPDATE question_banks
SET question_data = question_data
  || jsonb_build_object(
    'image_url', '/wpt/q7-potongan.svg',
    'option_images', jsonb_build_array(
      '/wpt/q7-bentuk-1.svg',
      '/wpt/q7-bentuk-2.svg',
      '/wpt/q7-bentuk-3.svg',
      '/wpt/q7-bentuk-4.svg',
      '/wpt/q7-bentuk-5.svg'
    )
  )
WHERE id = 1312
  AND order_number = 7
  AND question_data->>'text' LIKE '%gabungan dua potongan%'
  AND question_data->'options' = '["Bentuk 1","Bentuk 2","Bentuk 3","Bentuk 4","Bentuk 5"]'::jsonb;
