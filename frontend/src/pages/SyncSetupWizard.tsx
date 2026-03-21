import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  ArrowUpDown, ArrowRight, Send, Sparkles, Check,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { useAuth } from '@/hooks/useAuth'
import { useCreateSyncRule } from '@/hooks/useSyncRules'
import { slideInRight, scaleIn, fadeUp } from '@/lib/animations'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const PLATFORMS = [
  { id: 'asana', name: 'Asana' },
  { id: 'trello', name: 'Trello' },
  { id: 'monday', name: 'Monday' },
  { id: 'jira', name: 'Jira' },
  { id: 'linear', name: 'Linear' },
]

const STEPS = [
  { id: 'platforms', label: 'Choose platforms' },
  { id: 'describe', label: 'Describe your sync' },
  { id: 'review', label: 'Review & confirm' },
  { id: 'done', label: 'Done' },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ParsedRule {
  source: { platform: string; project: string; projectId: string }
  target: { platform: string; project: string; projectId: string }
  trigger: string
  action: string
  direction: string
  suggestedName: string
  fieldMappings: { sourceField: string; targetField: string }[]
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
              i < current && 'bg-brand-500 text-white',
              i === current && 'bg-brand-500 text-white ring-4 ring-brand-100',
              i > current && 'bg-neutral-100 text-neutral-400',
            )}>
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={cn(
              'text-sm hidden sm:block transition-colors duration-200',
              i === current ? 'font-medium text-neutral-900' : 'text-neutral-400'
            )}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'flex-1 h-px transition-colors duration-500 ml-2',
              i < current ? 'bg-brand-500' : 'bg-neutral-200'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

function Step1({ source, target, setSource, setTarget }: {
  source: string; target: string
  setSource: (v: string) => void; setTarget: (v: string) => void
}) {
  const swap = () => { const tmp = source; setSource(target); setTarget(tmp) }
  const sameError = source && target && source === target

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">Choose your platforms</h2>
        <p className="text-sm text-neutral-500">Select the source and target platforms for your sync.</p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-neutral-400 mb-3 block">Sync from</label>
        <div className="grid grid-cols-5 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSource(p.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                source === p.id
                  ? 'border-brand-500 bg-brand-50 shadow-brand'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              )}
              aria-pressed={source === p.id}
            >
              <PlatformIcon platform={p.id} className="w-8 h-8" />
              <span className="text-xs font-medium text-neutral-700">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={swap}
        className="mx-auto flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
        aria-label="Swap platforms"
      >
        <ArrowUpDown className="w-4 h-4 text-neutral-500" />
      </button>

      <div>
        <label className="text-xs uppercase tracking-widest text-neutral-400 mb-3 block">Sync to</label>
        <div className="grid grid-cols-5 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setTarget(p.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                target === p.id
                  ? 'border-brand-500 bg-brand-50 shadow-brand'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              )}
              aria-pressed={target === p.id}
            >
              <PlatformIcon platform={p.id} className="w-8 h-8" />
              <span className="text-xs font-medium text-neutral-700">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {sameError && (
        <p className="text-xs text-red-500 mt-2" role="alert">Source and target platforms must be different.</p>
      )}
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-neutral-100">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
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
  )
}

