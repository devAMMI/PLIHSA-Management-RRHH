/*
# Fix vacation balances for all employees

1. Data Changes
- For every active employee hired BEFORE 2026 who currently has a vacation_balances row for year=2026:
  - Renames that row's year to 2025 (the last completed vacation period).
  - Inserts missing vacation_balances rows for each year from hire_year through 2024,
    each with 30 total_days and 0 used_days.
- Employees hired in 2026 keep their single 2026 balance (first year in progress).
- Employees who already have correct multi-year balances (like Adriana) are not touched.

2. Security
- No schema or policy changes.
- Uses ON CONFLICT to be idempotent and avoid duplicates.

3. Important Notes
- This is idempotent: running it again will not create duplicates.
- Preserves any existing used_days and notes on the renamed 2025 row.
- Only affects active employees.
*/

-- Step 1: Rename existing 2026 balances to 2025 for employees hired before 2026
-- (but only if they don't already have a 2025 balance)
UPDATE public.vacation_balances vb
SET year = 2025, updated_at = now()
FROM public.employees e
WHERE vb.employee_id = e.id
  AND vb.year = 2026
  AND e.status = 'active'
  AND e.hire_date IS NOT NULL
  AND EXTRACT(YEAR FROM e.hire_date::date) < 2026
  AND NOT EXISTS (
    SELECT 1 FROM public.vacation_balances vb2
    WHERE vb2.employee_id = e.id AND vb2.year = 2025
  );

-- Step 2: Insert all missing year balances from hire_year through 2024
-- for employees hired before 2026
INSERT INTO public.vacation_balances (employee_id, year, total_days, used_days, notes)
SELECT e.id, y.year, 30, 0, NULL
FROM public.employees e
CROSS JOIN generate_series(
  EXTRACT(YEAR FROM e.hire_date::date)::int,
  2024
) AS y(year)
WHERE e.status = 'active'
  AND e.hire_date IS NOT NULL
  AND EXTRACT(YEAR FROM e.hire_date::date) < 2026
  AND NOT EXISTS (
    SELECT 1 FROM public.vacation_balances existing
    WHERE existing.employee_id = e.id AND existing.year = y.year
  )
ON CONFLICT (employee_id, year) DO NOTHING;