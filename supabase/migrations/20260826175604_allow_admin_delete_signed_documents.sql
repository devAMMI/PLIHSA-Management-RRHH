/*
# Allow admin role to delete signed documents

## Problem
Only `rrhh` and `superadmin` could delete signed documents from storage.
Jessica Lopez and Karla Sagastume (both `admin` role) need the same ability
to delete and replace signed documents in finalized reviews.

## Changes
Recreate the DELETE policy on storage.objects to include `admin` alongside
`rrhh` and `superadmin`.
*/

DROP POLICY IF EXISTS "RRHH and admins can delete signed documents" ON storage.objects;

CREATE POLICY "RRHH and admins can delete signed documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents'
  AND EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
    AND system_users.role IN ('rrhh', 'superadmin', 'admin')
  )
);
