/**
 * @ployComponent
 * @ployComponentId about-promises-keep-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from label: The promises we keep
 */
type ListItemProps = {
  className: string;
  text: string;
  text_1: string;
  separator?: string;
};

function ListItem({ className, text, text_1, separator }: ListItemProps) {
  return (
    <>
      <li className={className || undefined}>
        <strong className="text-ploy-text-primary font-bold">{text}</strong>
        {text_1}
      </li>
      {separator}
    </>
  );
}

export const promisesKeepSection: ListItemProps[] = [
  {
    className: "mb-6",
    text: "Free, forever.",
    text_1: " For individuals and the people who care for them.",
  },
  {
    className: "mb-6",
    text: "Open source.",
    text_1: " Apache 2.0. Read the code, fork it, run your own copy.",
  },
  {
    className: "mb-6",
    text: "No ads. Ever.",
    text_1: " Nothing in PurpleLife is paid to be there.",
  },
  {
    className: "mb-6",
    text: "Your story is yours.",
    text_1: " Export it or delete it, whenever you want.",
  },
  {
    className: "",
    text: "Not a medical device.",
    text_1:
      " PurpleLife supports you and your clinician. It doesn’t replace either of you.",
  },
];

export default function PromisesKeepSection({
  items = promisesKeepSection,
}: {
  items?: ListItemProps[];
}) {
  return (
    <section className="max-w-screen-md mx-auto max-md:px-6 max-md:py-24 md:px-10 md:py-32">
      <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
        {"The promises we keep"}
      </p>
      <ul className="text-ploy-text-primary/80 leading-relaxed text-lg mt-10 mb-0 pl-0">
        {items.map((item, index) => (
          <ListItem
            key={index}
            {...item}
            separator={index < items.length - 1 ? "\n" : ""}
          />
        ))}
      </ul>
      <p className="text-ploy-neutral-inverse-600 leading-normal mt-8">
        {"Each promise, and why you can check it yourself:"}{" "}
        <a
          href="/trust"
          className="text-ploy-text-primary hover:text-ploy-text-primary"
        >
          {"why PurpleLife is different"}
        </a>
        {"."}
      </p>
    </section>
  );
}
