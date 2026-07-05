/// Marketing page copy aligned with TanStack routes and en.json intent.
abstract final class MarketingCopy {
  // Home
  static const homeEyebrow = 'A quiet companion for your health';
  static const homeHeadline = 'Your health,\nremembered.';
  static const homeBody =
      'Write it. Say it. Snap it. Purple keeps it, and helps you see what matters.';
  static const homeCtaPrimary = 'Begin today';
  static const homeCtaSecondary = 'See how it works';
  static const homeQuote =
      'Last night I wrote three sentences. That was enough.';
  static const homeQuoteAttribution = 'What using Purple actually feels like';
  static const homeAudienceEyebrow = 'For the days that need attention';
  static const homeAudienceHeadline =
      'Epilepsy. Migraine. Diabetes.\nMental health. And more.';
  static const homeAudienceBody =
      'The alternatives feel cold and clinical. Purple is warm, quiet, and patient, the way a journal should be.';

  static const pillarCaptureEyebrow = 'Capture';
  static const pillarCaptureTitle = 'A second is enough.';
  static const pillarCaptureBody =
      'Type a sentence. Hold the mic and talk. Snap a photo. Purple tags it, summarizes it, and tucks it into the right place.';

  static const pillarAskEyebrow = 'Ask';
  static const pillarAskTitle = 'Today is a new page.';
  static const pillarAskBody =
      'A quiet bubble waits on every screen. Ask about your sleep, your meds, the pattern you can almost see.';

  static const pillarTogetherEyebrow = 'Together';
  static const pillarTogetherTitle = 'No one should do this alone.';
  static const pillarTogetherBody =
      'Share read-only access with the people who help. They see what you choose, nothing more.';

  static const homeStat = 'Free. Forever.';
  static const homeStatCaption =
      'For the people who need it most, and the people who help them carry it.';

  static const homeCaregiverQuote =
      'My mom can see my week without me having to explain it again.';
  static const homeCaregiverAttribution =
      'On sharing with the people who help';

  static const homePrivacyHeadline = 'Your story is yours.';
  static const homePrivacyBody =
      'Encrypted at rest. Export or delete anything, any time. No ads. No selling. No third-party trackers, ever.';

  static const homeFinalEyebrow = 'Free forever · Open source';
  static const homeFinalHeadline = 'Begin where you are.';
  static const homeFinalBody =
      'One page is all it takes. Purple will be here tomorrow, and the day after that.';
  static const homeFinalCta = 'Create your free account';
  static const homeFinalSecondary = 'Read our story';

  // Pricing
  static const pricingEyebrow = 'Pricing';
  static const pricingHeadline = 'Simple plans.\nHonest pricing.';
  static const pricingIntro =
      'Purple is free for everyone right now. The plans below are how we\'ll keep the lights on later, with plenty of notice.';
  static const pricingBanner = 'Free for everyone · no payment needed today';

  static const pricingFreeLabel = 'Free';
  static const pricingFreePrice = '\$0';
  static const pricingFreeSub = 'forever, for everyone';
  static const pricingFreeCta = 'Get started free';

  static const pricingProLabel = 'Purple Pro';
  static const pricingProMonthly = '\$9.99';
  static const pricingProYearly = '\$99';
  static const pricingProMonthlySub = 'per month';
  static const pricingProYearlySub = 'per year · save 17%';
  static const pricingProCta = 'Upgrade to Pro';
  static const pricingProCurrent = 'You\'re on Pro today';

  static const pricingFaqTitle = 'Questions';
  static const pricingCtaTitle = 'Begin today.';
  static const pricingCtaSub = 'Free for everyone. No card needed.';

  static const freeFeatures = [
    'Unlimited journal entries, text, voice, photo, video',
    'Daily AI risk forecast tailored to your history',
    'Unified timeline with filters and free-text search',
    'Medication tracking, reminders, adherence, refills',
    'Seizure log with backdating',
    'Oura, Whoop & Apple Health biometrics',
    'Ask Purple, up to 10 messages per day',
    'One caregiver, read-only by default',
    'Travel mode that shifts your meds across time zones',
    'Export everything to JSON or PDF, any time',
  ];

  static const proFeatures = [
    'Everything in Free',
    'DNA upload & curated trait insights',
    'Unlimited Ask Purple',
    'Share medical reports with clinicians',
    'Schedule monthly auto-reports',
    'Unlimited caregivers',
    'Priority support',
  ];

  static const pricingFaqs = [
    (
      q: 'Is Purple really free right now?',
      a:
          'Yes. Every signed-in user, new or existing, has full Pro access today. No payment, no trial, no card on file.',
    ),
    (
      q: 'What happens when paid plans turn on?',
      a:
          'We\'ll announce it in-app well before any change. Your data stays yours, your free features stay free, and you\'ll only see Pro prompts on the four Pro-only surfaces: DNA insights, unlimited Ask Purple, report sharing, and additional caregivers.',
    ),
    (
      q: 'Can I cancel any time?',
      a:
          'Yes. When paid plans go live, you\'ll cancel from your account in one click. No phone calls, no retention scripts.',
    ),
    (
      q: 'Do you sell my data?',
      a:
          'No. No ads, no third-party trackers, no selling. The product is the product, not you.',
    ),
    (
      q: 'Is Purple open source?',
      a:
          'The Purple app is built in the open and you can self-host the core. Get in touch if you want the bundle.',
    ),
  ];