function Step2({ source, target, onRuleParsed }: {
  source: string; target: string; onRuleParsed: (rule: ParsedRule) => void
}) {
  const sourceName = PLATFORMS.find((p) => p.id === source)?.name ?? source
  const targetName = PLATFORMS.find((p) => p.id === target)?.name ?? target

  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: `Hi! I'll help you set up a sync between ${sourceName} and ${targetName}.\n\nDescribe what you want to happen — for example: "When a task is marked Done in ${sourceName}, move the card to Done in ${targetName}."\n\nYou can be as specific or general as you like.`,
  }])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [parsedRule, setParsedRule] = useState<ParsedRule | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSend = async () => {
    if (!input.trim() || isThinking) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    try {
      const { data } = await api.post('/llm/conversation', {
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        source_platform: source,
        target_platform: target,
      })

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      }
      setMessages((prev) => [...prev, assistantMsg])

      if (data.parsed_rule) {
        setParsedRule(data.parsed_rule)
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
      }])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">Describe your sync</h2>
        <p className="text-sm text-neutral-500">Tell me what you want to happen in plain language.</p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
        <PlatformIcon platform={source} className="w-5 h-5" />
        <span className="text-sm text-neutral-500">{sourceName}</span>
        <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
        <PlatformIcon platform={target} className="w-5 h-5" />
        <span className="text-sm text-neutral-500">{targetName}</span>
        <span className="ml-auto text-xs text-neutral-400">Bi-directional sync</span>
      </div>

      <div className="flex flex-col gap-4 min-h-[280px] max-h-[360px] overflow-y-auto py-2 pr-1">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className={cn('flex gap-3', msg.role === 'user' ? 'ml-auto flex-row-reverse max-w-[85%]' : 'max-w-[85%]')}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
              msg.role === 'assistant'
                ? 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
                : 'bg-brand-500 text-white rounded-tr-sm'
            )}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isThinking && <ThinkingIndicator />}
        <div ref={bottomRef} />
      </div>

      {parsedRule && (
        <div className="flex gap-2 mt-2">
          <Button onClick={() => onRuleParsed(parsedRule)} size="sm">Looks good →</Button>
          <Button variant="secondary" size="sm" onClick={() => setParsedRule(null)}>Let me change something</Button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`e.g. When a task is marked Done in ${sourceName}, close the card in ${targetName}`}
          className="flex-1 resize-none min-h-[44px] max-h-[120px] rounded-xl border border-neutral-200 text-sm focus:border-brand-500 focus:shadow-brand transition-all duration-200 py-3 px-4 outline-none font-sans"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          aria-label="Describe your sync"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className="w-10 h-10 rounded-xl bg-brand-500 text-white flex-shrink-0 flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-neutral-400">Press Enter to send · Shift+Enter for new line</p>
    </div>
  )
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-xs uppercase tracking-widest text-neutral-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-neutral-800 font-medium">{value}</span>
    </div>
  )
}

