/*
  # Fix operative_goal_definitions dates with UTC offset error

  Records created between 00:00-05:59 UTC (which is 18:00-23:59 GMT-6 Honduras)
  were saved with definition_date = next day due to UTC vs local time mismatch.
  This corrects definition_date to the actual Honduras local date.
*/

UPDATE operative_goal_definitions
SET definition_date = (created_at AT TIME ZONE 'America/Tegucigalpa')::date
WHERE definition_date != (created_at AT TIME ZONE 'America/Tegucigalpa')::date;
