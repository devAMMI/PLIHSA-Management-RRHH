/*
  # Add DELETE policy for june_reviews table

  ## Problem
  The june_reviews table is missing a DELETE RLS policy.
  INSERT, SELECT, and UPDATE policies exist, but DELETE was never created,
  causing the delete button to silently fail — the Supabase client executes
  the query but RLS blocks the operation and returns 0 rows deleted.

  ## Changes
  - Add DELETE policy on june_reviews for authenticated users
*/

CREATE POLICY "Authenticated users can delete june_reviews"
  ON june_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
