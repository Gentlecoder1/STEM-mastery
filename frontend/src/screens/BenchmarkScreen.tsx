/**
 * Hidden benchmark screen for the thesis phone test. Only registered when the app is built with
 * EXPO_PUBLIC_BENCHMARK=1 (eas.json profile "benchmark"), and opened from the laptop with
 *   adb shell am start -a android.intent.action.VIEW -d "stemmastery://benchmark?mode=latency"
 *   adb shell am start -a android.intent.action.VIEW -d "stemmastery://benchmark?mode=load&minutes=30&source=local"
 * The laptop script keeps the screen awake (screen_off_timeout). Results are shown on screen and printed to the device log as `STEM_BENCH {json}`.
 */
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCatalog } from '../catalogContext';
import * as Network from 'expo-network';
import { useOffline } from '../offlineContext';
import { BENCH_TAG, runLatency, runLoad, type BenchDeps } from '../lib/benchmark';
import { loadLesson, loadQuestions } from '../lib/offlineStore';
import { fetchConcept, fetchConcepts, fetchLesson } from '../lib/catalogApi';
import { fetchConceptQuestions } from '../lib/assessmentApi';
import { isApiConfigured } from '../lib/api';
import type { RootScreenProps } from '../navigation/types';

export default function BenchmarkScreen({ route }: RootScreenProps<'Benchmark'>) {
  const { getConcept, getTopicConceptIds } = useCatalog();
  const { downloads } = useOffline();
  const runId = route.params?.runId ?? "manual";
  const offline = route.params?.offline === "1";
  const mode = route.params?.mode ?? 'latency';
  const minutes = Number(route.params?.minutes ?? 30);
  const source = route.params?.source === 'cloud' ? 'cloud' : 'local';
  const [status, setStatus] = useState('Preparing…');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('Preparing…');
      setResult(null);
      const network = await Network.getNetworkStateAsync();
      const isOnline = network.isConnected === true && network.isInternetReachable !== false;
      if (offline === isOnline) throw new Error(offline ? 'Turn off Wi-Fi and mobile data.' : 'Connect the phone to the internet.');
      if (!offline && !isApiConfigured) throw new Error('The benchmark build has no API URL.');
      const cachedIds: string[] = [];
      for (const id of downloads) {
        const [lesson, questions] = await Promise.all([loadLesson(id), loadQuestions(id)]);
        if (getConcept(id) && lesson?.lesson.length && questions?.questions.length) cachedIds.push(id);
      }
      cachedIds.sort();
      const deps: BenchDeps = {
        cachedIds,
        getConcept,
        conceptsInTopic: getTopicConceptIds,
        loadLocal: async (id) => {
          const [, questions] = await Promise.all([loadLesson(id), loadQuestions(id)]);
          return questions?.questions ?? [];
        },
        cloud: !offline ? {
          concept: (id) => fetchConcept(id),
          topicConcepts: (topicId) => fetchConcepts(topicId),
          bundle: async (id) => { await Promise.all([fetchLesson(id), fetchConceptQuestions(id)]); },
        } : undefined,
      };
      setStatus(`${mode === 'load' ? `Running ${minutes}-minute ${source} workload` : 'Measuring latency'} on ${cachedIds.length} cached concepts…`);
      const out = mode === 'load' ? await runLoad(deps, minutes, source) : await runLatency(deps);
      const line = JSON.stringify({ ...out, run_id: runId, online: isOnline, at: new Date().toISOString() });
      if (!cancelled) console.log(`${BENCH_TAG} ${line}`);
      if (!cancelled) { setStatus('Done'); setResult(JSON.stringify(JSON.parse(line), null, 1)); }
    })().catch((error) => {
      if (!cancelled) console.log(`${BENCH_TAG} ${JSON.stringify({ run_id: runId, error: String(error) })}`);
      if (!cancelled) setStatus(`Failed: ${String(error)}`);
    });
    return () => { cancelled = true; };
    // run once per opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Benchmark</Text>
      <Text style={styles.status}>{status}</Text>
      {result ? <ScrollView><Text style={styles.mono}>{result}</Text></ScrollView> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, paddingTop: 64, backgroundColor: '#0f1424' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  status: { color: '#cbd2e1', fontSize: 14, marginBottom: 12 },
  mono: { color: '#e6e9f0', fontFamily: 'monospace', fontSize: 11 },
});
