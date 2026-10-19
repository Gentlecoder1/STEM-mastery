import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadLesson, loadQuestions, saveLesson, saveQuestions } from '../src/lib/offlineStore';
import { CATALOG_STORAGE_KEY, loadCatalogSnapshot } from '../src/lib/catalogCache';
import { mapConceptSummary } from '../src/types/catalog';

afterEach(async () => {
  await AsyncStorage.clear();
});

it('maps concept summaries to topic and subject membership arrays', () => {
  const concept = mapConceptSummary(
    {
      id: 'concept-velocity',
      name: 'Velocity',
      prefLabel: null,
      iri: null,
      prerequisites: [],
    },
    'topic-motion',
    'physics',
  );

  expect(concept.topicIds).toEqual(['topic-motion']);
  expect(concept.subjectIds).toEqual(['physics']);
  expect(concept.hasLesson).toBe(false);
  expect(concept.prerequisiteIds).toEqual([]);
  expect(concept.relatedConceptIds).toEqual([]);
});

it('persists client-safe quiz questions for offline use', async () => {
  const questions = [
    {
      id: 'question-1',
      type: 'mcq' as const,
      prompt: 'Which quantity has direction?',
      options: [{ id: 'a', label: 'A', text: 'Speed' }],
    },
  ];

  await saveQuestions('concept-velocity', questions);

  expect(await loadQuestions('concept-velocity')).toMatchObject({
    conceptId: 'concept-velocity',
    questions,
  });
});

it('persists structured lessons separately from legacy catalog snapshots', async () => {
  const lesson = {
    concept: {
      id: 'concept-velocity',
      title: 'Velocity',
      subjectId: 'physics',
      topicId: 'topic-motion',
      order: 1,
      estimatedMinutes: 30,
    },
    learningObjectives: ['Distinguish speed and velocity.'],
    definition: 'Velocity is speed in a direction.',
    explanation: ['Velocity includes direction.'],
    keyTerms: [{ term: 'Vector', definition: 'A quantity with magnitude and direction.' }],
    illustrations: [],
    workedExamples: [],
    realWorldApplications: [],
    commonMistakes: [],
    summary: [],
    prerequisiteNotes: [],
    prerequisites: [],
    relatedConcepts: [],
    practiceAvailable: true,
    questionCount: 2,
  };
  await saveLesson('concept-velocity', lesson);

  await AsyncStorage.setItem(
    CATALOG_STORAGE_KEY,
    JSON.stringify({
      lastSyncedAt: '2026-01-01T00:00:00Z',
      subjects: [],
      topics: [],
      conceptOrder: { 'topic-motion': ['concept-velocity'] },
      concepts: [
        {
          id: 'concept-velocity',
          topicId: 'topic-motion',
          subjectId: 'physics',
          title: 'Velocity',
          definition: 'Speed in a direction.',
          whyItMatters: '',
          prerequisites: [],
          related: [],
          tint: 'blue',
          soft: 'blueSoft',
          content: [{ id: 'legacy-section' }],
        },
      ],
    }),
  );

  const snapshot = await loadCatalogSnapshot();
  const cachedLesson = await loadLesson('concept-velocity');

  expect(snapshot?.concepts[0]).toMatchObject({
    topicIds: ['topic-motion'],
    subjectIds: ['physics'],
    hasLesson: false,
  });
  expect(snapshot?.concepts[0]).not.toHaveProperty('content');
  expect(cachedLesson?.lesson).toEqual(lesson);
});
