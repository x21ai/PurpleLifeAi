import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — Purple" }] }),
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});