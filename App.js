import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme';
import { ToastProvider } from './src/context/ToastContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import CustomTabBar from './src/components/CustomTabBar';
import {
  setLastSessionCompletedAt,
  setLastOpenedAt,
} from './src/storage/storageService';

// Screens
import TodayScreen from './src/screens/TodayScreen';
import SectionsScreen from './src/screens/SectionsScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import SourceTransparencyScreen from './src/screens/SourceTransparencyScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import SavedArticlesScreen from './src/screens/SavedArticlesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ManipulationAvoidedScreen from './src/screens/ManipulationAvoidedScreen';
import WhatNtrlIsScreen from './src/screens/WhatNtrlIsScreen';
import ManifestoScreen from './src/screens/ManifestoScreen';

// Navigators
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TodayStackNav = createNativeStackNavigator();
const SectionsStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

/**
 * Simple text-based tab icon (no custom SVGs yet)
 */
function TabIcon({ label, color }) {
  return <Text style={{ fontSize: 20, color, marginTop: 2 }}>{label}</Text>;
}

function ProfileIcon({ color }) {
  return (
    <View style={{ alignItems: 'center', marginTop: 2 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <View style={{ width: 14, height: 6, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: color, marginTop: 2 }} />
    </View>
  );
}

/**
 * Today tab — session-filtered articles
 */
function TodayStackScreen() {
  return (
    <TodayStackNav.Navigator screenOptions={{ headerShown: false }}>
      <TodayStackNav.Screen name="Today">
        {(props) => (
          <ErrorBoundary>
            <TodayScreen {...props} />
          </ErrorBoundary>
        )}
      </TodayStackNav.Screen>
      <TodayStackNav.Screen name="Search">
        {(props) => (
          <ErrorBoundary>
            <SearchScreen {...props} />
          </ErrorBoundary>
        )}
      </TodayStackNav.Screen>
    </TodayStackNav.Navigator>
  );
}

/**
 * Sections tab — all category sections
 */
function SectionsStackScreen() {
  return (
    <SectionsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SectionsStackNav.Screen name="Sections">
        {(props) => (
          <ErrorBoundary>
            <SectionsScreen {...props} />
          </ErrorBoundary>
        )}
      </SectionsStackNav.Screen>
      <SectionsStackNav.Screen name="Search">
        {(props) => (
          <ErrorBoundary>
            <SearchScreen {...props} />
          </ErrorBoundary>
        )}
      </SectionsStackNav.Screen>
    </SectionsStackNav.Navigator>
  );
}

/**
 * Profile tab — user content + settings
 */
function ProfileStackScreen() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="Profile">
        {(props) => (
          <ErrorBoundary>
            <ProfileScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
      <ProfileStackNav.Screen name="SavedArticles">
        {(props) => (
          <ErrorBoundary>
            <SavedArticlesScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
      <ProfileStackNav.Screen name="History">
        {(props) => (
          <ErrorBoundary>
            <HistoryScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
      <ProfileStackNav.Screen name="ManipulationAvoided">
        {(props) => (
          <ErrorBoundary>
            <ManipulationAvoidedScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
    </ProfileStackNav.Navigator>
  );
}

/**
 * Tab navigator with custom tab bar for enhanced haptics and visual feedback
 */
function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayStackScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => <TabIcon label="◉" color={color} />,
        }}
      />
      <Tab.Screen
        name="SectionsTab"
        component={SectionsStackScreen}
        options={{
          tabBarLabel: 'Sections',
          tabBarIcon: ({ color }) => <TabIcon label="☰" color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Navigation wrapper — applies theme-aware colors to NavigationContainer
 * so the navigation chrome (tab bar container, screen backgrounds) matches
 * the current color mode and avoids light-mode flashes during transitions.
 */
function AppNavigator() {
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const [showIntro, setShowIntro] = useState(null); // null = loading

  useEffect(() => {
    // Always show splash - it's a brief brand intro on every launch
    setShowIntro(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const navigationTheme = useMemo(() => {
    const base = colorMode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.background,
        border: colors.divider,
        text: colors.textPrimary,
      },
    };
  }, [colorMode, colors]);

  // Show nothing while checking (brief flash avoided by ThemeProvider)
  if (showIntro === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  // Show intro if not seen
  if (showIntro) {
    return <WhatNtrlIsScreen onComplete={handleIntroComplete} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={AppTabs} />
        <RootStack.Screen name="ArticleDetail">
          {(props) => (
            <ErrorBoundary>
              <ArticleDetailScreen {...props} />
            </ErrorBoundary>
          )}
        </RootStack.Screen>
<RootStack.Screen name="SourceTransparency">
          {(props) => (
            <ErrorBoundary>
              <SourceTransparencyScreen {...props} />
            </ErrorBoundary>
          )}
        </RootStack.Screen>
        <RootStack.Screen name="Settings">
          {(props) => (
            <ErrorBoundary>
              <SettingsScreen {...props} />
            </ErrorBoundary>
          )}
        </RootStack.Screen>
        <RootStack.Screen name="About">
          {(props) => (
            <ErrorBoundary>
              <AboutScreen {...props} />
            </ErrorBoundary>
          )}
        </RootStack.Screen>
        <RootStack.Screen name="Manifesto">
          {(props) => (
            <ErrorBoundary>
              <ManifestoScreen {...props} />
            </ErrorBoundary>
          )}
        </RootStack.Screen>
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

/**
 * App root — wraps providers and manages session timestamps.
 * Sets last_session_completed_at on background, last_opened_at on foreground.
 */
export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Record initial open
    setLastOpenedAt(new Date().toISOString());

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/active/) &&
        nextState.match(/inactive|background/)
      ) {
        // App going to background — record session end
        setLastSessionCompletedAt(new Date().toISOString());
      }
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // App coming to foreground — record open time
        setLastOpenedAt(new Date().toISOString());
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
