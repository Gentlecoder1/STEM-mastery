import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import { SearchIcon } from '../components/glyphs';
import {
  fetchConceptKnowledgeMap,
  fetchKnowledgeMapRoot,
  searchKnowledgeMapConcepts,
} from '../lib/catalogApi';
import { ApiError } from '../lib/api';
import { loadKnowledgeMap, saveKnowledgeMap } from '../lib/offlineStore';
import type {
  ApiConceptSearchResult,
  KnowledgeMapNode,
  KnowledgeMapResponse,
} from '../types/catalog';
import { colors, fonts, shadow } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import type { RootScreenProps } from '../navigation/types';

const ROOT_CACHE_KEY = 'knowledge-map:root:v1';
const ORBIT_PAGE_SIZE = 12;
const ORBIT_NODE_WIDTH = 66;
const ORBIT_NODE_HEIGHT = 48;

type OrbitPosition = { node: KnowledgeMapNode; x: number; y: number };

function shortLabel(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function describeError(error: unknown): string {
  if (error instanceof ApiError && error.status === 0) {
    return 'Connect to the curriculum service to load the Knowledge Map.';
  }
  if (error instanceof ApiError && error.status === 503) {
    return 'The curriculum service is temporarily unavailable. Please try again.';
  }
  if (error instanceof ApiError && error.status === 404) {
    return 'This backend deployment does not expose the Knowledge Map API yet. Deploy the updated backend.';
  }
  return 'The Knowledge Map could not be loaded. Please try again.';
}

function getConceptMapCacheKey(conceptId: string, topicId?: string): string {
  return `knowledge-map:concept:${conceptId}:${topicId ?? ''}:depth:1`;
}

function getOrbitPositions(nodes: KnowledgeMapNode[], size: number): OrbitPosition[] {
  const center = size / 2;
  const innerAngles = [-90, 0, 90, 180];
  const outerAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  const slots = [
    ...innerAngles.map((angle) => ({ angle, radius: size * 0.235 })),
    ...outerAngles.map((angle) => ({ angle, radius: size * 0.385 })),
  ];

  return nodes.slice(0, ORBIT_PAGE_SIZE).map((node, index) => {
    const slot = slots[index];
    const radians = (slot.angle * Math.PI) / 180;
    return {
      node,
      x: center + Math.cos(radians) * slot.radius,
      y: center + Math.sin(radians) * slot.radius,
    };
  });
}

function uniqueNodes(nodes: Array<KnowledgeMapNode | undefined>): KnowledgeMapNode[] {
  const unique = new Map<string, KnowledgeMapNode>();
  nodes.forEach((node) => {
    if (node) unique.set(node.id, node);
  });
  return [...unique.values()];
}

export default function KnowledgeMapScreen({
  navigation,
  route,
}: RootScreenProps<'KnowledgeMap'>) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [rootMap, setRootMap] = useState<KnowledgeMapResponse | null>(null);
  const [conceptMap, setConceptMap] = useState<KnowledgeMapResponse | null>(null);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(
    route.params?.conceptId ?? null,
  );
  const [conceptTrail, setConceptTrail] = useState<string[]>([]);
  const [orbitPage, setOrbitPage] = useState(0);
  const [rootLoading, setRootLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiConceptSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const rootRequest = useRef(0);
  const conceptRequest = useRef(0);
  const conceptCache = useRef(new Map<string, KnowledgeMapResponse>());
  const mapSize = Math.max(250, Math.min(380, screenWidth - 64));

  const loadRootMap = useCallback(async () => {
    const requestId = ++rootRequest.current;
    setRootError(null);
    const cached = await loadKnowledgeMap(ROOT_CACHE_KEY);
    if (requestId !== rootRequest.current) return;
    if (cached) {
      setRootMap(cached);
      setRootLoading(false);
    } else {
      setRootLoading(true);
    }

    try {
      const result = await fetchKnowledgeMapRoot();
      if (requestId !== rootRequest.current) return;
      setRootMap(result);
      setRootError(null);
      void saveKnowledgeMap(ROOT_CACHE_KEY, result);
    } catch (cause) {
      if (requestId === rootRequest.current && !cached) {
        setRootError(describeError(cause));
      }
    } finally {
      if (requestId === rootRequest.current) setRootLoading(false);
    }
  }, []);

  const loadConceptMap = useCallback(async (conceptId: string, topicId?: string) => {
    const requestId = ++conceptRequest.current;
    const cacheKey = getConceptMapCacheKey(conceptId, topicId);
    let cached = conceptCache.current.get(cacheKey) ?? null;
    setDetailError(null);
    setConceptMap(cached);
    setDetailLoading(!cached);

    if (!cached) {
      cached = await loadKnowledgeMap(cacheKey);
      if (requestId !== conceptRequest.current) return;
      if (cached) {
        conceptCache.current.set(cacheKey, cached);
        setConceptMap(cached);
        setDetailLoading(false);
      }
    }

    try {
      const result = await fetchConceptKnowledgeMap(conceptId, {
        topicId,
        depth: 1,
        includeConnectedTopics: true,
      });
      if (requestId !== conceptRequest.current) return;
      conceptCache.current.set(cacheKey, result);
      setConceptMap(result);
      setDetailError(null);
      void saveKnowledgeMap(cacheKey, result);
    } catch (cause) {
      if (requestId === conceptRequest.current && !cached) {
        setDetailError(describeError(cause));
      }
    } finally {
      if (requestId === conceptRequest.current) setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRootMap();
  }, [loadRootMap]);

  useEffect(() => {
    const conceptId = route.params?.conceptId;
    if (!conceptId) return;
    setActiveConceptId(conceptId);
    setConceptTrail([]);
    void loadConceptMap(conceptId, route.params?.topicId);
  }, [loadConceptMap, route.params?.conceptId, route.params?.topicId]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(false);
      return;
    }
    let active = true;
    setSearchLoading(true);
    setSearchError(false);
    const timer = setTimeout(() => {
      void searchKnowledgeMapConcepts(normalized)
        .then((results) => {
          if (active) {
            setSearchResults(results);
            setSearchError(false);
          }
        })
        .catch(() => {
          if (active) {
            setSearchResults([]);
            setSearchError(true);
          }
        })
        .finally(() => {
          if (active) setSearchLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const conceptNodes = useMemo(
    () => (rootMap?.nodes ?? []).filter((node) => node.type === 'concept'),
    [rootMap],
  );
  const pageCount = Math.max(1, Math.ceil(conceptNodes.length / ORBIT_PAGE_SIZE));
  const pageNodes = conceptNodes.slice(
    orbitPage * ORBIT_PAGE_SIZE,
    (orbitPage + 1) * ORBIT_PAGE_SIZE,
  );
  const orbitPositions = useMemo(
    () => getOrbitPositions(pageNodes, mapSize),
    [mapSize, pageNodes],
  );
  const activeConcept = conceptMap?.nodes.find((node) => node.id === activeConceptId);
  const prerequisites = useMemo(() => {
    if (!conceptMap || !activeConceptId) return [];
    return uniqueNodes(
      conceptMap.edges
        .filter((edge) => edge.type === 'PREREQUISITE_OF' && edge.target === activeConceptId)
        .map((edge) => conceptMap.nodes.find((node) => node.id === edge.source)),
    );
  }, [activeConceptId, conceptMap]);
  const relatedConcepts = useMemo(() => {
    if (!conceptMap || !activeConceptId) return [];
    return uniqueNodes(
      conceptMap.edges
        .filter(
          (edge) =>
            edge.type === 'RELATED_TO'
            && (edge.source === activeConceptId || edge.target === activeConceptId),
        )
        .map((edge) => conceptMap.nodes.find(
          (node) => node.id === (edge.source === activeConceptId ? edge.target : edge.source),
        )),
    );
  }, [activeConceptId, conceptMap]);

  useEffect(() => {
    if (orbitPage >= pageCount) setOrbitPage(Math.max(0, pageCount - 1));
  }, [orbitPage, pageCount]);

  const openConcept = (conceptId: string, topicId?: string) => {
    if (activeConceptId && activeConceptId !== conceptId) {
      setConceptTrail((trail) => [...trail, activeConceptId]);
    }
    setActiveConceptId(conceptId);
    setQuery('');
    setSearchResults([]);
    setSearchError(false);
    void loadConceptMap(conceptId, topicId);
  };

  const goBack = () => {
    const previousConceptId = conceptTrail[conceptTrail.length - 1];
    if (previousConceptId) {
      setConceptTrail((trail) => trail.slice(0, -1));
      setActiveConceptId(previousConceptId);
      const cachedMap = [...conceptCache.current.entries()].find(([key]) =>
        key.startsWith(`knowledge-map:concept:${previousConceptId}:`),
      )?.[1];
      void loadConceptMap(previousConceptId, cachedMap?.topicId ?? undefined);
      return;
    }
    setActiveConceptId(null);
    setConceptMap(null);
    setDetailError(null);
  };

  const selectSearchResult = (result: ApiConceptSearchResult) => {
    openConcept(result.id, result.contexts[0]?.topicId ?? undefined);
  };

  const retry = () => {
    if (activeConceptId) {
      const selectedTopic = conceptMap?.topicId ?? route.params?.topicId;
      void loadConceptMap(activeConceptId, selectedTopic ?? undefined);
    } else {
      void loadRootMap();
    }
  };

  const learnConcept = (conceptId: string, returnToConceptId?: string) => {
    navigation.navigate('ConceptLearning', {
      conceptId,
      returnToConceptId,
    });
  };

  const firstLearnablePrerequisite = prerequisites.find((node) => node.type === 'concept');
  const rootStatusMessage = rootMap?.mappingStatus && rootMap.mappingStatus !== 'ready'
    ? rootMap.mappingMessage ?? 'Some learning connections are still being verified.'
    : null;
  const detailStatusMessage = conceptMap && conceptMap.mappingStatus !== 'ready'
    ? conceptMap.mappingMessage ?? 'Learning connections are still being verified.'
    : null;

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 6, paddingBottom: activeConceptId ? 108 : insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={activeConceptId ? goBack : () => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={activeConceptId ? 'Back to previous concept or map' : 'Go back'}
          >
            <ArrowLeftIcon size={21} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>STEM · KNOWLEDGE ORBIT</Text>
            <Text style={styles.headerTitle}>{activeConceptId ? 'Concept pathway' : 'Knowledge Map'}</Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchField}>
            <SearchIcon size={18} color={colors.slate} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Find any concept"
              placeholderTextColor={colors.slate}
              accessibilityLabel="Search concepts in the Knowledge Map"
              returnKeyType="search"
            />
            {searchLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          {searchError ? (
            <View style={styles.searchResults}>
              <Text style={styles.searchError}>Search is unavailable. Try again shortly.</Text>
            </View>
          ) : null}
          {searchResults.length > 0 ? (
            <View style={styles.searchResults}>
              {searchResults.slice(0, 5).map((result) => (
                <Pressable
                  key={result.id}
                  style={styles.searchResult}
                  onPress={() => selectSearchResult(result)}
                >
                  <Text style={styles.searchResultTitle}>{result.name}</Text>
                  <Text style={styles.searchResultContext}>
                    {result.contexts[0]?.topicName ?? 'Open concept pathway'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {!activeConceptId ? (
          <>
            <View style={styles.intro}>
              <Text style={styles.introTitle}>One universe.{'\n'}Endless ways to learn.</Text>
              <Text style={styles.introText}>
                Start anywhere. Every concept connects to a bigger STEM picture.
              </Text>
            </View>

            {rootError && !rootMap ? (
              <View style={styles.messageState}>
                <Text style={styles.messageText}>{rootError}</Text>
                <Pressable style={styles.retryButton} onPress={retry}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {rootLoading && !rootMap ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Opening your STEM universe…</Text>
              </View>
            ) : null}

            {rootMap ? (
              <>
                <View style={styles.orbitCard}>
                  <View style={styles.orbitCardHeader}>
                    <View>
                      <Text style={styles.orbitEyebrow}>YOUR LEARNING UNIVERSE</Text>
                      <Text style={styles.orbitTitle}>Explore the constellation</Text>
                    </View>
                    <View style={styles.conceptCount}>
                      <Text style={styles.conceptCountValue}>{conceptNodes.length}</Text>
                      <Text style={styles.conceptCountLabel}>nodes</Text>
                    </View>
                  </View>

                  <View style={[styles.constellation, { width: mapSize, height: mapSize }]}>
                    <Svg width={mapSize} height={mapSize} style={StyleSheet.absoluteFill}>
                      <Circle
                        cx={mapSize / 2}
                        cy={mapSize / 2}
                        r={mapSize * 0.235}
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1}
                      />
                      <Circle
                        cx={mapSize / 2}
                        cy={mapSize / 2}
                        r={mapSize * 0.385}
                        fill="none"
                        stroke="rgba(255,255,255,0.09)"
                        strokeWidth={1}
                        strokeDasharray="3 7"
                      />
                      {orbitPositions.map(({ node, x, y }) => (
                        <Line
                          key={`spoke:${node.id}`}
                          x1={mapSize / 2}
                          y1={mapSize / 2}
                          x2={x}
                          y2={y}
                          stroke="rgba(255,255,255,0.26)"
                          strokeWidth={1}
                        />
                      ))}
                      {[
                        [0.18, 0.27],
                        [0.78, 0.18],
                        [0.86, 0.72],
                        [0.24, 0.81],
                        [0.55, 0.09],
                        [0.12, 0.62],
                        [0.67, 0.9],
                      ].map(([x, y], index) => (
                        <Circle
                          key={`star:${index}`}
                          cx={mapSize * x}
                          cy={mapSize * y}
                          r={index % 2 === 0 ? 1.8 : 1.2}
                          fill="rgba(255,255,255,0.62)"
                        />
                      ))}
                    </Svg>

                    <Pressable
                      style={[
                        styles.stemHub,
                        { left: mapSize / 2 - 39, top: mapSize / 2 - 39 },
                      ]}
                      onPress={() => setOrbitPage(0)}
                      accessibilityRole="button"
                      accessibilityLabel="STEM learning hub"
                    >
                      <Text style={styles.stemHubTitle}>STEM</Text>
                      <Text style={styles.stemHubSubtitle}>the big picture</Text>
                    </Pressable>

                    {orbitPositions.map(({ node, x, y }, index) => (
                      <Pressable
                        key={node.id}
                        style={[
                          styles.orbitNode,
                          { left: x - ORBIT_NODE_WIDTH / 2, top: y - ORBIT_NODE_HEIGHT / 2 },
                        ]}
                        onPress={() => openConcept(node.id, node.topicIds[0])}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${node.name}`}
                      >
                        <View style={[styles.nodeSpark, index % 3 === 1 && styles.nodeSparkAlt]} />
                        <Text numberOfLines={2} style={styles.orbitNodeText}>
                          {shortLabel(node.name, 10)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.orbitPager}>
                    <Pressable
                      style={[styles.pagerButton, orbitPage === 0 && styles.pagerButtonDisabled]}
                      onPress={() => setOrbitPage((page) => Math.max(0, page - 1))}
                      disabled={orbitPage === 0}
                      accessibilityLabel="Previous orbit"
                    >
                      <ArrowLeftIcon size={17} color={orbitPage === 0 ? colors.slate : colors.onPrimary} />
                    </Pressable>
                    <View style={styles.pagerCopy}>
                      <Text style={styles.pagerTitle}>Orbit {orbitPage + 1} of {pageCount}</Text>
                      <Text style={styles.pagerSubtitle}>Choose an orbit or explore a node below</Text>
                    </View>
                    <Pressable
                      style={[styles.pagerButton, orbitPage >= pageCount - 1 && styles.pagerButtonDisabled]}
                      onPress={() => setOrbitPage((page) => Math.min(pageCount - 1, page + 1))}
                      disabled={orbitPage >= pageCount - 1}
                      accessibilityLabel="Next orbit"
                    >
                      <ArrowRightIcon size={17} color={orbitPage >= pageCount - 1 ? colors.slate : colors.onPrimary} />
                    </Pressable>
                  </View>
                  <View style={styles.pageDots}>
                    {Array.from({ length: pageCount }, (_, index) => (
                      <Pressable
                        key={index}
                        style={[styles.pageDot, index === orbitPage && styles.pageDotActive]}
                        onPress={() => setOrbitPage(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Show orbit ${index + 1}`}
                      />
                    ))}
                  </View>
                </View>

                {rootStatusMessage ? (
                  <View style={styles.mappingNotice}>
                    <View style={styles.noticeDot} />
                    <Text style={styles.mappingNoticeText}>{rootStatusMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.nodesHeading}>
                  <View>
                    <Text style={styles.sectionEyebrow}>PICK A PATH</Text>
                    <Text style={styles.sectionTitle}>Concepts in this orbit</Text>
                  </View>
                  <Text style={styles.nodesRange}>
                    {pageNodes.length ? `${orbitPage * ORBIT_PAGE_SIZE + 1}–${orbitPage * ORBIT_PAGE_SIZE + pageNodes.length}` : '0'}
                  </Text>
                </View>
                <View style={styles.conceptList}>
                  {pageNodes.map((node) => (
                    <Pressable
                      key={node.id}
                      style={styles.conceptCard}
                      onPress={() => openConcept(node.id, node.topicIds[0])}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${node.name}`}
                    >
                      <View style={styles.conceptCardIcon}>
                        <Text style={styles.conceptCardIndex}>
                          {String(conceptNodes.findIndex((item) => item.id === node.id) + 1).padStart(2, '0')}
                        </Text>
                      </View>
                      <View style={styles.conceptCardCopy}>
                        <Text numberOfLines={2} style={styles.conceptCardTitle}>{node.name}</Text>
                        <Text style={styles.conceptCardMeta}>
                          {node.hasLesson ? 'Lesson ready' : 'Explore concept'}
                          {node.hasAssessment ? ' · Practice' : ''}
                        </Text>
                      </View>
                      <ArrowRightIcon size={17} color={colors.slate} />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : (
          <View style={styles.detailContent}>
            {detailError && !conceptMap ? (
              <View style={styles.messageState}>
                <Text style={styles.messageText}>{detailError}</Text>
                <Pressable style={styles.retryButton} onPress={retry}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {detailLoading && !conceptMap ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Finding this concept’s connections…</Text>
              </View>
            ) : null}

            {conceptMap ? (
              <>
                <View style={styles.focusHero}>
                  <View style={styles.focusHeroTop}>
                    <View style={styles.focusBadge}>
                      <View style={styles.focusBadgeDot} />
                      <Text style={styles.focusBadgeText}>CONCEPT NODE</Text>
                    </View>
                    {activeConcept?.hasAssessment ? (
                      <Text style={styles.assessmentBadge}>PRACTICE READY</Text>
                    ) : null}
                  </View>
                  <Text style={styles.focusTitle}>{activeConcept?.name ?? activeConceptId}</Text>
                  <Text style={styles.focusDescription}>
                    {activeConcept?.contentPreview?.trim()
                      || 'A connected idea in the STEM universe. Choose your next step or explore what it builds on.'}
                  </Text>
                  <View style={styles.focusStats}>
                    <View style={styles.focusStat}>
                      <Text style={styles.focusStatValue}>{prerequisites.length}</Text>
                      <Text style={styles.focusStatLabel}>prerequisites</Text>
                    </View>
                    <View style={styles.focusStatDivider} />
                    <View style={styles.focusStat}>
                      <Text style={styles.focusStatValue}>{relatedConcepts.length}</Text>
                      <Text style={styles.focusStatLabel}>related ideas</Text>
                    </View>
                    <View style={styles.focusStatDivider} />
                    <View style={styles.focusStat}>
                      <Text style={styles.focusStatValue}>{activeConcept?.hasLesson ? 'Ready' : 'Open'}</Text>
                      <Text style={styles.focusStatLabel}>learning</Text>
                    </View>
                  </View>
                </View>

                {detailStatusMessage ? (
                  <View style={styles.mappingNotice}>
                    <View style={styles.noticeDot} />
                    <Text style={styles.mappingNoticeText}>{detailStatusMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.relationSection}>
                  <View style={styles.sectionHeading}>
                    <View style={styles.relationIconPrerequisite}>
                      <Text style={styles.relationIconText}>1</Text>
                    </View>
                    <View style={styles.relationHeadingCopy}>
                      <Text style={styles.sectionEyebrow}>BUILD YOUR FOUNDATION</Text>
                      <Text style={styles.sectionTitle}>Prerequisites</Text>
                    </View>
                    <Text style={styles.relationCount}>{prerequisites.length}</Text>
                  </View>
                  {prerequisites.length ? (
                    <View style={styles.relationList}>
                      {prerequisites.map((node) => (
                        <RelationCard
                          key={node.id}
                          node={node}
                          label={node.type === 'concept' ? 'LEARN THIS FIRST' : 'FOUNDATION CONCEPT'}
                          onPress={
                            node.type === 'concept'
                              ? () => learnConcept(node.id, activeConceptId)
                              : undefined
                          }
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyRelation}>
                      <Text style={styles.emptyRelationTitle}>Start wherever you are</Text>
                      <Text style={styles.emptyRelationText}>
                        {conceptMap.mappingStatus === 'ready'
                          ? 'No prerequisite has been mapped for this concept.'
                          : 'Prerequisite links are still being verified. You can continue learning now.'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.relationSection}>
                  <View style={styles.sectionHeading}>
                    <View style={styles.relationIconRelated}>
                      <Text style={styles.relationIconText}>↗</Text>
                    </View>
                    <View style={styles.relationHeadingCopy}>
                      <Text style={styles.sectionEyebrow}>FOLLOW A CONNECTION</Text>
                      <Text style={styles.sectionTitle}>Related concepts</Text>
                    </View>
                    <Text style={styles.relationCount}>{relatedConcepts.length}</Text>
                  </View>
                  {relatedConcepts.length ? (
                    <View style={styles.relationList}>
                      {relatedConcepts.map((node) => (
                        <RelationCard
                          key={node.id}
                          node={node}
                          label="RELATED IDEA"
                          onPress={
                            node.type === 'concept'
                              ? () => openConcept(node.id, node.topicIds[0])
                              : undefined
                          }
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyRelation}>
                      <Text style={styles.emptyRelationTitle}>More links are on the way</Text>
                      <Text style={styles.emptyRelationText}>
                        Related ideas will appear here as the concept network is verified.
                      </Text>
                    </View>
                  )}
                </View>

                {activeConcept?.hasAssessment ? (
                  <Pressable
                    style={styles.practiceLink}
                    onPress={() => navigation.navigate('ConceptQuiz', { conceptId: activeConcept.id })}
                  >
                    <Text style={styles.practiceLinkText}>Practice this concept</Text>
                    <ArrowRightIcon size={17} color={colors.primary} />
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>

      {activeConceptId && conceptMap ? (
        <View style={[styles.stickyActions, { paddingBottom: Math.max(12, insets.bottom) }]}>
          {firstLearnablePrerequisite ? (
            <Pressable
              style={styles.prerequisiteAction}
              onPress={() => learnConcept(firstLearnablePrerequisite.id, activeConceptId)}
              accessibilityRole="button"
            >
              <Text style={styles.prerequisiteActionText}>Learn prerequisite</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.continueAction, !firstLearnablePrerequisite && styles.continueActionFull]}
            onPress={() => learnConcept(activeConceptId)}
            accessibilityRole="button"
          >
            <Text style={styles.continueActionText}>Continue learning</Text>
            <ArrowRightIcon size={17} color={colors.onPrimary} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function RelationCard({
  node,
  label,
  onPress,
}: {
  node: KnowledgeMapNode;
  label: string;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const cardContent = (
    <>
      <View style={styles.relationCardMarker} />
      <View style={styles.relationCardCopy}>
        <Text style={styles.relationCardLabel}>{label}</Text>
        <Text style={styles.relationCardTitle}>{node.name}</Text>
        <Text style={styles.relationCardMeta}>
          {node.type === 'ontology_only'
            ? 'Not yet available as an app lesson'
            : node.hasLesson
              ? 'Lesson available'
              : 'Concept in your STEM network'}
        </Text>
      </View>
      {onPress ? (
        <View style={styles.relationCardAction}>
          <Text style={styles.relationCardActionText}>
            {label === 'LEARN THIS FIRST' ? 'Start' : 'Open'}
          </Text>
          <ArrowRightIcon size={15} color={colors.primary} />
        </View>
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.relationCard}>{cardContent}</View>;
  return (
    <Pressable
      style={styles.relationCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label.toLowerCase()}: ${node.name}`}
    >
      {cardContent}
    </Pressable>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backButton: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  headerCopy: { gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 9, color: colors.primary, letterSpacing: 1.05 },
  headerTitle: { fontFamily: fonts.extrabold, fontSize: 21, lineHeight: 26, color: colors.ink },
  searchSection: { zIndex: 5, marginBottom: 16 },
  searchField: {
    height: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13,
    borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, paddingVertical: 0, fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  searchResults: {
    position: 'absolute', top: 53, left: 0, right: 0, borderRadius: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', elevation: 8, zIndex: 6,
  },
  searchResult: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchResultTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  searchResultContext: { marginTop: 3, fontFamily: fonts.regular, fontSize: 10, color: colors.slate },
  searchError: { padding: 13, fontFamily: fonts.regular, fontSize: 11, color: colors.danger },
  intro: { gap: 6, marginBottom: 17 },
  introTitle: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 31, color: colors.ink, letterSpacing: -0.5 },
  introText: { maxWidth: 320, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.slate },
  orbitCard: {
    alignItems: 'center', paddingHorizontal: 14, paddingTop: 17, paddingBottom: 14,
    borderRadius: 24, backgroundColor: colors.inkDeep, overflow: 'hidden', ...shadow.frame,
  },
  orbitCardHeader: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6, paddingHorizontal: 3,
  },
  orbitEyebrow: { fontFamily: fonts.bold, fontSize: 8, letterSpacing: 1, color: colors.onPrimaryMuted },
  orbitTitle: { marginTop: 4, fontFamily: fonts.bold, fontSize: 15, color: colors.onPrimary },
  conceptCount: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.08)',
  },
  conceptCountValue: { fontFamily: fonts.extrabold, fontSize: 15, lineHeight: 17, color: colors.onPrimary },
  conceptCountLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.onPrimaryMuted },
  constellation: { position: 'relative', alignSelf: 'center' },
  stemHub: {
    position: 'absolute', width: 78, height: 78, alignItems: 'center', justifyContent: 'center',
    borderRadius: 39, borderWidth: 3, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: colors.primary,
    ...shadow.card,
  },
  stemHubTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 20, color: colors.onPrimary, letterSpacing: 0.5 },
  stemHubSubtitle: { marginTop: 1, fontFamily: fonts.medium, fontSize: 7, color: colors.onPrimaryMuted },
  orbitNode: {
    position: 'absolute', width: ORBIT_NODE_WIDTH, height: ORBIT_NODE_HEIGHT, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 5, borderRadius: 15, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.27)', backgroundColor: 'rgba(255,255,255,0.96)',
    ...shadow.card,
  },
  nodeSpark: { width: 5, height: 5, position: 'absolute', top: 6, right: 7, borderRadius: 3, backgroundColor: colors.primary },
  nodeSparkAlt: { backgroundColor: colors.teal },
  orbitNodeText: { width: '100%', textAlign: 'center', fontFamily: fonts.semibold, fontSize: 8.5, lineHeight: 10, color: colors.ink },
  orbitPager: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pagerButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary },
  pagerButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  pagerCopy: { alignItems: 'center', gap: 2 },
  pagerTitle: { fontFamily: fonts.semibold, fontSize: 11, color: colors.onPrimary },
  pagerSubtitle: { fontFamily: fonts.regular, fontSize: 8, color: colors.onPrimaryMuted },
  pageDots: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  pageDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  pageDotActive: { width: 16, backgroundColor: colors.onPrimary },
  mappingNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: 12,
    borderRadius: 14, backgroundColor: colors.yellowSoft,
  },
  noticeDot: { width: 7, height: 7, marginTop: 4, borderRadius: 4, backgroundColor: colors.orange },
  mappingNoticeText: { flex: 1, fontFamily: fonts.medium, fontSize: 10, lineHeight: 15, color: colors.ink },
  nodesHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 23, marginBottom: 10 },
  sectionEyebrow: { fontFamily: fonts.bold, fontSize: 8, letterSpacing: 0.9, color: colors.primary },
  sectionTitle: { marginTop: 3, fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  nodesRange: { fontFamily: fonts.semibold, fontSize: 10, color: colors.slate },
  conceptList: { gap: 8 },
  conceptCard: {
    minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12,
    paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  conceptCardIcon: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    borderRadius: 13, backgroundColor: colors.primarySoft,
  },
  conceptCardIndex: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  conceptCardCopy: { flex: 1, gap: 4 },
  conceptCardTitle: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.ink },
  conceptCardMeta: { fontFamily: fonts.medium, fontSize: 9, color: colors.slate },
  messageState: { alignItems: 'center', gap: 12, padding: 28 },
  messageText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', color: colors.slate },
  retryButton: { paddingVertical: 9, paddingHorizontal: 17, borderRadius: 11, backgroundColor: colors.primary },
  retryText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onPrimary },
  loadingState: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontFamily: fonts.medium, fontSize: 11, color: colors.slate },
  detailContent: { gap: 18 },
  focusHero: {
    padding: 19, borderRadius: 24, backgroundColor: colors.inkDeep, ...shadow.frame,
  },
  focusHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  focusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal },
  focusBadgeText: { fontFamily: fonts.bold, fontSize: 8, letterSpacing: 0.9, color: colors.onPrimaryMuted },
  assessmentBadge: {
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, overflow: 'hidden',
    backgroundColor: 'rgba(20,196,174,0.17)', fontFamily: fonts.bold, fontSize: 7, color: colors.teal,
  },
  focusTitle: { marginTop: 15, fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 29, color: colors.onPrimary, letterSpacing: -0.35 },
  focusDescription: { marginTop: 8, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.onPrimaryMuted },
  focusStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  focusStat: { flex: 1, alignItems: 'center', gap: 3 },
  focusStatValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.onPrimary },
  focusStatLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.onPrimaryMuted },
  focusStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },
  relationSection: { gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  relationIconPrerequisite: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primarySoft },
  relationIconRelated: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.greenSoft },
  relationIconText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  relationHeadingCopy: { flex: 1 },
  relationCount: { fontFamily: fonts.bold, fontSize: 12, color: colors.slate },
  relationList: { gap: 8 },
  relationCard: {
    minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12,
    paddingVertical: 11, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  relationCardMarker: { width: 6, height: 34, borderRadius: 3, backgroundColor: colors.primary },
  relationCardCopy: { flex: 1, gap: 3 },
  relationCardLabel: { fontFamily: fonts.bold, fontSize: 7, letterSpacing: 0.65, color: colors.primary },
  relationCardTitle: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.ink },
  relationCardMeta: { fontFamily: fonts.regular, fontSize: 9, color: colors.slate },
  relationCardAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  relationCardActionText: { fontFamily: fonts.semibold, fontSize: 9, color: colors.primary },
  emptyRelation: { padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyRelationTitle: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },
  emptyRelationText: { marginTop: 4, fontFamily: fonts.regular, fontSize: 10, lineHeight: 15, color: colors.slate },
  practiceLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 15, backgroundColor: colors.primarySoft },
  practiceLinkText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.primary },
  stickyActions: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 11,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.canvas,
  },
  prerequisiteAction: {
    minHeight: 46, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  prerequisiteActionText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.ink, textAlign: 'center' },
  continueAction: {
    minHeight: 46, flex: 1.15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.primary,
  },
  continueActionFull: { flex: 1 },
  continueActionText: { fontFamily: fonts.bold, fontSize: 10, color: colors.onPrimary },
});
