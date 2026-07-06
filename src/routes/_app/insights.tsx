import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/insights")({
  beforeLoad: () => {
    throw redirect({ to: "/plan" });
  },
});
