# Smart Kanban Sync — Design System

Reference quality: Linear.app, Vercel dashboard. The product should feel like a tool engineers trust — precise, fast, no visual noise.

---

## Color Palette

### Brand Colors
```
--color-brand-50:  #f0f4ff   (tint backgrounds)
--color-brand-100: #e0eaff
--color-brand-500: #4f6ef7   (primary actions, links)
--color-brand-600: #3d5ce8   (hover state)
--color-brand-700: #2d4ad4   (active/pressed)
--color-brand-900: #1a2d8a   (dark text on light brand bg)
```

### Neutrals (the backbone — use these 80% of the time)
```
--color-neutral-0:   #ffffff
--color-neutral-50:  #f8f9fb   (page background)
--color-neutral-100: #f1f3f7   (card backgrounds, subtle fills)
--color-neutral-200: #e4e7ef   (borders, dividers)
--color-neutral-300: #c9cedd   (disabled borders)
--color-neutral-400: #9aa0b4   (placeholder text)
--color-neutral-500: #6b7280   (secondary text)
--color-neutral-700: #374151   (body text)
--color-neutral-900: #111827   (headings, primary text)
```

### Semantic Colors
```
success: #16a34a  (green-600)  — sync active, connected
warning: #d97706  (amber-600)  — sync paused, needs attention
error:   #dc2626  (red-600)    — sync failed, disconnected
info:    #0284c7  (sky-600)    — informational, LLM hints
```

### Platform Brand Colors (for connection status badges only)
```
asana:   #f06a6a
trello:  #0052cc
monday:  #ff3d57
jira:    #0052cc
linear:  #5e6ad2
```

### Dark Mode
All neutrals invert. Brand-500 stays the same. Page bg: `#0d0f14`. Card bg: `#161a23`. Border: `#252a36`.

---

## Typography

### Font Family
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
/* Load via: @fontsource/inter with weights 400, 500, 600, 700 */
```

### Scale
| Token       | Size  | Weight | Line Height | Usage                        |
|-------------|-------|--------|-------------|------------------------------|
| display-lg  | 48px  | 700    | 1.1         | Hero headline                |
| display-md  | 36px  | 700    | 1.15        | Section headlines            |
| heading-lg  | 24px  | 600    | 1.3         | Page titles, card headers    |
| heading-md  | 18px  | 600    | 1.4         | Sub-section titles           |
| heading-sm  | 15px  | 600    | 1.4         | Labels, group headers        |
| body-lg     | 16px  | 400    | 1.6         | Primary body copy            |
| body-md     | 14px  | 400    | 1.6         | Secondary body, descriptions |
| body-sm     | 13px  | 400    | 1.5         | Captions, metadata           |
| mono        | 13px  | 400    | 1.5         | Code, IDs, field keys        |

### Rules
- Never use font-weight 300 — too thin at small sizes
- Headings: `text-neutral-900` (dark mode: `text-neutral-50`)
- Body: `text-neutral-700` (dark mode: `text-neutral-300`)
- Muted/secondary: `text-neutral-500`
- Letter-spacing on display sizes: `-0.02em`
- Letter-spacing on labels/caps: `0.04em` + `uppercase` + `text-xs`

---

## Spacing Scale

Use Tailwind's default 4px base. Stick to these tokens:

| Token | Value | Tailwind  | Usage                          |
|-------|-------|-----------|--------------------------------|
| xs    | 4px   | `p-1`     | Icon padding, tight gaps       |
| sm    | 8px   | `p-2`     | Inline element gaps            |
| md    | 12px  | `p-3`     | Card inner padding (compact)   |
| lg    | 16px  | `p-4`     | Standard component padding     |
| xl    | 24px  | `p-6`     | Card padding, section gaps     |
| 2xl   | 32px  | `p-8`     | Section vertical padding       |
| 3xl   | 48px  | `p-12`    | Page section spacing           |
| 4xl   | 64px  | `p-16`    | Hero vertical padding          |
| 5xl   | 96px  | `p-24`    | Large section breaks           |

---

## Border Radius

```
none:   0
sm:     4px   (rounded-sm)   — badges, tags, code blocks
md:     8px   (rounded-md)   — inputs, buttons, small cards
lg:     12px  (rounded-xl)   — cards, modals, panels
xl:     16px  (rounded-2xl)  — large feature cards
full:   9999px (rounded-full) — avatars, status dots, pills
```

Rule: Never mix radius levels within the same component. Cards use `rounded-xl` throughout.

---

## Shadow Levels

```css
/* shadow-sm — subtle card lift */
box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

/* shadow-md — hover state, dropdowns */
box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);

/* shadow-lg — modals, popovers */
box-shadow: 0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);

