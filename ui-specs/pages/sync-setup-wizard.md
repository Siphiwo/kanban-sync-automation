# Sync Setup Wizard — Component Spec

Route: `/dashboard/syncs/new`  
This is the core UX differentiator. It must feel like talking to a smart colleague, not filling out a form.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────┐
│  ← Back to dashboard          Step 2 of 4           │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [Step Indicator]                                  │
│                                                     │
│   [Step Content — changes per step]                 │
│                                                     │
│   [Navigation: Back | Continue →]                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Full-page layout, no sidebar. Max width `max-w-2xl mx-auto`. Centered vertically with `min-h-screen flex flex-col justify-center py-12 px-6`.

---

## Step Indicator

### Spec
```tsx
<div className="flex items-center gap-2 mb-10">
  {steps.map((step, i) => (
    <React.Fragment key={step.id}>
      <div className="flex items-center gap-2">
        
        {/* Step circle */}
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
          i < currentStep  && "bg-brand-500 text-white",           // completed
          i === currentStep && "bg-brand-500 text-white ring-4 ring-brand-100", // active
          i > currentStep  && "bg-neutral-100 text-neutral-400"    // upcoming
        )}>
          {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
        </div>
        
        {/* Step label — only on desktop */}
        <span className={cn(
          "text-sm hidden sm:block transition-colors duration-200",
          i === currentStep ? "font-medium text-neutral-900" : "text-neutral-400"
        )}>
          {step.label}
        </span>
      </div>
      
      {/* Connector */}
      {i < steps.length - 1 && (
        <div className={cn(
          "flex-1 h-px transition-colors duration-500",
          i < currentStep ? "bg-brand-500" : "bg-neutral-200"
        )} />
      )}
    </React.Fragment>
  ))}
</div>
```

### Steps
```
1. Choose platforms
2. Describe your sync
3. Review & confirm
4. Done
```

---

## Step 1 — Choose Platforms

### Purpose
Pick source and target platform. Simple, visual, no text input.

### Layout
```
[Heading]
[Source platform picker]  →  [Target platform picker]
[Swap button]
```

### Platform Picker
```tsx
<div>
  <label className="text-xs uppercase tracking-widest 
    text-neutral-400 mb-3 block">Sync from</label>
  
  <div className="grid grid-cols-5 gap-2">
    {platforms.map(p => (
      <button
        key={p.id}
        onClick={() => setSource(p.id)}
        className={cn(
          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
          source === p.id
            ? "border-brand-500 bg-brand-50 shadow-brand"
            : "border-neutral-200 hover:border-neutral-300 bg-white"
        )}
      >
        <img src={p.logo} className="w-8 h-8" />
        <span className="text-xs font-medium text-neutral-700">{p.name}</span>
      </button>
    ))}
  </div>
</div>
```

### Swap Button
```tsx
<button
  onClick={swapPlatforms}
  className="mx-auto flex items-center justify-center 
    w-9 h-9 rounded-full border border-neutral-200 
    bg-white hover:bg-neutral-50 hover:border-neutral-300 
    transition-all duration-200 my-4"
>
  <ArrowUpDown className="w-4 h-4 text-neutral-500" />
</button>
```

### Validation
- Source and target cannot be the same platform
- If same: show inline error `text-xs text-red-500 mt-2`
- "Continue" button disabled until both selected

### Disconnected Platform Handling
If a selected platform is not connected:
```tsx
<div className="mt-4 flex items-center gap-2 p-3 rounded-lg 
  bg-amber-50 border border-amber-200">
  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
  <p className="text-sm text-amber-700">
    You haven't connected Trello yet.{" "}
    <button className="underline font-medium">Connect now →</button>
  </p>
</div>
```

---

## Step 2 — Describe Your Sync (LLM Chat UI)

### Purpose
This is the magic step. The user types in plain language. The LLM responds conversationally and extracts the sync rule. It should feel like a smart assistant, not a chatbot.

### Layout
```
[Context bar: Asana → Trello]
[Chat messages area]
[Input bar]
```

### Context Bar
```tsx
<div className="flex items-center gap-2 px-4 py-2.5 
  rounded-xl bg-neutral-50 border border-neutral-200 mb-6">
  <img src={source.logo} className="w-5 h-5" />
  <span className="text-sm text-neutral-500">{source.name}</span>
  <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
  <img src={target.logo} className="w-5 h-5" />
  <span className="text-sm text-neutral-500">{target.name}</span>
  <span className="ml-auto text-xs text-neutral-400">
    Bi-directional sync
  </span>
</div>
```

### Chat Messages Area
```tsx
<div className="flex flex-col gap-4 min-h-[280px] max-h-[400px] 
  overflow-y-auto py-2 pr-1 scroll-smooth">
  {messages.map(msg => (
    <ChatMessage key={msg.id} message={msg} />
  ))}
  {isThinking && <ThinkingIndicator />}
</div>
```

