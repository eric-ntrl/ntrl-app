import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  ActivityIndicator,
  Animated,
  Share,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { serifFamily } from '../theme/typography';
import { openExternalUrl } from '../utils/links';
import { createFallbackSummary } from '../services/detailSummary';
import { fetchTransparency } from '../api';
import type { TransparencySpan } from '../types';
import type { Transformation, TransformationType, SpanReason } from '../navigation/types';
import {
  isArticleSaved,
  saveArticle,
  removeSavedArticle,
  addToHistory,
} from '../storage/storageService';
import { decodeHtmlEntities } from '../utils/text';
import {
  copyStoryLink,
  shareToTarget,
  getAvailableShareTargets,
  getStoryShareUrl,
  type ShareTarget,
  type ShareTargetConfig,
} from '../utils/sharing';
import { lightTap } from '../utils/haptics';
import type { Item } from '../types';
import type { ArticleDetailScreenProps } from '../navigation/types';
import SegmentedControl from '../components/SegmentedControl';
import ArticleBrief from '../components/ArticleBrief';
import NtrlContent from '../components/NtrlContent';

type ViewMode = 'brief' | 'full' | 'ntrl';

/**
 * Map API reason to app TransformationType for display
 */
function mapReasonToType(reason: string): TransformationType {
  const reasonLower = reason.toLowerCase();
  if (reasonLower === 'urgency_inflation') {
    return 'urgency';
  }
  if (reasonLower === 'emotional_trigger') {
    return 'emotional';
  }
  if (reasonLower === 'clickbait') {
    return 'clickbait';
  }
  if (reasonLower === 'selling' || reasonLower === 'rhetorical_framing') {
    return 'sensational';
  }
  if (reasonLower === 'editorial_voice' || reasonLower === 'agenda_signaling') {
    return 'opinion';
  }
  return 'other';
}

/**
 * Validate and cast reason string to SpanReason type
 */
function castToSpanReason(reason: string): SpanReason {
  const validReasons: SpanReason[] = [
    'clickbait', 'urgency_inflation', 'emotional_trigger',
    'selling', 'agenda_signaling', 'rhetorical_framing', 'editorial_voice'
  ];
  const reasonLower = reason.toLowerCase() as SpanReason;
  if (validReasons.includes(reasonLower)) {
    return reasonLower;
  }
  return 'rhetorical_framing'; // Default fallback
}

/**
 * Convert API TransparencySpan[] to app Transformation[]
 */
function mapSpansToTransformations(spans: TransparencySpan[]): Transformation[] {
  return spans.map((span) => ({
    start: span.start_char,
    end: span.end_char,
    type: mapReasonToType(span.reason),
    reason: castToSpanReason(span.reason),
    original: span.original_text,
    filtered: span.replacement_text || '',
  }));
}

/**
 * Format relative time for display
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'Today';
}

/**
 * Content length constants for Article Detail
 */
const DETAIL_MAX_SENTENCES = 10;
const DETAIL_MAX_PARAGRAPHS = 3;

/**
 * Filler phrases to filter out when substance exists
 */
const FILLER_PHRASES = [
  'More detail may be available',
  'Details available in the full article',
  'Additional context',
  'See full article for details',
];

/**
 * Check if text contains filler language
 */
function containsFiller(text: string): boolean {
  return FILLER_PHRASES.some((phrase) => text.toLowerCase().includes(phrase.toLowerCase()));
}

/**
 * Count sentences in text (approximate)
 */
function countSentences(text: string): number {
  return (text.match(/[.!?]+/g) || []).length || 1;
}

/**
 * Truncate text to max sentences at sentence boundary
 */
function truncateToSentences(text: string, maxSentences: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= maxSentences) {
    return text;
  }
  return sentences.slice(0, maxSentences).join('').trim();
}

/**
 * Compose article body as organic narrative paragraphs
 * Enforces max 10 sentences / 3 paragraphs
 * Uses the new Detail schema: title, brief, full, disclosure
 */