function Step3({ rule, source, target, onSave, isSaving }: {
  rule: ParsedRule; source: string; target: string
  onSave: (name: string, mappings: ParsedRule['fieldMappings']) => void
  isSaving: boolean
}) {
  const [name, setName] = useState(rule.suggestedName)
  const [mappings, setMappings] = useState(rule.fieldMappings)
  const [fieldMappingsOpen, setFieldMappingsOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">Review & confirm</h2>
        <p className="text-sm text-neutral-500">Check the sync rule before saving.</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={source} className="w-5 h-5" />
            <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
            <PlatformIcon platform={target} className="w-5 h-5" />
          </div>
          <Badge variant="brand">Ready to save</Badge>
        </div>
        <div className="px-6 py-5 space-y-4">
          <RuleRow label="Watch" value={rule.source.project} />
          <RuleRow label="Trigger" value={rule.trigger} />
          <RuleRow label="Action" value={rule.action} />
          <RuleRow label="Direction" value={rule.direction} />
        </div>
      </div>

      {mappings.length > 0 && (
        <div>
          <button
            onClick={() => setFieldMappingsOpen((v) => !v)}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors group"
            aria-expanded={fieldMappingsOpen}
          >
            <ChevronRight className={cn('w-4 h-4 transition-transform', fieldMappingsOpen && 'rotate-90')} />
            Advanced: Field mappings
          </button>

          {fieldMappingsOpen && (
            <div className="mt-4 rounded-xl border border-neutral-200 overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-neutral-200">
                <div className="bg-neutral-50 px-4 py-2.5 flex items-center gap-2">
                  <PlatformIcon platform={source} className="w-4 h-4" />
                  <span className="text-xs font-medium text-neutral-500 capitalize">{source} field</span>
                </div>
                <div className="bg-neutral-50 px-4 py-2.5 flex items-center gap-2">
                  <PlatformIcon platform={target} className="w-4 h-4" />
                  <span className="text-xs font-medium text-neutral-500 capitalize">{target} field</span>
                </div>
              </div>
              {mappings.map((m, i) => (
                <div key={i} className="grid grid-cols-2 gap-px bg-neutral-200">
                  <div className="bg-white px-4 py-3">
                    <span className="text-sm text-neutral-700 font-mono">{m.sourceField}</span>
                  </div>
                  <div className="bg-white px-4 py-3">
                    <input
                      value={m.targetField}
                      onChange={(e) => setMappings((prev) => prev.map((mp, j) => j === i ? { ...mp, targetField: e.target.value } : mp))}
                      className="text-sm font-mono border-0 outline-none w-full bg-transparent text-neutral-700"
                      aria-label={`Target field for ${m.sourceField}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {fieldMappingsOpen && (
            <p className="text-xs text-neutral-400 mt-2">Field mappings are pre-filled by AI. You can adjust them here.</p>
          )}
        </div>
      )}

      <div>
        <label className="text-xs uppercase tracking-widest text-neutral-400 mb-2 block" htmlFor="sync-name">
          Sync name (optional)
        </label>
        <input
          id="sync-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Engineering tasks — Asana to Trello"
          className="w-full border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:shadow-brand transition-all duration-200 px-4 py-2.5 outline-none"
        />
      </div>

      <Button
        onClick={() => onSave(name, mappings)}
        loading={isSaving}
        disabled={isSaving}
        className="w-full py-3 rounded-xl"
        size="lg"
      >
        {isSaving ? 'Saving sync…' : 'Save sync →'}
      </Button>
    </div>
  )
}

function Step4({ source, target, onCreateAnother }: { source: string; target: string; onCreateAnother: () => void }) {
  const navigate = useNavigate()
  const sourceName = PLATFORMS.find((p) => p.id === source)?.name ?? source
  const targetName = PLATFORMS.find((p) => p.id === target)?.name ?? target

  return (
    <motion.div variants={scaleIn} initial="hidden" animate="visible" className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-8 h-8 text-green-600" />
      </motion.div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Sync is live!</h2>
      <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
        Your sync between {sourceName} and {targetName} is now active. Changes will sync in real-time.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Button variant="secondary" onClick={onCreateAnother}>Create another sync</Button>
        <Button onClick={() => navigate('/dashboard')}>Go to dashboard →</Button>
      </div>
    </motion.div>
  )
}

export default function SyncSetupWizard() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const shouldReduce = useReducedMotion()
  const { mutateAsync: createSync } = useCreateSyncRule()

  const [step, setStep] = useState(0)
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [parsedRule, setParsedRule] = useState<ParsedRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const canAdvance =
    step === 0 ? !!(source && target && source !== target) :
    step === 1 ? !!parsedRule :
    true

  const handleRuleParsed = (rule: ParsedRule) => {
    setParsedRule(rule)
    setStep(2)
  }

  const handleSave = async (name: string, mappings: ParsedRule['fieldMappings']) => {
    if (!parsedRule) return
    setIsSaving(true)
    try {
      await createSync({
        name: name || parsedRule.suggestedName,
        source: parsedRule.source,
        target: parsedRule.target,
        trigger: parsedRule.trigger,
        action: parsedRule.action,
        direction: parsedRule.direction,
        status: 'active',
        fieldMappings: mappings,
      })
      setStep(3)
    } catch {
      // error handled by mutation
    } finally {
      setIsSaving(false)
    }
  }

  const reset = () => {
    setStep(0); setSource(''); setTarget(''); setParsedRule(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
          >
            ← Back to dashboard
          </button>
          <span className="text-xs text-neutral-400">Step {step + 1} of {STEPS.length}</span>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={shouldReduce ? {} : slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {step === 0 && (
              <Step1 source={source} target={target} setSource={setSource} setTarget={setTarget} />
            )}
            {step === 1 && (
              <Step2 source={source} target={target} onRuleParsed={handleRuleParsed} />
            )}
            {step === 2 && parsedRule && (
              <Step3 rule={parsedRule} source={source} target={target} onSave={handleSave} isSaving={isSaving} />
            )}
            {step === 3 && (
              <Step4 source={source} target={target} onCreateAnother={reset} />
            )}
          </motion.div>
        </AnimatePresence>

        {step < 3 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={cn('text-neutral-500', step === 0 && 'opacity-0 pointer-events-none')}
            >
              ← Back
            </Button>
            <span className="text-xs text-neutral-400">Step {step + 1} of {STEPS.length}</span>
            {step < 2 && (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Continue →
              </Button>
            )}
            {step === 2 && <div />}
          </div>
        )}
      </div>
    </div>
  )
}
