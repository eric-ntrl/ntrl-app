/**
 * Navigation type definitions for type-safe routing.
 * Root stack + tab + nested stack architecture for bottom tab navigation.
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
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

// ============================================
// Root Stack Navigator
// ============================================

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  ArticleDetail: { item: Item };
SourceTransparency: { sourceName: string; sourceUrl: string };
  Settings: undefined;
  About: undefined;
};

// ============================================
// Tab Navigator
// ============================================

export type TabParamList = {
  TodayTab: NavigatorScreenParams<TodayStackParamList>;
  SectionsTab: NavigatorScreenParams<SectionsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ============================================
// Nested Stack Navigators (tab-internal only)
// ============================================

export type TodayStackParamList = {
  Today: undefined;
};

export type SectionsStackParamList = {
  Sections: undefined;
  Search: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  SavedArticles: undefined;
  History: undefined;
};

// ============================================
// Screen Prop Types — Tab screens (3 levels: RootStack > Tab > Stack)
// ============================================

export type TodayScreenProps = CompositeScreenProps<
  NativeStackScreenProps<TodayStackParamList, 'Today'>,
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type SectionsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SectionsStackParamList, 'Sections'>,
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type SearchScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SectionsStackParamList, 'Search'>,
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type ProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Profile'>,
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type SavedArticlesScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'SavedArticles'>,
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type HistoryScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'History'>,
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

// ============================================
// Screen Prop Types — Root stack screens (direct children of RootStack)
// ============================================

export type ArticleDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;
export type SourceTransparencyScreenProps = NativeStackScreenProps<RootStackParamList, 'SourceTransparency'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type AboutScreenProps = NativeStackScreenProps<RootStackParamList, 'About'>;

// ============================================
// Generic navigation prop type
// ============================================

/**
 * Generic navigation prop type for use in hooks or utility functions.
 */
export type AppNavigation = NativeStackScreenProps<RootStackParamList>['navigation'];