### ChatMessage Component
```tsx
// Assistant message
<motion.div
  variants={fadeUp}
  initial="hidden"
  animate="visible"
  className={cn(
    "flex gap-3 max-w-[85%]",
    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
  )}
>
  {msg.role === 'assistant' && (
    <div className="w-7 h-7 rounded-full bg-brand-500 
      flex items-center justify-center flex-shrink-0 mt-0.5">
      <Sparkles className="w-3.5 h-3.5 text-white" />
    </div>
  )}
  
  <div className={cn(
    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
    msg.role === 'assistant'
      ? "bg-neutral-100 text-neutral-800 rounded-tl-sm"
      : "bg-brand-500 text-white rounded-tr-sm"
  )}>
    {msg.content}
  </div>
</motion.div>
```

### Thinking Indicator
```tsx
<div className="flex gap-3 max-w-[85%]">
  <div className="w-7 h-7 rounded-full bg-brand-500 
    flex items-center justify-center flex-shrink-0">
    <Sparkles className="w-3.5 h-3.5 text-white" />
  </div>
  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-neutral-100">
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-neutral-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  </div>
</div>
```

### Input Bar
```tsx
<div className="flex gap-2 mt-4 items-end">
  <Textarea
    placeholder="e.g. When a task is marked Done in Asana, close the card in Trello"
    className="flex-1 resize-none min-h-[44px] max-h-[120px] 
      rounded-xl border-neutral-200 text-sm 
      focus:border-brand-500 focus:shadow-brand 
      transition-all duration-200 py-3 px-4"
    onKeyDown={e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }}
  />
  <Button
    onClick={handleSend}
    disabled={!input.trim() || isThinking}
    className="w-10 h-10 rounded-xl bg-brand-500 text-white 
      flex-shrink-0 p-0 hover:bg-brand-600 
      disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <Send className="w-4 h-4" />
  </Button>
</div>
<p className="text-xs text-neutral-400 mt-2">
  Press Enter to send · Shift+Enter for new line
</p>
```

### Initial Assistant Message
```
"Hi! I'll help you set up a sync between Asana and Trello.

Describe what you want to happen — for example: 'When a task 
is marked Done in Asana, move the Trello card to the Done list.'

You can be as specific or general as you like."
```

### Follow-up Questions (LLM may ask)
```
"Which Asana project should I watch for changes?"
"Should this sync go both ways, or just Asana → Trello?"
"What should happen to the Trello card if the Asana task is deleted?"
```

### When LLM Has Enough Info
The LLM responds with a summary and a "Looks good?" prompt:
```
"Got it! Here's what I'll set up:

• Watch: Asana project 'Engineering'
• Trigger: Task status changes to 'Done'
• Action: Move Trello card to 'Done' list in 'Dev Board'
• Direction: One-way (Asana → Trello)

Does this look right? I can adjust anything before we continue."

[Looks good →]  [Let me change something]
```

The "Looks good →" button advances to Step 3.

---

## Step 3 — Review & Confirm

### Purpose
Show the generated sync rule in a structured, readable format. Let the user edit field mappings before saving.

### Rule Confirmation Card
```tsx
<div className="rounded-xl border border-neutral-200 
  bg-white shadow-sm overflow-hidden">
  
  {/* Header */}
  <div className="px-6 py-4 border-b border-neutral-100 
    flex items-center justify-between">
    <div className="flex items-center gap-2">
      <img src={source.logo} className="w-5 h-5" />
      <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
      <img src={target.logo} className="w-5 h-5" />
    </div>
    <Badge className="bg-brand-50 text-brand-600 border-brand-100">
      Ready to save
    </Badge>
  </div>
  
  {/* Rule details */}
  <div className="px-6 py-5 space-y-4">
    <RuleRow label="Watch" value={rule.source.project} />
    <RuleRow label="Trigger" value={rule.trigger} />
    <RuleRow label="Action" value={rule.action} />
    <RuleRow label="Direction" value={rule.direction} />
  </div>
</div>
```

### RuleRow
```tsx
<div className="flex items-start gap-4">
  <span className="text-xs uppercase tracking-widest 
    text-neutral-400 w-20 flex-shrink-0 pt-0.5">
    {label}
  </span>
  <span className="text-sm text-neutral-800 font-medium">
    {value}
  </span>
</div>
```

### Field Mapping UI

Shown below the rule card. Collapsible — collapsed by default with "Advanced: Field mappings" toggle.

