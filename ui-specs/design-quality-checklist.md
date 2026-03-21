# Design Quality Checklist

The Frontend Agent must pass every item in this checklist before a page is considered done. No exceptions.

---

## 1. Visual Identity

- [ ] Uses brand-500 (`#4f6ef7`) for all primary actions — not Tailwind's default blue-500
- [ ] All headings use `tracking-tight` (`letter-spacing: -0.02em`)
- [ ] Font is Inter, loaded via `@fontsource/inter` — not system-ui fallback alone
- [ ] No default shadcn component styles visible — every component has been overridden per `design-system.md`
- [ ] No pure black (`#000000`) anywhere — use `neutral-900` (`#111827`)
- [ ] Platform logos use the grayscale treatment on the landing page (`grayscale opacity-50`)
- [ ] Status badges use semantic color system (green/amber/red) — not arbitrary colors
- [ ] Page background is `neutral-50` (`#f8f9fb`), not white
- [ ] Cards use `rounded-xl` with `border border-neutral-200 shadow-sm`
- [ ] No `shadow-xl` or `shadow-2xl` used anywhere

---

## 2. Interactive States

Every interactive element must have all of these:

### Buttons
- [ ] Default state: defined background + text color
- [ ] Hover: color shift + `shadow-md` (primary) or `bg-neutral-50` (secondary)
- [ ] Active/pressed: darker shade (`brand-700`)
- [ ] Focus-visible: `shadow-brand` ring (not default browser outline)
- [ ] Disabled: `opacity-40 cursor-not-allowed` — not just grayed out text
- [ ] Loading: spinner (`Loader2 animate-spin`) + disabled state

### Inputs
- [ ] Default: `border-neutral-200`
- [ ] Focus: `border-brand-500 shadow-brand` — no default blue ring
- [ ] Error: `border-red-500` + error message below in `text-xs text-red-600`
- [ ] Disabled: `bg-neutral-50 text-neutral-400 cursor-not-allowed`

### Links / Nav Items
- [ ] Hover: color transition `duration-150`
- [ ] Active/current: `bg-neutral-100 text-neutral-900`
- [ ] Focus-visible: visible outline

### Cards (clickable)
- [ ] Hover: `shadow-md border-neutral-300` transition
- [ ] Active: slight scale down `scale-[0.99]`

---

## 3. All Required States Per Component

### Lists (syncs, activity)
- [ ] Loading state: skeleton with `animate-pulse` — matches the shape of real content
- [ ] Empty state: centered illustration/icon + headline + CTA button
- [ ] Error state: error icon + message + retry button
- [ ] Populated state: actual content with animations

### Forms / Wizard Steps
- [ ] Validation errors shown inline, not in a toast
- [ ] Submit button disabled until form is valid
- [ ] Loading state during async operations
- [ ] Success state after completion

### Platform Connection Cards
- [ ] Connected state
- [ ] Disconnected state (dashed border)
- [ ] Error/expired state (red tint)
- [ ] Loading/connecting state (spinner)

---

## 4. Motion & Animation

- [ ] Page/section entrance: `fadeUp` with `whileInView` + `once: true`
- [ ] List items: `staggerContainer` + `fadeUp` — not all items appearing simultaneously
- [ ] Modal/dialog open: `scaleIn` variant
- [ ] Wizard step transitions: `slideInRight` with `AnimatePresence mode="wait"`
- [ ] No layout shifts during animation (use `opacity` + `transform` only)
- [ ] `useReducedMotion()` check wraps all Framer Motion — animations disabled if user prefers
- [ ] Hover transitions use `transition-all duration-200` — not `transition-none`
- [ ] No animation on every scroll event — only `whileInView` with `once: true`
- [ ] Loading spinners: `animate-spin` on `Loader2` icon — not custom CSS keyframes
- [ ] Success states: spring animation (`type: "spring", stiffness: 400, damping: 20`)

---

## 5. Typography Hierarchy

Each page must have a clear 3-level hierarchy:

- [ ] Level 1 (page title): `text-xl font-semibold text-neutral-900`
- [ ] Level 2 (section title): `text-base font-semibold text-neutral-900`
- [ ] Level 3 (label/caption): `text-xs uppercase tracking-widest text-neutral-400`
- [ ] Body text: `text-sm text-neutral-700 leading-relaxed`
- [ ] Secondary/muted: `text-sm text-neutral-500`
- [ ] No more than 3 font sizes in a single card
- [ ] No `font-bold` on body text — only headings
- [ ] Monospace font (`font-mono`) used for: field keys, IDs, code values, sync rule details

---

## 6. Mobile Responsiveness

- [ ] Sidebar hidden on mobile — replaced by `Sheet` drawer
- [ ] All grids collapse to single column on mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- [ ] Touch targets minimum 44×44px (buttons, nav items, interactive cards)
- [ ] Horizontal scroll on platform connection cards row (mobile)
- [ ] Activity feed hidden on mobile (shown in separate tab or collapsed section)
- [ ] Wizard is full-screen on mobile with no sidebar
- [ ] Text sizes don't go below `text-xs` (12px) on mobile
- [ ] No horizontal overflow on any viewport width
- [ ] Tested at: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1280px (desktop)

---

## 7. "Does It Look Like a Real Product" Criteria

These are the subjective checks. Be honest.

- [ ] **No default shadcn**: Open the page and ask — does any component look like it came straight from the shadcn docs? If yes, it needs overrides.
- [ ] **Consistent spacing**: Padding and gaps feel rhythmic, not random. Cards don't have mismatched inner padding.
- [ ] **Color discipline**: Only brand-500, neutrals, and semantic colors are used. No random Tailwind colors (no `purple-400`, no `teal-300`).
- [ ] **Intentional empty states**: Empty states have an icon, a headline, a description, and a CTA. Not just "No data found."
- [ ] **Loading states match content shape**: Skeletons mirror the exact layout of the loaded content — not generic gray bars.
- [ ] **Micro-interactions on hover**: Every clickable element responds visually to hover. Nothing is static.
- [ ] **Copy is product-quality**: No placeholder text like "Lorem ipsum" or "Click here". All copy matches the tone in `landing.md`.
- [ ] **Icons are consistent**: Use only Lucide icons throughout. No mixing icon libraries.
- [ ] **No visual clutter**: Each page has a clear primary action. The eye knows where to go first.
- [ ] **Feels fast**: Optimistic UI updates where possible. No full-page spinners for small actions.

---

## 8. Accessibility Baseline

- [ ] All interactive elements reachable via keyboard (Tab order logical)
- [ ] Focus states visible (not removed with `outline-none` without replacement)
- [ ] Images have `alt` text (platform logos: `alt="Asana logo"`)
- [ ] Color is not the only indicator of state (badges have text, not just color)
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Modals trap focus and close on Escape

---

## Sign-off

Before marking a page complete, the Frontend Agent must confirm:

```
Page: _______________
Date: _______________

Visual identity:        PASS / FAIL
Interactive states:     PASS / FAIL
All required states:    PASS / FAIL
Motion & animation:     PASS / FAIL
Typography hierarchy:   PASS / FAIL
Mobile responsiveness:  PASS / FAIL
Real product criteria:  PASS / FAIL
Accessibility:          PASS / FAIL

Overall: READY / NEEDS REVISION
Notes: _______________
```

A page is only READY when all 8 sections are PASS.
