# Landing Page — Component Spec

Route: `/`  
Goal: Convert visitors to sign-ups. Communicate value in under 5 seconds. Feel like a tool built by people who use these platforms daily.

---

## Layout Overview

```
┌─────────────────────────────────┐
│           Navbar                │
├─────────────────────────────────┤
│           Hero                  │
├─────────────────────────────────┤
│       Platform Logos Bar        │
├─────────────────────────────────┤
│       How It Works (3 steps)    │
├─────────────────────────────────┤
│       Feature Highlights        │
├─────────────────────────────────┤
│           CTA Banner            │
├─────────────────────────────────┤
│           Footer                │
└─────────────────────────────────┘
```

---

## 1. Navbar

### Structure
```
[Logo + wordmark]          [Sign in]  [Get started →]
```

### Specs
- Height: `h-16`
- Background: `bg-white/80 backdrop-blur-md` — frosted glass, sticky
- Border: `border-b border-neutral-200/60`
- Logo: SVG mark (two overlapping arrows suggesting sync) + "Kanban Sync" in `font-semibold text-neutral-900`
- "Sign in": ghost button, `text-neutral-500 hover:text-neutral-900`
- "Get started": primary button, `bg-brand-500 text-white text-sm px-4 py-2 rounded-md`
- On scroll past 80px: add `shadow-sm` transition

### Mobile
- Hamburger menu replaces nav links
- Drawer slides in from right using Framer Motion `x: "100%" → x: 0`

---

## 2. Hero Section

### Copy Tone
Direct, confident, no fluff. Speaks to the pain (context-switching between tools) not the feature.

### Layout
```
[Badge: "Now in beta"]
[H1: headline]
[Subheadline]
[CTA buttons row]
[Social proof line]
[Hero visual / product screenshot]
```

### Copy
```
Badge:       "Now in beta — free during launch"
H1:          "Your tasks, in sync.\nEvery platform."
Subheadline: "Connect Asana, Trello, Jira, Monday, and Linear. 
              Describe what you want to sync — we handle the rest."
CTA Primary: "Start syncing free →"
CTA Ghost:   "See how it works"
Social proof: "No credit card required · Setup in under 2 minutes"
```

### Tailwind Classes
```tsx
// Section
<section className="pt-24 pb-16 px-6 text-center max-w-3xl mx-auto">

// Badge
<span className="inline-flex items-center gap-1.5 text-xs font-medium 
  text-brand-600 bg-brand-50 border border-brand-100 
  rounded-full px-3 py-1 mb-6">

// H1
<h1 className="text-5xl font-bold text-neutral-900 tracking-tight 
  leading-[1.1] mb-4 whitespace-pre-line">

// Subheadline
<p className="text-lg text-neutral-500 max-w-xl mx-auto mb-8 leading-relaxed">

// CTA row
<div className="flex items-center justify-center gap-3 mb-4">

// Social proof
<p className="text-sm text-neutral-400">
```

### Hero Visual
- A stylized product screenshot or abstract diagram showing two platform logos connected by an animated line
- Use a `rounded-xl border border-neutral-200 shadow-md` frame
- Subtle gradient overlay at bottom: `bg-gradient-to-t from-white to-transparent`
- If no screenshot yet: use a placeholder with platform logo grid connected by dashed lines (SVG)

### Animations
```tsx
// Stagger entrance — badge → h1 → sub → CTAs → visual
<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  <motion.span variants={fadeUp}>badge</motion.span>
  <motion.h1 variants={fadeUp}>headline</motion.h1>
  // etc.
</motion.div>

// Hero visual: slight float loop
<motion.div
  animate={{ y: [0, -6, 0] }}
  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
>
```

---

## 3. Platform Logos Bar

### Purpose
Instant recognition. Users see their tools and trust the product.

### Layout
```
"Works with the tools you already use"
[Asana] [Trello] [Monday] [Jira] [Linear]
```

### Specs
- Section: `py-12 border-y border-neutral-100 bg-neutral-50`
- Label: `text-xs uppercase tracking-widest text-neutral-400 text-center mb-6`
- Logos row: `flex items-center justify-center gap-10 flex-wrap`
- Each logo: `h-7 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300`
- Use official SVG logos. Never use colored logos at full opacity — the grayscale treatment looks intentional and premium.

### Animation
```tsx
// Logos fade in with stagger on scroll
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-50px" }}
>
  {platforms.map(p => (
    <motion.img key={p.name} variants={fadeUp} src={p.logo} />
  ))}
</motion.div>
```

---

## 4. How It Works

### Layout
3-column grid on desktop, stacked on mobile.

