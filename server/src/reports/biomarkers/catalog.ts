import type { Sex } from '../../generated/prisma/enums.js';

export type MarkerKey =
  | 'HBA1C'
  | 'FASTING_GLUCOSE'
  | 'LDL'
  | 'HDL'
  | 'TRIGLYCERIDES'
  | 'VITAMIN_D'
  | 'B12'
  | 'HEMOGLOBIN';

export interface Range {
  low: number | null;
  high: number | null;
}

export interface Guidance {
  why: string;
  action: string;
}

export interface MarkerDefinition {
  key: MarkerKey;
  displayName: string;
  /** The unit Katori stores and shows. */
  unit: string;
  /** Matched against the printed name after lower casing and turning punctuation into spaces. */
  aliases: RegExp[];
  /** Converts a value from another unit (keys are normalised units) into `unit`. */
  conversions: Record<string, (value: number) => number>;
  /** Used only when the report does not print its own reference range. */
  defaultRange: (sex: Sex | null) => Range;
  guidance: { LOW?: Guidance; HIGH?: Guidance };
}

const same = (value: number) => value;
const times = (factor: number) => (value: number) => value * factor;

/**
 * The eight markers Katori understands, with reviewed, plain language guidance. Written by
 * hand on purpose: health advice should be consistent and checked, not improvised by a model.
 * Ranges are common adult reference values; the lab's own printed range takes priority.
 */
export const MARKERS: MarkerDefinition[] = [
  {
    key: 'HBA1C',
    displayName: 'HbA1c',
    unit: '%',
    aliases: [
      /\bhba1c\b/,
      /\ba1c\b/,
      /glyc?osylated (haemo|hemo)globin/,
      /glycated (haemo|hemo)globin/,
    ],
    conversions: { '%': same, 'mmol/mol': (v) => v / 10.929 + 2.15 },
    defaultRange: () => ({ low: 4, high: 5.6 }),
    guidance: {
      HIGH: {
        why: 'HbA1c shows your average blood sugar over the last 3 months. Yours is above the healthy range.',
        action:
          'Swap white rice or maida for millets, brown rice or whole wheat, and add dal or salad first.',
      },
    },
  },
  {
    key: 'FASTING_GLUCOSE',
    displayName: 'Fasting glucose',
    unit: 'mg/dL',
    aliases: [/fasting.*(glucose|sugar)/, /(glucose|sugar).*fasting/, /\b(fbs|fbg|fpg)\b/],
    conversions: { 'mg/dl': same, 'mmol/l': times(18.016) },
    defaultRange: () => ({ low: 70, high: 100 }),
    guidance: {
      HIGH: {
        why: 'Your blood sugar after an overnight fast is higher than ideal, an early sign to act on.',
        action:
          'Keep dinner light and early, and pair carbs with protein like dal, paneer or eggs.',
      },
      LOW: {
        why: 'Your fasting sugar is on the low side, which can leave you shaky or tired.',
        action:
          "Don't skip breakfast; have poha, upma or oats with a protein within an hour of waking.",
      },
    },
  },
  {
    key: 'LDL',
    displayName: 'LDL cholesterol',
    unit: 'mg/dL',
    aliases: [/\bldl\b/],
    conversions: { 'mg/dl': same, 'mmol/l': times(38.67) },
    defaultRange: () => ({ low: null, high: 100 }),
    guidance: {
      HIGH: {
        why: 'LDL is the cholesterol that builds up in arteries. Yours is above the healthy limit.',
        action:
          'Replace fried snacks with roasted chana or a handful of walnuts, and go easy on ghee.',
      },
    },
  },
  {
    key: 'HDL',
    displayName: 'HDL cholesterol',
    unit: 'mg/dL',
    aliases: [/\bhdl\b/],
    conversions: { 'mg/dl': same, 'mmol/l': times(38.67) },
    defaultRange: (sex) => ({ low: sex === 'FEMALE' ? 50 : 40, high: null }),
    guidance: {
      LOW: {
        why: 'HDL is the protective cholesterol that clears the harmful kind. Yours is low.',
        action: 'Add a daily handful of nuts or seeds, and cook with mustard or groundnut oil.',
      },
    },
  },
  {
    key: 'TRIGLYCERIDES',
    displayName: 'Triglycerides',
    unit: 'mg/dL',
    aliases: [/triglyceride/, /\btg\b/],
    conversions: { 'mg/dl': same, 'mmol/l': times(88.57) },
    defaultRange: () => ({ low: null, high: 150 }),
    guidance: {
      HIGH: {
        why: 'Triglycerides rise with sugar, refined carbs and excess calories. Yours are high.',
        action:
          'Cut sweet chai, juices and mithai to once a day at most; choose whole fruit instead.',
      },
    },
  },
  {
    key: 'VITAMIN_D',
    displayName: 'Vitamin D',
    unit: 'ng/mL',
    aliases: [/vitamin d/, /\bvit d/, /25 ?oh/, /25 hydroxy/, /calcidiol/],
    conversions: { 'ng/ml': same, 'ug/l': same, 'nmol/l': (v) => v / 2.496 },
    defaultRange: () => ({ low: 30, high: 100 }),
    guidance: {
      LOW: {
        why: 'Vitamin D keeps bones and immunity strong. Low levels are very common in India.',
        action:
          'Get 15 minutes of morning sun and add eggs, fortified milk or mushrooms; ask about a supplement.',
      },
      HIGH: {
        why: 'Your vitamin D is above the usual range, which usually comes from high dose supplements.',
        action: 'Check your supplement dose with your doctor before taking more.',
      },
    },
  },
  {
    key: 'B12',
    displayName: 'Vitamin B12',
    unit: 'pg/mL',
    aliases: [/\bb ?12\b/, /cobalamin/],
    conversions: { 'pg/ml': same, 'ng/l': same, 'pmol/l': times(1.355) },
    defaultRange: () => ({ low: 200, high: 900 }),
    guidance: {
      LOW: {
        why: 'B12 keeps your energy and nerves healthy. It is often low on vegetarian diets.',
        action:
          'Have curd, milk or paneer daily, eggs if you eat them, and ask your doctor about a supplement.',
      },
      HIGH: {
        why: 'Your B12 is above the usual range, which is usually from supplements.',
        action: 'Mention it to your doctor at your next visit; no diet change is needed.',
      },
    },
  },
  {
    key: 'HEMOGLOBIN',
    displayName: 'Hemoglobin',
    unit: 'g/dL',
    aliases: [/^(total )?(haemoglobin|hemoglobin|hb|hgb)( hb| hgb)?$/],
    conversions: { 'g/dl': same, 'g/l': (v) => v / 10, 'mmol/l': times(1.611) },
    defaultRange: (sex) =>
      sex === 'MALE'
        ? { low: 13, high: 17 }
        : sex === 'FEMALE'
          ? { low: 12, high: 15 }
          : { low: 12, high: 17 },
    guidance: {
      LOW: {
        why: 'Hemoglobin carries oxygen in your blood. Low levels can make you feel tired.',
        action:
          'Eat iron rich foods like spinach, rajma, chana or jaggery with lemon or amla for absorption.',
      },
      HIGH: {
        why: 'Your hemoglobin is above the usual range, sometimes from dehydration.',
        action: 'Drink enough water through the day and mention it to your doctor.',
      },
    },
  },
];

export const GUIDANCE_FOR_UNKNOWN_MARKER: Guidance = {
  why: 'This result is outside the range printed by your lab.',
  action: 'Ask your doctor what it means for you.',
};
