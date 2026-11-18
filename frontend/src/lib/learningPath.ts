import type { CatalogTopic, Concept } from '../types/catalog';

export const MIN_STUDY_SECONDS = 10 * 60;
export const LESSONS_PER_SESSION = 3;

type PathCatalog = {
  getConcept: (id: string) => Concept | undefined;
  getTopicConceptIds: (topicId: string) => string[];
};

export function studyBatch(
  catalog: PathCatalog,
  conceptId: string,
  topicId: string | undefined,
  canStudy: (id: string) => boolean,
): string[] {
  const order = topicId ? catalog.getTopicConceptIds(topicId) : [];
  const index = order.indexOf(conceptId);
  const following = index < 0 ? [] : order.slice(index + 1);
  return [conceptId, ...following.filter((id) => canStudy(id) && catalog.getConcept(id)?.hasLesson)]
    .slice(0, LESSONS_PER_SESSION);
}

export function nextTopicLesson(
  catalog: PathCatalog,
  topics: CatalogTopic[],
  topicId: string | undefined,
  canStudy: (id: string) => boolean,
): { conceptId: string; topicId: string } | undefined {
  const current = topics.find((topic) => topic.id === topicId);
  if (!current) return undefined;
  const sameSubject = topics.filter((topic) => topic.subjectId === current.subjectId);
  for (const topic of sameSubject.slice(sameSubject.indexOf(current) + 1)) {
    const conceptId = catalog.getTopicConceptIds(topic.id)
      .find((id) => canStudy(id) && catalog.getConcept(id)?.hasLesson);
    if (conceptId) return { conceptId, topicId: topic.id };
  }
  return undefined;
}
