export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-10 sm:pt-16 pb-12">
      <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-foreground">{title}</h1>
      <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">{body}</p>
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
        <p className="font-serif italic text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}
