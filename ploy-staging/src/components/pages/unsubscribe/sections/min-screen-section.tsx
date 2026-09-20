/**
 * @ployComponent
 * @ployComponentId unsubscribe-min-screen-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from semantic markup
 */
export default function MinScreenSection() {
  return (
    <main className="bg-ploy-background-primary flex justify-center items-center px-4 py-12 min-h-screen text-ploy-text-primary">
      <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary text-ploy-text-primary w-full max-w-md shadow-sm rounded-[1.25rem] text-card-foreground border">
        <div className="flex flex-col p-6">
          <div className="leading-none font-semibold tracking-tight">
            {"Email preferences"}
          </div>
        </div>
        <div className="text-ploy-neutral-inverse-600 leading-snug text-sm pb-6 px-6">
          <p>This unsubscribe link is invalid or has expired.</p>
        </div>
      </div>
    </main>
  );
}
