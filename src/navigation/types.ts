/**
 * Navigation type definitions for type-safe routing.
 * Provides compile-time type checking for navigation params.
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Item } from '../types';

/**
 * Transformation type categories for NtrlView screen.
 */
export type TransformationType =
  | 'urgency'
  | 'emotional'
  | 'clickbait'
  | 'sensational'
  | 'opinion'
  | 'other';

/**
 * Span reason from the backend - maps to highlight colors
 */
export type SpanReason =
  | 'clickbait'
  | 'urgency_inflation'
  | 'emotional_trigger'
  | 'selling'
  | 'agenda_signaling'
  | 'rhetorical_framing'
  | 'editorial_voice';

/**
 * Transformation record showing what was changed.
 */
export type Transformation = {
  start: number;
  end: number;
  type: TransformationType;
  reason: SpanReason; // Backend reason for highlight color mapping
  original: string;
  filtered: string;
};

/**
 * Root stack parameter list defining all screens and their params.
 */
export type RootStackParamList = {
  Feed: undefined;
  ArticleDetail: {
    item: Item;
  };
  About: undefined;
  Profile: undefined;
  SavedArticles: undefined;
  History: undefined;
  Search: undefined;
  NtrlView: {
    item: Item;
    fullOriginalText?: string | null;
    fullFilteredText?: string | null;
    transformations?: Transformation[];
  };
  SourceTransparency: {
    sourceName: string;
    sourceUrl: string;
  };
};

/**
 * Screen-specific prop types for each screen.
 * Use these in screen components for full type safety.
 */
export type FeedScreenProps = NativeStackScreenProps<RootStackParamList, 'Feed'>;
export type ArticleDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;
export type AboutScreenProps = NativeStackScreenProps<RootStackParamList, 'About'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type SavedArticlesScreenProps = NativeStackScreenProps<RootStackParamList, 'SavedArticles'>;
export type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'History'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type NtrlViewScreenProps = NativeStackScreenProps<RootStackParamList, 'NtrlView'>;
export type SourceTransparencyScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'SourceTransparency'
>;

/**
 * Generic navigation prop type for use in hooks or utility functions.
 */
export type AppNavigation = NativeStackScreenProps<RootStackParamList>['navigation'];
