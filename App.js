import React, { useEffect, useRef } from 'react';
import { AppState, StyleSheet, Text } from 'react-native';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import {
  setLastSessionCompletedAt,
  setLastOpenedAt,
} from './src/storage/storageService';

// Screens
import TodayScreen from './src/screens/TodayScreen';
import SectionsScreen from './src/screens/SectionsScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import NtrlViewScreen from './src/screens/NtrlViewScreen';
import SourceTransparencyScreen from './src/screens/SourceTransparencyScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import SavedArticlesScreen from './src/screens/SavedArticlesScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Navigators
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
      <TodayStackNav.Screen name="ArticleDetail">
        {(props) => (
          <ErrorBoundary>
            <ArticleDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </TodayStackNav.Screen>
      <TodayStackNav.Screen name="NtrlView">
        {(props) => (
          <ErrorBoundary>
            <NtrlViewScreen {...props} />
          </ErrorBoundary>
        )}
      </TodayStackNav.Screen>
      <TodayStackNav.Screen name="SourceTransparency">
        {(props) => (
          <ErrorBoundary>
            <SourceTransparencyScreen {...props} />
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
      <SectionsStackNav.Screen name="ArticleDetail">
        {(props) => (
          <ErrorBoundary>
            <ArticleDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </SectionsStackNav.Screen>
      <SectionsStackNav.Screen name="NtrlView">
        {(props) => (
          <ErrorBoundary>
            <NtrlViewScreen {...props} />
          </ErrorBoundary>
        )}
      </SectionsStackNav.Screen>
      <SectionsStackNav.Screen name="SourceTransparency">
        {(props) => (
          <ErrorBoundary>
            <SourceTransparencyScreen {...props} />
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
      <ProfileStackNav.Screen name="Settings">
        {(props) => (
          <ErrorBoundary>
            <SettingsScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
      <ProfileStackNav.Screen name="About">
        {(props) => (
          <ErrorBoundary>
            <AboutScreen {...props} />
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
      <ProfileStackNav.Screen name="ArticleDetail">
        {(props) => (
          <ErrorBoundary>
            <ArticleDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
      <ProfileStackNav.Screen name="NtrlView">
        {(props) => (
          <ErrorBoundary>
            <NtrlViewScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
      <ProfileStackNav.Screen name="SourceTransparency">
        {(props) => (
          <ErrorBoundary>
            <SourceTransparencyScreen {...props} />
          </ErrorBoundary>
        )}
      </ProfileStackNav.Screen>
    </ProfileStackNav.Navigator>
  );
}

// Screens where bottom tab bar should be hidden
const HIDE_TAB_BAR_ROUTES = [
  'ArticleDetail',
  'NtrlView',
  'SourceTransparency',
  'Settings',
  'About',
];

function getTabBarStyle(route, colors) {
  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName && HIDE_TAB_BAR_ROUTES.includes(routeName)) {
    return { display: 'none' };
  }
  return {
    backgroundColor: colors.background,
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
  };
}

/**
 * Tab navigator with theme-aware styling
 */
function AppTabs() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayStackScreen}
        options={({ route }) => ({
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => <TabIcon label="◉" color={color} />,
          tabBarStyle: getTabBarStyle(route, colors),
        })}
      />
      <Tab.Screen
        name="SectionsTab"
        component={SectionsStackScreen}
        options={({ route }) => ({
          tabBarLabel: 'Sections',
          tabBarIcon: ({ color }) => <TabIcon label="☰" color={color} />,
          tabBarStyle: getTabBarStyle(route, colors),
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={({ route }) => ({
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon label="○" color={color} />,
          tabBarStyle: getTabBarStyle(route, colors),
        })}
      />
    </Tab.Navigator>
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
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <AppTabs />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
