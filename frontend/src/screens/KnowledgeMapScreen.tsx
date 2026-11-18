import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import { SearchIcon } from '../components/glyphs';
import {
  fetchConceptKnowledgeMap,
  fetchKnowledgeMapRoot,
  searchKnowledgeMapConcepts,
} from '../lib/catalogApi';
import { ApiError } from '../lib/api';
import type { ApiConceptSearchResult, KnowledgeMapNode, KnowledgeMapResponse } from '../types/catalog';
import { colors, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useCatalog } from '../catalogContext';
import type { RootScreenProps } from '../navigation/types';

const MAP_HEIGHT = 410;
const NODE_HEIGHT = 58;
const ROW_GAP = 28;
const COLUMN_GAP = 14;
const HORIZONTAL_PADDING = 10;

type MapMode = 'overview' | 'concept';
type Point = { x: number; y: number };
type PositionedNode = { node: KnowledgeMapNode; x: number; y: number };

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

export default function KnowledgeMapScreen({
  navigation,
  route,
}: RootScreenProps<'KnowledgeMap'>) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { topics } = useCatalog();
  const initialMode: MapMode = route.params?.conceptId ? 'concept' : 'overview';
  const initialIncludeConnectedTopics = initialMode === 'concept';
  const initialTopicId = route.params?.topicId ?? '';
  const [mapData, setMapData] = useState<KnowledgeMapResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeMapNode | null>(null);
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [topicId, setTopicId] = useState(initialTopicId);
  const [depth, setDepth] = useState(1);
  const [includeConnectedTopics, setIncludeConnectedTopics] = useState(initialIncludeConnectedTopics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiConceptSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const panOrigin = useRef<Point>({ x: 0, y: 0 });
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const graphWidth = Math.max(300, screenWidth - 36);
  const nodeWidth = Math.floor((graphWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2);
  const updatePan = useCallback((point: Point) => {
    panRef.current = point;
    setPan(point);
  }, []);

  const loadRootMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchKnowledgeMapRoot();
      setMode('overview');
      setTopicId('');
      setMapData(result);
      setSelectedNode(result.root ?? result.nodes.find((node) => node.type === 'root') ?? null);
      setScale(1);
      updatePan({ x: 0, y: 0 });
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setLoading(false);
    }
  }, [updatePan]);

  const loadConceptMap = useCallback(async (
    conceptId: string,
    requestedTopicId?: string,
    requestedDepth = depth,
    includeConnected = includeConnectedTopics,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchConceptKnowledgeMap(conceptId, {
        topicId: requestedTopicId,
        depth: requestedDepth,
        includeConnectedTopics: includeConnected,
      });
      setMode('concept');
      setTopicId(requestedTopicId ?? result.topicId ?? '');
      setMapData(result);
      setSelectedNode(result.nodes.find((node) => node.id === result.focusId) ?? null);
      setIncludeConnectedTopics(includeConnected);
      setScale(1);
      updatePan({ x: 0, y: 0 });
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setLoading(false);
    }
  }, [depth, includeConnectedTopics, updatePan]);

  useEffect(() => {
    let active = true;
    const request = route.params?.conceptId
      ? fetchConceptKnowledgeMap(route.params.conceptId, {
        topicId: route.params.topicId,
        depth: 1,
        includeConnectedTopics: true,
      })
      : fetchKnowledgeMapRoot();
    if (request) {
      setLoading(true);
      setError(null);
      void request
        .then((result) => {
          if (!active) return;
          const mode: MapMode = route.params?.conceptId ? 'concept' : 'overview';
          setMode(mode);
          setTopicId(mode === 'concept' ? route.params?.topicId ?? result.topicId ?? '' : '');
          setMapData(result);
          setSelectedNode(
            mode === 'overview'
              ? result.root ?? result.nodes.find((node) => node.type === 'root') ?? null
              : result.nodes.find((node) => node.id === result.focusId) ?? null,
          );
          setIncludeConnectedTopics(mode === 'concept');
          setScale(1);
          updatePan({ x: 0, y: 0 });
        })
        .catch((cause: unknown) => {
          if (active) setError(describeError(cause));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => { active = false; };
  }, [route.params?.conceptId, route.params?.topicId, updatePan]);

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

  const visibleMapData = mapData;

  const positionedNodes = useMemo<PositionedNode[]>(() => {
    if (!visibleMapData) return [];
    const ordered = [...visibleMapData.nodes].sort((a, b) => {
      if (a.id === visibleMapData.focusId) return -1;
      if (b.id === visibleMapData.focusId) return 1;
      return (a.conceptOrder ?? Number.MAX_SAFE_INTEGER) - (b.conceptOrder ?? Number.MAX_SAFE_INTEGER)
        || a.name.localeCompare(b.name);
    });
    if (visibleMapData.mode === 'overview') {
      const root = ordered.find((node) => node.type === 'root');
      const concepts = ordered.filter((node) => node.type !== 'root');
      return [
        ...(root
          ? [{ node: root, x: (graphWidth - nodeWidth) / 2, y: 8 }]
          : []),
        ...concepts.map((node, index) => ({
          node,
          x: HORIZONTAL_PADDING + (index % 2) * (nodeWidth + COLUMN_GAP),
          y: 8 + NODE_HEIGHT + ROW_GAP + Math.floor(index / 2) * (NODE_HEIGHT + ROW_GAP),
        })),
      ];
    }
    const focus = ordered.find((node) => node.id === visibleMapData.focusId);
    const neighbors = ordered.filter((node) => node.id !== visibleMapData.focusId);
    return [
      ...(focus ? [{ node: focus, x: (graphWidth - nodeWidth) / 2, y: 8 }] : []),
      ...neighbors.map((node, index) => ({
        node,
        x: HORIZONTAL_PADDING + (index % 2) * (nodeWidth + COLUMN_GAP),
        y: 8 + NODE_HEIGHT + ROW_GAP + Math.floor(index / 2) * (NODE_HEIGHT + ROW_GAP),
      })),
    ];
  }, [graphWidth, nodeWidth, visibleMapData]);

  const byId = useMemo(
    () => new Map(positionedNodes.map((positioned) => [positioned.node.id, positioned])),
    [positionedNodes],
  );
  const svgHeight = Math.max(
    MAP_HEIGHT,
    ...positionedNodes.map(({ y }) => y + NODE_HEIGHT + ROW_GAP),
  );

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => {
      panOrigin.current = panRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      updatePan({ x: panOrigin.current.x + gesture.dx, y: panOrigin.current.y + gesture.dy });
    },
  }), [updatePan]);

  const selectSearchResult = (result: ApiConceptSearchResult) => {
    setQuery('');
    setSearchResults([]);
    setSearchError(false);
    setIncludeConnectedTopics(true);
    void loadConceptMap(result.id, result.contexts[0]?.topicId ?? undefined, depth, true);
  };

  const resetToOverview = () => {
    setMode('overview');
    setIncludeConnectedTopics(false);
    setDepth(1);
    setTopicId('');
    void loadRootMap();
  };

  const reloadWithFilters = (requestedDepth: number, includeConnected: boolean) => {
    setDepth(requestedDepth);
    setIncludeConnectedTopics(includeConnected);
    const focusId = selectedNode?.id ?? mapData?.focusId ?? undefined;
    if (mode === 'concept' && focusId && focusId !== 'STEM') {
      void loadConceptMap(focusId, topicId || undefined, requestedDepth, includeConnected);
    }
  };

  const expandSelected = () => {
    if (selectedNode?.type === 'concept') {
      void loadConceptMap(selectedNode.id, topicId || undefined, depth, includeConnectedTopics);
    }
  };

  const selectedPrerequisites =
    selectedNode && mapData?.mode === 'concept'
      ? mapData.edges
          .filter((edge) => edge.type === 'PREREQUISITE_OF' && edge.target === selectedNode.id)
          .map((edge) => mapData.nodes.find((node) => node.id === edge.source))
          .filter((node): node is KnowledgeMapNode => Boolean(node))
      : [];
  const selectedRelated =
    selectedNode && mapData?.mode === 'concept'
      ? mapData.edges
          .filter(
            (edge) =>
              edge.type === 'RELATED_TO'
              && (edge.source === selectedNode.id || edge.target === selectedNode.id),
          )
          .map((edge) => mapData.nodes.find(
            (node) => node.id === (edge.source === selectedNode.id ? edge.target : edge.source),
          ))
          .filter((node): node is KnowledgeMapNode => Boolean(node))
      : [];
  const selectedDependents =
    selectedNode && mapData?.mode === 'concept'
      ? mapData.edges
          .filter((edge) => edge.type === 'PREREQUISITE_OF' && edge.source === selectedNode.id)
          .map((edge) => mapData.nodes.find((node) => node.id === edge.target))
          .filter((node): node is KnowledgeMapNode => Boolean(node))
      : [];
  const selectedTopics = selectedNode?.topicIds
    .map((id) => topics.find((topic) => topic.id === id)?.name ?? id)
    .filter((name, index, names) => names.indexOf(name) === index) ?? [];

  const statusText = mapData
    ? mapData.mappingStatus === 'not_applicable'
      ? null
      : mapData.mappingStatus === 'ready'
        ? 'Prerequisite paths are verified.'
        : mapData.mappingMessage ?? 'Prerequisite paths are pending verification.'
    : null;

  const handleNodePress = (node: KnowledgeMapNode) => {
    if (node.type !== 'concept') {
      setSelectedNode(node);
      return;
    }
    if (mode === 'overview' || node.id !== mapData?.focusId) {
      setIncludeConnectedTopics(true);
      void loadConceptMap(node.id, node.topicIds[0], depth, true);
      return;
    }
    setSelectedNode(node);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>EXPLORE CONNECTIONS</Text>
          <Text style={styles.headerTitle}>Knowledge Map</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchField}>
          <SearchIcon size={18} color={colors.slate} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search a concept"
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
                  {[result.contexts[0]?.topicName]
                    .filter(Boolean)
                    .join(' · ') || 'Open concept map'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {mode === 'concept' ? (
        <View style={styles.focusFilters}>
          <Pressable style={styles.filterChip} onPress={resetToOverview} accessibilityRole="button">
            <Text style={styles.filterText}>STEM tree</Text>
          </Pressable>
          <View style={styles.depthOptions}>
            {[1, 2, 3].map((value) => (
              <Pressable
                key={value}
                style={[styles.filterChip, depth === value && styles.filterChipActive]}
                onPress={() => reloadWithFilters(value, includeConnectedTopics)}
                accessibilityRole="button"
                accessibilityLabel={`Show prerequisite depth ${value}`}
              >
                <Text style={[styles.filterText, depth === value && styles.filterTextActive]}>
                  Depth {value}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {visibleMapData && statusText ? (
        <View style={styles.mappingNotice}>
          <View style={[styles.statusDot, visibleMapData.mappingStatus === 'ready' && styles.statusDotReady]} />
          <Text style={styles.mappingNoticeText}>{statusText}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.messageState}>
          <Text style={styles.messageText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              if (route.params?.conceptId) void loadConceptMap(route.params.conceptId, route.params.topicId);
              else void loadRootMap();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && !mapData ? (
        <View style={styles.loadingState}><ActivityIndicator color={colors.primary} /></View>
      ) : null}

      {visibleMapData ? (
        <>
          <View style={styles.graphToolbar}>
            <Text style={styles.nodeCount}>
              {visibleMapData.nodes.filter((node) => node.type === 'concept').length} concepts
            </Text>
            <View style={styles.zoomActions}>
              <Pressable style={styles.zoomButton} onPress={() => setScale((value) => Math.max(0.65, value - 0.15))}>
                <Text style={styles.zoomText}>−</Text>
              </Pressable>
              <Pressable
                style={styles.zoomButton}
                onPress={() => {
                  setScale(Math.max(0.2, Math.min(1, MAP_HEIGHT / svgHeight)));
                  updatePan({ x: 0, y: 0 });
                }}
              >
                <Text style={styles.resetText}>Fit</Text>
              </Pressable>
              <Pressable style={styles.zoomButton} onPress={() => setScale((value) => Math.min(1.8, value + 0.15))}>
                <Text style={styles.zoomText}>+</Text>
              </Pressable>
            </View>
          </View>
          {mode === 'concept' ? (
            <View style={styles.relationshipLegend}>
              <Text style={styles.prerequisiteLegend}>Prerequisite →</Text>
              <Text style={styles.relatedLegend}>Related —</Text>
            </View>
          ) : null}
          <View style={styles.graphViewport} {...panResponder.panHandlers}>
            {loading ? (
              <View style={styles.loadingOverlay}><ActivityIndicator color={colors.primary} /></View>
            ) : null}
            <Svg width={graphWidth} height={svgHeight} viewBox={`0 0 ${graphWidth} ${svgHeight}`}>
              <G transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
                {visibleMapData.edges.map((edge) => {
                  const source = byId.get(edge.source);
                  const target = byId.get(edge.target);
                  if (!source || !target) return null;
                  const sourceCenter = { x: source.x + nodeWidth / 2, y: source.y + NODE_HEIGHT / 2 };
                  const targetCenter = { x: target.x + nodeWidth / 2, y: target.y + NODE_HEIGHT / 2 };
                  const dx = targetCenter.x - sourceCenter.x;
                  const dy = targetCenter.y - sourceCenter.y;
                  const distance = Math.max(1, Math.hypot(dx, dy));
                  const ux = dx / distance;
                  const uy = dy / distance;
                  const sourceScale = Math.min(
                    (nodeWidth / 2) / Math.max(0.001, Math.abs(ux)),
                    (NODE_HEIGHT / 2) / Math.max(0.001, Math.abs(uy)),
                  );
                  const x1 = sourceCenter.x + ux * sourceScale;
                  const y1 = sourceCenter.y + uy * sourceScale;
                  const x2 = targetCenter.x - ux * sourceScale;
                  const y2 = targetCenter.y - uy * sourceScale;
                  const arrowLength = 7;
                  const arrowHalfWidth = 4;
                  const arrowPoints = [
                    `${x2},${y2}`,
                    `${x2 - ux * arrowLength - uy * arrowHalfWidth},${y2 - uy * arrowLength + ux * arrowHalfWidth}`,
                    `${x2 - ux * arrowLength + uy * arrowHalfWidth},${y2 - uy * arrowLength - ux * arrowHalfWidth}`,
                  ].join(' ');
                  return (
                    <G key={`${edge.type}:${edge.source}:${edge.target}`}>
                      <Line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={
                          edge.type === 'STEM_ROOT'
                            ? colors.border
                            : edge.type === 'RELATED_TO'
                              ? colors.green
                              : colors.primary
                        }
                        strokeWidth={edge.type === 'STEM_ROOT' ? 1.5 : 2}
                      />
                      {edge.type === 'PREREQUISITE_OF' ? (
                        <Polygon points={arrowPoints} fill={colors.primary} />
                      ) : null}
                    </G>
                  );
                })}
                {positionedNodes.map(({ node, x, y }) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isFocus = visibleMapData.focusId === node.id;
                  return (
                    <G key={node.id} onPress={() => handleNodePress(node)}>
                      <Rect
                        x={x}
                        y={y}
                        width={nodeWidth}
                        height={NODE_HEIGHT}
                        rx={12}
                        fill={isSelected || node.type === 'root' ? colors.primarySoft : node.type === 'ontology_only' ? colors.canvas : colors.surface}
                        stroke={isSelected || isFocus ? colors.primary : node.type === 'ontology_only' ? colors.slate : colors.border}
                        strokeWidth={isSelected || isFocus ? 2 : 1}
                      />
                      <SvgText
                        x={x + 11}
                        y={y + 23}
                        fill={colors.ink}
                        fontSize={12}
                        fontWeight="600"
                      >
                        {shortLabel(node.name, Math.max(16, Math.floor(nodeWidth / 7)))}
                      </SvgText>
                      <SvgText x={x + 11} y={y + 43} fill={colors.slate} fontSize={10}>
                        {node.type === 'root'
                          ? 'All STEM concepts'
                          : node.type === 'ontology_only'
                            ? 'Ontology-only · no app content'
                            : [
                                node.hasLesson ? 'Lesson' : null,
                                node.hasAssessment ? 'Assessment' : null,
                              ].filter(Boolean).join(' · ') || 'Concept'}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
            {visibleMapData.edges.length === 0 ? (
              <View pointerEvents="none" style={styles.graphHint}>
                <Text style={styles.graphHintText}>
                  {visibleMapData.mappingStatus === 'ready'
                    ? 'Select a concept to explore its connections.'
                    : 'Concepts are shown; prerequisite links will appear after explicit mappings are verified.'}
                </Text>
              </View>
            ) : null}
          </View>
          {selectedNode ? (
            <View style={[styles.selectionCard, { paddingBottom: Math.max(12, insets.bottom) }]}>
              <View style={styles.selectionCopy}>
                <Text style={styles.selectionEyebrow}>
                  {selectedNode.type === 'root'
                    ? 'STEM NETWORK'
                    : selectedNode.type === 'ontology_only'
                      ? 'ONTOLOGY-ONLY NODE'
                      : 'SELECTED CONCEPT'}
                </Text>
                <Text style={styles.selectionTitle}>{selectedNode.name}</Text>
                <Text style={styles.selectionMeta}>
                  {selectedNode.type === 'root'
                    ? `${visibleMapData.nodes.filter((node) => node.type === 'concept').length} important concepts across STEM`
                    : selectedNode.type === 'ontology_only'
                      ? 'No matching app concept or lesson'
                      : selectedTopics.join(', ') || 'STEM concept'}
                </Text>
                {selectedNode.type === 'concept' ? (
                  <Text style={styles.selectionMeta}>
                    Prerequisites {selectedPrerequisites.length} · Unlocks {selectedDependents.length}
                    {' · '}Related {selectedRelated.length}
                    {' · '}Learning content {selectedNode.hasLesson ? 'available' : 'unavailable'}
                    {' · '}Assessment {selectedNode.hasAssessment ? 'available' : 'unavailable'}
                  </Text>
                ) : null}
              </View>
              {selectedNode.type === 'concept' ? (
                <View style={styles.selectionActions}>
                  <Pressable
                    style={styles.secondaryAction}
                    onPress={() => navigation.navigate('ConceptDetails', {
                      conceptId: selectedNode.id,
                      contextTopicId: topicId || undefined,
                    })}
                  >
                    <Text style={styles.secondaryActionText}>Details</Text>
                  </Pressable>
                  <Pressable style={styles.expandAction} onPress={expandSelected}>
                    <Text style={styles.expandActionText}>Open connections</Text>
                    <ArrowRightIcon size={15} color={colors.onPrimary} />
                  </Pressable>
                  {selectedNode.hasLesson ? (
                  <Pressable
                    style={styles.learnAction}
                    onPress={() => navigation.navigate('ConceptLearning', { conceptId: selectedNode.id })}
                  >
                    <Text style={styles.learnActionText}>Learn</Text>
                  </Pressable>
                  ) : null}
                  {selectedNode.hasAssessment ? (
                    <Pressable
                      style={styles.secondaryAction}
                      onPress={() => navigation.navigate('ConceptQuiz', {
                        conceptId: selectedNode.id,
                      })}
                    >
                      <Text style={styles.secondaryActionText}>Practice</Text>
                    </Pressable>
                  ) : null}
                  {selectedPrerequisites[0] ? (
                    <Pressable
                      style={styles.secondaryAction}
                      onPress={() => navigation.navigate('ConceptDetails', {
                        conceptId: selectedPrerequisites[0].id,
                        contextTopicId: selectedPrerequisites[0].topicIds[0],
                        returnToConceptId: selectedNode.id,
                      })}
                    >
                      <Text style={styles.secondaryActionText}>
                        Learn {shortLabel(selectedPrerequisites[0].name, 20)} first
                      </Text>
                    </Pressable>
                  ) : null}
                  {selectedDependents.length > 0 ? (
                    <Text style={styles.selectionMeta}>
                      Unlocks: {selectedDependents.slice(0, 3).map((node) => node.name).join(', ')}
                    </Text>
                  ) : null}
                  {selectedRelated.length > 0 ? (
                    <Text style={styles.selectionMeta}>
                      Related to: {selectedRelated.slice(0, 3).map((node) => node.name).join(', ')}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {selectedNode.type === 'root' ? (
                <Pressable style={styles.expandAction} onPress={resetToOverview}>
                  <Text style={styles.expandActionText}>Reset overview</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 13 },
  backButton: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  headerCopy: { gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 9, color: colors.primary, letterSpacing: 0.8 },
  headerTitle: { fontFamily: fonts.extrabold, fontSize: 21, lineHeight: 26, color: colors.ink },
  searchSection: { zIndex: 2, paddingHorizontal: 18 },
  searchField: {
    height: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, paddingVertical: 0, fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  searchResults: {
    position: 'absolute', top: 52, left: 18, right: 18, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', elevation: 5,
  },
  searchResult: { paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchResultTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  searchResultContext: { marginTop: 2, fontFamily: fonts.regular, fontSize: 10, color: colors.slate },
  searchError: { padding: 12, fontFamily: fonts.regular, fontSize: 11, color: colors.danger },
  focusFilters: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 18, paddingTop: 11 },
  depthOptions: { flexDirection: 'row', gap: 5 },
  filterChip: { paddingHorizontal: 9, height: 30, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  filterText: { fontFamily: fonts.medium, fontSize: 10, color: colors.slate },
  filterTextActive: { color: colors.primary },
  mappingNotice: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 18, marginTop: 10, paddingHorizontal: 11, borderRadius: 10, backgroundColor: colors.yellowSoft },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange },
  statusDotReady: { backgroundColor: colors.success },
  mappingNoticeText: { flex: 1, fontFamily: fonts.medium, fontSize: 10, lineHeight: 14, color: colors.ink },
  messageState: { alignItems: 'center', gap: 12, padding: 28 },
  messageText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', color: colors.slate },
  retryButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.primary },
  retryText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onPrimary },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  graphToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  nodeCount: { fontFamily: fonts.semibold, fontSize: 11, color: colors.slate },
  relationshipLegend: { flexDirection: 'row', gap: 12, paddingHorizontal: 22, paddingBottom: 6 },
  prerequisiteLegend: { fontFamily: fonts.medium, fontSize: 10, color: colors.primary },
  relatedLegend: { fontFamily: fonts.medium, fontSize: 10, color: colors.green },
  zoomActions: { flexDirection: 'row', gap: 6 },
  zoomButton: { minWidth: 32, height: 30, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  zoomText: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 21, color: colors.ink },
  resetText: { fontFamily: fonts.medium, fontSize: 10, color: colors.ink },
  graphViewport: { height: MAP_HEIGHT, marginHorizontal: 18, overflow: 'hidden', borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  loadingOverlay: { ...StyleSheet.absoluteFill, zIndex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.scrim },
  graphHint: { position: 'absolute', left: 22, right: 22, bottom: 10, padding: 9, borderRadius: 9, backgroundColor: colors.canvas },
  graphHintText: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 14, color: colors.slate, textAlign: 'center' },
  selectionCard: {
    flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 10, paddingTop: 12,
    paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.canvas,
  },
  selectionCopy: { flex: 1, gap: 3 },
  selectionEyebrow: { fontFamily: fonts.bold, fontSize: 8, color: colors.slate },
  selectionTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  selectionMeta: { fontFamily: fonts.regular, fontSize: 9, color: colors.slate },
  selectionActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  secondaryAction: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  secondaryActionText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.ink },
  expandAction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, backgroundColor: colors.primary },
  expandActionText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.onPrimary },
  learnAction: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, backgroundColor: colors.green },
  learnActionText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.onPrimary },
});