function composeBodyText(detail: Item['detail']): string[] {
  const paragraphs: string[] = [];
  let totalSentences = 0;

  // Primary content: use brief summary
  if (detail.brief && !containsFiller(detail.brief)) {
    const sentences = countSentences(detail.brief);
    if (totalSentences + sentences <= DETAIL_MAX_SENTENCES) {
      paragraphs.push(detail.brief);
      totalSentences += sentences;
    } else {
      // Truncate to fit within limit
      const remaining = DETAIL_MAX_SENTENCES - totalSentences;
      paragraphs.push(truncateToSentences(detail.brief, remaining));
      totalSentences = DETAIL_MAX_SENTENCES;
    }
  }

  // If we have full content and room for more, add first paragraph
  if (
    paragraphs.length < DETAIL_MAX_PARAGRAPHS &&
    totalSentences < DETAIL_MAX_SENTENCES &&
    detail.full &&
    !containsFiller(detail.full)
  ) {
    // Extract first few sentences from full content
    const fullSentences = detail.full.match(/[^.!?]+[.!?]+/g) || [];
    const additionalSentences = fullSentences.slice(0, 3).join('').trim();

    if (additionalSentences && additionalSentences.length > 50) {
      const sentences = countSentences(additionalSentences);
      if (totalSentences + sentences <= DETAIL_MAX_SENTENCES) {
        paragraphs.push(additionalSentences);
      }
    }
  }

  return paragraphs.filter((p) => p.trim().length > 0);
}

function BackButton({
  onPress,
  styles,
}: {
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      hitSlop={12}
    >
      <Text style={styles.backArrow}>‹</Text>
    </Pressable>
  );
}

