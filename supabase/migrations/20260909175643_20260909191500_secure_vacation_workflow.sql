/*
# Secure vacation approval workflow

1. Existing Tables Updated
- `vacation_requests`: keeps the existing employee_id, start_date, end_date, days, reason, status, reviewed_by, reviewed_at, and review_notes columns.
- Existing policies are replaced so RRHH, managers, chiefs, administrators, and superadmins can review requests in their company.

2. New Database Function
- `review_vacation_request`: securely approves, rejects, or cancels a pending request.
- The reviewing user is derived from auth.uid(), never from a client-supplied actor id.
- The function validates the request status, reviewer role, company scope, and allowed decision values.

3. Security
- Direct authenticated UPDATE access to vacation requests is revoked.
- Employees can still create requests for their own employee record and view their own requests.
- Reviewers can read requests in their company and must use the guarded function to change decisions.
- Vacation balances remain writable only by administrators and superadmins.

4. Important Notes
- No existing vacation rows are deleted or changed.
- The approval action records reviewer identity and timestamp for auditability.
*/

DROP POLICY IF EXISTS "Admins update vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Employees view own vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Employees insert own vacation requests" ON public.vacation_requests;

CREATE POLICY "Vacation users view permitted requests" ON public.vacation_requests FOR SELECT TO authenticated
USING (
  employee_id IN (SELECT su.employee_id FROM public.system_users su WHERE su.user_id = auth.uid() AND su.is_active = true)
  OR EXISTS (
    SELECT 1 FROM public.system_users actor
    JOIN public.employees requested_employee ON requested_employee.id = vacation_requests.employee_id
    WHERE actor.user_id = auth.uid() AND actor.is_active = true
      AND actor.company_id = requested_employee.company_id
      AND actor.role IN ('superadmin', 'admin', 'rrhh', 'manager', 'jefe')
  )
);

CREATE POLICY "Employees insert own vacation requests" ON public.vacation_requests FOR INSERT TO authenticated
WITH CHECK (
  employee_id IN (SELECT su.employee_id FROM public.system_users su WHERE su.user_id = auth.uid() AND su.is_active = true)
  AND status = 'pending'
);

REVOKE UPDATE ON public.vacation_requests FROM authenticated;

CREATE OR REPLACE FUNCTION public.review_vacation_request(
  p_request_id uuid,
  p_status text,
  p_review_notes text DEFAULT NULL
)
RETURNS public.vacation_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.vacation_requests;
  v_actor public.system_users;
BEGIN
  SELECT * INTO v_actor FROM public.system_users WHERE user_id = auth.uid() AND is_active = true;
  IF v_actor.id IS NULL OR v_actor.role NOT IN ('superadmin', 'admin', 'rrhh', 'manager', 'jefe') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('approved', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid vacation decision';
  END IF;
  SELECT vr.* INTO v_request
  FROM public.vacation_requests vr
  JOIN public.employees e ON e.id = vr.employee_id
  WHERE vr.id = p_request_id AND vr.status = 'pending' AND (v_actor.role = 'superadmin' OR e.company_id = v_actor.company_id);
  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Vacation request not available';
  END IF;
  UPDATE public.vacation_requests
  SET status = p_status, reviewed_by = auth.uid(), reviewed_at = now(), review_notes = NULLIF(trim(p_review_notes), ''), updated_at = now()
  WHERE id = p_request_id
  RETURNING * INTO v_request;
  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.review_vacation_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_vacation_request(uuid, text, text) TO authenticated;
