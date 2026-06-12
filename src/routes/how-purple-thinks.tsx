import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/how-purple-thinks")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/how-purple-thinks" });
  },
});
