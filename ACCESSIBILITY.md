# Accessibility Guidelines

AeroArcade is committed to making probability education accessible to all users. This document outlines our accessibility implementation and serves as a checklist for development.

**Target**: WCAG 2.1 Level AA compliance.

---

## 1. Keyboard Navigation

- All interactive elements (buttons, links, form controls, game controls) are reachable via Tab key.
- Focus order follows the visual layout (left-to-right, top-to-bottom).
- Custom game controls (bet sliders, coin flip buttons, wheel spin) support keyboard activation.
- Escape key closes modals, dropdowns, and overlays.
- No keyboard traps — focus can always be moved away from any element.

**Checklist:**
- [ ] All clickable elements are `<button>`, `<a>`, or have `role="button"` with `tabindex="0"`
- [ ] Custom game interactions have keyboard handlers (`onKeyDown` for Enter/Space)
- [ ] Focus is managed in modals (trap focus, restore on close)
- [ ] No elements with `tabindex` > 0 (use DOM order instead)
- [ ] Skip links implemented

---

## 2. Screen Reader Labels

- All interactive elements have descriptive `aria-label` or visible text labels.
- Icons used alone (no text) have `aria-label` describing the action.
- Dynamic content updates use `aria-live` regions.
- Form inputs are associated with `<label>` elements.
- Error messages use `aria-describedby` to link to their input.

**Checklist:**
- [ ] `<button aria-label="Close modal">` — all icon-only buttons labeled
- [ ] `<img alt="Coin flip animation">` — all images have alt text
- [ ] `<div aria-live="polite">` for score updates, notifications
- [ ] `<input aria-describedby="error-email">` for form validation
- [ ] `role="alert"` on error toasts and validation summaries

---

## 3. Color Contrast (WCAG 2.1 AA)

- **Normal text** (under 18px / 14px bold): contrast ratio ≥ 4.5:1
- **Large text** (18px+ / 14px+ bold): contrast ratio ≥ 3:1
- **UI components** (borders, focus indicators): contrast ratio ≥ 3:1
- Dark and light themes each meet the contrast requirements independently.
- Color is never the sole indicator of information (supplement with icons or text).

**Current palette checks:**
| Element | Light Theme | Dark Theme | Ratio | Pass? |
|---------|------------|------------|-------|-------|
| Body text on bg | #1a1a2e on #ffffff | #e0e0e0 on #0f0f23 | >7:1 | ✓ |
| Disabled text | #9ca3af on #ffffff | #6b7280 on #0f0f23 | 3.5:1 | Needs check |
| Error text | #dc2626 on #ffffff | #f87171 on #0f0f23 | >4.5:1 | ✓ |
| Link text | #2563eb on #ffffff | #60a5fa on #0f0f23 | >4.5:1 | ✓ |

---

## 4. Focus Indicators

- All focusable elements have a visible focus ring (default browser outline or custom `outline: 2px solid`).
- Focus indicators have contrast ratio ≥ 3:1 against the background.
- Custom focus styles are consistent across the application.
- Focus is never removed via `outline: none` without providing an alternative.
- Mouse users do not see focus indicators (use `:focus-visible`).

**Implementation:**
```css
/* Tailwind: focus-visible ring */
@layer base {
  *:focus-visible {
    @apply outline-2 outline-offset-2 outline-blue-500;
  }
}
```

---

## 5. Reduced Motion

- All animations respect the `prefers-reduced-motion` media query.
- Framer Motion animations use `useReducedMotion()` hook or `transition: { disable: true }`.
- Critical animations (game results, win effects) are replaced with static transitions.
- No auto-playing animations or parallax effects.
- The user preference `reducedMotion` allows overriding the OS setting in-app.

**Implementation:**
```typescript
// In Framer Motion components
import { useReducedMotion } from 'framer-motion';

function MyComponent() {
  const shouldReduceMotion = useReducedMotion();
  return <motion.div animate={shouldReduceMotion ? {} : { x: 100 }} />;
}
```

---

## 6. Semantic HTML

- Use proper HTML elements: `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`, `<aside>`.
- Headings follow a logical hierarchy (`h1` → `h2` → `h3`, no skipping).
- Lists use `<ul>` / `<ol>` with `<li>`.
- Tables use `<table>` with `<th>` and `<caption>`.
- Landmark regions are used for navigation, main content, and complementary content.

**Checklist:**
- [ ] `<nav>` for main and secondary navigation
- [ ] `<main>` wraps primary page content (one per page)
- [ ] `<header>` for page and section headers
- [ ] `<footer>` for page footer
- [ ] `<section>` with `aria-label` for distinct content groups
- [ ] Game areas use `role="application"` with `aria-label`

