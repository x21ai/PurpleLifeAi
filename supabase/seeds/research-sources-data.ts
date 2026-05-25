export type ResearchSourceSeed = {
  title: string;
  authors?: string;
  publication: string;
  year: number;
  url: string;
  source_type: "peer_review" | "guideline" | "foundation" | "government" | "review";
  evidence_grade: "A" | "B" | "C" | "expert";
  abstract: string;
  content: string;
};

/** Curated epilepsy research library. Content is excerpted from cited sources only. */
export const RESEARCH_SOURCE_ENTRIES: ResearchSourceSeed[] = [
  {
    title: "Types of Seizures",
    publication: "Epilepsy Foundation",
    year: 2026,
    url: "https://www.epilepsy.com/what-is-epilepsy/seizure-types",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Overview of how the International League Against Epilepsy classifies seizures by onset (focal, generalized, unknown), consciousness, and observable manifestations.",
    content: `New terms to describe and classify seizures have been developed by the International League Against Epilepsy. This was done to make the names of seizures more accurate, less confusing, and more descriptive of what is happening.

The new terms consider: (1) The onset or beginning of a seizure: where seizures start in the brain tells a lot about what may occur during a seizure and what treatment may be best. When we do not know if a seizure is focal or generalized in onset, the wrong treatment may be used. (2) A person's level of consciousness during a seizure: whether a person is aware and responsive. We assess awareness by whether the person can recall what happened; responsiveness by whether they can follow a simple command. (3) Observable manifestations during a seizure.

Generalized seizures affect both sides of the brain at the same time. Examples include absence and atonic seizures. Tonic-clonic seizures can start as generalized or spread from a focal seizure.

Focal seizures start in one area or group of cells on one side of the brain. Focal seizure with preserved consciousness: the person is awake and aware (formerly focal aware). Focal seizure with impaired consciousness: awareness is affected (formerly focal impaired awareness). A focal seizure can spread to both sides and become a focal to bilateral tonic-clonic seizure.

Unknown whether focal or generalized seizure is used when the beginning is not known. As more information is learned, the type may be reclassified.`,
  },
  {
    title: "Updated classification of epileptic seizures (ILAE 2025)",
    authors: "Beniczky S, Trinka E, Wirrell E, et al.",
    publication: "Epilepsia / International League Against Epilepsy",
    year: 2025,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12169392/",
    source_type: "guideline",
    evidence_grade: "A",
    abstract:
      "ILAE position paper updating operational seizure classification: four main classes, 21 seizure types, with revised rules for consciousness and observable manifestations.",
    content: `The International League Against Epilepsy (ILAE) has updated the operational classification of epileptic seizures, building upon the framework established in 2017. The updated classification maintains four main seizure classes: Focal, Generalized, Unknown (whether focal or generalized), and Unclassified — and comprises 21 seizure types, in contrast to 63 seizure types in the 2017 classification.

Six key changes: (1) "Onset" is removed from the names of the four main seizure classes. (2) A distinction is made between classifiers and descriptors. Classifiers reflect biological classes and directly impact clinical management. (3) "Consciousness" replaces "awareness" as a classifier, defined by both awareness and responsiveness. (4) Motor vs. non-motor is replaced by observable vs. non-observable manifestations. (5) Seizures are described by chronological sequence of signs and symptoms. (6) Epileptic negative myoclonus is recognized as a seizure type. Seizures in neonates are addressed in a separate position paper.`,
  },
  {
    title: "Epilepsy Basics",
    publication: "Centers for Disease Control and Prevention",
    year: 2024,
    url: "https://www.cdc.gov/epilepsy/about/index.html",
    source_type: "government",
    evidence_grade: "expert",
    abstract:
      "CDC overview of epilepsy prevalence, signs that seizures may not look like convulsions, and common causes including preventable factors.",
    content: `Epilepsy is a brain disorder that causes repeated seizures. A seizure is a change in normal brain activity that lasts from a few seconds to a few minutes. Epilepsy is not contagious.

CDC estimates that about 2.9 million U.S. adults had active epilepsy in 2021. An estimated 456,000 U.S. children 17 or younger had active epilepsy in 2022. Many people do well with treatment and live a typical life.

The signs of a seizure depend on the type. More often, someone having a seizure may seem confused, stare into space, wander, make unusual movements, or be unable to answer questions — not only falling and shaking.

Epilepsy can be caused by cysticercosis infection, brain tumor, traumatic brain injury, loss of oxygen to the brain, genetic conditions, and other neurological diseases. Less than half of newly diagnosed cases have a known cause.`,
  },
  {
    title: "First Aid for Seizures",
    publication: "Centers for Disease Control and Prevention",
    year: 2024,
    url: "https://www.cdc.gov/epilepsy/first-aid-for-seizures/index.html",
    source_type: "government",
    evidence_grade: "expert",
    abstract:
      "Step-by-step seizure first aid: stay calm, protect from injury, time the seizure, and when to call emergency services.",
    content: `About 1 in 10 people in the United States may have a seizure in their lifetime.

Keep yourself and others calm. Stay with the person. Remove anything near them that can cause injury. Check for a medical bracelet. If lying down, turn them gently on their side with mouth pointing to the ground. Time the seizure; if it lasts more than 5 minutes, seek immediate medical attention or call 911. When the seizure is over, help them sit safely and explain what happened.

For generalized seizures: ease them to the ground, turn on one side, clear the space, put something soft under the head, loosen anything around the neck, time the seizure.

Call 911 if: the seizure lasts longer than 5 minutes; another seizure follows soon; trouble breathing or waking; injury; seizure in water; first seizure ever; diabetes with loss of consciousness; pregnancy.

Do not hold the person down, put anything in their mouth, or give mouth-to-mouth during the seizure. Do not offer water or food until fully alert.`,
  },
  {
    title: "Epilepsies in children, young people and adults (NICE NG217)",
    publication: "National Institute for Health and Care Excellence",
    year: 2025,
    url: "https://www.nice.org.uk/guidance/ng217",
    source_type: "guideline",
    evidence_grade: "A",
    abstract:
      "NICE guideline on diagnosing and managing epilepsy in primary and secondary care, including treatment principles and epilepsy-related death risk reduction.",
    content: `This guideline covers diagnosing and managing epilepsy in children, young people and adults in primary and secondary care. It aims to improve diagnosis and treatment for different seizure types and epilepsy syndromes, and reduce risks for people with epilepsy.

Recommendations cover referral and diagnosis, information and support, principles of treatment and withdrawal, treating epileptic seizures and childhood-onset epilepsies, non-pharmacological treatments, status epilepticus and cluster seizures, managing comorbidities, reducing the risk of epilepsy-related death including SUDEP, and referral to tertiary services.

MHRA advice on antiepileptic drugs in pregnancy is incorporated for carbamazepine, lamotrigine, levetiracetam, oxcarbazepine, valproate, and others. Valproate must not be started for the first time in people younger than 55 years unless two specialists document no other effective treatment. Valproate must not be used in women and girls of childbearing potential unless other options are unsuitable and the Pregnancy Prevention Programme is in place.`,
  },
  {
    title: "Levetiracetam",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/tools-resources/seizure-medication-list/levetiracetam",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Patient-oriented guide to levetiracetam (Keppra): approved seizure types, dosing, mechanism, effectiveness, and common side effects.",
    content: `Levetiracetam is the generic name for Keppra. It is approved as add-on therapy for focal (partial) seizures in children 1 month and older and adults; for myoclonic seizures in juvenile myoclonic epilepsy (12+); and for generalized onset tonic-clonic seizures (6+).

Adults and teens 16+: usually started at 250 or 500 mg twice daily, increased by 500 mg twice daily every 2 weeks; recommended dose 1500 mg twice daily (3000 mg daily).

Levetiracetam works differently from most seizure medicines: it binds SV2A involved in neurotransmitter release. The liver does not substantially metabolize it; the body clears it through the kidneys.

In studies as add-on, 20 to 40% had at least 50% seizure reduction. Common side effects: dizziness, headache, irritability, sleepiness, mood and behavior changes. Serious risks include allergic reactions, coordination problems, mood changes (more often in young children), severe skin reactions, and suicidality (FDA alert). Do not stop suddenly — can cause status epilepticus.`,
  },
  {
    title: "Levetiracetam add-on for drug-resistant focal epilepsy",
    authors: "Nevitt SJ, Marson AG, et al.",
    publication: "Cochrane Database of Systematic Reviews",
    year: 2020,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7387854/",
    source_type: "review",
    evidence_grade: "A",
    abstract:
      "Cochrane review: add-on levetiracetam versus placebo for drug-resistant focal epilepsy in adults and children.",
    content: `Objectives: To evaluate the effectiveness of levetiracetam when used as add-on treatment for people with drug-resistant focal epilepsy.

Main results: 14 trials (2455 participants). Levetiracetam was significantly better than placebo when pooled across doses 1000–3000 mg/day (RR 2.37, 95% CI 2.02 to 2.78; moderate-certainty evidence). Dose-response: odds of 50% response increased by nearly 40% per 1000 mg increase. A 500 mg daily dose was no more effective than placebo.

Participants were not significantly more likely to experience treatment withdrawal (high-certainty). Somnolence affected 13% and was associated with levetiracetam (moderate-certainty). Behaviour changes were negligible in adults (1%) but significant in children (23%).

Authors' conclusions: In drug-resistant focal epilepsy, add-on levetiracetam is more effective than placebo at reducing seizure frequency, unlikely to be stopped by patients, with minimal adverse effects outside potential worsening behaviour in children.`,
  },
  {
    title: "Safety of Levetiracetam in Paediatrics: A Systematic Review",
    authors: "Egunsola O, Choonara I, Sammons HM",
    publication: "PLOS ONE",
    year: 2016,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4773020/",
    source_type: "peer_review",
    evidence_grade: "B",
    abstract:
      "Systematic review of adverse events associated with levetiracetam in children with epilepsy.",
    content: `Objective: To identify adverse events (AEs) associated with levetiracetam (LEV) in children.

Methods: EMBASE and Medline searched for paediatric patients (≤18 years) receiving LEV for epilepsy. 67 articles, 3174 patients, 1913 AEs reported.

Results: Most common AEs were behavioural problems (10.9% of AEs in prospective studies) and somnolence (8.4%). 47% of children in prospective studies reporting AEs experienced at least one AE. Significantly more children on polytherapy (64%) than monotherapy (22%) had AEs (p<0.001). LEV discontinued in 4.5% on polytherapy and 0.9% on monotherapy, mostly due to behavioural problems.

Conclusion: Behavioural problems and somnolence were the most prevalent AEs and most common causes of discontinuation. Children on polytherapy have greater risk than monotherapy.`,
  },
  {
    title:
      "Safety and efficacy of levetiracetam for partial onset seizures in children from one month of age",
    authors: "Cormier J, Chu CJ",
    publication: "Neuropsychiatric Disease and Treatment",
    year: 2013,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3582481/",
    source_type: "peer_review",
    evidence_grade: "B",
    abstract:
      "Review of pharmacology, efficacy, and tolerability of levetiracetam in pediatric partial onset seizures after FDA approval down to one month.",
    content: `Epilepsy affects up to one percent of children. Of 34 anticonvulsants approved by the FDA, only 13 are approved for children; only three evaluated for use under age 2 before levetiracetam's 2012 approval as adjunctive therapy for partial onset seizures from one month of age.

Levetiracetam binds SV2A. Formulations include tablets, oral solution (100 mg/mL), and injection. Pharmacokinetics in children differ by age and weight.

Available pediatric data leading to approval are encouraging for partial onset seizures from one month, although more work is needed across age groups before definitive efficacy conclusions.`,
  },
  {
    title: "Lamotrigine",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/tools-resources/seizure-medication-list/lamotrigine",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Epilepsy Foundation guide to lamotrigine (Lamictal), including interactions with valproate and pregnancy considerations.",
    content: `Lamotrigine (Lamictal) is used for focal and generalized seizures. Valproate (Depakote and related medicines) raises lamotrigine blood levels substantially — people on both need smaller lamotrigine doses. Children on valproate may need very small lamotrigine doses compared to those not on valproate.

Lamotrigine is Pregnancy Category C: caution advised; benefits may outweigh risks. Animal studies show some harm; human data limited. Women capable of pregnancy should take folic acid daily (400 mcg; 4 mg if high risk).

About 20–35% of women have more seizures during pregnancy due to hormones or drug handling — particularly noted with lamotrigine. Doctors should check blood levels regularly during pregnancy.`,
  },
  {
    title: "Lamotrigine add-on therapy for drug-resistant focal epilepsy",
    authors: "Nevitt SJ, Marson AG, et al.",
    publication: "Cochrane Database of Systematic Reviews",
    year: 2024,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10712213/",
    source_type: "review",
    evidence_grade: "A",
    abstract: "Updated Cochrane review of add-on lamotrigine for drug-resistant focal epilepsy.",
    content: `Background: Epilepsy affects 0.5–1% of the population. Nearly 30% have drug-resistant epilepsy. Lamotrigine is a second-generation antiseizure medication used as add-on.

Objectives: To evaluate benefits and harms of add-on lamotrigine compared with add-on placebo or other drugs for drug-resistant focal epilepsy.

This updated Cochrane review assesses randomized placebo-controlled trials of add-on lamotrigine, including seizure frequency outcomes, treatment withdrawal, adverse effects, cognition, and quality of life — informing whether lamotrigine reduces seizures versus placebo in refractory focal epilepsy.`,
  },
  {
    title: "Valproic Acid",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/tools-resources/seizure-medication-list/valproic-acid",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Foundation guide to valproic acid/valproate (Depakene, Depakote): broad-spectrum use and drug interactions.",
    content: `Valproic acid is the generic form; valproate is the active form in the body. Depakote (divalproex) converts to valproate. Available as capsules and syrup in the U.S. (Depakene).

Used to treat juvenile myoclonic epilepsy, Lennox-Gastaut syndrome, focal seizures, myoclonic seizures, and tonic-clonic seizures.

Valproic acid affects levels of many other seizure medicines including felbamate, lamotrigine, primidone, and phenobarbital — doses often need adjustment when combined.

Broad-spectrum antiseizure medicine; significant pregnancy risks (birth defects, MHRA/NICE restrictions). Typical adult dosing often 250–500 mg two or three times daily; extended-release forms exist.`,
  },
  {
    title:
      "Monotherapy treatment of epilepsy in pregnancy: congenital malformation outcomes in the child",
    authors: "Cochrane Epilepsy Group",
    publication: "Cochrane Database of Systematic Reviews",
    year: 2024,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10463554/",
    source_type: "review",
    evidence_grade: "A",
    abstract:
      "Cochrane review of prenatal antiseizure medication exposure and major congenital malformations, including valproate.",
    content: `Background: Prenatal exposure to certain antiseizure medications is associated with increased risk of major congenital malformations (MCM). Most women with epilepsy continue ASMs during pregnancy.

Objectives: To assess effects of prenatal ASM exposure on prevalence of MCM in the child.

This review compares monotherapy treatments including valproate, carbamazepine, lamotrigine, and levetiracetam for malformation outcomes — critical for counseling on valproate and other ASM risks in pregnancy.`,
  },
  {
    title: "Carbamazepine",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/tools-resources/seizure-medication-list/carbamazepine",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Guide to carbamazepine (Tegretol) for focal and generalized seizures: dosing, effectiveness, and interactions.",
    content: `Carbamazepine (Tegretol, Epitol) is approved alone or with other medicines for focal/partial seizures, generalized tonic-clonic seizures, and mixed seizure types in children and adults.

Adults usually start 100–200 mg daily, increased every 1–2 weeks; average 600–1200 mg daily (some need up to 2000 mg).

Studies suggest carbamazepine may control seizures in about 7 out of 10 people in trials, though everyday results vary. Works by slowing abnormal electrical activity in the brain.

Do not stop suddenly — can cause status epilepticus. Rash risk with oxcarbazepine or eslicarbazepine cross-reactivity. Phenytoin, phenobarbital, primidone, oxcarbazepine, and felbamate can lower carbamazepine levels.`,
  },
  {
    title: "Oxcarbazepine add-on for drug-resistant focal epilepsy",
    authors: "Bresnahan R, Atim-Oluk M, Marson AG",
    publication: "Cochrane Database of Systematic Reviews",
    year: 2020,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7059897/",
    source_type: "review",
    evidence_grade: "A",
    abstract: "Cochrane review of oxcarbazepine as add-on for drug-resistant focal epilepsy.",
    content: `Background: In ~30% of epilepsy, seizures remain uncontrolled on one antiepileptic drug. Oxcarbazepine is a keto-analogue of carbamazepine.

Objectives: To review effectiveness and tolerability of add-on oxcarbazepine versus placebo or other drugs for drug-resistant focal epilepsy.

This Cochrane review evaluates randomized trials of oxcarbazepine add-on for seizure frequency reduction, adverse effects, and treatment withdrawal in adults and children with refractory focal epilepsy.`,
  },
  {
    title: "Oxcarbazepine",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/tools-resources/seizure-medication-list/oxcarbazepine",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Patient guide to oxcarbazepine (Trileptal, Oxtellar XR) for focal seizures in adults and children.",
    content: `Oxcarbazepine (Trileptal; extended-release Oxtellar XR) treats focal/partial seizures.

Approved: alone or with other medicines in adults; alone in children age 4+; with other medicines in children age 2+.

Adults on oxcarbazepine alone: typically 600–1200 mg/day in two doses; with other medicines 1200–2400 mg/day possible.

Adults often start 300–600 mg/day divided twice daily, then increase. Estrogen-containing birth control may lower oxcarbazepine levels slightly; seizure control should be monitored when starting or stopping birth control.`,
  },
  {
    title: "Clobazam",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/tools-resources/seizure-medication-list/clobazam",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Guide to clobazam (Onfi, Sympazan) as add-on for seizures associated with Lennox-Gastaut syndrome and related types.",
    content: `Clobazam (Onfi, Sympazan) is approved as add-on for seizures in children 2+ and adults, including types associated with Lennox-Gastaut syndrome (absence, myoclonic, tonic-clonic, refractory seizures).

Studies show clobazam can decrease seizure frequency but rarely eliminates seizures. Higher recommended doses gave greater improvement than lower doses.

Some evidence suggests efficacy against photosensitive epilepsy and myoclonic seizures. Young adults often start 10 mg at night; children start lower (e.g., 5 mg) with slow increases every 5–7 days.`,
  },
  {
    title:
      "Efficacy and safety of adjunctive clobazam in Chinese patients with drug-resistant epilepsy",
    authors: "Zhang Y, Liu X, et al.",
    publication: "Frontiers in Neurology",
    year: 2026,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13061665/",
    source_type: "peer_review",
    evidence_grade: "B",
    abstract: "Real-world retrospective study of adjunctive clobazam in drug-resistant epilepsy.",
    content: `Objective: Evaluate efficacy and safety of adjunctive clobazam (CLB) in Chinese patients with drug-resistant epilepsy (DRE).

Methods: 121 DRE patients receiving adjunctive CLB; follow-up at 1, 3, 6, 9, 12+ months. Response defined as ≥50% reduction in seizure frequency.

Results: Retrospective single-center data on CLB dosing, seizure types, and adverse events in refractory epilepsy — informing real-world response rates and tolerability beyond trial populations.`,
  },
  {
    title: "Ketogenic diets for drug-resistant epilepsy",
    authors: "Cochrane Epilepsy Group",
    publication: "Cochrane Database of Systematic Reviews",
    year: 2018,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7387249/",
    source_type: "review",
    evidence_grade: "A",
    abstract:
      "Cochrane review of ketogenic and modified Atkins diets for drug-resistant epilepsy in children and adults.",
    content: `Background: Ketogenic diets (KDs) are high in fat and low in carbohydrates and have been suggested to reduce seizure frequency. Such diets are mainly recommended for children with drug-resistant epilepsy; less restrictive KDs (e.g., modified Atkins) extend into adult practice.

Objectives: To assess effects of ketogenic diets for people with drug-resistant epilepsy.

This updated Cochrane review searches trials comparing KDs to usual care or other diets for seizure outcomes and adverse effects in refractory epilepsy populations.`,
  },
  {
    title: "The Ketogenic Diet and Antiepileptic Drugs: A Good Mix?",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/stories/ketogenic-diet-and-antiepileptic-drugs-good-mix",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Overview of combining ketogenic diet therapy with antiseizure medications, including valproate.",
    content: `Valproic acid, topiramate, and zonisamide have overlapping side effects with ketogenic diet (traditionally concern for liver toxicity and pancreatitis with valproate plus diet). Recent clinical evidence (Lyczkowski et al., 2005) suggests valproic acid with ketogenic diet can be safe and well tolerated in some patients.

No single anticonvulsant has proven more effective in combination with the diet; some patients respond well to diet plus valproic acid. A 2007 study of ketogenic diet plus vagus nerve stimulation in 30 children found more than two-thirds reported additional benefits, well tolerated.`,
  },
  {
    title: "What Is Status Epilepticus?",
    publication: "Epilepsy Foundation",
    year: 2024,
    url: "https://www.epilepsy.com/complications-risks/emergencies/status-epilepticus",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Defines status epilepticus, common causes including missed medicines, and rescue therapy planning.",
    content: `Status epilepticus occurs when a seizure lasts more than 5 minutes, or seizures occur very close together without recovery of consciousness between them.

Convulsive status epilepticus: prolonged tonic-clonic seizures over 5 minutes, or repeated tonic-clonic seizures without recovery over 5 minutes. Post-ictal sleepiness can make it hard to tell when a seizure ends.

Missing doses of seizure medicine is the most common cause of breakthrough seizures and can trigger status epilepticus.

People at risk should discuss emergency rescue therapies with their doctor — medicines used only to prevent seizure emergencies.`,
  },
  {
    title: "Evidence-Based Guideline: Treatment of Convulsive Status Epilepticus in Children",
    authors: "Glauser T, Shinnar S, Gloss D, et al.",
    publication: "Neurology (American Academy of Neurology)",
    year: 2016,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4749120/",
    source_type: "guideline",
    evidence_grade: "A",
    abstract:
      "AAN evidence-based guideline on pharmacologic treatment of convulsive status epilepticus in children and adults.",
    content: `Context: The optimal pharmacologic treatment for early convulsive status epilepticus is unclear.

Objective: Analyze efficacy, tolerability and safety of anticonvulsant treatment of children and adults with convulsive status epilepticus and develop an evidence-based treatment algorithm.

Data sources: Structured literature review. Outcomes include seizure cessation, treatment failure, respiratory depression, and hypotension.

This guideline informs first-line and second-line ASM choices after benzodiazepines for convulsive status epilepticus in pediatric and adult populations.`,
  },
  {
    title: "Managing Triggers That Provoke Seizures",
    publication: "Epilepsy Foundation",
    year: 2024,
    url: "https://www.epilepsy.com/manage/managing-triggers",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "How to track and reduce personal seizure triggers including sleep, stress, alcohol, and menstrual cycles.",
    content: `Some people find seizures occur in a pattern or are more likely in certain situations. Tracking seizure triggers helps you avoid or manage them.

Write in a seizure diary: sleep, stress, alcohol or recreational drugs, illness, fever, and missed medicines — the most common triggers for many people. Note patterns: sickness, night seizures, stress, or menstrual cycle timing.

Steps to reduce exposure: adjust medicines with your team; reduce stress; practice sleep hygiene (consistent bed/wake times); reduce alcohol or drugs if they trigger seizures; for menstrual cycles, ask about ASM dose adjustments or short add-on therapy.`,
  },
  {
    title: "Missed Medicines as a Seizure Trigger",
    publication: "Epilepsy Foundation",
    year: 2024,
    url: "https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/missed-medicines",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Explains how missed antiseizure medication doses cause breakthrough seizures and status epilepticus risk.",
    content: `Missing doses of seizure medicine is the most common cause of breakthrough seizures. Missed medicines can trigger more frequent, more intense seizures, or status epilepticus — a medical emergency.

Missing one dose is more likely to cause seizures if you take medicine only once daily (a full day missed). Missing several doses in a row raises risk further.

Stopping seizure medication without medical advice is dangerous: withdrawal symptoms, long seizures, clusters, or status epilepticus. Stopping one medicine when on several can change levels of others.

Use pillboxes, alarms, seizure diary tracking, and talk to your care team before any dose changes.`,
  },
  {
    title: "Photosensitivity and Seizures",
    publication: "Epilepsy Foundation",
    year: 2024,
    url: "https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/photosensitivity",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Photosensitive epilepsy: flashing lights, visual patterns, and EEG testing for photosensitivity.",
    content: `For about 3% of people with epilepsy, flashing lights or certain visual patterns can trigger seizures (photosensitive or visually-provoked seizures).

Triggers may include television or monitor flicker, intense strobe lights, fireworks, and striped high-contrast patterns. Factors combining include flash frequency (often 5–30 Hz most provocative), brightness, contrast, distance, wavelength, and eyes open vs closed.

EEG with photic stimulation tests photosensitivity. If concerned, discuss with your doctor; records often note photic stimulation results.`,
  },
  {
    title: "Women and Epilepsy",
    publication: "Epilepsy Foundation",
    year: 2024,
    url: "https://www.epilepsy.com/specific-populations/women",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Hormones, catamenial epilepsy, and antiseizure medicine interactions with contraception.",
    content: `About half of women with epilepsy report more seizures around menstruation (catamenial epilepsy); some report ovulation-linked seizures. Controlling catamenial seizures remains difficult; no clearly effective hormonal therapy; some use higher ASM doses at those times.

Certain seizure medicines increase breakdown of hormonal contraception: phenytoin, carbamazepine, phenobarbital, primidone, felbamate, oxcarbazepine, topiramate, perampanel — birth control may be less effective.

Estrogen-containing contraception lowers lamotrigine levels and can worsen seizures unless doses are adjusted; smaller effect on oxcarbazepine and valproic acid.`,
  },
  {
    title: "Early Death and SUDEP",
    publication: "Epilepsy Foundation",
    year: 2024,
    url: "https://www.epilepsy.com/complications-risks/early-death-sudep",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Sudden unexpected death in epilepsy (SUDEP): definition, incidence, and risk factors including uncontrolled seizures.",
    content: `SUDEP is the sudden, unexpected death of someone with epilepsy who was otherwise healthy. No other cause is found on autopsy. Each year more than 1 in 1,000 people with epilepsy die from SUDEP — leading cause of death in people with uncontrolled seizures.

Often found dead in bed; over one-third have witnessed or recent seizure evidence. Causes may include irregular heart rhythm or breathing difficulties after seizures.

Until more is known, best prevention is lowering risk by controlling seizures. Research shows people with convulsive seizures can be at risk. Epilepsy Foundation SUDEP program drives awareness and research.`,
  },
  {
    title:
      "Real-World Practices in Educating Patients and Caregivers About SUDEP: A Scoping Review",
    authors: "Multiple authors",
    publication: "Epilepsy & Behavior Reports (PMC open access)",
    year: 2025,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12890233/",
    source_type: "peer_review",
    evidence_grade: "B",
    abstract:
      "Scoping review of SUDEP education practices and estimated annual prevalence (~1.2 per 1000).",
    content: `Background: Sudden unexpected death in epilepsy (SUDEP) is sudden unexpected death unrelated to trauma or drowning, with or without a recent seizure. Estimated annual prevalence ~1.2 per 1000 patients. Disseminating SUDEP knowledge helps prevent deaths by managing risk factors and educating patients and caregivers.

Objectives: Scoping review highlighting real-world practices in SUDEP education for patients, caregivers, and clinicians.

Many people with epilepsy have never heard of SUDEP; medical professionals rarely discuss it despite patient interest in information.`,
  },
  {
    title: "How to Prevent SUDEP",
    publication: "Epilepsy Foundation",
    year: 2024,
    url: "https://www.epilepsy.com/complications-risks/early-death-sudep/preventing-sudep",
    source_type: "foundation",
    evidence_grade: "expert",
    abstract:
      "Practical SUDEP risk reduction: seizure control, night monitoring, and discussing risks with clinicians.",
    content: `SUDEP risk is higher with uncontrolled seizures. Having as few seizures as possible — ideally zero — is the best way to lessen risk (#AimForZero). Even with best care, SUDEP can still occur.

Discuss risks with your doctor. Since SUDEP often occurs during sleep, consider a seizure alert monitor for night seizures. Night supervision may help with first aid and positioning after generalized seizures; evidence for preventing SUDEP is limited.

Seizure detection devices are being developed; whether they prevent SUDEP remains unknown. Anti-suffocation pillows are not proven to prevent SUDEP.`,
  },
  {
    title:
      "The Pharmacology and Clinical Efficacy of Antiseizure Medications: From Bromide Salts to Cenobamate and Beyond",
    authors: "Löscher W, Klein P",
    publication: "CNS Drugs",
    year: 2021,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8408078/",
    source_type: "review",
    evidence_grade: "A",
    abstract:
      "Comprehensive review of ~30 antiseizure medications: mechanisms, efficacy spectrum, and drug-resistant epilepsy.",
    content: `Epilepsy affects ~1% of the population. Antiseizure medications (ASMs) are the mainstay of symptomatic treatment. About 30 ASMs are available; most act via voltage-gated ion channels, GABA enhancement, synaptic release modulation, or glutamate receptor blockade.

Complete seizure elimination is the goal; ~30% remain drug-resistant. Second-generation ASMs introduced 1960–1975 include carbamazepine, valproate, and benzodiazepines. Third-generation agents include lamotrigine, oxcarbazepine, gabapentin, and cenobamate (focal-onset trials showed high seizure-free rates in maintenance periods).

Because mechanisms differ, ASMs do not suppress all seizure types — appropriate choice matters. Polypharmacy knowledge of pharmacokinetics, efficacy spectrum, and adverse effects is essential for drug-resistant epilepsy.`,
  },
  {
    title: "A New Trial of Medications for Status Epilepticus",
    publication: "Epilepsy Foundation",
    year: 2023,
    url: "https://www.epilepsy.com/stories/new-trial-medications-status-epilepticus",
    source_type: "foundation",
    evidence_grade: "B",
    abstract:
      "Summary of trial comparing levetiracetam, phenytoin, and valproate after benzodiazepines for status epilepticus.",
    content: `Benzodiazepines (lorazepam, midazolam) are first-line for status epilepticus but fail to stop status in about 1 in 3 people.

A study compared levetiracetam, phenytoin, and valproate as second-line treatments. Response rates were very similar: levetiracetam 47%, phenytoin 45%, valproate 46%. None was clearly better or worse.

Health care providers can choose based on the individual and situation (comorbidities, availability, prior exposure). Status epilepticus is when a seizure lasts more than 5 minutes or seizures cluster without recovery — call emergency services or use rescue medicine per your plan.`,
  },
];
