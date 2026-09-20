import HeroSection from "./sections/hero-section";
import MinScreenSection from "./sections/min-screen-section";

export default function Page() {
  return (
    <>
      <HeroSection />
      <MinScreenSection />
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