function Header({
  onBack,
  styles,
}: {
  onBack: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} styles={styles} />
      <View style={styles.headerCenter}>
        <Text style={styles.headerBrand}>NTRL</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

/**
 * Source unavailable modal
 */
function SourceUnavailableModal({
  visible,
  onClose,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Source unavailable</Text>
          <Text style={styles.modalBody}>
            This link couldn't be opened. You can try again later.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Displays a single article with Brief/Full content tabs and footer actions.
 * - Toggles between a short summary (Brief) and the full neutralized text (Full)
 * - Fetches transparency data for the ntrl view link
 * - Supports save/unsave, native share, copy link, and external source viewing
 * @param route.params.item - The feed Item object to display
 */
export default function ArticleDetailScreen({ route, navigation }: ArticleDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { item } = route.params;
  const timeLabel = formatRelativeTime(item.published_at);

  // Reading progress bar state (Full article only)
  const [scrollProgress, setScrollProgress] = useState(0);
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollableHeight = contentSize.height - layoutMeasurement.height;
    if (scrollableHeight > 0) {
      setScrollProgress(Math.min(1, contentOffset.y / scrollableHeight));
    }
  }, []);

  const [showSourceError, setShowSourceError] = useState(false);
  // Initialize summary from item.detail immediately - no loading required
  const [summaryParagraphs] = useState<string[]>(() => {
    const fallback = createFallbackSummary(item.detail);
    return fallback.length > 0 ? fallback : composeBodyText(item.detail);
  });
  const [backendTransformations, setBackendTransformations] = useState<Transformation[]>([]);
  const [originalBodyText, setOriginalBodyText] = useState<string | null>(null);
  const [transparencyLoading, setTransparencyLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('brief');

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    lightTap();
    setViewMode(mode);
  }, []);

  // Debug logging for detail content
  useEffect(() => {
    if (__DEV__) {
      console.log('[ArticleDetail] Detail content:', {
        itemId: item.id,
        detailBriefLength: item.detail.brief?.length || 0,
        detailBriefPreview: item.detail.brief?.substring(0, 100) || '(none)',
        detailFullLength: item.detail.full?.length || 0,
        detailFullPreview: item.detail.full?.substring(0, 100) || '(none)',
        disclosure: item.detail.disclosure,
        hasManipulative: item.has_manipulative_content,
      });
    }
  }, [item.id, item.detail]);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [shareTargets, setShareTargets] = useState<ShareTargetConfig[]>([]);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);

  // Check saved status and add to history on mount
  useEffect(() => {
    async function initArticle() {
      const saved = await isArticleSaved(item.id);
      setIsSaved(saved);
      await addToHistory(item);
    }
    initArticle();
  }, [item.id]);

  // Load available share targets on mount
  useEffect(() => {
    getAvailableShareTargets().then(setShareTargets);
  }, []);

  // Fetch transparency data from backend
  useEffect(() => {
    setTransparencyLoading(true);
    fetchTransparency(item.id)
      .then((result) => {
        // Debug logging for diagnostic purposes
        if (__DEV__) {
          console.log('[ArticleDetail] Transparency data received:', {
            itemId: item.id,
            originalBodyLength: result.originalBody?.length || 0,
            originalBodyPreview: result.originalBody?.substring(0, 100) || '(none)',
            spanCount: result.spans.length,
            spans: result.spans.slice(0, 3).map(s => ({
              start: s.start_char,
              end: s.end_char,
              text: s.original_text?.substring(0, 30),
            })),
          });
        }

        const transformations = mapSpansToTransformations(result.spans);
        setBackendTransformations(transformations);
        // Store original body for correct span highlighting
        setOriginalBodyText(result.originalBody);
      })
      .catch((error) => {
        console.warn('[ArticleDetail] Failed to fetch transparency:', error);
        // Fall back to empty transformations - don't break the UI
      })
      .finally(() => {
        setTransparencyLoading(false);
      });
  }, [item.id]);

  // Cleanup animations on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (toastAnimationRef.current) {
        toastAnimationRef.current.stop();
      }
    };
  }, []);

  // Determine if content was modified
  const hasRemovedContent = item.has_manipulative_content || backendTransformations.length > 0 || !!item.detail.disclosure;

  // Handle external source link with error fallback
  const handleViewSource = async () => {
    const success = await openExternalUrl(item.url, item.source_url);
    if (!success) {
      setShowSourceError(true);
    }
  };

  // Handle save/unsave article
  const handleToggleSave = async () => {
    if (isSaved) {
      await removeSavedArticle(item.id);
      setIsSaved(false);
    } else {
      await saveArticle(item);
      setIsSaved(true);
    }
  };

  // Handle share to specific target
  const handleShareToTarget = async (target: ShareTarget) => {
    setShowShareMenu(false);
    const headline = decodeHtmlEntities(item.headline);
    await shareToTarget(target, item.id, headline);
  };

  // Handle copy link to clipboard
  const handleCopyLink = async () => {
    setShowShareMenu(false);
    await copyStoryLink(item.id);

    // Haptic feedback - subtle success notification
    lightTap();

    // Stop any existing animation
    if (toastAnimationRef.current) {
      toastAnimationRef.current.stop();
    }

    // Show animated toast
    setCopiedToast(true);
    toastOpacity.setValue(0);

    toastAnimationRef.current = Animated.sequence([
      // Fade in
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(1500),
      // Fade out
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    toastAnimationRef.current.start(() => {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setCopiedToast(false);
      }
    });
  };

  // Handle share button - try native share first, fall back to custom menu
  const handleShare = async () => {
    const headline = decodeHtmlEntities(item.headline);
    const url = getStoryShareUrl(item.id);
    const message = `${headline}\n\n${url}`;

    try {
      const result = await Share.share({ message });
      // Share completed (user shared or cancelled) - no further action needed
    } catch (error) {
      // Native share failed - show custom menu as fallback
      setShowShareMenu(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header onBack={() => navigation.goBack()} styles={styles} />

      {/* Reading progress bar (Full article only) */}
      {viewMode === 'full' && item.detail.full && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${scrollProgress * 100}%` }]} />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Headline */}
        <Text style={styles.headline}>{decodeHtmlEntities(item.headline)}</Text>

        {/* Metadata band: Source · Time | Brief | Full | Ntrl */}
        <View style={styles.metadataBand}>
          {/* Left: Source + Timestamp */}
          <View style={styles.metadataLeft}>
            <Pressable
              onPress={() =>
                navigation.navigate('SourceTransparency', {
                  sourceName: item.source,
                  sourceUrl: item.url,
                })
              }
              style={({ pressed }) => pressed && styles.metadataPressed}
              accessibilityRole="link"
              accessibilityLabel={`Source: ${item.source}. Tap for source info.`}
            >
              <Text style={styles.metadataSource}>{item.source}</Text>
            </Pressable>
            <Text style={styles.metadataSeparator}>·</Text>
            <Text style={styles.metadataTime}>{timeLabel}</Text>
          </View>

          {/* Right: Brief | Full | Ntrl segment control */}
          <SegmentedControl<ViewMode>
            segments={[
              { key: 'brief', label: 'Brief' },
              { key: 'full', label: 'Full' },
              { key: 'ntrl', label: 'Ntrl' },
            ]}
            selected={viewMode}
            onSelect={handleViewModeChange}
          />
        </View>

        {/* Copied toast */}
        {copiedToast && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <View style={styles.toastContent}>
              <Text style={styles.toastCheck}>✓</Text>
              <Text style={styles.toastText}>Link copied</Text>
            </View>
          </Animated.View>
        )}

        {/* Body - Brief, Full, or Ntrl mode */}
        <View style={styles.bodySection}>
          {viewMode === 'brief' ? (
            // Brief mode: show detail_brief from API
            <ArticleBrief text={item.detail.brief || summaryParagraphs.join('\n\n')} />
          ) : viewMode === 'full' ? (
            // Full mode: show detail_full from API (already neutralized)
            item.detail.full ? (
              <Text style={styles.bodyText}>{item.detail.full}</Text>
            ) : (
              <>
                <ArticleBrief text={item.detail.brief || summaryParagraphs.join('\n\n')} />
                <Text style={styles.thinContentNotice}>
                  Full text not available from this source.
                </Text>
              </>
            )
          ) : (
            // Ntrl mode — inline transparency content
            transparencyLoading ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color={colors.textMuted} />
                <Text style={styles.loadingText}>Loading transparency data...</Text>
              </View>
            ) : (
              <NtrlContent
                item={item}
                fullOriginalText={originalBodyText}
                transformations={backendTransformations}
              />
            )
          )}
        </View>

        {/* Disclosure */}
        {hasRemovedContent && viewMode !== 'ntrl' && (
          <Text style={styles.disclosure}>Language adjusted for clarity.</Text>
        )}

        {/* Breathing space before footer actions */}
        <View style={styles.footerSpacer} />

        {/* Footer actions - quiet inline text row */}
        <View style={styles.footerActions}>
          <Pressable
            onPress={handleToggleSave}
            style={({ pressed }) => pressed && styles.footerActionPressed}
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save article'}
            accessibilityRole="button"
          >
            <Text style={[styles.footerActionText, isSaved && styles.footerActionActive]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => pressed && styles.footerActionPressed}
            accessibilityLabel="Share article"
            accessibilityRole="button"
          >
            <Text style={styles.footerActionText}>Share</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable
            onPress={handleViewSource}
            style={({ pressed }) => pressed && styles.footerActionPressed}
            accessibilityLabel="View original source"
            accessibilityRole="link"
          >
            <Text style={styles.footerActionText}>View original</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Source error modal */}
      <SourceUnavailableModal
        visible={showSourceError}
        onClose={() => setShowSourceError(false)}
        styles={styles}
      />

      {/* Share menu modal */}
      <Modal
        visible={showShareMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareMenu(false)}
      >
        <View style={styles.shareMenuOverlay}>
          <Pressable style={styles.shareMenuBackdrop} onPress={() => setShowShareMenu(false)} />
          <View style={styles.shareMenuContent}>
            <View style={styles.shareMenuHandle} />
            <Text style={styles.shareMenuTitle}>Share article</Text>

            {/* All share options as consistent list */}
            <View style={styles.shareOptionsList}>
              {shareTargets
                .filter((t) => t.available)
                .map((target) => (
                  <Pressable
                    key={target.key}
                    style={({ pressed }) => [
                      styles.shareOption,
                      pressed && styles.shareOptionPressed,
                    ]}
                    onPress={() => handleShareToTarget(target.key)}
                  >
                    <Text style={styles.shareOptionLabel}>{target.label}</Text>
                    <Text style={styles.shareOptionChevron}>›</Text>
                  </Pressable>
                ))}

              {/* Copy link option */}
              <Pressable
                style={({ pressed }) => [styles.shareOption, pressed && styles.shareOptionPressed]}
                onPress={handleCopyLink}
              >
                <Text style={styles.shareOptionLabel}>Copy link</Text>
                <Text style={styles.shareOptionChevron}>›</Text>
              </Pressable>
            </View>

            {/* Cancel button */}
            <Pressable
              style={({ pressed }) => [
                styles.shareMenuCancel,
                pressed && styles.shareMenuCancelPressed,
              ]}
              onPress={() => setShowShareMenu(false)}
            >
              <Text style={styles.shareMenuCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Dynamic styles factory
function createStyles(theme: Theme) {
  const { colors, typography, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPressed: {
      opacity: 0.5,
    },
    backArrow: {
      fontSize: 32,
      fontWeight: '300',
      color: colors.textPrimary,
      marginTop: -4,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerBrand: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },

    // Scroll content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.xxl, // Book-page margins (24px)
      paddingTop: spacing.xxxl, // Generous breathing room (32px)
      paddingBottom: spacing.xxxl,
    },

    // Reading progress bar
    progressBarContainer: {
      height: 2,
      backgroundColor: 'transparent',
      width: '100%',
    },
    progressBar: {
      height: 2,
      backgroundColor: colors.textSubtle,
      opacity: 0.3,
    },

    // Article content - uses refined serif typography
    headline: {
      fontSize: typography.detailHeadline.fontSize,
      fontWeight: typography.detailHeadline.fontWeight,
      lineHeight: typography.detailHeadline.lineHeight,
      letterSpacing: typography.detailHeadline.letterSpacing,
      fontFamily: serifFamily,
      color: typography.detailHeadline.color,
      marginBottom: spacing.xl, // Chapter title breathing room (20px)
    },

    // Metadata band - single line with source/time, mode toggle, ntrl view
    metadataBand: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28, // Clear zone separation
      paddingTop: spacing.xs,
    },
    metadataLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metadataSource: {
      fontSize: typography.meta.fontSize,
      fontWeight: typography.meta.fontWeight,
      fontFamily: serifFamily,
      color: colors.textSubtle,
    },
    metadataSeparator: {
      fontSize: typography.meta.fontSize,
      fontWeight: typography.meta.fontWeight,
      color: colors.textSubtle,
      marginHorizontal: spacing.xs,
    },
    metadataTime: {
      fontSize: typography.meta.fontSize,
      fontWeight: typography.meta.fontWeight,
      color: colors.textSubtle,
    },
    metadataPressed: {
      opacity: 0.5,
    },
    // Body section: constrain measure for optimal reading
    bodySection: {
      marginBottom: spacing.lg,
      maxWidth: 600, // ~65-75 chars at 16px, optimal reading measure
    },
    // Body text: book-like reading experience (serif)
    bodyText: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      letterSpacing: typography.body.letterSpacing,
      fontFamily: serifFamily,
      color: typography.body.color,
    },
    // Meta: tighter to body, slight breathing room above via bodySection margin
    meta: {
      fontSize: typography.meta.fontSize,
      fontWeight: typography.meta.fontWeight,
      lineHeight: 18, // Explicit line-height for consistency
      color: typography.meta.color,
      marginBottom: spacing.sm, // Was md (12) → sm (8), tighter grouping
    },
    disclosure: {
      fontSize: typography.disclosure.fontSize,
      fontWeight: typography.disclosure.fontWeight,
      fontStyle: typography.disclosure.fontStyle,
      lineHeight: 18, // Match meta line-height
      color: typography.disclosure.color,
      marginBottom: spacing.sm,
    },
    thinContentNotice: {
      fontSize: 13,
      fontWeight: '400',
      fontStyle: 'italic',
      lineHeight: 18,
      color: colors.textSubtle,
      marginBottom: spacing.lg,
    },

    // Loading state
    loadingSection: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
    },

    // Footer spacer - breathing room before actions
    footerSpacer: {
      height: spacing.xxxl,
    },

    // Footer actions - quiet inline text row (non-sticky)
    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
    },
    footerActionText: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
    },
    // Saved state uses sage accent color
    footerActionActive: {
      color: colors.accentSecondary,
    },
    footerActionPressed: {
      opacity: 0.5,
    },
    footerSeparator: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
      marginHorizontal: spacing.sm,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: layout.screenPadding,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.xxl,
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    modalBody: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    modalButton: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    modalButtonPressed: {
      opacity: 0.5,
    },
    modalButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },

    // Toast
    toast: {
      position: 'absolute',
      bottom: 100,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    toastContent: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.textPrimary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 20,
      gap: spacing.xs,
    },
    toastCheck: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.background,
    },
    toastText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.background,
    },

    // Share menu
    shareMenuOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    shareMenuBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    shareMenuContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxxl,
    },
    shareMenuHandle: {
      width: 36,
      height: 4,
      backgroundColor: colors.divider,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    shareMenuTitle: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    shareOptionsList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    shareOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.lg,
      paddingHorizontal: layout.screenPadding,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    shareOptionPressed: {
      backgroundColor: colors.dividerSubtle,
    },
    shareOptionLabel: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textPrimary,
    },
    shareOptionChevron: {
      fontSize: 20,
      fontWeight: '300',
      color: colors.textMuted,
    },
    shareMenuCancel: {
      marginTop: spacing.md,
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    shareMenuCancelPressed: {
      opacity: 0.5,
    },
    shareMenuCancelText: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.textMuted,
    },
  });
}
