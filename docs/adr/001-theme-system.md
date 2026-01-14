# ADR 001: Theme System Architecture

## Status
Accepted

## Context

The NTRL app needs to support both light and dark color modes while maintaining a consistent, calm visual design. React Native does not provide built-in theming, so we needed to choose an approach for:

1. Defining color palettes for light and dark modes
2. Providing theme values to components
3. Ensuring components respond to theme changes
4. Maintaining type safety

## Decision

We implemented a **React Context-based theme system** with the following components:

### 1. Theme Provider (`src/theme/index.tsx`)

A context provider wrapping the app that:
- Detects system color scheme via `useColorScheme()`
- Provides `theme` object and `colorMode` to descendants
- Re-renders children when system theme changes

```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const colorMode: ColorMode = systemColorScheme === 'dark' ? 'dark' : 'light';
  const theme = createTheme(colorMode);

  return (
    <ThemeContext.Provider value={{ theme, colorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. Theme Structure (`src/theme/types.ts`)

```typescript
export type Theme = {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  layout: Layout;
};
```

### 3. Dynamic Style Creation Pattern

Components must create styles dynamically using the theme:

```typescript
function MyScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // ...
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    container: { backgroundColor: colors.background },
  });
}
```

## Consequences

### Positive

- **Automatic dark mode**: App responds to system preference changes
- **Type safety**: TypeScript catches incorrect color/spacing references
- **Consistency**: Single source of truth for design tokens
- **Performance**: `useMemo` prevents unnecessary style recalculation

### Negative

- **Boilerplate**: Every screen needs `useTheme()` + `createStyles()`
- **Learning curve**: Developers must follow the pattern strictly
- **No static imports**: Cannot use simple `import { colors }` pattern

### Mitigations

- Added clear documentation in `CLAUDE.md`
- ESLint rules can catch static imports (future)
- Code examples in component files

## Alternatives Considered

### 1. Styled Components / Emotion
- **Rejected**: Adds dependency, different paradigm from StyleSheet
- **Concern**: Performance overhead for native rendering

### 2. Static Theme with Manual Toggle
- **Rejected**: Would not respond to system preference changes
- **Concern**: Poor UX on iOS/Android where users expect system integration

### 3. Inline Styles Only
- **Rejected**: Poor performance, no style caching
- **Concern**: Hard to maintain consistency

## References

- React Native `useColorScheme`: https://reactnative.dev/docs/usecolorscheme
- iOS Dark Mode HIG: https://developer.apple.com/design/human-interface-guidelines/dark-mode