```
[Step 1]        [Step 2]        [Step 3]
Connect         Describe        Done
your tools      your sync
```

### Step Card Spec
```tsx
<div className="flex flex-col items-start p-6 rounded-xl 
  bg-white border border-neutral-200 shadow-sm">
  
  {/* Step number */}
  <span className="text-xs font-semibold text-brand-500 
    bg-brand-50 rounded-full w-6 h-6 flex items-center 
    justify-center mb-4">1</span>
  
  {/* Icon — 24px, neutral-700 */}
  <Icon className="w-6 h-6 text-neutral-700 mb-3" />
  
  {/* Title */}
  <h3 className="text-base font-semibold text-neutral-900 mb-2">
    Connect your tools
  </h3>
  
  {/* Description */}
  <p className="text-sm text-neutral-500 leading-relaxed">
    OAuth into any combination of Asana, Trello, Jira, 
    Monday, or Linear in seconds.
  </p>
</div>
```

### Step Content
```
Step 1 — Connect your tools
Icon: plug/link icon
"OAuth into any combination of Asana, Trello, Jira, Monday, 
or Linear in seconds."

Step 2 — Describe what you want
Icon: chat bubble / sparkle
"Tell us in plain language: 'When a task is marked Done in 
Asana, close the card in Trello.' We handle the rest."

Step 3 — Stay in sync, automatically
Icon: refresh/arrows
"Bi-directional, real-time sync powered by webhooks. 
No polling. No delays."
```

### Section Header
```tsx
<div className="text-center mb-12">
  <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
    How it works
  </p>
  <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">
    Set up in three steps
  </h2>
</div>
```

### Animation
Cards stagger in with `fadeUp` on scroll. Connector line between cards (desktop only): thin dashed `border-t border-dashed border-neutral-200` positioned absolutely between cards.

---

## 5. Feature Highlights

### Layout
Alternating left/right rows (2 total). Each row: text left + visual right, then flipped.

### Features to Highlight
```
Feature 1: "Describe it in plain English"
  Body: "No dropdowns, no complex rule builders. Just tell the 
  LLM what you want and it configures the sync for you."
  Visual: Chat UI mockup showing the conversation

Feature 2: "Bi-directional, real-time"
  Body: "Changes flow both ways, instantly. Powered by webhooks 
  — not polling. Your team never sees stale data."
  Visual: Animated diagram of two platforms with arrows
```

### Row Spec
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 
  items-center py-16">
  <div>
    <p className="text-xs uppercase tracking-widest 
      text-brand-500 mb-3">Plain language setup</p>
    <h2 className="text-3xl font-bold text-neutral-900 
      tracking-tight mb-4">Describe it in plain English</h2>
    <p className="text-base text-neutral-500 leading-relaxed">...</p>
  </div>
  <div className="rounded-xl border border-neutral-200 
    shadow-md overflow-hidden bg-neutral-50">
    {/* Visual / mockup */}
  </div>
</div>
```

---

## 6. CTA Banner

### Layout
Full-width section, centered content.

```tsx
<section className="py-20 bg-brand-500 text-white text-center">
  <h2 className="text-3xl font-bold mb-3 tracking-tight">
    Ready to stop copy-pasting tasks?
  </h2>
  <p className="text-brand-100 mb-8 text-base">
    Free during beta. No credit card required.
  </p>
  <Button className="bg-white text-brand-600 hover:bg-brand-50 
    font-semibold px-6 py-3 rounded-md shadow-md text-sm">
    Get started free →
  </Button>
</section>
```

---

## 7. Footer

### Layout
```
[Logo + tagline]    [Product links]    [Legal links]
                    Dashboard          Privacy
                    Pricing            Terms
                    Docs
```

### Specs
- `bg-neutral-50 border-t border-neutral-200 py-12 px-6`
- Links: `text-sm text-neutral-500 hover:text-neutral-900 transition-colors`
- Copyright: `text-xs text-neutral-400 mt-8`

---

## What Makes This Feel Premium (Not Generic)

1. The grayscale logo treatment — intentional, not lazy
2. Frosted glass navbar — modern, not flat
3. Copy that names the pain ("stop copy-pasting tasks") not the feature
4. Step numbers as small brand-colored circles — detail that signals craft
5. Staggered entrance animations — nothing pops in all at once
6. The hero visual floats — subtle life without being distracting
7. Dashed connector lines between steps — shows spatial thinking
8. `tracking-tight` on all headings — tighter letter-spacing reads as premium
9. No stock photos — only product UI and abstract diagrams
10. Social proof line under CTA is tiny and muted — confident, not desperate
