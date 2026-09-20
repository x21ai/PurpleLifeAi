/**
 * @ployComponent
 * @ployComponentId contact-navbar
 * @ployComponentType component
 * @ployComponentPattern navbar
 * @ployComponentDescription Main navigation for the website.
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
    href: "/features",
    text: "Features",
  },
  {
    href: "/about",
    text: "About",
  },
  {
    href: "/pricing",
    text: "Pricing",
  },
  {
    href: "/contact",
    text: "Contact",
  },
];

export default function Navbar({ items = links }: { items?: LinkItemProps[] }) {
  return (
    <header className="border-solid border-ploy-neutral-primary-900 bg-ploy-background-primary/80 sticky z-30 backdrop-blur border-b top-0">
      <div className="h-16 max-w-6xl flex justify-between items-center mx-auto max-md:px-6 md:px-10">
        <a
          aria-label="PurpleLife home"
          href="/"
          className="text-ploy-text-primary font-semibold text-sm tracking-[0.45em] uppercase block"
        >
          {"PurpleLife"}
        </a>
        <nav className="text-ploy-neutral-inverse-600 leading-snug text-sm items-center gap-6 min-[768px]:flex max-md:hidden">
          {items.map((item, index) => (
            <LinkItem key={index} {...item} />
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/sign-in"
            className="text-ploy-neutral-inverse-600 leading-snug text-sm block px-3 py-2 hover:text-ploy-text-primary"
          >
            {"Sign in"}
          </a>
          <a
            href="/sign-up"
            className="text-nowrap bg-ploy-background-secondary text-ploy-text-inverse leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm transition-colors px-3 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-secondary/90"
          >
            {"Get started"}
          </a>
        </div>
      </div>
    </header>
  );
}
