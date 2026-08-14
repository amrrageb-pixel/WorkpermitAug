import type { PermitType, TrainingRecord } from '../types';

/**
 * Keywords matched (case-insensitive, substring) against TrainingRecord titles to decide
 * whether a training record satisfies the certification a given permit type requires.
 * Permit types not listed here have no specific certification requirement.
 */
const REQUIRED_TRAINING_KEYWORDS: Partial<Record<PermitType, string[]>> = {
  HOT: ['hot work', 'hot-work', 'welding', 'أعمال ساخنة', 'لحام'],
  CONFINED: ['confined space', 'confined', 'أماكن مغلقة', 'مكان مغلق'],
  HEIGHT: ['height', 'fall protection', 'ارتفاع', 'العمل على ارتفاع'],
  LOTO: ['loto', 'lockout', 'tagout', 'isolation', 'عزل الطاقة', 'قفل وعلامات'],
  ELECTRICAL: ['electrical', 'كهرباء', 'كهربائي'],
  LINE_BREAKING: ['line breaking', 'line-breaking', 'فتح خطوط', 'فك خطوط'],
  EXCAVATION: ['excavation', 'trenching', 'حفريات'],
};

/**
 * Whether `workerName` holds a currently-valid (non-expired) training record matching the
 * certification `permitType` requires. Returns true when the permit type has no specific
 * certification requirement — this is the ONLY case competency should default to "qualified".
 */
export function isWorkerCertifiedForType(
  workerName: string,
  permitType: PermitType,
  trainings: TrainingRecord[]
): boolean {
  const keywords = REQUIRED_TRAINING_KEYWORDS[permitType];
  if (!keywords || keywords.length === 0) return true;

  const today = new Date();
  return trainings.some((t) => {
    if (!t.attendees?.includes(workerName)) return false;
    if (t.status === 'EXPIRED') return false;
    const expiry = new Date(t.expiryDate);
    if (isNaN(expiry.getTime()) || expiry < today) return false;
    const haystack = `${t.titleEn} ${t.titleAr}`.toLowerCase();
    return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
  });
}

export function requiresCertificationFor(permitType: PermitType): boolean {
  return !!REQUIRED_TRAINING_KEYWORDS[permitType];
}
