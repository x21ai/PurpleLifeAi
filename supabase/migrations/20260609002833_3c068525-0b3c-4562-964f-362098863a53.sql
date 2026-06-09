
-- 1) Condition catalog
CREATE TABLE public.condition_catalog (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  aka TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  traits TEXT[] NOT NULL DEFAULT '{}',
  common_symptoms TEXT[] NOT NULL DEFAULT '{}',
  common_meds TEXT[] NOT NULL DEFAULT '{}',
  key_metrics TEXT[] NOT NULL DEFAULT '{}',
  monitoring_cadence TEXT NOT NULL DEFAULT 'asneeded',
  red_flags TEXT[] NOT NULL DEFAULT '{}',
  disclaimer_tier TEXT NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.condition_catalog TO anon;
GRANT SELECT ON public.condition_catalog TO authenticated;
GRANT ALL ON public.condition_catalog TO service_role;

ALTER TABLE public.condition_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Condition catalog is public read"
  ON public.condition_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TRIGGER condition_catalog_set_updated_at
  BEFORE UPDATE ON public.condition_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Profile columns for cached AI care profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_care_profile JSONB,
  ADD COLUMN IF NOT EXISTS care_profile_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS care_profile_conditions_hash TEXT;

-- 3) Seed 40 conditions
INSERT INTO public.condition_catalog
  (slug, label, short_label, aka, category, traits, common_symptoms, common_meds, key_metrics, monitoring_cadence, red_flags, disclaimer_tier, sort_order)
VALUES
-- Neurology
('epilepsy','Epilepsy / seizures','Epilepsy',ARRAY['seizures','convulsions'],'neuro',ARRAY['seizure_prone','neuro','sleep_critical'],ARRAY['aura','seizure','postictal fatigue','memory gaps'],ARRAY['levetiracetam','lamotrigine','valproate','clobazam'],ARRAY['seizure_count','aura_count','sleep_hours','med_adherence'],'daily',ARRAY['status epilepticus','seizure longer than 5 minutes','injury during seizure','first ever seizure'],'general',10),
('migraine','Migraine','Migraine',ARRAY['headache'],'neuro',ARRAY['headache','sensory','autonomic'],ARRAY['head pain','aura','nausea','photophobia'],ARRAY['sumatriptan','rizatriptan','propranolol','topiramate'],ARRAY['attack_count','attack_duration','abortive_uses'],'daily',ARRAY['thunderclap headache','worst headache of life','headache with weakness or vision loss','fever and stiff neck'],'general',20),
('cluster_headache','Cluster headache','Cluster',ARRAY['suicide headache'],'neuro',ARRAY['headache','autonomic'],ARRAY['severe one-sided pain','tearing','restlessness'],ARRAY['oxygen','sumatriptan injection','verapamil'],ARRAY['attack_count','bout_length'],'daily',ARRAY['neurological deficits','first ever severe headache'],'general',30),
('parkinsons','Parkinson''s disease','Parkinson''s',ARRAY['PD'],'neuro',ARRAY['neuro','motor','cognitive_load'],ARRAY['tremor','rigidity','slowness','off periods','freezing'],ARRAY['carbidopa-levodopa','ropinirole','rasagiline'],ARRAY['on_off_log','med_adherence','falls'],'daily',ARRAY['fall with injury','severe confusion','swallowing trouble'],'general',40),
('multiple_sclerosis','Multiple sclerosis','MS',ARRAY['MS'],'neuro',ARRAY['neuro','inflammatory','pacing_required','sensory'],ARRAY['fatigue','numbness','vision change','spasticity','heat sensitivity'],ARRAY['ocrelizumab','natalizumab','glatiramer','interferon beta'],ARRAY['fatigue_level','flare_count','mobility'],'weekly',ARRAY['sudden vision loss','new severe weakness','loss of bladder control'],'general',50),
('stroke_recovery','Stroke recovery','Stroke',ARRAY['post-stroke','TIA recovery'],'neuro',ARRAY['neuro','cardiovascular','cognitive_load','pacing_required'],ARRAY['weakness','aphasia','fatigue','vision changes'],ARRAY['aspirin','clopidogrel','atorvastatin','antihypertensives'],ARRAY['bp','adherence','therapy_sessions'],'daily',ARRAY['FAST symptoms returning','sudden severe headache','new weakness or numbness'],'general',60),
('neuropathy','Peripheral neuropathy','Neuropathy',ARRAY['nerve pain'],'neuro',ARRAY['pain','neuro','sensory'],ARRAY['burning','tingling','numbness','balance trouble'],ARRAY['gabapentin','pregabalin','duloxetine'],ARRAY['pain_level','sleep_disruption'],'weekly',ARRAY['sudden new weakness','foot ulcer','loss of bowel/bladder control'],'general',70),

