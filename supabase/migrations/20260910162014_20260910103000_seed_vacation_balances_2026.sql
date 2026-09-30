/*
# Seed 2026 vacation balances

1. Data Changes
- Creates or updates one `vacation_balances` row for every active employee.
- Sets `total_days` to 30 for the 2026 vacation year.
- Preserves any existing `used_days` and notes.

2. Security
- Uses the existing vacation balance table and policies.
- Does not expose or change employee permissions.

3. Important Notes
- This is an idempotent data update keyed by employee and year.
- Employees without a balance receive 30 total days and zero used days.
*/

INSERT INTO public.vacation_balances (employee_id, year, total_days, used_days)
SELECT e.id, 2026, 30, 0
FROM public.employees e
WHERE e.status = 'active'
ON CONFLICT (employee_id, year) DO UPDATE
SET total_days = 30,
    updated_at = now();