```tsx
<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-2 
    text-sm text-neutral-500 hover:text-neutral-700 
    transition-colors mt-4 group">
    <ChevronRight className="w-4 h-4 transition-transform 
      group-data-[state=open]:rotate-90" />
    Advanced: Field mappings
  </CollapsibleTrigger>
  
  <CollapsibleContent>
    <div className="mt-4 rounded-xl border border-neutral-200 
      overflow-hidden">
      
      {/* Header row */}
      <div className="grid grid-cols-2 gap-px bg-neutral-200">
        <div className="bg-neutral-50 px-4 py-2.5 flex items-center gap-2">
          <img src={source.logo} className="w-4 h-4" />
          <span className="text-xs font-medium text-neutral-500">
            {source.name} field
          </span>
        </div>
        <div className="bg-neutral-50 px-4 py-2.5 flex items-center gap-2">
          <img src={target.logo} className="w-4 h-4" />
          <span className="text-xs font-medium text-neutral-500">
            {target.name} field
          </span>
        </div>
      </div>
      
      {/* Mapping rows */}
      {mappings.map((mapping, i) => (
        <div key={i} className="grid grid-cols-2 gap-px bg-neutral-200">
          <div className="bg-white px-4 py-3">
            <span className="text-sm text-neutral-700 font-mono">
              {mapping.sourceField}
            </span>
          </div>
          <div className="bg-white px-4 py-3">
            <Select value={mapping.targetField} onValueChange={...}>
              <SelectTrigger className="h-8 text-sm border-0 
                shadow-none focus:ring-0 p-0 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetFields.map(f => (
                  <SelectItem key={f} value={f} className="font-mono text-sm">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
    
    <p className="text-xs text-neutral-400 mt-2">
      Field mappings are pre-filled by AI. You can adjust them here.
    </p>
  </CollapsibleContent>
</Collapsible>
```

### Sync Name Input
```tsx
<div className="mt-6">
  <label className="text-xs uppercase tracking-widest 
    text-neutral-400 mb-2 block">
    Sync name (optional)
  </label>
  <Input
    placeholder="e.g. Engineering tasks — Asana to Trello"
    defaultValue={rule.suggestedName}
    className="..."
  />
</div>
```

### Save Button
```tsx
<Button
  onClick={handleSave}
  disabled={isSaving}
  className="w-full bg-brand-500 text-white font-medium 
    py-3 rounded-xl mt-6 hover:bg-brand-600 
    disabled:opacity-60 transition-all"
>
  {isSaving ? (
    <span className="flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      Saving sync...
    </span>
  ) : "Save sync →"}
</Button>
```

---

## Step 4 — Done

### Purpose
Celebrate the completion. Give clear next steps.

```tsx
<motion.div
  variants={scaleIn}
  initial="hidden"
  animate="visible"
  className="text-center py-8"
>
  {/* Success icon */}
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
    className="w-16 h-16 rounded-full bg-green-100 
      flex items-center justify-center mx-auto mb-6"
  >
    <Check className="w-8 h-8 text-green-600" />
  </motion.div>
  
  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
    Sync is live!
  </h2>
  <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
    Your sync between {source.name} and {target.name} is now active. 
    Changes will sync in real-time.
  </p>
  
  <div className="flex gap-3 justify-center">
    <Button variant="outline" onClick={createAnother}>
      Create another sync
    </Button>
    <Button className="bg-brand-500 text-white ..." onClick={goToDashboard}>
      Go to dashboard →
    </Button>
  </div>
</motion.div>
```

---

## Step Navigation Bar

```tsx
<div className="flex items-center justify-between mt-8 pt-6 
  border-t border-neutral-100">
  
  <Button
    variant="ghost"
    onClick={prevStep}
    disabled={currentStep === 0}
    className="text-neutral-500 disabled:opacity-0"
  >
    ← Back
  </Button>
  
  {/* Step counter */}
  <span className="text-xs text-neutral-400">
    Step {currentStep + 1} of {steps.length}
  </span>
  
  {currentStep < 2 && (
    <Button
      onClick={nextStep}
      disabled={!canAdvance}
      className="bg-brand-500 text-white ..."
    >
      Continue →
    </Button>
  )}
</div>
```

---

## Step Transition Animation

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    variants={slideInRight}
    initial="hidden"
    animate="visible"
    exit="exit"
  >
    {renderStep(currentStep)}
  </motion.div>
</AnimatePresence>
```

---

## What Makes This Feel Smart, Not Generic

1. The LLM chat uses a branded avatar (Sparkles icon in brand-500 circle) — not a generic bot icon
2. Typing indicator uses bouncing dots, not a spinner — feels conversational
3. User messages are right-aligned in brand color — mirrors iMessage/Slack pattern users know
4. The rule confirmation card uses a structured layout, not a JSON dump — shows the AI understood
5. Field mappings are hidden by default — power users can find them, others aren't overwhelmed
6. Step transitions slide horizontally — reinforces the "moving forward" mental model
7. The success screen uses a spring animation on the checkmark — satisfying, not clinical
8. "Looks good?" phrasing in the LLM response — conversational, not "Confirm and proceed"
