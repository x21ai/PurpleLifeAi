import FooterIcon5 from "../../svgs/footer-icon-5";
import FooterIcon11 from "../../svgs/footer-icon-11";
import FooterIcon12 from "../../svgs/footer-icon-12";
import FooterIcon13 from "../../svgs/footer-icon-13";
import FooterIcon14 from "../../svgs/footer-icon-14";
import FooterIcon15 from "../../svgs/footer-icon-15";
import FooterIcon16 from "../../svgs/footer-icon-16";
import FooterIcon17 from "../../svgs/footer-icon-17";
import FooterIcon18 from "../../svgs/footer-icon-18";
import FooterIcon19 from "../../svgs/footer-icon-19";
import FooterIcon20 from "../../svgs/footer-icon-20";
import FooterIcon21 from "../../svgs/footer-icon-21";
import FooterIcon23 from "../../svgs/footer-icon-23";
const listItemClassName =
  "border-solid [color:inherit] bg-ploy-button-primary-background [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent";
const listItemClassName2 =
  "pointer-events-none [translate:16px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary";
const listItemClassName3 =
  "border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug [font-weight:inherit] text-sm block px-2 py-1 rounded-[0.875rem] border-input overflow-clip border";

/**
 * @ployComponent
 * @ployComponentId settings-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type ListItemProps = {
  text: string;
};

function ListItem({ text }: ListItemProps) {
  return (
    <button
      type="button"
      style={{ fontVariationSettings: "inherit" }}
      className="border-solid border-[rgb(37,32,47)] bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs block transition-colors px-3 py-1.5 rounded-full hover:bg-ploy-button-secondary-background border"
      data-ploy-component-type="button"
      data-ploy-component-variant="secondary"
    >
      {text}
    </button>
  );
}

type ListItem2Props = {
  className: string;
  text: string;
  text_1: string;
  text_2: string;
  id: string;
};

function ListItem2({ className, text, text_1, text_2, id }: ListItem2Props) {
  return (
    <div className={className}>
      <div className="min-w-0 grow basis-[0%]">
        <label
          style={{
            fontFamily:
              "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
          }}
          className="text-ploy-text-primary leading-normal font-medium"
        >
          {text}
        </label>
        <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-0.5">
          {text_1}
        </p>
        <p className="text-ploy-neutral-inverse-600/80 text-xs mt-0.5">
          {text_2}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          data-state="unchecked"
          value="on"
          id={id}
          style={{ fontVariationSettings: "inherit" }}
          className="border-solid text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent"
          data-ploy-component-type="button"
          data-ploy-component-variant="secondary"
        >
          <span
            data-state="unchecked"
            className="pointer-events-none [translate:0px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary"
          />
        </button>
      </div>
    </div>
  );
}

export const items: ListItemProps[] = [
  { text: "Epilepsy / seizures" },
  { text: "Migraine" },
  { text: "Cluster headache" },
  { text: "Parkinson's disease" },
  { text: "Multiple sclerosis" },
  { text: "Stroke recovery" },
  { text: "Peripheral neuropathy" },
  { text: "Autism / ASD" },
  { text: "ADHD" },
  { text: "Alzheimer's & dementia" },
  { text: "Depression" },
  { text: "Anxiety" },
  { text: "Bipolar disorder" },
  { text: "PTSD" },
  { text: "OCD" },
  { text: "Eating disorder" },
  { text: "High blood pressure" },
  { text: "Type 1 diabetes" },
  { text: "Type 2 diabetes" },
  { text: "Pre-diabetes" },
  { text: "High cholesterol" },
  { text: "Atrial fibrillation" },
  { text: "Heart failure" },
  { text: "Rheumatoid arthritis" },
  { text: "Lupus (SLE)" },
  { text: "Crohn's disease" },
  { text: "Ulcerative colitis" },
  { text: "Psoriasis" },
  { text: "Hashimoto's / hypothyroidism" },
  { text: "Celiac disease" },
  { text: "Asthma" },
  { text: "COPD" },
  { text: "Sleep apnea" },
  { text: "Fibromyalgia" },
  { text: "Chronic pain" },
  { text: "Long COVID / ME-CFS" },
  { text: "POTS / dysautonomia" },
  { text: "Ehlers-Danlos (hypermobility)" },
  { text: "IBS" },
  { text: "GERD" },
  { text: "Chronic kidney disease" },
  { text: "Cancer (in treatment / survivorship)" },
  { text: "Caregiving for someone" },
  { text: "General wellness" },
];

export const textSegments: ListItem2Props[] = [
  {
    className: "flex justify-between items-start gap-4 mb-3",
    text: "Aura / déjà vu",
    text_1: "Capture seizure warning signs as they happen.",
    text_2: "Default-on for seizure-prone",
    id: "feat-aura",
  },
  {
    className: "flex justify-between items-start gap-4 mb-3",
    text: "Seizure log",
    text_1: "Log seizures with type, duration, and triggers.",
    text_2: "Default-on for seizure-prone",
    id: "feat-seizure_log",
  },
  {
    className: "flex justify-between items-start gap-4",
    text: "Rescue medications",
    text_1: "Quick access to as-needed meds.",
    text_2: "Default-on for seizure-prone, headache, breathing",
    id: "feat-rescue_meds",
  },
];

export const textSegments2: ListItem2Props[] = [
  {
    className: "flex justify-between items-start gap-4 mb-3",
    text: "Blood pressure trend",
    text_1: "Chart systolic/diastolic from your reports over time.",
    text_2: "Default-on for cardiovascular, autonomic",
    id: "feat-bp_trend",
  },
  {
    className: "flex justify-between items-start gap-4 mb-3",
    text: "Glucose & HbA1c trend",
    text_1: "Chart glucose, HbA1c, and time-in-range.",
    text_2: "Default-on for blood sugar",
    id: "feat-glucose_trend",
  },
  {
    className: "flex justify-between items-start gap-4",
    text: "Cholesterol panel trend",
    text_1: "Chart LDL, HDL, total, and triglycerides over time.",
    text_2: "Off by default, opt in if useful",
    id: "feat-lipid_trend",
  },
];

export function FooterPart1() {
  return (
    <section className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-6 rounded-3xl max-md:p-5 md:p-6 border">
      <h2
        style={{
          fontFamily:
            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
        }}
        className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
      >
        {"Preferences"}
      </h2>
      <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
        {"How PurpleLife talks to you and which mind does the thinking."}
      </p>
      <div className="mt-6">
        <div className="mb-6">
          <label
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
          >
            <FooterIcon11 />
            {"Your focus"}
          </label>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
            {
              "What you're managing. Shapes prompts and how PurpleLife talks with you."
            }
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {items.map((item, index) => (
              <ListItem key={index} {...item} />
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              placeholder="Add your own (e.g. Heart health)"
              style={{ fontVariationSettings: "inherit" }}
              className="border-solid border-ploy-neutral-primary-s3 [color:inherit] [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] flex grow basis-[0%] shadow-sm transition-colors px-3 py-1 rounded-[0.875rem] border-input md:leading-snug overflow-clip border"
            />
            <button
              type="button"
              disabled={true}
              style={{ fontVariationSettings: "inherit" }}
              className="border-solid border-[rgb(37,32,47)] bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs flex items-center gap-1.5 opacity-50 px-3 py-1.5 rounded-full hover:bg-ploy-button-secondary-background border"
              data-ploy-component-type="button"
              data-ploy-component-variant="secondary"
            >
              <FooterIcon12 />
              {"Add"}
            </button>
          </div>
        </div>
        <div className="border-solid border-ploy-neutral-primary-s3 mb-6 pt-5 border-t">
          <label
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
          >
            <FooterIcon13 />
            {"AI model"}
          </label>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
            {"Which model answers your questions and reads your patterns."}
          </p>
          <div className="mt-3">
            <button
              type="button"
              role="combobox"
              aria-expanded="false"
              data-state="closed"
              id="ai-model"
              style={{ fontVariationSettings: "inherit" }}
              className="text-nowrap border-solid border-[rgb(37,32,47)] [color:inherit] leading-snug [font-weight:inherit] text-sm whitespace-nowrap h-9 flex justify-between items-center shadow-sm cursor-pointer px-3 py-2 rounded-[0.875rem] border-input max-md:w-full md:w-[22.5rem] border"
              data-ploy-component-type="button"
              data-ploy-component-variant="outline"
            >
              <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                <div className="text-nowrap flex flex-col items-start">
                  <span className="text-nowrap block">Gemini Flash</span>
                  <span className="text-nowrap text-ploy-neutral-inverse-600 leading-snug text-xs block">
                    {"Quickest replies. Best default."}
                  </span>
                </div>
              </span>{" "}
              <FooterIcon14 />
            </button>
          </div>
        </div>
        <div className="border-solid border-ploy-neutral-primary-s3 flex justify-between items-start gap-4 mb-6 pt-5 border-t">
          <div className="grow basis-[0%]">
            <label
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
            >
              <FooterIcon15 />
              {"Floating Ask button"}
            </label>
            <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
              {
                "Show a small Ask PurpleLife bubble on every screen so you can chat without leaving what you're doing."
              }
            </p>
          </div>
          <button
            type="button"
            role="switch"
            data-state="checked"
            value="on"
            id="floating-ask"
            style={{ fontVariationSettings: "inherit" }}
            className={listItemClassName}
            data-ploy-component-type="button"
            data-ploy-component-variant="primary"
          >
            <span data-state="checked" className={listItemClassName2} />
          </button>
        </div>
        <div className="border-solid border-ploy-neutral-primary-s3 mb-6 pt-5 border-t">
          <label
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
          >
            <FooterIcon16 />
            {"Sleep window"}
          </label>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
            {
              "Doses that fall during your sleep are flagged with a moon icon so you know to take them when you wake."
            }
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <label className="text-ploy-neutral-inverse-600 leading-snug font-medium text-sm block">
                {"Wake"}
              </label>
              <input
                id="wake-time"
                type="time"
                value="07:00"
                style={{ fontVariationSettings: "inherit" }}
                className={listItemClassName3}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-ploy-neutral-inverse-600 leading-snug font-medium text-sm block">
                {"Sleep"}
              </label>
              <input
                id="sleep-time"
                type="time"
                value="23:00"
                style={{ fontVariationSettings: "inherit" }}
                className={listItemClassName3}
              />
            </div>
          </div>
        </div>
        <div className="border-solid border-ploy-neutral-primary-s3 mb-6 pt-5 border-t">
          <label
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
          >
            <FooterIcon17 />
            {"Reminder snooze"}
          </label>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
            {
              'How long "Snooze" pushes a dose reminder out, and how often a critical-style alarm repeats.'
            }
          </p>
          <div className="mt-3">
            <button
              type="button"
              role="combobox"
              aria-expanded="false"
              data-state="closed"
              id="snooze-min"
              style={{ fontVariationSettings: "inherit" }}
              className="text-nowrap border-solid border-[rgb(37,32,47)] [color:inherit] leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-40 h-9 flex justify-between items-center shadow-sm cursor-pointer px-3 py-2 rounded-[0.875rem] border-input border"
              data-ploy-component-type="button"
              data-ploy-component-variant="outline"
            >
              <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                {"10 minutes"}
              </span>{" "}
              <FooterIcon14 />
            </button>
          </div>
        </div>
        <div className="border-solid border-ploy-neutral-primary-s3 mb-6 pt-5 border-t">
          <label
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
          >
            <FooterIcon18 />
            {"Daily water goal"}
          </label>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
            {
              "Target volume used on the Hydration timeline. Between 250 and 10,000 ml."
            }
          </p>
          <div className="flex items-center gap-2 mt-3">
            <input
              id="water-goal"
              min="250"
              max="10000"
              step="50"
              type="number"
              value="2000"
              style={{ fontVariationSettings: "inherit" }}
              className="border-solid border-ploy-neutral-primary-s3 [color:inherit] [font-weight:inherit] text-sm w-[calc((.25rem)_*_32)] h-[calc((.25rem)_*_9)] flex shadow-sm transition-colors px-3 py-1 rounded-[0.875rem] border-input md:leading-snug overflow-clip border"
            />
            <span className="text-ploy-neutral-inverse-600 leading-snug text-sm block">
              {"ml"}
            </span>
            <span className="text-ploy-neutral-inverse-600 leading-snug text-xs block">
              {"≈ 2.0 L"}
            </span>
          </div>
        </div>
        <div className="border-solid border-ploy-neutral-primary-s3 mb-6 pt-5 border-t">
          <label
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
          >
            <FooterIcon19 />
            {"Quiet hours"}
          </label>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
            {
              "Dose reminders go silent during this window. The dose still shows on Today · PurpleLife just doesn't push a notification."
            }
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <label className="text-ploy-neutral-inverse-600 leading-snug font-medium text-sm block">
                {"From"}
              </label>
              <input
                id="quiet-start"
                type="time"
                style={{ fontVariationSettings: "inherit" }}
                className={listItemClassName3}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-ploy-neutral-inverse-600 leading-snug font-medium text-sm block">
                {"Until"}
              </label>
              <input
                id="quiet-end"
                type="time"
                style={{ fontVariationSettings: "inherit" }}
                className={listItemClassName3}
              />
            </div>
          </div>
        </div>
        <div className="border-solid border-ploy-neutral-primary-s3 flex justify-between items-start gap-4 mb-6 pt-5 border-t">
          <div className="grow basis-[0%]">
            <label
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-normal font-medium flex items-center gap-2"
            >
              <FooterIcon20 />
              {"Weekly recap email"}
            </label>
            <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
              {
                "A short Sunday summary of your week, events, doses, and one pattern PurpleLife noticed."
              }
            </p>
          </div>
          <button
            type="button"
            role="switch"
            data-state="checked"
            value="on"
            id="weekly-digest"
            style={{ fontVariationSettings: "inherit" }}
            className={listItemClassName}
            data-ploy-component-type="button"
            data-ploy-component-variant="primary"
          >
            <span data-state="checked" className={listItemClassName2} />
          </button>
        </div>
        <a
          href="/settings/how-purple-thinks"
          className="border-solid border-[rgb(37,32,47)] [color:inherit] flex justify-between items-center transition-colors -mx-1 pt-5 px-1 rounded-2xl border-t hover:bg-ploy-neutral-primary-s3/40"
          data-ploy-component-type="button"
          data-ploy-component-variant="outline"
        >
          <div className="flex items-center gap-2">
            <FooterIcon21 />
            <div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className="text-ploy-text-primary leading-normal"
              >
                {"How PurpleLife thinks"}
              </p>
              <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                {"What it reads, when it acts, what stays private."}
              </p>
            </div>
          </div>
          <FooterIcon5 />
        </a>
      </div>
    </section>
  );
}

export function FooterPart2() {
  return (
    <section className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-6 rounded-3xl max-md:p-5 md:p-6 border">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl flex items-center gap-2"
          >
            <FooterIcon23 />
            {"What I track"}
          </h2>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm max-w-[36.1856rem] mt-1">
            {
              "Each tracker turns on by default for the conditions it helps with. Turn anything on or off, your call, not your diagnosis's."
            }
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-6">
          <p className="text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase mb-2">
            {"Hydration"}
          </p>
          <div>
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 grow basis-[0%]">
                <label
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal font-medium"
                >
                  {"Hydration"}
                </label>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-0.5">
                  {"Log water and electrolytes throughout the day."}
                </p>
                <p className="text-ploy-neutral-inverse-600/80 text-xs mt-0.5">
                  {"On for everyone by default"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  data-state="checked"
                  value="on"
                  id="feat-hydration"
                  style={{ fontVariationSettings: "inherit" }}
                  className={listItemClassName}
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <span data-state="checked" className={listItemClassName2} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase mb-2">
            {"Neurology"}
          </p>
          <div>
            {textSegments.map((item, index) => (
              <ListItem2 key={index} {...item} />
            ))}
          </div>
        </div>
        <div className="mb-6">
          <p className="text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase mb-2">
            {"Cardio & metabolic"}
          </p>
          <div>
            {textSegments2.map((item, index) => (
              <ListItem2 key={index} {...item} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase mb-2">
            {"Sleep & recovery"}
          </p>
          <div>
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 grow basis-[0%]">
                <label
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal font-medium"
                >
                  {"Oura ring sync "}
                  <span className="bg-ploy-neutral-primary-s3 text-ploy-neutral-inverse-600 text-xs tracking-wide uppercase ml-2 px-2 py-0.5 rounded-full">
                    {"Device"}
                  </span>
                </label>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-0.5">
                  {"Pull readiness, sleep, and recovery from Oura."}
                </p>
                <p className="text-ploy-neutral-inverse-600/80 text-xs mt-0.5">
                  {"Off by default, opt in if useful"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  data-state="unchecked"
                  value="on"
                  id="feat-oura_sync"
                  style={{ fontVariationSettings: "inherit" }}
                  className="border-solid text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="secondary"
                >
                  <span
                    data-state="unchecked"
                    className="pointer-events-none [translate:0px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
