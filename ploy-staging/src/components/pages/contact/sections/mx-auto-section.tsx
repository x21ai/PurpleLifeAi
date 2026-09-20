import { type FormEvent, useState } from "react";
import { submitForm } from "@/lib/ploy-forms/submit-form";

const inputClassName =
  "border-solid border-ploy-neutral-primary-900 bg-white/65 [color:inherit] [font-weight:inherit] text-sm w-full h-12 flex shadow-sm transition-colors mt-1.5 px-4 rounded-[1.25rem] border-input outline-none focus:ring-2 focus:ring-ploy-accent-primary/25 md:leading-snug overflow-clip border";

/**
 * @ployComponent
 * @ployComponentId contact-mx-auto-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Branded contact form using PurpleLife's built-in submission capture with clear sending, success, and error states.
 * @ployComponentStatus experimental
 */
export default function MxAutoSection() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    try {
      await submitForm("PurpleLife contact", data);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16 md:px-10 md:py-24">
      <form onSubmit={handleSubmit} className="mb-0 rounded-[2rem] bg-white/55 p-5 shadow-sm ring-1 ring-ploy-neutral-primary-900 md:p-7">
        <div className="mb-5">
          <label htmlFor="contact-name" className="text-sm font-medium leading-none">Your name</label>
          <input id="contact-name" name="name" maxLength={200} required className={inputClassName} />
        </div>
        <div className="mb-5">
          <label htmlFor="contact-email" className="text-sm font-medium leading-none">Email</label>
          <input type="email" id="contact-email" name="email" maxLength={320} required className={inputClassName} />
        </div>
        <div className="mb-5">
          <label htmlFor="contact-subject" className="text-sm font-medium leading-none">Subject <span className="font-normal text-ploy-neutral-inverse-600">optional</span></label>
          <input id="contact-subject" name="subject" maxLength={200} className={inputClassName} />
        </div>
        <div className="mb-5">
          <label htmlFor="contact-message" className="text-sm font-medium leading-none">Message</label>
          <textarea id="contact-message" name="message" maxLength={5000} required rows={6} className="mt-1.5 min-h-[10rem] w-full resize-y rounded-[1.25rem] border border-solid border-ploy-neutral-primary-900 bg-white/65 px-4 py-3 text-sm leading-relaxed outline-none shadow-sm focus:ring-2 focus:ring-ploy-accent-primary/25" />
        </div>
        <button type="submit" disabled={status === "sending"} className="inline-flex h-12 w-full items-center justify-center rounded-[1.25rem] bg-ploy-background-inverse px-4 py-2 text-sm font-medium text-ploy-text-inverse shadow-sm transition-opacity hover:opacity-90 disabled:opacity-55">
          {status === "sending" ? "Sending" : "Send message"}
        </button>
        {status === "sent" && <p role="status" className="mt-4 text-center text-sm font-medium text-ploy-text-primary">Thank you. Your message was sent.</p>}
        {status === "error" && <p role="alert" className="mt-4 text-center text-sm font-medium text-ploy-accent-primary">Your message could not be sent. Please try again.</p>}
        <p className="mt-4 text-center text-xs leading-relaxed text-ploy-neutral-inverse-600">Please leave private health information out of this message.</p>
      </form>
    </main>
  );
}
