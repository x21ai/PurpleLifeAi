import DarkTextAmberSection from "./sections/dark-text-amber-section";
import HeroSection from "./sections/hero-section";

export default function Page() {
  return (
    <>
      <DarkTextAmberSection />
      <HeroSection />
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
