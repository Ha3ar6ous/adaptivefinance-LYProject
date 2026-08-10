# Frontend Enhancement Plan — Polish Pass

> Base plan only — expand each phase after reading the actual component
> code. This is a general polish pass on the existing working dashboard,
> not a redesign. Keep the current layout/structure and information
> mostly as-is; the goal is to make it feel less boxy/rigid, responsive,
> and less laggy — not to rebuild pages from scratch.

## Current state
- Dashboard pages (Enter Data, Income History, Forecasts, Health &
  Decisions, Investment Suggestions) are functionally complete and
  showing real model output (Stages 1-4 of the ML integration).
- Visual style right now: plain black/white boxes, hard borders, flat
  typography, not mobile-responsive, and scrolling feels laggy
  (suspected chart re-rendering, unconfirmed).
- **Out of scope for this pass:** landing page (separate effort later),
  any change to data/logic/API calls, full visual redesign.

## Phase 1 — Diagnose the scroll lag before touching anything else
- Don't guess-fix this — profile it first (React DevTools Profiler /
  browser Performance tab) while scrolling on the Income History and
  Forecasts pages specifically, since those have the most charts.
- Likely suspects to check: charts re-rendering on every scroll/parent
  re-render instead of being memoized, too many chart points being
  rendered without any downsampling, missing `key`/memoization causing
  full remounts, or layout thrashing from unoptimized CSS.
- Fix only the confirmed cause(s) — don't apply a general "optimize
  everything" pass blindly.

## Phase 2 — Make it responsive
- Sidebar/menu needs a mobile pattern (collapsible/hamburger) instead of
  a fixed-width panel that doesn't fit small screens.
- Audit fixed pixel widths across the dashboard cards/forms and convert
  to responsive units so charts, cards, and forms reflow properly on
  phone-sized viewports.
- Test at a few real breakpoints (small phone, large phone, tablet,
  desktop), not just one mobile width.

## Phase 3 — Colour palette (finance + Gen Z, not corporate-serious)
- Move off plain black/white/grey boxes toward a palette that still
  reads "money/finance" (greens, deep teals, navy) but with one bolder
  accent color for a Gen Z feel (e.g. an electric/gradient accent used
  sparingly for highlights, buttons, key numbers) — not neon everywhere.
- Use color meaningfully, not just decoratively: status already exists
  in the data (blocked/allowed, risk level, volatility) — let color
  reinforce those states instead of everything being black text on
  white boxes.
- Keep contrast/accessibility in mind, especially for numbers gig
  workers need to read quickly.

## Phase 4 — Typography
- Pick a distinct heading/display font with some character (not the
  default system sans currently used everywhere) paired with a clean,
  highly readable body font — common finance-app pairing pattern (a
  confident display face for headings/big numbers, a neutral workhorse
  font for body text and data).
- Establish a real type scale (clear size/weight jumps between page
  titles, card headings, body text, and numeric callouts like the
  health score or forecast total) instead of everything looking the
  same weight/size.

## Phase 5 — Smooth out the "boxy" feel
- Soften hard black borders/dividers — replace with subtle shadows,
  lighter borders, or spacing-based separation instead of thick outlines
  on every card.
- Consistent rounded corners and consistent spacing rhythm across all
  cards/sections (currently inconsistent box styles per page).
- Add small, tasteful transitions (hover states, loading states) so
  interactions feel less abrupt — nothing heavy or animation-for-its-
  own-sake.

## Phase 6 — Re-check on real devices after all changes
- Re-test scroll performance (Phase 1 fix) after the visual changes are
  in, since new shadows/gradients/transitions can reintroduce jank if
  overused.
- Re-test responsiveness on actual phone-sized screens, not just a
  resized browser window.
- Confirm nothing in the data/numbers/logic changed — this pass should
  be visual/perceptual only.

## Notes for the agent
- Read the current component/CSS structure first — reuse existing
  design tokens/theme setup if one already exists rather than
  introducing a second styling system.
- Landing page is explicitly excluded from this pass.
- If a phase turns out bigger than expected once the code is visible
  (e.g. chart lag has a deeper cause), flag it rather than quietly
  expanding scope.
