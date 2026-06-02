-- QA-REAL-003 C.1
-- Harden SECURITY DEFINER views by making them security invoker views.
-- This preserves the public contract while ensuring underlying RLS is enforced.

alter view public.quality_nci_view set (security_invoker = true);
alter view public.budget_items_view set (security_invoker = true);