---

## 7. Form Validation with Screen Reader Announcements

- Validation errors are announced via `aria-live="polite"` or `role="alert"`.
- Each invalid input has `aria-invalid="true"`.
- Error messages are linked to inputs via `aria-describedby`.
- Form-level error summary appears at the top of the form.
- Success messages are also announced (e.g., "Profile saved successfully").

**Example:**
```tsx
<input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert">{errors.email.message}</p>
)}
```

---

## 8. Skip Navigation Links

- A "Skip to main content" link is the first focusable element on every page.
- The link is visually hidden until focused (appears on Tab press).
- The link scrolls to `<main id="main-content">`.

**Implementation:**
```tsx
// In layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
>
  Skip to main content
</a>
<main id="main-content">{children}</main>
```

---

## 9. Alt Text for All Images

- All `<img>` elements have meaningful `alt` attributes.
- Decorative images have `alt=""` (empty alt) to be ignored by screen readers.
- Icons in buttons/links describe the action, not the icon itself.
- Game result images (dice, coins, cards) describe the outcome.

**Examples:**
```tsx
<img src="/dice-6.png" alt="Dice showing 6" />
<img src="/decoration-bg.png" alt="" role="presentation" />
<button aria-label="Close">
  <XIcon aria-hidden="true" />
</button>
```

---

## 10. ARIA Live Regions for Dynamic Content

- Balance changes announce via `aria-live="polite"`.
- Game result announcements via `aria-live="assertive"`.
- Notifications and toasts via `role="status"` or `aria-live="polite"`.
- Leaderboard updates via `aria-live="polite"`.
- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

**Implementation:**
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  You won {payout} points
</div>
<div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
  {progress}%
</div>
```

---

## 11. Accessible Error States

- Error pages (404, 500) have descriptive text explaining what happened.
- Network errors provide a retry action.
- Empty states explain why content is missing and what to do next.
- Game connection errors (WebSocket disconnect) show a reconnection message.

**Components:** `EmptyState.tsx`, `ErrorState.tsx` in `frontend/src/components/ui/`

---

## 12. Language Attribute

- `<html lang="en">` for English, `<html lang="ur">` for Urdu.
- The `lang` attribute updates dynamically when the user switches language via i18next.
- Screen readers use this to apply the correct pronunciation rules.

**Implementation:**
```tsx
// In _app.tsx or layout
<html lang={i18n.language}>
```

---

## 13. Heading Hierarchy

- One `<h1>` per page (page title).
- `<h2>` for major sections (e.g., "Games", "Leaderboard", "Settings").
- `<h3>` for subsections within sections.
- No heading level skipping (e.g., `h1` → `h3` without `h2`).

**Page structure example:**
```
h1: AeroArcade - Flight Curve
  h2: Game Controls
    h3: Bet Amount
    h3: Cash Out
  h2: Game History
  h2: Leaderboard
```

---

## 14. Touch Target Sizes

- All interactive elements have a minimum touch target of **44×44px** (WCAG 2.5.5).
- Small targets (icons) are wrapped in larger clickable areas with padding.
- Game controls (bet buttons, spin button) are at least 48×48px for ease of use.
- Sufficient spacing between adjacent touch targets (at least 8px gap).

**Implementation:**
```tsx
<button className="min-w-[44px] min-h-[44px] p-3">
  <Icon />
</button>
```

---

## Accessibility Testing

### Automated Tools
- **Lighthouse** — Accessibility audit in Chrome DevTools (run on every page)
- **axe DevTools** — Browser extension for automated testing
- **Wave** — Web Accessibility Evaluation Tool

### Manual Testing
- **Keyboard-only navigation** — Tab through every page
- **Screen reader testing** — NVDA (Windows) and VoiceOver (macOS)
- **Zoom testing** — 200% browser zoom without loss of content
- **Reduced motion** — Enable in Windows settings (`System > Display > Simplify and personalize Windows`)

### CI Integration
- Accessibility checks should be added to the CI pipeline:
  ```yaml
  - name: Accessibility audit
    run: npx axe-core
  ```

---

## Priority Fixes (Next Iteration)

1. Add `skip-to-content` link to all page layouts
2. Ensure game WebSocket status updates use `aria-live` regions
3. Add `aria-label` to icon-only navigation items in the sidebar
4. Test and fix color contrast for disabled states in both themes
5. Add keyboard shortcuts for common game actions (Space = bet, Enter = cash out)
6. Implement reduced-motion fallbacks for all Framer Motion animations
