import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadLesson, loadQuestions, saveQuestions } from '../src/lib/offlineStore';
import { CATALOG_STORAGE_KEY, loadCatalogSnapshot } from '../src/lib/catalogCache';
import { mapConceptSummary, mapLesson } from '../src/types/catalog';

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
});

it('maps lesson sections independently and sorts them by chapter order', () => {
  const lesson = mapLesson(
    [
      {
        id: 'section-2',
        conceptId: 'concept-velocity',
        title: null,
        contentText: 'Example',
        contentType: 'worked_example',
        chapterOrder: 2,
        mediaURI: null,
      },
      {
        id: 'section-1',
        conceptId: 'concept-velocity',
        title: 'Definition',
        contentText: 'Change in position over time.',
        contentType: 'definition',
        chapterOrder: 1,
        mediaURI: null,
      },
    ],
    'concept-velocity',
  );

  expect(lesson.map((section) => section.id)).toEqual(['section-1', 'section-2']);
  expect(lesson[1].contentType).toBe('WORKED_EXAMPLE');
  expect(lesson[1].title).toBe('Worked example');
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

it('migrates embedded lesson sections from old catalog snapshots to the lesson store', async () => {
  const section = {
    id: 'section-1',
    conceptId: 'concept-velocity',
    title: 'Definition',
    contentText: 'Change in position over time.',
    contentType: 'DEFINITION',
    chapterOrder: 1,
    mediaURI: null,
  };
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
          content: [section],
        },
      ],
    }),
  );

  const snapshot = await loadCatalogSnapshot();
  const lesson = await loadLesson('concept-velocity');

  expect(snapshot?.concepts[0]).toMatchObject({
    topicIds: ['topic-motion'],
    subjectIds: ['physics'],
    hasLesson: true,
  });
  expect(snapshot?.concepts[0]).not.toHaveProperty('content');
  expect(lesson?.content).toEqual([section]);
});
