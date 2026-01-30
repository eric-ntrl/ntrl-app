import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Minimal haptic feedback — lightest style, iOS only.
 * Used on mode changes (Brief/Full/Ntrl switch) and preference saves.
 */
export function lightTap() {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * Selection haptic — native iOS tab/picker selection feel.
 * Lighter than impactAsync, matches standard tab bar behavior.
 */
export function selectionTap() {
  if (Platform.OS === 'ios') {
    Haptics.selectionAsync();
  }
}
