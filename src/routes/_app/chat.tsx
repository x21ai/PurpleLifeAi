import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/layout/placeholder-page";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — Purple" }] }),
  component: () => (
    <Placeholder
      title="Ask anything"
      body="Soon you'll be able to ask Purple about your own patterns. It only ever speaks from your data."
    />
  ),
});