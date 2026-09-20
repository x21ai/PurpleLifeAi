/**
 * @ployComponent
 * @ployComponentId features-mx-auto-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from semantic markup
 */
export default function MxAutoSection() {
  return (
    <section className="max-w-screen-lg relative will-change-[opacity,transform] transition-[opacity,transform,translate,scale,rotate] ease-[ease-out] mx-auto rounded-[1.75rem] h-[clamp(260px,40vh,440px)] max-md:my-12 md:my-16 overflow-hidden">
      <picture>
        {" "}
        <img
          src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/e8a859d5-moment-features-phone-typing-j8fhgwcm.webp"
          width="1280"
          height="1280"
          alt="Hands typing a quiet thought into a phone on a warm wooden table, evening light."
          loading="eager"
          className="w-full h-full absolute object-cover inset-0 overflow-clip"
        />
      </picture>
    </section>
  );
}
