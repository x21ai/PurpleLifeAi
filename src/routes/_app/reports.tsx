import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Purple" },
      { name: "description", content: "Upload lab reports and track changes over time." },
    ],
  }),
  beforeLoad: ({ location }) => {
    if (location.pathname === "/reports" || location.pathname === "/reports/") {
      throw redirect({ to: "/reports/metrics" });
    }
  },
  component: () => <Outlet />,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm text-destructive">Couldn't load reports: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});