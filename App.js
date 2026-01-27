import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';

import FeedScreen from './src/screens/FeedScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import AboutScreen from './src/screens/AboutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SavedArticlesScreen from './src/screens/SavedArticlesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SearchScreen from './src/screens/SearchScreen';
import NtrlViewScreen from './src/screens/NtrlViewScreen';
import SourceTransparencyScreen from './src/screens/SourceTransparencyScreen';

const Stack = createNativeStackNavigator();

/**
 * Wraps a screen component with ErrorBoundary so that errors in individual
 * screens are isolated and don't crash the entire app. The user sees a
 * "Try Again" fallback scoped to the failing screen only.
 */
function withScreenErrorBoundary(ScreenComponent) {
  const WrappedScreen = (props) => (
    <ErrorBoundary>
      <ScreenComponent {...props} />
    </ErrorBoundary>
  );
  WrappedScreen.displayName = `withScreenErrorBoundary(${ScreenComponent.displayName || ScreenComponent.name || 'Component'})`;
  return WrappedScreen;
}

// Hoist wrapped screens to module scope so component references are stable
// and don't cause unnecessary remounts on re-render.
const SafeFeedScreen = withScreenErrorBoundary(FeedScreen);
const SafeArticleDetailScreen = withScreenErrorBoundary(ArticleDetailScreen);
const SafeAboutScreen = withScreenErrorBoundary(AboutScreen);
const SafeProfileScreen = withScreenErrorBoundary(ProfileScreen);
const SafeSavedArticlesScreen = withScreenErrorBoundary(SavedArticlesScreen);
const SafeHistoryScreen = withScreenErrorBoundary(HistoryScreen);
const SafeSearchScreen = withScreenErrorBoundary(SearchScreen);
const SafeNtrlViewScreen = withScreenErrorBoundary(NtrlViewScreen);
const SafeSourceTransparencyScreen = withScreenErrorBoundary(SourceTransparencyScreen);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Feed" component={SafeFeedScreen} />
              <Stack.Screen name="ArticleDetail" component={SafeArticleDetailScreen} />
              <Stack.Screen name="About" component={SafeAboutScreen} />
              <Stack.Screen name="Profile" component={SafeProfileScreen} />
              <Stack.Screen name="SavedArticles" component={SafeSavedArticlesScreen} />
              <Stack.Screen name="History" component={SafeHistoryScreen} />
              <Stack.Screen name="Search" component={SafeSearchScreen} />
              <Stack.Screen name="NtrlView" component={SafeNtrlViewScreen} />
              <Stack.Screen name="SourceTransparency" component={SafeSourceTransparencyScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