-- Neurodevelopmental
('autism','Autism / ASD','Autism',ARRAY['ASD','autism spectrum','autistic'],'neurodevelopmental',ARRAY['neurodevelopmental','sensory','routine_sensitive','cognitive_load'],ARRAY['sensory overload','meltdown','shutdown','burnout','social fatigue'],ARRAY[]::text[],ARRAY['sensory_load','energy_level','routine_disruption','sleep_quality'],'daily',ARRAY['severe shutdown lasting days','self-injury','suicidal thoughts'],'sensitive',80),
('adhd','ADHD','ADHD',ARRAY['attention deficit','ADD'],'neurodevelopmental',ARRAY['neurodevelopmental','cognitive_load','mood'],ARRAY['focus difficulty','executive function','restlessness','rejection sensitivity'],ARRAY['methylphenidate','lisdexamfetamine','atomoxetine'],ARRAY['focus_rating','sleep_hours','med_adherence'],'daily',ARRAY['severe mood crash','stimulant side effects (chest pain, racing heart)','suicidal thoughts'],'sensitive',90),
('dementia','Alzheimer''s & dementia','Dementia',ARRAY['Alzheimer''s','memory loss'],'neurodevelopmental',ARRAY['cognitive_load','neuro','caregiver_helpful'],ARRAY['memory loss','confusion','wandering','sundowning'],ARRAY['donepezil','memantine','rivastigmine'],ARRAY['orientation','behavioral_episodes','sleep'],'daily',ARRAY['sudden severe confusion','falls','wandering at night'],'sensitive',100),

-- Mental health
('depression','Depression','Depression',ARRAY['major depressive disorder','MDD'],'mental_health',ARRAY['mood','sleep_critical','pacing_required'],ARRAY['low mood','anhedonia','fatigue','sleep changes','appetite changes'],ARRAY['sertraline','escitalopram','bupropion','fluoxetine'],ARRAY['mood_rating','sleep_hours','energy_level'],'daily',ARRAY['suicidal thoughts','plan or means to harm self','psychosis'],'sensitive',110),
('anxiety','Anxiety','Anxiety',ARRAY['generalized anxiety','GAD','panic'],'mental_health',ARRAY['mood','autonomic','sleep_critical'],ARRAY['worry','racing thoughts','panic','restlessness','muscle tension'],ARRAY['sertraline','escitalopram','buspirone','propranolol prn'],ARRAY['anxiety_rating','panic_count','sleep'],'daily',ARRAY['panic with chest pain not relieved','suicidal thoughts','can''t function'],'sensitive',120),
('bipolar','Bipolar disorder','Bipolar',ARRAY['manic depression'],'mental_health',ARRAY['mood','sleep_critical'],ARRAY['mood swings','elevated energy','reduced sleep need','depressive episodes'],ARRAY['lithium','lamotrigine','quetiapine','valproate'],ARRAY['mood_rating','sleep_hours','med_adherence'],'daily',ARRAY['suicidal thoughts','psychosis','dangerous impulsivity','severe mania'],'sensitive',130),
('ptsd','PTSD','PTSD',ARRAY['post traumatic stress'],'mental_health',ARRAY['mood','autonomic','sleep_critical'],ARRAY['flashbacks','nightmares','hypervigilance','dissociation'],ARRAY['sertraline','paroxetine','prazosin'],ARRAY['mood_rating','sleep_quality','trigger_log'],'daily',ARRAY['suicidal thoughts','severe dissociation','self-harm urges'],'sensitive',140),
('ocd','OCD','OCD',ARRAY['obsessive compulsive'],'mental_health',ARRAY['mood','cognitive_load'],ARRAY['intrusive thoughts','compulsions','ritualizing'],ARRAY['fluoxetine','sertraline','clomipramine'],ARRAY['compulsion_time','distress_rating'],'daily',ARRAY['suicidal thoughts','self-harm','severe functional impairment'],'sensitive',150),
('eating_disorder','Eating disorder','Eating',ARRAY['anorexia','bulimia','BED','ARFID'],'mental_health',ARRAY['mood','nutritional','sensory'],ARRAY['restriction','bingeing','purging','body image distress'],ARRAY[]::text[],ARRAY['meals_logged','distress_rating','behaviors'],'daily',ARRAY['fainting','chest pain','severe electrolyte symptoms','suicidal thoughts','rapid weight loss'],'sensitive',160),

