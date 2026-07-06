import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/my-health")({
  beforeLoad: () => {
    throw redirect({ to: "/data" });
  },
});