  // Privacy (marketing page, not settings privacy)
  static const privacyEyebrow = 'About Purple';
  static const privacyTitle = 'Privacy & safety.';
  static const privacyIntro =
      'Your health story is yours. Here\'s exactly how we treat it.';

  // About
  static const aboutEyebrow = 'About Purple';
  static const aboutHeadline = 'Calm, quiet,\non your side.';
  static const aboutWhyEyebrow = 'Why Purple exists';
  static const aboutWhyTitle = 'Most health apps feel like spreadsheets.';
  static const aboutWhyP1 =
      'Living with a chronic condition means watching your body, your meds, your sleep, your moods. Every day. The tools that try to help are cold, demanding, full of charts that don\'t answer the question you actually have.';
  static const aboutWhyP2 =
      'Purple listens before it speaks. It takes whatever you can give it, a sentence, a voice memo, a photo, and quietly builds a picture of you over time. When you have a question, Purple has read the chapters that matter.';
  static const aboutQuote =
      'It\'s here when I need it, and quiet when I don\'t.';
  static const aboutQuoteAttribution = 'What we\'re building toward';
  static const aboutStat = 'Named for the color of epilepsy awareness.';
  static const aboutStatCaption = 'Built for anyone carrying something heavy.';
  static const aboutCaregiverQuote = 'No one should do this alone.';
  static const aboutCaregiverAttribution =
      'On caregivers, family, and the people who help';
  static const aboutPromisesEyebrow = 'The promises we keep';
  static const aboutBandHeadline = 'Free, open, yours.';
  static const aboutBandBody =
      'Open source on GitHub. No ads. No selling your data. No third-party trackers, ever.';

  static const aboutPromises = [
    ('Free, forever.', 'For individuals and the people who care for them.'),
    ('Open source.', 'Apache 2.0. Read the code, fork it, run your own copy.'),
    ('No ads. Ever.', 'Nothing in Purple is paid to be there.'),
    ('Your story is yours.', 'Export it or delete it, whenever you want.'),
    (
      'Not a medical device.',
      'Purple supports you and your clinician. It doesn\'t replace either of you.',
    ),
  ];

  // Trust
  static const trustEyebrow = 'Trust';
  static const trustHeadline = 'Why Purple\nis different.';
  static const trustSectionEyebrow = 'In writing';
  static const trustSectionTitle = 'Promises you can check.';
  static const trustSectionIntro =
      'Health software asks for the most private things you have. That deserves more than a privacy policy nobody reads. Each claim below is true in the code today, and the code is public.';

  static const trustClaims = [
    (
      title: 'No ads. No trackers. No analytics.',
      body:
          'There is no advertising code, no third-party tracker, and no analytics script anywhere in Purple. Nothing watches you use it. The page you are reading loads from our servers and nowhere else.',
    ),
    (
      title: 'Open source.',
      body:
          'The entire codebase is public. Read it, audit it, fork it, run your own copy. Every promise on this page can be checked against the code rather than taken on faith.',
    ),
    (
      title: 'Private by architecture.',
      body:
          'Every table is protected by row-level security, so your rows are readable by you and no one else. Photos and voice notes live behind signed, expiring links. Caregivers see only what you choose to share, scope by scope, and every access is written to an audit log you can review.',
    ),
    (
      title: 'Your entries train nothing.',
      body:
          'When Purple\'s AI reads your journal, it reads it to answer you, and that is all. Your words are the prompt, never the training data. No model is built from your health story.',
    ),
    (
      title: 'Free forever.',
      body:
          'Everything health-critical stays free: journaling, medications, reminders, patterns, caregivers. Pro exists to fund the mission, not to hold your safety behind a paywall.',
    ),
    (
      title: 'The covenant.',
      body:
          'Purple will never sell your data. Purple will refuse acquisition by anyone who would. These are not growth-stage promises to be renegotiated later; they are the reason this exists.',
    ),
  ];

  static const trustFounderName = 'Devyn Walker';
  static const trustFounderRole = 'Founder';
  static const trustCharterNote =
      'The longer version of these commitments lives in the Charter.';

  // Header / footer
  static const wordmark = 'Purple';
  static const navAbout = 'About';
  static const navPricing = 'Pricing';
  static const navContact = 'Contact';
  static const navSignIn = 'Sign in';
  static const navGetStarted = 'Get started';
  static const navOpenApp = 'Open app';

  static const footerTrust = 'Trust';
  static const footerPrivacy = 'Privacy';
  static const footerTerms = 'Terms';
  static const footerGitHub = 'GitHub';
  static const footerCopyright = '© {year} Purple · Free forever · Built by X21 Ai';
}
