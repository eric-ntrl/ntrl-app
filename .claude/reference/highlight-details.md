# Highlight Colors, Legend & Manipulation Gauge

## Category-Specific Highlight Colors

ntrl-view uses different highlight colors based on manipulation type:

| Reason | Color | Light Mode | Dark Mode |
|--------|-------|------------|-----------|
| `urgency_inflation` | Dusty rose | `rgba(200, 120, 120, 0.35)` | `rgba(200, 120, 120, 0.30)` |
| `emotional_trigger` | Slate blue | `rgba(130, 160, 200, 0.35)` | `rgba(130, 160, 200, 0.30)` |
| `editorial_voice`, `agenda_signaling` | Lavender | `rgba(160, 130, 180, 0.35)` | `rgba(160, 130, 180, 0.30)` |
| `clickbait`, `selling` | Amber/tan | `rgba(200, 160, 100, 0.35)` | `rgba(200, 160, 100, 0.30)` |
| Default (rhetorical_framing, etc.) | Gold | `rgba(255, 200, 50, 0.50)` | `rgba(255, 200, 50, 0.40)` |

Colors are muted to maintain "calm reading" aesthetic. All have similar saturation for visual harmony.

**SpanReason type** (`navigation/types.ts`):
```typescript
type SpanReason = 'clickbait' | 'urgency_inflation' | 'emotional_trigger'
  | 'selling' | 'agenda_signaling' | 'rhetorical_framing' | 'editorial_voice';
```

## Highlight Legend

The Ntrl tab includes a collapsible legend explaining what each highlight color means:
- Collapsed by default ("What do colors mean?")
- Shows 4 color swatches with human-readable labels: Emotional language, Urgency/hype, Editorial opinion, Clickbait/selling
- Highlights are always ON (no toggle)
- Component: `HighlightLegend` in `NtrlContent.tsx`

The badge ("N phrases flagged") is always visible when changes exist.

## Manipulation Gauge

The ntrl-view displays a semi-circular gauge showing manipulation density:

```
        ╭─────────────────╮
       ╱   🟢  🟡  🔴      ╲
      │        ↑            │
      ╰─────────────────────╯
         12% manipulation
      15 phrases in 125 words
```

**Component:** `ManipulationGauge.tsx`
- Uses `react-native-svg` for smooth arc rendering
- Gradient: green (0%) → yellow (25%) → red (50%+)
- Props: `percent`, `spanCount`, `wordCount`
- Labels: Minimal (<5%), Low (<15%), Moderate (<30%), High (30%+)
- Capped at 50% visually (anything above is "heavy manipulation")

**Calculation:**
```typescript
const manipulationPercent = (allTransformations.length / wordCount) * 100;
```
