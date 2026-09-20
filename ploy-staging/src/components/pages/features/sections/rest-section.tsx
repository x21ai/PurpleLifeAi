/**
 * @ployComponent
 * @ployComponentId features-rest-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from label: And the rest
 */
type ListItemProps = {
  text: string;
  text_1: string;
};

function ListItem({ text, text_1 }: ListItemProps) {
  return (
    <article className="border-solid border-ploy-neutral-primary-900 pt-5 border-t">
      <h3 className="font-heading text-ploy-text-primary leading-snug [font-weight:inherit] text-2xl">
        {text}
      </h3>
      <p className="text-ploy-neutral-inverse-600 leading-relaxed text-sm mt-3">
        {text_1}
      </p>
    </article>
  );
}

export const restSection: ListItemProps[] = [
  {
    text: "Smart meds",
    text_1:
      "Reminders, adherence, side-effect notes, refill alerts. Backdate old prescriptions to build full history.",
  },
  {
    text: "Seizure log",
    text_1:
      "Quick capture with type, duration, witnesses, recovery, rescue meds. Backdate past episodes.",
  },
  {
    text: "Biometrics",
    text_1:
      "Connect Oura, Whoop, Apple Health. Sleep, HRV, temperature deviation, SpO₂, respiratory rate.",
  },
  {
    text: "Caregiver mode",
    text_1:
      "Share read-only access with the people who help. Every write needs your blessing first.",
  },
  {
    text: "Travel mode",
    text_1:
      "An itinerary-driven medication schedule that shifts cleanly across time zones.",
  },
  {
    text: "Yours to keep",
    text_1:
      "Export everything to JSON or PDF. Delete your account and everything goes with it.",
  },
];

export default function RestSection({
  items = restSection,
}: {
  items?: ListItemProps[];
}) {
  return (
    <section className="max-w-screen-lg mx-auto max-md:px-6 max-md:py-20 md:px-10 md:py-28">
      <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase text-center label-eyebrow">
        {"And the rest"}
      </p>
      <h2 className="font-heading leading-none [font-weight:inherit] text-center mt-5 max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:text-5xl md:tracking-[-1.2px] md:leading-none">
        {"Quietly thorough."}
      </h2>
      <div className="grid gap-[2.5rem_48px] mt-14 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
        {items.map((item, index) => (
          <ListItem key={index} {...item} />
        ))}
      </div>
    </section>
  );
}
