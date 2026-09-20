import NavbarIcon1 from "../svgs/navbar-icon-1";
import NavbarIcon2 from "../svgs/navbar-icon-2";

/**
 * @ployComponent
 * @ployComponentId settings-navbar
 * @ployComponentType component
 * @ployComponentPattern navbar
 * @ployComponentDescription Main navigation for the website.
 */
export default function Navbar() {
  return (
    <header className="border-solid border-ploy-neutral-primary-s2/60 bg-ploy-background-primary/70 h-14 sticky z-20 justify-between items-center gap-2 backdrop-blur border-b top-0 min-[768px]:flex max-md:hidden max-lg:px-4 lg:px-6">
      <div className="flex items-center" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Sync wearable data"
          data-state="closed"
          style={{ fontVariationSettings: "inherit" }}
          className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-8 h-8 flex justify-center items-center transition-colors p-0 rounded-full hover:bg-ploy-neutral-primary-s3 hover:text-ploy-text-primary"
        >
          <NavbarIcon1 />
        </button>
        <button
          type="button"
          id="radix-_r_8_"
          aria-expanded="false"
          data-state="closed"
          aria-label="Open account menu"
          style={{ fontVariationSettings: "inherit" }}
          className="[color:inherit] [font-weight:inherit] flex items-center gap-1 transition pl-0.5 pr-2 py-0.5 rounded-full hover:bg-ploy-neutral-primary-s3/60"
        >
          <span
            aria-hidden="true"
            className="bg-[rgb(176,132,209)] text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
          >
            <span className="block">P</span>
          </span>
          <NavbarIcon2 />
        </button>
      </div>
    </header>
  );
}
