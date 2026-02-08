# Feed Categories & Topic Selection

## 10 Feed Categories

The brief is organized into 10 user-facing categories (classified by LLM on the backend):

| Key | Display Name |
|-----|-------------|
| `world` | World |
| `us` | U.S. |
| `local` | Local |
| `business` | Business |
| `technology` | Technology |
| `science` | Science |
| `health` | Health |
| `environment` | Environment |
| `sports` | Sports |
| `culture` | Culture |

## User Topic Selection

Users can toggle categories on/off in ProfileScreen. Filtering is **client-side** — the API always returns all categories, and `SectionsScreen`/`TodayScreen` filter `brief.sections` by the user's `selectedTopics` preference.

**How it works:**
1. ProfileScreen saves topic preferences to SecureStore via `updatePreferences()`
2. SectionsScreen/TodayScreen loads preferences via `useFocusEffect` → `getPreferences()`
3. `filteredBrief` memo filters `brief.sections` by `selectedTopics`
4. All 10 topics are enabled by default for new users

**Preference migration:** Existing users who had the old 5-topic format (`tech` key) are auto-migrated: `tech` → `technology`, and 5 new categories are auto-enabled. See `migrateTopics()` in `storageService.ts`.

**Important:** `migrateTopics()` only runs when the `tech` key is detected (actual old-format data). It does NOT re-add topics on every `getPreferences()` call — this was a bug that was fixed. If you modify migration logic, ensure it doesn't override user deselections.

## Category Pills Navigation

SectionsScreen displays horizontal scrollable pills for quick section navigation. Tapping a pill scrolls to that section and highlights the pill.

**Component:** `CategoryPills.tsx`
- Horizontal ScrollView with pill buttons
- Active pill has highlighted background
- Auto-scrolls to keep active pill visible

**Implementation notes:**
- Uses `onViewableItemsChanged` (NOT `onLayout`) to track visible sections
- `onLayout` returns incorrect values in virtualized FlatList items (positions relative to visible window, not absolute offsets)
- `viewabilityConfig` with 50% threshold determines when a section is "visible"
- `isProgrammaticScrollRef` prevents scroll-based updates during pill press animations (500ms lock)
- `scrollToIndex` with `onScrollToIndexFailed` fallback handles virtualized item scrolling

**Why NOT to use `onLayout` for scroll tracking:**
FlatList uses transform-based virtualization internally. `e.nativeEvent.layout.y` returns position relative to the visible window, not absolute scroll offset. This causes the last section to always match during range checks.