-- Cardio / metabolic
('hypertension','High blood pressure','Hypertension',ARRAY['HTN','high BP'],'cardio_metabolic',ARRAY['cardiovascular'],ARRAY['headaches','dizziness','often silent'],ARRAY['lisinopril','amlodipine','losartan','hydrochlorothiazide'],ARRAY['bp_systolic','bp_diastolic','heart_rate'],'daily',ARRAY['BP above 180/120','chest pain','severe headache','vision changes'],'general',170),
('t1_diabetes','Type 1 diabetes','T1D',ARRAY['type 1','insulin dependent'],'cardio_metabolic',ARRAY['glycemic','autoimmune'],ARRAY['highs','lows','ketones','fatigue'],ARRAY['insulin'],ARRAY['glucose','hba1c','time_in_range','insulin_dose'],'daily',ARRAY['DKA symptoms (nausea, fruity breath)','severe hypoglycemia','glucose unmeasurable'],'general',180),
('t2_diabetes','Type 2 diabetes','T2D',ARRAY['type 2','adult onset'],'cardio_metabolic',ARRAY['glycemic'],ARRAY['highs','fatigue','increased thirst'],ARRAY['metformin','semaglutide','empagliflozin','insulin'],ARRAY['glucose','hba1c','weight','bp'],'daily',ARRAY['glucose > 300 with symptoms','foot ulcer','vision change'],'general',190),
('prediabetes','Pre-diabetes','Pre-diabetes',ARRAY[]::text[],'cardio_metabolic',ARRAY['glycemic'],ARRAY['elevated fasting glucose','elevated A1c'],ARRAY[]::text[],ARRAY['fasting_glucose','hba1c','weight'],'weekly',ARRAY[]::text[],'general',200),
('high_cholesterol','High cholesterol','Cholesterol',ARRAY['hyperlipidemia','dyslipidemia'],'cardio_metabolic',ARRAY['cardiovascular'],ARRAY['often silent'],ARRAY['atorvastatin','rosuvastatin','ezetimibe'],ARRAY['ldl','hdl','triglycerides','total_cholesterol'],'asneeded',ARRAY['chest pain','muscle pain on statin'],'general',210),
('afib','Atrial fibrillation','AFib',ARRAY['AFib','atrial fib'],'cardio_metabolic',ARRAY['cardiovascular','autonomic'],ARRAY['palpitations','fatigue','breathlessness','dizziness'],ARRAY['apixaban','metoprolol','diltiazem','flecainide'],ARRAY['heart_rate','rhythm_episodes','bp'],'daily',ARRAY['chest pain','stroke symptoms (FAST)','fainting'],'general',220),
('heart_failure','Heart failure','Heart failure',ARRAY['CHF','HFrEF','HFpEF'],'cardio_metabolic',ARRAY['cardiovascular','pacing_required'],ARRAY['shortness of breath','swelling','fatigue','weight gain'],ARRAY['furosemide','sacubitril-valsartan','metoprolol','spironolactone'],ARRAY['weight','bp','swelling','breathlessness'],'daily',ARRAY['weight up >2lb/day or 5lb/week','severe breathlessness','chest pain'],'general',230),

