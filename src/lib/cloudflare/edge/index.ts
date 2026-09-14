export { runOuraIncrementalSync } from "./oura-sync";
export { processJournalEntry } from "./journal-processor";

/** Dispatch edge-function equivalents based on action name. */
export async function invokeEdgeFunction(
  name: string,
  body: Record<string, unknown>,
): Promise<Response> {
  switch (name) {
    case "oura-sync": {
      const { runOuraIncrementalSync } = await import("./oura-sync");
      const result = await runOuraIncrementalSync({
        userId: typeof body.user_id === "string" ? body.user_id : undefined,
        all: body.all === true,
      });
      return Response.json(result);
    }
    case "journal-processor": {
      const entryId =
        (body.entry_id as string | undefined) ?? (body.entryId as string | undefined);
      if (!entryId) {
        return Response.json({ error: "entry_id required" }, { status: 400 });
      }
      const { processJournalEntry } = await import("./journal-processor");
      const result = await processJournalEntry(entryId);
      return Response.json(result, { status: result.ok ? 200 : 404 });
    }
    default:
      return Response.json({ error: `Edge function ${name} not ported yet` }, { status: 501 });
  }
}
