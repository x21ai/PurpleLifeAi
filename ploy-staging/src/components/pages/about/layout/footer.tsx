/**
 * @ployComponent
 * @ployComponentId about-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type LinkItemProps = {
  href: string;
  text: string;
};

function LinkItem({ href, text }: LinkItemProps) {
  return (
    <a
      href={href}
      className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
    >
      {text}
    </a>
  );
}

export const links: LinkItemProps[] = [
  {
    href: "/trust",
    text: "Trust",
  },
  {
    href: "/charter",
    text: "Charter",
  },
  {
    href: "/privacy",
    text: "Privacy",
  },
  {
    href: "/terms",
    text: "Terms",
  },
  {
    href: "/contact",
    text: "Contact",
  },
];

export default function Footer({ items = links }: { items?: LinkItemProps[] }) {
  return (
    <footer className="border-solid border-ploy-neutral-primary-900 bg-ploy-background-primary/60 border-t">
      <div className="text-ploy-neutral-inverse-600 leading-snug text-sm max-w-6xl flex gap-4 mx-auto py-8 max-md:flex-col max-md:px-5 md:flex-row md:justify-between md:items-center md:px-8">
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center gap-[0.5rem_20px]"
        >
          {items.map((item, index) => (
            <LinkItem key={index} {...item} />
          ))}
          <a
            href="https://github.com/x21ai/PurpleLifeAi"
            target="_blank"
            rel="noreferrer noopener"
            className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
          >
            {"GitHub"}
          </a>
        </nav>
        <p className="leading-snug text-xs">
          {"© 2026 PurpleLife · Design preview"}
        </p>
      </div>
    </footer>
  );
}