/* shadow-brand — focused inputs, primary button glow */
box-shadow: 0 0 0 3px rgba(79,110,247,0.2);
```

Tailwind custom config:
```js
// tailwind.config.js
boxShadow: {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  lg: '0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
  brand: '0 0 0 3px rgba(79,110,247,0.2)',
}
```

---

## Animation Standards

### Timing Tokens
```
instant:  0ms    — no animation (immediate feedback)
fast:     120ms  — micro-interactions (button press, checkbox)
normal:   200ms  — hover transitions, color changes
slow:     300ms  — panel slides, modal open
slower:   500ms  — page transitions, hero entrance
```

### Easing
```
ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1)   — elements entering
ease-in:     cubic-bezier(0.4, 0.0, 1, 1)     — elements leaving
ease-inout:  cubic-bezier(0.4, 0.0, 0.2, 1)   — repositioning
spring:      type: "spring", stiffness: 400, damping: 30  — playful reveals
```

### Framer Motion Variants (reusable)
```tsx
// Fade up — use for cards, sections entering viewport
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] } }
}

// Stagger children — use for lists, card grids
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}

// Scale in — use for modals, popovers
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1] } }
}

// Slide in from right — use for wizard steps
export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1] } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } }
}
```

### Rules
- Never animate `width` or `height` directly — use `scaleX`/`scaleY` or `max-height` with overflow hidden
- All hover transitions: `transition-all duration-200`
- Loading skeletons: `animate-pulse` with `bg-neutral-100`
- Respect `prefers-reduced-motion`: wrap all Framer Motion in `useReducedMotion()` check

---

## shadcn/ui Customization Rules

The goal: zero components should look like default shadcn. Every component gets a design token override.

### Button
```tsx
// Primary
<Button className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white 
  font-medium rounded-md px-4 py-2 text-sm shadow-sm 
  transition-all duration-200 hover:shadow-md focus-visible:shadow-brand" />

// Secondary
<Button variant="outline" className="border-neutral-200 text-neutral-700 
  hover:bg-neutral-50 hover:border-neutral-300 rounded-md font-medium text-sm" />

// Ghost
<Button variant="ghost" className="text-neutral-500 hover:text-neutral-900 
  hover:bg-neutral-100 rounded-md text-sm" />

// Destructive
<Button variant="destructive" className="bg-red-600 hover:bg-red-700 rounded-md text-sm" />
```

### Card
```tsx
<Card className="bg-white border border-neutral-200 rounded-xl shadow-sm 
  hover:shadow-md transition-shadow duration-200" />
```

### Input
```tsx
<Input className="border-neutral-200 rounded-md text-sm text-neutral-900 
  placeholder:text-neutral-400 focus:border-brand-500 focus:ring-0 
  focus:shadow-brand transition-all duration-200" />
```

### Badge
```tsx
// Status badges — always use semantic colors
<Badge className="rounded-sm text-xs font-medium px-2 py-0.5 
  bg-green-50 text-green-700 border border-green-200" />  // active
<Badge className="bg-amber-50 text-amber-700 border border-amber-200" />  // paused
<Badge className="bg-red-50 text-red-700 border border-red-200" />        // error
```

### Dialog / Modal
```tsx
<DialogContent className="rounded-xl border-neutral-200 shadow-lg p-6 
  max-w-lg w-full" />
```

### Tabs
```tsx
<TabsList className="bg-neutral-100 rounded-lg p-1" />
<TabsTrigger className="rounded-md text-sm font-medium text-neutral-500 
  data-[state=active]:bg-white data-[state=active]:text-neutral-900 
  data-[state=active]:shadow-sm transition-all duration-200" />
```

### Tooltip
```tsx
<TooltipContent className="bg-neutral-900 text-white text-xs rounded-md 
  px-2 py-1 shadow-lg" />
```

---

## Layout System

### Page Shell
```
max-w-screen-xl mx-auto px-6 (desktop)
px-4 (mobile)
```

### Sidebar (dashboard)
```
width: 240px (desktop), hidden on mobile with slide-in drawer
bg-neutral-50 border-r border-neutral-200
```

### Content Area
```
flex-1 min-w-0 p-8 (desktop), p-4 (mobile)
```

### Grid
- 12-column grid for landing page sections
- Dashboard: sidebar + main content (flex row)
- Cards: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

---

## Do Not Rules

- Do NOT use `rounded-full` on buttons — only on avatars and status dots
- Do NOT use pure black (`#000`) anywhere — use `neutral-900`
- Do NOT use default blue (`#3b82f6`) — use brand-500 (`#4f6ef7`)
- Do NOT use `font-bold` on body text — only headings
- Do NOT use more than 3 font sizes in a single card
- Do NOT animate on every scroll event — use `whileInView` with `once: true`
- Do NOT use `shadow-xl` or `shadow-2xl` — too heavy for this aesthetic