-- Autoimmune / inflammatory
('rheumatoid_arthritis','Rheumatoid arthritis','RA',ARRAY['RA'],'autoimmune',ARRAY['autoimmune','inflammatory','pain','pacing_required'],ARRAY['joint pain','morning stiffness','swelling','fatigue'],ARRAY['methotrexate','adalimumab','etanercept','prednisone'],ARRAY['joint_pain','stiffness_minutes','flare_count'],'daily',ARRAY['high fever on biologic','severe new joint redness','infection signs'],'general',240),
('lupus','Lupus (SLE)','Lupus',ARRAY['SLE'],'autoimmune',ARRAY['autoimmune','inflammatory','pacing_required'],ARRAY['fatigue','joint pain','rash','sun sensitivity','flares'],ARRAY['hydroxychloroquine','prednisone','mycophenolate'],ARRAY['fatigue_level','flare_count','rash'],'daily',ARRAY['chest pain','severe headache','high fever','new neurologic symptoms'],'general',250),
('crohns','Crohn''s disease','Crohn''s',ARRAY['IBD'],'autoimmune',ARRAY['autoimmune','inflammatory','gi','pacing_required'],ARRAY['abdominal pain','diarrhea','weight loss','fatigue'],ARRAY['infliximab','adalimumab','azathioprine','budesonide'],ARRAY['bowel_movements','pain_level','flare_count','weight'],'daily',ARRAY['blood in stool with weakness','severe abdominal pain','high fever','dehydration'],'general',260),
('ulcerative_colitis','Ulcerative colitis','UC',ARRAY['IBD','colitis'],'autoimmune',ARRAY['autoimmune','inflammatory','gi'],ARRAY['bloody diarrhea','urgency','abdominal pain'],ARRAY['mesalamine','infliximab','prednisone'],ARRAY['bowel_movements','blood','flare_count'],'daily',ARRAY['heavy bleeding','severe abdominal distension','high fever'],'general',270),
('psoriasis','Psoriasis','Psoriasis',ARRAY[]::text[],'autoimmune',ARRAY['autoimmune','inflammatory','sensory'],ARRAY['plaques','itching','joint pain'],ARRAY['adalimumab','secukinumab','methotrexate','topical steroids'],ARRAY['flare_area','itch_level','joint_pain'],'weekly',ARRAY['widespread red skin','signs of infection in lesions'],'general',280),
('hashimotos','Hashimoto''s / hypothyroidism','Hashimoto''s',ARRAY['hypothyroid','underactive thyroid'],'autoimmune',ARRAY['autoimmune','mood','pacing_required'],ARRAY['fatigue','cold intolerance','weight gain','brain fog'],ARRAY['levothyroxine'],ARRAY['tsh','energy_level','weight'],'asneeded',ARRAY['severe fatigue with cold','myxedema symptoms'],'general',290),
('celiac','Celiac disease','Celiac',ARRAY['gluten intolerance (celiac)'],'autoimmune',ARRAY['autoimmune','gi','nutritional'],ARRAY['diarrhea','bloating','fatigue after gluten','skin rash'],ARRAY[]::text[],ARRAY['gluten_exposures','symptom_score'],'daily',ARRAY['severe dehydration','chronic weight loss'],'general',300),

-- Respiratory
('asthma','Asthma','Asthma',ARRAY[]::text[],'respiratory',ARRAY['respiratory','autonomic'],ARRAY['wheezing','shortness of breath','cough','chest tightness'],ARRAY['albuterol','fluticasone','montelukast','budesonide-formoterol'],ARRAY['peak_flow','rescue_uses','attacks'],'daily',ARRAY['rescue inhaler not working','can''t speak full sentence','lips bluish'],'general',310),
('copd','COPD','COPD',ARRAY['emphysema','chronic bronchitis'],'respiratory',ARRAY['respiratory','pacing_required'],ARRAY['breathlessness','chronic cough','sputum','fatigue'],ARRAY['tiotropium','salbutamol','fluticasone-salmeterol','prednisone bursts'],ARRAY['breathlessness','rescue_uses','sputum_color'],'daily',ARRAY['severe breathlessness','color change in sputum with fever','confusion'],'general',320),
('sleep_apnea','Sleep apnea','Sleep apnea',ARRAY['OSA','obstructive sleep apnea'],'respiratory',ARRAY['respiratory','sleep_critical'],ARRAY['daytime sleepiness','snoring','witnessed apneas','morning headache'],ARRAY[]::text[],ARRAY['cpap_hours','ahi','sleep_quality'],'daily',ARRAY['falling asleep while driving','severe morning headaches'],'general',330),

