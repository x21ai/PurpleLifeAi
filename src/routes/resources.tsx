import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/resources")({
  beforeLoad: () => {
    throw redirect({ to: "/community/resources" });
  },
});