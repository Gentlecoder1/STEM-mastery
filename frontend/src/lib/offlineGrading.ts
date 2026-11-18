/**
 * Provisional on-device marking.
 *
 * The backend sends a hashed `offlineKey` with each question (see
 * backend/app/services/grading.py). Answers are hashed here the same way and
 * compared, so plain answer keys never sit on the phone. Results are provisional:
 * the attempt is queued and re-graded by the server when the device reconnects.
 * Keep STOPWORDS and keywordStems() in step with grading.py.
 */

import { sha256Hex } from './sha256';
import { QUIZ_PASS_RATIO, type QuizQuestion } from '../types/catalog';

const STOPWORDS = new Set(
  (
    'the and for are was were with that this from into onto than then they them their '
    + 'there which what when where while have has had been being will would can could '
    + "should shall may might must not but also its it's per each any all some such "
    + 'very more most less least one two how why who whom whose our your his her'
  ).split(' '),
);

export function keywordStems(text: string): string[] {
  const stems: string[] = [];
  for (const token of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (token.length < 3 || STOPWORDS.has(token)) continue;
    const stem =
      token.length > 3 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;
    if (!stems.includes(stem)) stems.push(stem);
  }
  return stems;
}

export const answerHash = (questionId: string, value: string) =>
  sha256Hex(`${questionId}:${value.trim().toLowerCase()}`);

export type OfflineMark = {
  questionId: string;
  /** true/false when the phone could mark it; null when it cannot (no key or unsupported response). */
  correct: boolean | null;
  /** Written answers only: share of reference keywords found in the response (0–1). */
  coverage?: number;
  /** Time spent marking on the device, in milliseconds (for the Objective 3 latency log). */
  ms: number;
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function markOffline(question: QuizQuestion, response: string | null): OfflineMark {
  const started = now();
  const key = question.offlineKey;
  const text = (response ?? '').trim();
  let correct: boolean | null = null;
  let coverage: number | undefined;

  if (key?.answerHash && text) {
    correct = answerHash(question.id, text) === key.answerHash;
  } else if (key?.keywordHashes?.length && text) {
    const given = new Set(keywordStems(text).map((stem) => answerHash(question.id, stem)));
    const found = key.keywordHashes.filter((hash) => given.has(hash)).length;
    coverage = found / key.keywordHashes.length;
    correct = coverage >= (key.minCoverage ?? 0.5);
  }
  return { questionId: question.id, correct, coverage, ms: now() - started };
}

export type OfflineSummary = {
  correct: number;
  total: number;
  scorePct: number;
  passed: boolean;
  /** Questions the phone could not mark (no offline key cached). */
  unmarked: number;
};

/** Mirrors grading.summarise(): only automatically marked answers count. */
export function summariseOffline(questions: QuizQuestion[], marks: OfflineMark[]): OfflineSummary {
  const graded = marks.filter((mark) => mark.correct !== null);
  const total = graded.length;
  const correct = graded.filter((mark) => mark.correct).length;
  const scorePct = total ? Math.round((correct / total) * 100) : 0;
  const unmarked = questions.length - total;
  return { correct, total, scorePct, passed: total > 0 && correct / total >= QUIZ_PASS_RATIO, unmarked };
}

export function coverageFeedback(coverage: number | undefined): string | null {
  if (coverage === undefined) return null;
  if (coverage >= 0.5) return 'Your answer covers the main ideas.';
  if (coverage >= 0.25) return 'Partly there. Check the lesson for the key terms you may have missed.';
  return 'Your answer is missing most of the key ideas. Review the lesson and try again.';
}