-- Pain / fatigue / autonomic
('fibromyalgia','Fibromyalgia','Fibro',ARRAY['fibro'],'pain_fatigue',ARRAY['pain','pacing_required','sleep_critical'],ARRAY['widespread pain','fatigue','brain fog','tender points','poor sleep'],ARRAY['duloxetine','pregabalin','amitriptyline'],ARRAY['pain_level','fatigue_level','sleep_quality'],'daily',ARRAY['new severe localized pain','fever with widespread pain'],'general',340),
('chronic_pain','Chronic pain','Chronic pain',ARRAY[]::text[],'pain_fatigue',ARRAY['pain','pacing_required'],ARRAY['persistent pain','fatigue','mood impact','sleep disruption'],ARRAY['gabapentin','duloxetine','NSAIDs'],ARRAY['pain_level','flare_count','mood_rating'],'daily',ARRAY['sudden severe new pain','loss of bowel/bladder control','weakness'],'general',350),
('long_covid','Long COVID / ME-CFS','Long COVID',ARRAY['ME/CFS','chronic fatigue syndrome','post viral'],'pain_fatigue',ARRAY['pacing_required','autonomic','cognitive_load'],ARRAY['fatigue','PEM','brain fog','orthostatic intolerance'],ARRAY['low-dose naltrexone','beta blockers prn'],ARRAY['energy_level','pem_events','activity_load'],'daily',ARRAY['chest pain','fainting','severe new weakness'],'general',360),
('pots','POTS / dysautonomia','POTS',ARRAY['postural tachycardia','dysautonomia'],'pain_fatigue',ARRAY['autonomic','cardiovascular','pacing_required'],ARRAY['lightheadedness on standing','tachycardia','fatigue','brain fog'],ARRAY['midodrine','fludrocortisone','beta blockers','salt tablets'],ARRAY['standing_heart_rate','fluids','salt','dizzy_episodes'],'daily',ARRAY['fainting with injury','chest pain','severe palpitations'],'general',370),
('eds','Ehlers-Danlos (hypermobility)','EDS',ARRAY['hEDS','HSD','hypermobility'],'pain_fatigue',ARRAY['pain','autonomic','pacing_required'],ARRAY['joint pain','subluxations','fatigue','GI issues','dizziness'],ARRAY['gabapentin','PT'],ARRAY['pain_level','subluxations','fatigue_level'],'daily',ARRAY['joint dislocation needing reduction','chest pain','severe GI symptoms'],'general',380),

-- GI / renal / oncology
('ibs','IBS','IBS',ARRAY['irritable bowel'],'gi',ARRAY['gi','autonomic'],ARRAY['abdominal pain','bloating','diarrhea','constipation'],ARRAY['hyoscine','loperamide','linaclotide','peppermint oil'],ARRAY['bowel_movements','pain_level','triggers'],'daily',ARRAY['blood in stool','unexplained weight loss','nighttime symptoms'],'general',390),
('gerd','GERD','GERD',ARRAY['reflux','heartburn'],'gi',ARRAY['gi'],ARRAY['heartburn','regurgitation','cough','sleep disruption'],ARRAY['omeprazole','famotidine','pantoprazole'],ARRAY['reflux_episodes','triggers'],'asneeded',ARRAY['trouble swallowing','blood in vomit','chest pain'],'general',400),
('ckd','Chronic kidney disease','CKD',ARRAY['kidney disease'],'cardio_metabolic',ARRAY['cardiovascular','pacing_required','nutritional'],ARRAY['fatigue','swelling','reduced urine','itch'],ARRAY['lisinopril','furosemide','sevelamer','epoetin'],ARRAY['weight','bp','urine_output','potassium'],'daily',ARRAY['little or no urine','severe shortness of breath','confusion'],'general',410),
('cancer','Cancer (in treatment / survivorship)','Cancer',ARRAY['oncology','chemo','radiation'],'oncology',ARRAY['pacing_required','mood','pain','nutritional'],ARRAY['fatigue','pain','nausea','neuropathy','sleep disruption'],ARRAY[]::text[],ARRAY['fatigue_level','pain_level','treatment_side_effects'],'daily',ARRAY['fever during chemo','uncontrolled bleeding','severe new pain'],'sensitive',420),

-- Special
('caregiver','Caregiving for someone','Caregiver',ARRAY['carer','family caregiver'],'caregiver',ARRAY['caregiver','mood','pacing_required'],ARRAY['caregiver fatigue','sleep loss','overwhelm'],ARRAY[]::text[],ARRAY['hours_caring','self_care','sleep'],'daily',ARRAY['caregiver burnout','suicidal thoughts'],'sensitive',900),
('general','General wellness','General',ARRAY[]::text[],'general',ARRAY['mood','pacing_required'],ARRAY['stress','sleep','habits'],ARRAY[]::text[],ARRAY['sleep_hours','mood_rating','energy_level'],'asneeded',ARRAY[]::text[],'general',999);
