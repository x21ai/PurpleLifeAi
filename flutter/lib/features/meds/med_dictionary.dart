/// Offline medication dictionary for add-med autocomplete.
/// Port of `src/lib/med-dictionary.ts` (epilepsy-first aliases + defaults).
library;

class MedDictEntry {
  const MedDictEntry({
    required this.label,
    required this.aliases,
    required this.kind,
    this.defaultForm,
    this.defaultUnit,
    this.commonStrengths,
  });

  final String label;
  final List<String> aliases;
  final String kind;
  final String? defaultForm;
  final String? defaultUnit;
  final List<String>? commonStrengths;
}

const _rawDictionary = <MedDictEntry>[
  MedDictEntry(label: 'Levetiracetam (Keppra)', aliases: ['levetiracetam', 'keppra'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['250', '500', '750', '1000']),
  MedDictEntry(label: 'Levetiracetam Extended Release (Keppra XR)', aliases: ['keppra xr', 'keppra extended release', 'keppra er', 'levetiracetam xr', 'levetiracetam er', 'levetiracetam extended'], kind: 'medication'),
  MedDictEntry(label: 'Lamotrigine (Lamictal)', aliases: ['lamotrigine', 'lamictal'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['25', '50', '100', '200']),
  MedDictEntry(label: 'Lamotrigine Extended Release (Lamictal XR)', aliases: ['lamictal xr', 'lamotrigine xr', 'lamotrigine er', 'lamictal extended'], kind: 'medication'),
  MedDictEntry(label: 'Valproate (Depakote)', aliases: ['valproate', 'valproic', 'depakote', 'depakene'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['125', '250', '500']),
  MedDictEntry(label: 'Divalproex Extended Release (Depakote ER)', aliases: ['depakote er', 'divalproex er', 'divalproex xr', 'depakote extended'], kind: 'medication'),
  MedDictEntry(label: 'Carbamazepine (Tegretol)', aliases: ['carbamazepine', 'tegretol'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['100', '200', '400']),
  MedDictEntry(label: 'Carbamazepine Extended Release (Tegretol XR)', aliases: ['tegretol xr', 'carbamazepine xr', 'carbamazepine er', 'carbatrol', 'equetro'], kind: 'medication'),
  MedDictEntry(label: 'Oxcarbazepine (Trileptal)', aliases: ['oxcarbazepine', 'trileptal'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['150', '300', '600']),
  MedDictEntry(label: 'Oxcarbazepine Extended Release (Oxtellar XR)', aliases: ['oxtellar', 'oxtellar xr', 'oxcarbazepine xr', 'oxcarbazepine er'], kind: 'medication'),
  MedDictEntry(label: 'Clobazam (Onfi)', aliases: ['clobazam', 'onfi'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['5', '10', '20']),
  MedDictEntry(label: 'Lacosamide (Vimpat)', aliases: ['lacosamide', 'vimpat'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['50', '100', '150', '200']),
  MedDictEntry(label: 'Topiramate (Topamax)', aliases: ['topiramate', 'topamax'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['25', '50', '100', '200']),
  MedDictEntry(label: 'Topiramate Extended Release (Trokendi XR / Qudexy XR)', aliases: ['trokendi', 'trokendi xr', 'qudexy', 'qudexy xr', 'topiramate xr', 'topiramate er'], kind: 'medication'),
  MedDictEntry(label: 'Phenytoin (Dilantin)', aliases: ['phenytoin', 'dilantin'], kind: 'medication', defaultForm: 'capsule', defaultUnit: 'mg', commonStrengths: ['30', '100', '300']),
  MedDictEntry(label: 'Zonisamide (Zonegran)', aliases: ['zonisamide', 'zonegran'], kind: 'medication', defaultForm: 'capsule', defaultUnit: 'mg', commonStrengths: ['25', '50', '100']),
  MedDictEntry(label: 'Gabapentin (Neurontin)', aliases: ['gabapentin', 'neurontin'], kind: 'medication', defaultForm: 'capsule', defaultUnit: 'mg', commonStrengths: ['100', '300', '400', '600', '800']),
  MedDictEntry(label: 'Pregabalin (Lyrica)', aliases: ['pregabalin', 'lyrica'], kind: 'medication', defaultForm: 'capsule', defaultUnit: 'mg', commonStrengths: ['25', '50', '75', '100', '150', '200', '300']),
  MedDictEntry(label: 'Brivaracetam (Briviact)', aliases: ['brivaracetam', 'briviact'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['10', '25', '50', '75', '100']),
  MedDictEntry(label: 'Cannabidiol (Epidiolex)', aliases: ['cannabidiol', 'cbd', 'epidiolex'], kind: 'medication'),
  MedDictEntry(label: 'Phenobarbital', aliases: ['phenobarbital', 'phenobarb'], kind: 'medication'),
  MedDictEntry(label: 'Primidone (Mysoline)', aliases: ['primidone', 'mysoline'], kind: 'medication'),
  MedDictEntry(label: 'Ethosuximide (Zarontin)', aliases: ['ethosuximide', 'zarontin'], kind: 'medication'),
  MedDictEntry(label: 'Felbamate (Felbatol)', aliases: ['felbamate', 'felbatol'], kind: 'medication'),
  MedDictEntry(label: 'Tiagabine (Gabitril)', aliases: ['tiagabine', 'gabitril'], kind: 'medication'),
  MedDictEntry(label: 'Vigabatrin (Sabril)', aliases: ['vigabatrin', 'sabril'], kind: 'medication'),
  MedDictEntry(label: 'Perampanel (Fycompa)', aliases: ['perampanel', 'fycompa'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['2', '4', '6', '8', '10', '12']),
  MedDictEntry(label: 'Rufinamide (Banzel)', aliases: ['rufinamide', 'banzel'], kind: 'medication'),
  MedDictEntry(label: 'Eslicarbazepine (Aptiom)', aliases: ['eslicarbazepine', 'aptiom'], kind: 'medication'),
  MedDictEntry(label: 'Cenobamate (Xcopri)', aliases: ['cenobamate', 'xcopri'], kind: 'medication'),
  MedDictEntry(label: 'Stiripentol (Diacomit)', aliases: ['stiripentol', 'diacomit'], kind: 'medication'),
  MedDictEntry(label: 'Fenfluramine (Fintepla)', aliases: ['fenfluramine', 'fintepla'], kind: 'medication'),
  MedDictEntry(label: 'Sertraline (Zoloft)', aliases: ['sertraline', 'zoloft'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['25', '50', '100', '200']),
  MedDictEntry(label: 'Escitalopram (Lexapro)', aliases: ['escitalopram', 'lexapro'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['5', '10', '20']),
  MedDictEntry(label: 'Fluoxetine (Prozac)', aliases: ['fluoxetine', 'prozac'], kind: 'medication', defaultForm: 'capsule', defaultUnit: 'mg', commonStrengths: ['10', '20', '40']),
  MedDictEntry(label: 'Citalopram (Celexa)', aliases: ['citalopram', 'celexa'], kind: 'medication'),
  MedDictEntry(label: 'Bupropion (Wellbutrin)', aliases: ['bupropion', 'wellbutrin'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['75', '100', '150', '200', '300']),
  MedDictEntry(label: 'Venlafaxine (Effexor)', aliases: ['venlafaxine', 'effexor'], kind: 'medication'),
  MedDictEntry(label: 'Duloxetine (Cymbalta)', aliases: ['duloxetine', 'cymbalta'], kind: 'medication'),
  MedDictEntry(label: 'Trazodone', aliases: ['trazodone'], kind: 'medication'),
  MedDictEntry(label: 'Mirtazapine (Remeron)', aliases: ['mirtazapine', 'remeron'], kind: 'medication'),
  MedDictEntry(label: 'Buspirone (Buspar)', aliases: ['buspirone', 'buspar'], kind: 'medication'),
  MedDictEntry(label: 'Propranolol (Inderal)', aliases: ['propranolol', 'inderal'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['10', '20', '40', '60', '80']),
  MedDictEntry(label: 'Metoprolol', aliases: ['metoprolol', 'lopressor', 'toprol'], kind: 'medication'),
  MedDictEntry(label: 'Atorvastatin (Lipitor)', aliases: ['atorvastatin', 'lipitor'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['10', '20', '40', '80']),
  MedDictEntry(label: 'Rosuvastatin (Crestor)', aliases: ['rosuvastatin', 'crestor'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['5', '10', '20', '40']),
  MedDictEntry(label: 'Lisinopril', aliases: ['lisinopril'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['2.5', '5', '10', '20', '40']),
  MedDictEntry(label: 'Losartan (Cozaar)', aliases: ['losartan', 'cozaar'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['25', '50', '100']),
  MedDictEntry(label: 'Metformin (Glucophage)', aliases: ['metformin', 'glucophage'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['500', '850', '1000']),
  MedDictEntry(label: 'Levothyroxine (Synthroid)', aliases: ['levothyroxine', 'synthroid'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mcg', commonStrengths: ['25', '50', '75', '88', '100', '112', '125', '150']),
  MedDictEntry(label: 'Omeprazole (Prilosec)', aliases: ['omeprazole', 'prilosec'], kind: 'medication', defaultForm: 'capsule', defaultUnit: 'mg', commonStrengths: ['10', '20', '40']),
  MedDictEntry(label: 'Pantoprazole (Protonix)', aliases: ['pantoprazole', 'protonix'], kind: 'medication'),
  MedDictEntry(label: 'Loratadine (Claritin)', aliases: ['loratadine', 'claritin'], kind: 'medication'),
  MedDictEntry(label: 'Cetirizine (Zyrtec)', aliases: ['cetirizine', 'zyrtec'], kind: 'medication'),
  MedDictEntry(label: 'Albuterol (Ventolin)', aliases: ['albuterol', 'ventolin', 'salbutamol'], kind: 'medication', defaultForm: 'inhaler', defaultUnit: 'sprays', commonStrengths: ['1', '2']),
  MedDictEntry(label: 'Montelukast (Singulair)', aliases: ['montelukast', 'singulair'], kind: 'medication'),
  MedDictEntry(label: 'Acetaminophen (Tylenol)', aliases: ['acetaminophen', 'tylenol', 'paracetamol'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['325', '500', '650']),
  MedDictEntry(label: 'Ibuprofen (Advil)', aliases: ['ibuprofen', 'advil', 'motrin'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['200', '400', '600', '800']),
  MedDictEntry(label: 'Naproxen (Aleve)', aliases: ['naproxen', 'aleve'], kind: 'medication'),
  MedDictEntry(label: 'Amoxicillin', aliases: ['amoxicillin'], kind: 'medication'),
  MedDictEntry(label: 'Azithromycin (Zithromax)', aliases: ['azithromycin', 'zithromax', 'z-pak'], kind: 'medication'),
  MedDictEntry(label: 'Methylphenidate (Ritalin)', aliases: ['methylphenidate', 'ritalin', 'concerta'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['5', '10', '20']),
  MedDictEntry(label: 'Adderall (Amphetamine/Dextroamphetamine)', aliases: ['adderall', 'amphetamine', 'dextroamphetamine'], kind: 'medication'),
  MedDictEntry(label: 'Modafinil (Provigil)', aliases: ['modafinil', 'provigil'], kind: 'medication'),
  MedDictEntry(label: 'Quetiapine (Seroquel)', aliases: ['quetiapine', 'seroquel'], kind: 'medication', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['25', '50', '100', '200', '300', '400']),
  MedDictEntry(label: 'Aripiprazole (Abilify)', aliases: ['aripiprazole', 'abilify'], kind: 'medication'),
  MedDictEntry(label: 'Risperidone (Risperdal)', aliases: ['risperidone', 'risperdal'], kind: 'medication'),
  MedDictEntry(label: 'Magnesium', aliases: ['magnesium'], kind: 'supplement', defaultForm: 'capsule', defaultUnit: 'mg', commonStrengths: ['200', '250', '400']),
  MedDictEntry(label: 'Magnesium Glycinate', aliases: ['magnesium glycinate'], kind: 'supplement'),
  MedDictEntry(label: 'Melatonin', aliases: ['melatonin'], kind: 'supplement', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['1', '3', '5', '10']),
  MedDictEntry(label: 'Omega-3 (Fish Oil)', aliases: ['omega-3', 'omega 3', 'fish oil', 'epa', 'dha'], kind: 'supplement'),
  MedDictEntry(label: 'Ashwagandha', aliases: ['ashwagandha'], kind: 'supplement'),
  MedDictEntry(label: 'L-theanine', aliases: ['l-theanine', 'theanine'], kind: 'supplement'),
  MedDictEntry(label: 'Zinc', aliases: ['zinc'], kind: 'supplement'),
  MedDictEntry(label: 'Iron', aliases: ['iron', 'ferrous'], kind: 'supplement'),
  MedDictEntry(label: 'Folate', aliases: ['folate', 'folic acid'], kind: 'supplement'),
  MedDictEntry(label: 'CoQ10', aliases: ['coq10', 'coenzyme q10', 'ubiquinol'], kind: 'supplement'),
  MedDictEntry(label: 'Curcumin (Turmeric)', aliases: ['curcumin', 'turmeric'], kind: 'supplement'),
  MedDictEntry(label: 'Ginkgo Biloba', aliases: ['ginkgo', 'ginkgo biloba'], kind: 'supplement'),
  MedDictEntry(label: 'Probiotic', aliases: ['probiotic'], kind: 'supplement'),
  MedDictEntry(label: 'Creatine', aliases: ['creatine'], kind: 'supplement'),
  MedDictEntry(label: 'Collagen', aliases: ['collagen'], kind: 'supplement'),
  MedDictEntry(label: 'Glutamine', aliases: ['glutamine', 'l-glutamine'], kind: 'supplement'),
  MedDictEntry(label: '5-HTP', aliases: ['5-htp', '5htp'], kind: 'supplement'),
  MedDictEntry(label: 'GABA', aliases: ['gaba'], kind: 'supplement'),
  MedDictEntry(label: 'NAC (N-Acetylcysteine)', aliases: ['nac', 'n-acetylcysteine'], kind: 'supplement'),
  MedDictEntry(label: 'Rhodiola', aliases: ['rhodiola'], kind: 'supplement'),
  MedDictEntry(label: 'Vitamin D3', aliases: ['vitamin d', 'vitamin d3', 'cholecalciferol'], kind: 'vitamin', defaultForm: 'capsule', defaultUnit: 'IU', commonStrengths: ['1000', '2000', '5000']),
  MedDictEntry(label: 'Vitamin B12', aliases: ['b12', 'vitamin b12', 'cobalamin'], kind: 'vitamin', defaultForm: 'tablet', defaultUnit: 'mcg', commonStrengths: ['500', '1000', '2500', '5000']),
  MedDictEntry(label: 'B-Complex', aliases: ['b-complex', 'b complex', 'vitamin b'], kind: 'vitamin'),
  MedDictEntry(label: 'Vitamin C', aliases: ['vitamin c', 'ascorbic acid'], kind: 'vitamin'),
  MedDictEntry(label: 'Vitamin E', aliases: ['vitamin e', 'tocopherol'], kind: 'vitamin'),
  MedDictEntry(label: 'Vitamin K2', aliases: ['vitamin k', 'vitamin k2', 'menaquinone'], kind: 'vitamin'),
  MedDictEntry(label: 'Vitamin A', aliases: ['vitamin a', 'retinol'], kind: 'vitamin'),
  MedDictEntry(label: 'Biotin', aliases: ['biotin', 'vitamin b7'], kind: 'vitamin'),
  MedDictEntry(label: 'Multivitamin', aliases: ['multivitamin', 'multi'], kind: 'vitamin'),
  MedDictEntry(label: 'Prenatal Vitamin', aliases: ['prenatal'], kind: 'vitamin'),
  MedDictEntry(label: 'Chamomile', aliases: ['chamomile'], kind: 'herbal'),
  MedDictEntry(label: 'Valerian Root', aliases: ['valerian'], kind: 'herbal'),
  MedDictEntry(label: 'Passionflower', aliases: ['passionflower', 'passion flower'], kind: 'herbal'),
  MedDictEntry(label: 'Lemon Balm', aliases: ['lemon balm', 'melissa'], kind: 'herbal'),
  MedDictEntry(label: 'Lavender', aliases: ['lavender'], kind: 'herbal'),
  MedDictEntry(label: 'Holy Basil (Tulsi)', aliases: ['holy basil', 'tulsi'], kind: 'herbal'),
  MedDictEntry(label: 'Reishi', aliases: ['reishi'], kind: 'herbal'),
  MedDictEntry(label: 'Lion\'s Mane', aliases: ['lions mane', 'lion\'s mane'], kind: 'herbal'),
  MedDictEntry(label: 'Diazepam (Valium)', aliases: ['diazepam', 'valium'], kind: 'rescue', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['2', '5', '10']),
  MedDictEntry(label: 'Midazolam (Versed) nasal', aliases: ['midazolam', 'versed', 'nayzilam'], kind: 'rescue'),
  MedDictEntry(label: 'Lorazepam (Ativan)', aliases: ['lorazepam', 'ativan'], kind: 'rescue', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['0.5', '1', '2']),
  MedDictEntry(label: 'Clonazepam (Klonopin)', aliases: ['clonazepam', 'klonopin'], kind: 'rescue', defaultForm: 'tablet', defaultUnit: 'mg', commonStrengths: ['0.25', '0.5', '1', '2']),
  MedDictEntry(label: 'Diastat (Diazepam rectal)', aliases: ['diastat', 'diazepam rectal'], kind: 'rescue'),
  MedDictEntry(label: 'Valtoco (Diazepam nasal)', aliases: ['valtoco', 'diazepam nasal'], kind: 'rescue'),
];

/// Full dictionary with per-label dosage defaults applied.
final List<MedDictEntry> medDictionary =
    List<MedDictEntry>.unmodifiable(_rawDictionary);

int _matchScore(MedDictEntry entry, String q) {
  final ql = q.toLowerCase();
  final label = entry.label.toLowerCase();
  if (entry.aliases.any((a) => a.toLowerCase() == ql)) return 100;
  if (label == ql) return 95;
  if (entry.aliases.any((a) => a.toLowerCase().startsWith(ql))) return 85;
  if (label.startsWith(ql)) return 80;
  if (entry.aliases.any((a) => a.toLowerCase().contains(ql))) return 60;
  if (label.contains(ql)) return 50;
  return 0;
}

/// Ranked dictionary hits for [query]. Empty when query is blank.
List<MedDictEntry> searchMedDictionary(String query, {int limit = 8}) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return const [];
  final scored = <({MedDictEntry entry, int score})>[];
  for (final entry in medDictionary) {
    final score = _matchScore(entry, q);
    if (score > 0) scored.add((entry: entry, score: score));
  }
  scored.sort((a, b) {
    final byScore = b.score.compareTo(a.score);
    if (byScore != 0) return byScore;
    return a.entry.label.compareTo(b.entry.label);
  });
  return scored.take(limit).map((x) => x.entry).toList(growable: false);
}

/// Substring match against the user's existing med names.
List<String> searchUserMedNames(
  List<String> names,
  String query, {
  int limit = 4,
}) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return const [];
  return names
      .where((n) => n.toLowerCase().contains(q))
      .take(limit)
      .toList(growable: false);
}
