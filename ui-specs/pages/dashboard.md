# Dashboard — Component Spec

Route: `/dashboard`  
Auth: Required. Redirect to `/` if no session.  
Goal: Give users a clear picture of what's syncing, what's broken, and what needs attention — at a glance.

---

## Layout Overview

```
┌──────────┬──────────────────────────────────────────┐
│          │  Top bar: page title + quick actions      │
│ Sidebar  ├──────────────────────────────────────────┤
│          │  Platform Connection Cards (row)          │
│          ├──────────────────────────────────────────┤
│          │  Active Syncs List    │  Activity Feed    │
│          │  (flex-1)             │  (w-80)           │
└──────────┴──────────────────────────────────────────┘
```

---

## Sidebar

### Specs
```tsx
<aside className="w-60 h-screen sticky top-0 flex flex-col 
  bg-neutral-50 border-r border-neutral-200 py-4 px-3">
```

### Nav Items
```
[Logo]
─────────────
Dashboard        (active: bg-neutral-100 text-neutral-900)
My Syncs
Activity Log
Settings
─────────────
[User avatar + name]
[Sign out]
```

### Nav Item Style
```tsx
<NavItem className="flex items-center gap-2.5 px-3 py-2 rounded-md 
  text-sm font-medium text-neutral-500 
  hover:bg-neutral-100 hover:text-neutral-900 
  transition-colors duration-150
  data-[active=true]:bg-neutral-100 data-[active=true]:text-neutral-900" />
```

### Mobile
- Hidden. Replaced by a top bar with hamburger → `Sheet` (shadcn) slides in from left.

---

## Top Bar

```tsx
<header className="flex items-center justify-between 
  px-8 py-5 border-b border-neutral-200">
  
  <div>
    <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
    <p className="text-sm text-neutral-400 mt-0.5">
      {activeCount} active syncs
    </p>
  </div>
  
  <Button className="bg-brand-500 text-white text-sm ...">
    + New sync
  </Button>
</header>
```

---

## Platform Connection Cards

### Purpose
Show which platforms are connected. Entry point to connect/disconnect.

### Layout
```
Horizontal scroll row on mobile, flex-wrap on desktop.
5 cards — one per platform.
```

### Card Spec
```tsx
<div className="flex items-center gap-3 p-4 rounded-xl 
  bg-white border border-neutral-200 shadow-sm 
  min-w-[180px] flex-1">
  
  {/* Platform logo — 28px */}
  <img src={platform.logo} className="w-7 h-7 rounded-md" />
  
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-neutral-900 truncate">
      {platform.name}
    </p>
    <p className="text-xs text-neutral-400 truncate">
      {platform.workspace || "Not connected"}
    </p>
  </div>
  
  {/* Status dot */}
  <span className={cn(
    "w-2 h-2 rounded-full flex-shrink-0",
    connected ? "bg-green-500" : "bg-neutral-300"
  )} />
</div>
```

### States
| State | Dot color | Border | Action on click |
|-------|-----------|--------|-----------------|
| Connected | `bg-green-500` | default | Opens disconnect dialog |
| Disconnected | `bg-neutral-300` | `border-dashed` | Triggers OAuth flow |
| Error (token expired) | `bg-red-500` | `border-red-200` | Re-auth prompt |
| Loading | skeleton pulse | — | — |

### Error State Card
```tsx
// Add a subtle red tint + warning icon
<div className="border-red-200 bg-red-50/30">
  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
  <p className="text-xs text-red-600">Reconnect required</p>
</div>
```

---

## Active Syncs List

### Layout
```tsx
<section className="flex-1 min-w-0">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-base font-semibold text-neutral-900">
      Active Syncs
    </h2>
    <Button variant="ghost" size="sm">View all</Button>
  </div>
  
  <div className="space-y-2">
    {syncs.map(sync => <SyncRow key={sync.id} sync={sync} />)}
  </div>
</section>
```

### SyncRow Component
```tsx
<div className="flex items-center gap-4 p-4 rounded-xl 
  bg-white border border-neutral-200 shadow-sm 
  hover:shadow-md hover:border-neutral-300 
  transition-all duration-200 cursor-pointer group">
  
  {/* Platform pair */}
  <div className="flex items-center gap-1.5 flex-shrink-0">
    <img src={sync.source.logo} className="w-5 h-5" />
    <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-300" />
    <img src={sync.target.logo} className="w-5 h-5" />
  </div>
  
  {/* Sync name + description */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-neutral-900 truncate">
      {sync.name}
    </p>
    <p className="text-xs text-neutral-400 truncate">
      {sync.source.project} → {sync.target.project}
    </p>
  </div>
  
  {/* Last synced */}
  <p className="text-xs text-neutral-400 flex-shrink-0 hidden sm:block">
    {timeAgo(sync.lastSyncedAt)}
  </p>
  
  {/* Status badge */}
  <StatusBadge status={sync.status} />
  
  {/* Actions — visible on hover */}
  <div className="opacity-0 group-hover:opacity-100 transition-opacity 
    flex items-center gap-1">
    <IconButton icon={Pause} tooltip="Pause sync" />
    <IconButton icon={Settings} tooltip="Edit sync" />
  </div>
</div>
```

