/**
 * @ployComponent
 * @ployComponentId features-ask-purple-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from label: Ask PurpleLife
 */
type ListItemProps = {
  className: string;
  text: string;
  separator?: string;
};

function ListItem({ className, text, separator }: ListItemProps) {
  return (
    <>
      <li className={className || undefined}>{text}</li>
      {separator}
    </>
  );
}

export const askPurpleSection: ListItemProps[] = [
  { className: "mb-2", text: "Your choice of AI model. Switch any time." },
  { className: "mb-2", text: "Confirm-to-write on every action." },
  {
    className: "",
    text: "Your entries are the prompt, never the training data.",
  },
];

export default function AskPurpleSection({
  items = askPurpleSection,
}: {
  items?: ListItemProps[];
}) {
  return (
    <section className="text-center max-w-screen-md mx-auto max-md:px-6 max-md:py-24 md:px-10 md:py-32">
      <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
        {"Ask PurpleLife"}
      </p>
      <h2 className="font-heading leading-none [font-weight:inherit] mt-5 max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:max-lg:text-5xl md:max-lg:tracking-[-1.2px] md:max-lg:leading-none lg:text-6xl lg:tracking-[-1.5px] lg:leading-none">
        {"A question, answered in your own context."}
      </h2>
      <p className="text-ploy-neutral-inverse-600 leading-relaxed text-lg max-w-xl mt-6 mx-auto">
        {
          "A quiet bubble waits on every screen. Claude answers by default, or pick OpenAI, Gemini, or Grok in Settings. PurpleLife already knows your history, and asks before changing anything."
        }
      </p>
      <ul className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-7 mb-0 pl-0">
        {items.map((item, index) => (
          <ListItem
            key={index}
            {...item}
            separator={index < items.length - 1 ? "\n" : ""}
          />
        ))}
      </ul>
    </section>
  );
}
