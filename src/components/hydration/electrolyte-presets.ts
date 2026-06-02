export type ElectrolytePreset = {
  brand: string;
  sodium_mg: number;
  default_volume_ml: number;
};

// Common electrolyte products with per-serving sodium content.
// Users can always override.
export const ELECTROLYTE_PRESETS: ElectrolytePreset[] = [
  { brand: "LMNT", sodium_mg: 1000, default_volume_ml: 500 },
  { brand: "Liquid I.V.", sodium_mg: 500, default_volume_ml: 500 },
  { brand: "Pedialyte", sodium_mg: 245, default_volume_ml: 240 },
  { brand: "Nuun", sodium_mg: 300, default_volume_ml: 500 },
  { brand: "Gatorade", sodium_mg: 270, default_volume_ml: 500 },
  { brand: "Coconut water", sodium_mg: 60, default_volume_ml: 330 },
  { brand: "Pinch of salt", sodium_mg: 400, default_volume_ml: 250 },
];