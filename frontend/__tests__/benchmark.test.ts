import { learningPath, runLatency, runLoad, sample, type BenchDeps } from '../src/lib/benchmark';

const graph: Record<string, string[]> = { a: [], b: ['a'], c: ['b'], d: ['c', 'a'] };
const deps = (): BenchDeps => {
  let t = 0;
  return {
    cachedIds: Object.keys(graph),
    getConcept: (id) => ({ id, prerequisiteIds: graph[id] ?? [], relatedConceptIds: [], topicIds: ['T1'] }),
    conceptsInTopic: () => Object.keys(graph),
    loadLocal: async () => {},
    cloud: { concept: async (id) => ({ prerequisiteIds: graph[id] ?? [], topicIds: ['T1'] }), topicConcepts: async () => [], bundle: async () => {} },
    now: () => (t += 1),
    sleep: async () => {},
  };
};

test('learning path follows prerequisites transitively', () => {
  expect(learningPath('d', deps().getConcept).sort()).toEqual(['a', 'b', 'c', 'd']);
});

test('sampling is repeatable', () => {
  expect(sample(['x', 'y', 'z'], 5)).toEqual(sample(['x', 'y', 'z'], 5));
  expect(sample([], 5)).toEqual([]);
});

test('latency run reports local and cloud averages and LR', async () => {
  const out = await runLatency(deps(), 10);
  expect(out.k_local).toBe(10);
  expect(out.local.remediation_bundle.n).toBe(10);
  expect(out.k_cloud).toBe(10);
  expect(out.QL_cloud_ms).not.toBeNull();
  expect(typeof out.LR_percent).toBe('number');
});

test('load run stops after the time budget', async () => {
  const d = deps();
  const out = await runLoad({ ...d, now: (() => { let t = 0; return () => (t += 10_000); })() }, 1, 'local');
  expect(out.cycles).toBeGreaterThan(0);
  expect(out.errors).toBe(0);
});
