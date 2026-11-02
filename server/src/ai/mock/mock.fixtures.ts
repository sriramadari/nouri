import type { MealAnalysis, ReportExtraction, VoiceMealAnalysis } from '../ai.schemas.js';

/** A typical North Indian lunch plate. */
export const MOCK_PHOTO_MEAL: MealAnalysis = {
  issue: 'NONE',
  items: [
    {
      name: 'Roti',
      portion: '2 medium',
      calories: 240,
      proteinG: 8,
      carbsG: 44,
      fatG: 4,
      confidence: 0.92,
    },
    {
      name: 'Dal tadka',
      portion: '1 katori (150 g)',
      calories: 180,
      proteinG: 9,
      carbsG: 22,
      fatG: 6,
      confidence: 0.85,
    },
    {
      name: 'Aloo gobi',
      portion: '1 katori (120 g)',
      calories: 150,
      proteinG: 3,
      carbsG: 16,
      fatG: 8,
      confidence: 0.55,
    },
  ],
};

export const MOCK_VOICE_MEAL: VoiceMealAnalysis = {
  speechDetected: true,
  transcript: 'Two rotis, dal and a bowl of curd',
  issue: 'NONE',
  items: [
    {
      name: 'Roti',
      portion: '2 medium',
      calories: 240,
      proteinG: 8,
      carbsG: 44,
      fatG: 4,
      confidence: 0.9,
    },
    {
      name: 'Dal',
      portion: '1 katori (150 g)',
      calories: 170,
      proteinG: 9,
      carbsG: 22,
      fatG: 5,
      confidence: 0.75,
    },
    {
      name: 'Curd',
      portion: '1 bowl (150 g)',
      calories: 90,
      proteinG: 5,
      carbsG: 7,
      fatG: 5,
      confidence: 0.8,
    },
  ],
};

/**
 * A realistic report that also exercises the edge cases: glucose in mmol/L, an alias name,
 * a value that could not be read and a marker Nouri does not track.
 */
export const MOCK_REPORT: ReportExtraction = {
  issue: 'NONE',
  markers: [
    { name: 'Glycosylated Haemoglobin (HbA1c)', value: 6.1, unit: '%', refLow: 4, refHigh: 5.6 },
    { name: 'Glucose - Fasting', value: 6.2, unit: 'mmol/L', refLow: 3.9, refHigh: 5.6 },
    { name: 'LDL Cholesterol', value: 142, unit: 'mg/dL', refLow: null, refHigh: 100 },
    { name: 'HDL Cholesterol', value: 44, unit: 'mg/dL', refLow: 40, refHigh: null },
    { name: 'Triglycerides', value: 168, unit: 'mg/dL', refLow: null, refHigh: 150 },
    { name: '25-OH Vitamin D', value: 14, unit: 'ng/mL', refLow: 30, refHigh: 100 },
    { name: 'Vitamin B12', value: null, unit: 'pg/mL', refLow: 200, refHigh: 900 },
    { name: 'Haemoglobin', value: 13.1, unit: 'g/dL', refLow: 12, refHigh: 15 },
    { name: 'TSH', value: 2.1, unit: 'µIU/mL', refLow: 0.4, refHigh: 4.2 },
  ],
};
