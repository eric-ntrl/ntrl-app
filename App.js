import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import FeedScreen from './src/screens/FeedScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import RedlineScreen from './src/screens/RedlineScreen';
import AboutScreen from './src/screens/AboutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SavedArticlesScreen from './src/screens/SavedArticlesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SearchScreen from './src/screens/SearchScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Feed" component={FeedScreen} />
          <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
          <Stack.Screen name="Redline" component={RedlineScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="SavedArticles" component={SavedArticlesScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
