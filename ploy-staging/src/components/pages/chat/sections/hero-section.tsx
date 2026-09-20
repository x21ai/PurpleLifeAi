/**
 * @ployComponent
 * @ployComponentId chat-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
type ListItemProps = {
  text: string;
};

function ListItem({ text }: ListItemProps) {
  return (
    <button
      type="button"
      style={{ fontVariationSettings: "inherit" }}
      className="border-solid border-ploy-button-primary-border/10 text-ploy-button-secondary-text bg-ploy-button-secondary-background/60 leading-snug [font-weight:inherit] text-sm text-left block shadow-[0px_1px_2px_0px_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] transition px-4 py-2.5 rounded-full hover:bg-ploy-neutral-primary-s3/40 max-md:shrink-0 md:shrink border"
      data-ploy-component-type="button"
      data-ploy-component-variant="secondary"
    >
      {text}
    </button>
  );
}

export const heroSection: ListItemProps[] = [
  { text: "How am I sleeping?" },
  { text: "Show last week's events" },
  { text: "What patterns do you see in my journal?" },
];

export default function HeroSection({
  items = heroSection,
}: {
  items?: ListItemProps[];
}) {
  return (
    <div className="overflow-y-auto grow basis-[0%] max-md:pb-28 max-md:px-4 md:max-lg:px-10 md:pb-6 lg:px-16">
      <div className="max-w-screen-md mx-auto py-8">
        <div className="max-md:py-6 md:py-10">
          <p className="text-ploy-text-primary/80 leading-relaxed text-base max-w-lg">
            {
              "Ask me anything about your sleep, your medication, your symptoms, your patterns, or your care."
            }
          </p>
          <div
            style={{ scrollbarWidth: "none" }}
            className="flex flex-wrap gap-2 mt-8 -mx-1 scrollbar-none max-md:overflow-x-auto"
          >
            {items.map((item, index) => (
              <ListItem key={index} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
