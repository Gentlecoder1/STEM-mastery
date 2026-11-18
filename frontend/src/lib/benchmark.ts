/**
 * On-device benchmark for the thesis evaluation (Objective 3/4): query latency and a steady workload for the energy test. Pure logic with injected data access so it can
 * be unit-tested; BenchmarkScreen wires it to the app's cache and API.
 *
 * Results are printed to the device log as one line starting with BENCH_TAG, so the laptop
 * script (tools/phone_test.py) can read them with `adb logcat`.
 */
import { markOffline } from './offlineGrading';
import type { QuizQuestion } from '../types/catalog';

export const BENCH_TAG = 'STEM_BENCH';

export type BenchConcept = {
  id: string;
  prerequisiteIds: readonly string[];
  relatedConceptIds: readonly string[];
  topicIds: readonly string[];
};

export type BenchDeps = {
  /** Concepts whose lesson and questions are cached on the phone. */
  cachedIds: string[];
  getConcept: (id: string) => BenchConcept | undefined;
  conceptsInTopic: (topicId: string) => string[];
  loadLocal: (id: string) => Promise<readonly QuizQuestion[]>;
  /** Cloud versions of the same lookups; omit to skip the cloud baseline. */
  cloud?: {
    concept: (id: string) => Promise<{ prerequisiteIds: string[]; topicIds?: string[] }>;
    topicConcepts: (topicId: string) => Promise<unknown[]>;
    bundle: (id: string) => Promise<void>;
  };
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

type Stats = { n: number; mean_ms: number; p95_ms: number };
const stats = (xs: number[]): Stats => {
  const s = [...xs].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
  return { n: s.length, mean_ms: +mean.toFixed(3), p95_ms: +(s[Math.min(s.length - 1, Math.floor(0.95 * s.length))] ?? 0).toFixed(3) };
};

/** Small seeded generator so every run samples the same concepts. */
function rng(seed: number) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export function sample<T>(items: T[], k: number, seed = 42): T[] {
  const r = rng(seed);
  return Array.from({ length: items.length ? k : 0 }, () => items[Math.floor(r() * items.length)]);
}

/** Prerequisite ancestors (learning path), breadth-first up to `maxDepth` steps. */
export function learningPath(id: string, get: BenchDeps['getConcept'], maxDepth = 15, cached?: ReadonlySet<string>): string[] {
  const seen = new Set<string>([id]);
  let frontier = [id];
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const next: string[] = [];
    for (const c of frontier) for (const p of get(c)?.prerequisiteIds ?? []) if ((!cached || cached.has(p)) && !seen.has(p)) { seen.add(p); next.push(p); }
    frontier = next;
  }
  return [...seen];
}

export async function runLatency(deps: BenchDeps, k = 20) {
  const now = deps.now ?? (() => performance.now());
  if (!deps.cachedIds.length) throw new Error("Download topics with lessons and questions first.");
  const ids = sample(deps.cachedIds, k);
  const cached = new Set(deps.cachedIds);
  const getCachedConcept = (id: string) => cached.has(id) ? deps.getConcept(id) : undefined;
  const t: Record<string, number[]> = { prerequisite_lookup: [], related_topic_search: [], learning_path: [], remediation_bundle: [] };
  const markingTimes: number[] = [];
  for (const id of ids) {
    let t0 = now(); deps.getConcept(id)?.prerequisiteIds; t.prerequisite_lookup.push(now() - t0);
    t0 = now();
    const c = deps.getConcept(id);
    new Set([...(c?.relatedConceptIds ?? []), ...(c?.prerequisiteIds ?? []), ...(c?.topicIds ?? []).flatMap(deps.conceptsInTopic)]);
    t.related_topic_search.push(now() - t0);
    t0 = now();
    const path = learningPath(id, getCachedConcept, 15, cached);
    t.learning_path.push(now() - t0);
    t0 = now();
    const [questions] = await Promise.all(path.map(deps.loadLocal));
    t.remediation_bundle.push(now() - t0);
    for (const question of questions) {
      const option = question.options?.[0];
      if (question.type === 'mcq' && question.offlineKey?.answerHash && option) {
        markingTimes.push(markOffline(question, option.id).ms);
      }
    }
  }
  const local = Object.fromEntries(Object.entries(t).map(([name, xs]) => [name, stats(xs)]));
  const queryNames = ['prerequisite_lookup', 'related_topic_search', 'learning_path', 'remediation_bundle'];
  const QL_local = +(queryNames.reduce((a, n) => a + local[n].mean_ms, 0) / queryNames.length).toFixed(3);

  let cloud: Record<string, Stats> | null = null;
  let QL_cloud: number | null = null;
  if (deps.cloud) {
    const c = deps.cloud;
    const ct: Record<string, number[]> = { prerequisite_lookup: [], related_topic_search: [], learning_path: [], remediation_bundle: [] };
    for (const id of ids) {
      let t0 = now(); const meta = await c.concept(id); ct.prerequisite_lookup.push(now() - t0);
      t0 = now(); await c.concept(id); await Promise.all((meta.topicIds ?? []).map(c.topicConcepts)); ct.related_topic_search.push(now() - t0);
      t0 = now();
      const seen = new Set([id]); let frontier = [id];
      for (let d = 0; d < 15 && frontier.length; d++) {
        const metas = await Promise.all(frontier.map(c.concept));
        frontier = metas.flatMap((m) => m.prerequisiteIds).filter((p) => cached.has(p) && !seen.has(p) && seen.add(p));
      }
      ct.learning_path.push(now() - t0);
      t0 = now(); await Promise.all([...seen].map(c.bundle)); ct.remediation_bundle.push(now() - t0);
    }
    cloud = Object.fromEntries(Object.entries(ct).map(([name, xs]) => [name, stats(xs)]));
    QL_cloud = +(queryNames.reduce((a, n) => a + cloud![n].mean_ms, 0) / queryNames.length).toFixed(2);
  }
  return {
    mode: 'latency', cached_concepts: deps.cachedIds.length, k_local: ids.length, k_cloud: deps.cloud ? ids.length : 0,
    offline_marking_per_answer: markingTimes.length ? stats(markingTimes) : null,
    local, QL_local_ms: QL_local, cloud, QL_cloud_ms: QL_cloud,
    LR_percent: QL_cloud ? +(((QL_cloud - QL_local) / QL_cloud) * 100).toFixed(2) : null,
  };
}

/** Steady study-like workload for the energy test: one concept every `pauseMs`, for `minutes`. */
export async function runLoad(deps: BenchDeps, minutes: number, source: 'local' | 'cloud', pauseMs = 1500) {
  const now = deps.now ?? (() => performance.now());
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  if (!deps.cachedIds.length) throw new Error('Download topics with lessons and questions first.');
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('Invalid workload duration.');
  const cloud = deps.cloud;
  if (source === 'cloud' && !cloud) throw new Error('The cloud workload requires an internet connection.');

  const start = now();
  const end = start + minutes * 60_000;
  const r = rng(99);
  let cycles = 0;
  let errors = 0;
  while (now() < end) {
    const started = now();
    const id = deps.cachedIds[Math.floor(r() * deps.cachedIds.length)];
    try {
      if (source === 'cloud' && cloud) {
        await cloud.concept(id);
        await cloud.bundle(id);
      } else {
        deps.getConcept(id);
        await deps.loadLocal(id);
      }
      cycles++;
    } catch {
      errors++;
    }
    await sleep(Math.max(0, Math.min(end - now(), started + pauseMs - now())));
  }
  return { mode: 'load', source, minutes, elapsed_ms: now() - start, cycles, errors };
}