### Status Badge Values
```
active  → green-50 bg, green-700 text, "Active"
paused  → amber-50 bg, amber-700 text, "Paused"
error   → red-50 bg, red-700 text, "Error"
syncing → brand-50 bg, brand-700 text, "Syncing..." + spinner
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center 
  py-16 text-center rounded-xl border border-dashed 
  border-neutral-200 bg-neutral-50">
  
  <div className="w-10 h-10 rounded-full bg-neutral-100 
    flex items-center justify-center mb-4">
    <ArrowLeftRight className="w-5 h-5 text-neutral-400" />
  </div>
  
  <p className="text-sm font-medium text-neutral-700 mb-1">
    No syncs yet
  </p>
  <p className="text-xs text-neutral-400 mb-4 max-w-xs">
    Connect two platforms and describe what you want to sync.
  </p>
  
  <Button size="sm" className="bg-brand-500 text-white ...">
    Create your first sync
  </Button>
</div>
```

### Loading State
```tsx
// 3 skeleton rows
{[1,2,3].map(i => (
  <div key={i} className="flex items-center gap-4 p-4 
    rounded-xl border border-neutral-200 animate-pulse">
    <div className="w-12 h-5 bg-neutral-100 rounded" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-neutral-100 rounded w-1/3" />
      <div className="h-3 bg-neutral-100 rounded w-1/2" />
    </div>
    <div className="w-14 h-5 bg-neutral-100 rounded-full" />
  </div>
))}
```

### Error State
```tsx
<div className="flex flex-col items-center py-12 text-center">
  <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
  <p className="text-sm text-neutral-700 mb-1">
    Failed to load syncs
  </p>
  <p className="text-xs text-neutral-400 mb-4">
    {error.message}
  </p>
  <Button variant="outline" size="sm" onClick={retry}>
    Try again
  </Button>
</div>
```

---

## Activity Feed

### Layout
```tsx
<aside className="w-80 flex-shrink-0 border-l border-neutral-200 
  pl-6 hidden lg:block">
  
  <h2 className="text-base font-semibold text-neutral-900 mb-4">
    Recent Activity
  </h2>
  
  <div className="space-y-1">
    {events.map(e => <ActivityItem key={e.id} event={e} />)}
  </div>
</aside>
```

### ActivityItem
```tsx
<div className="flex gap-3 py-2.5">
  
  {/* Timeline dot */}
  <div className="flex flex-col items-center pt-1">
    <span className={cn(
      "w-1.5 h-1.5 rounded-full flex-shrink-0",
      event.type === 'success' ? "bg-green-500" :
      event.type === 'error'   ? "bg-red-500" : "bg-neutral-300"
    )} />
    {/* Connector line */}
    <div className="w-px flex-1 bg-neutral-100 mt-1" />
  </div>
  
  <div className="pb-2 min-w-0">
    <p className="text-xs text-neutral-700 leading-relaxed">
      {event.description}
    </p>
    <p className="text-xs text-neutral-400 mt-0.5">
      {timeAgo(event.createdAt)}
    </p>
  </div>
</div>
```

### Activity Event Copy Examples
```
✓ Task "Fix login bug" synced from Asana → Trello  (2m ago)
✓ Status update synced: "In Progress" → "Doing"    (5m ago)
⚠ Sync paused: Trello token expired                (1h ago)
✓ New sync rule created: Jira → Linear             (3h ago)
```

### Empty State
```tsx
<p className="text-xs text-neutral-400 py-8 text-center">
  No activity yet. Activity will appear here once your syncs start running.
</p>
```

### Loading State
```tsx
// 5 skeleton items
{[1,2,3,4,5].map(i => (
  <div key={i} className="flex gap-3 py-2.5 animate-pulse">
    <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 mt-1.5" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-neutral-100 rounded w-full" />
      <div className="h-3 bg-neutral-100 rounded w-2/3" />
      <div className="h-2.5 bg-neutral-100 rounded w-1/4 mt-1" />
    </div>
  </div>
))}
```

---

## Quick Actions (Top of main content, below connection cards)

```tsx
// Only show if user has 0 syncs OR has disconnected platforms
<div className="flex gap-3 flex-wrap mb-6">
  
  {disconnectedPlatforms.length > 0 && (
    <QuickActionCard
      icon={<Plug />}
      label="Connect a platform"
      description={`${disconnectedPlatforms.length} platforms not connected`}
      onClick={openConnectionModal}
      variant="warning"
    />
  )}
  
  {syncs.length === 0 && (
    <QuickActionCard
      icon={<Plus />}
      label="Create your first sync"
      description="Takes about 2 minutes"
      onClick={openWizard}
      variant="brand"
    />
  )}
</div>
```

### QuickActionCard
```tsx
<button className="flex items-center gap-3 px-4 py-3 rounded-xl 
  border border-dashed border-brand-200 bg-brand-50/50 
  text-left hover:bg-brand-50 hover:border-brand-300 
  transition-all duration-200 group">
  
  <div className="w-8 h-8 rounded-lg bg-brand-100 
    flex items-center justify-center flex-shrink-0 
    group-hover:bg-brand-200 transition-colors">
    {icon}
  </div>
  
  <div>
    <p className="text-sm font-medium text-neutral-900">{label}</p>
    <p className="text-xs text-neutral-500">{description}</p>
  </div>
  
  <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto 
    group-hover:translate-x-0.5 transition-transform" />
</button>
```

---

## Animation Notes

- SyncRow list: `staggerContainer` + `fadeUp` on initial load
- New activity items: slide in from top with `y: -8 → 0, opacity: 0 → 1`
- Status badge changes: crossfade via `AnimatePresence`
- Connection card status dot: pulse animation when `status === 'syncing'`
- Page entrance: top bar fades in, then cards, then list — 3-step stagger
