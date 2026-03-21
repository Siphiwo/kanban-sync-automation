import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, RefreshCw, Link2, Sparkles, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'asana', name: 'Asana' },
  { id: 'trello', name: 'Trello' },
  { id: 'monday', name: 'Monday' },
  { id: 'jira', name: 'Jira' },
  { id: 'linear', name: 'Linear' },
]

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 bg-white/80 backdrop-blur-md border-b border-neutral-200/60 transition-shadow duration-200',
        scrolled && 'shadow-sm'
      )}
    >
      <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M8 14C8 10.686 10.686 8 14 8" stroke="#4f6ef7" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M20 14C20 17.314 17.314 20 14 20" stroke="#4f6ef7" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14 8L17 5M14 8L11 5" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 20L11 23M14 20L17 23" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-semibold text-neutral-900 text-sm">Kanban Sync</span>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-neutral-500">Sign in</Button>
          <a href="#get-started" className="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md text-xs px-3 py-1.5">
            Get started →
          </a>
        </nav>

        <button
          className="md:hidden p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
          className="fixed inset-0 bg-white z-50 flex flex-col p-6"
        >
          <div className="flex justify-end mb-8">
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <Button variant="ghost" onClick={() => setMobileOpen(false)}>Sign in</Button>
            <Button onClick={() => setMobileOpen(false)}>Get started →</Button>
          </div>
        </motion.div>
      )}
    </header>
  )
}

function HeroVisual() {
  return (
    <div className="relative rounded-xl border border-neutral-200 shadow-md bg-neutral-50 overflow-hidden p-8">
      <div className="flex items-center justify-center gap-8">
        {['asana', 'trello', 'jira'].map((p, i) => (
          <div key={p} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
              <PlatformIcon platform={p} className="w-6 h-6" />
            </div>
            <span className="text-xs text-neutral-500 capitalize">{p}</span>
            {i < 2 && (
              <svg className="absolute" style={{ display: 'none' }} />
            )}
          </div>
        ))}
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <line x1="30%" y1="50%" x2="50%" y2="50%" stroke="#e4e7ef" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="50%" y1="50%" x2="70%" y2="50%" stroke="#e4e7ef" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="50%" cy="50%" r="4" fill="#4f6ef7" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  )
}

export default function LandingPage() {
  const shouldReduce = useReducedMotion()
  const motionProps = shouldReduce ? {} : { variants: staggerContainer, initial: 'hidden', animate: 'visible' }
  const itemProps = shouldReduce ? {} : { variants: fadeUp }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center max-w-3xl mx-auto">
        <motion.div {...motionProps}>
          <motion.span
            {...itemProps}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-3 py-1 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Now in beta — free during launch
          </motion.span>

          <motion.h1
            {...itemProps}
            className="text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4"
          >
            Your tasks, in sync.{'\n'}Every platform.
          </motion.h1>

          <motion.p
            {...itemProps}
            className="text-lg text-neutral-500 max-w-xl mx-auto mb-8 leading-relaxed"
          >
            Connect Asana, Trello, Jira, Monday, and Linear. Describe what you want to sync — we handle the rest.
          </motion.p>

          <motion.div {...itemProps} className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            <a
              href={`${API_URL}/auth/asana/connect`}
              id="get-started"
              className="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm hover:shadow-md text-sm px-6 py-3"
            >
              Start syncing free →
            </a>
            <Button variant="ghost" size="lg">See how it works</Button>
          </motion.div>

          <motion.p {...itemProps} className="text-sm text-neutral-400">
            No credit card required · Setup in under 2 minutes
          </motion.p>

          <motion.div
            {...itemProps}
            animate={shouldReduce ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-12"
          >
            <HeroVisual />
          </motion.div>
        </motion.div>
      </section>

      {/* Platform logos bar */}
      <section className="py-12 border-y border-neutral-100 bg-white">
        <div className="max-w-screen-xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-neutral-400 text-center mb-6">
            Works with the tools you already use
          </p>
          <motion.div
            variants={shouldReduce ? {} : staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="flex items-center justify-center gap-10 flex-wrap"
          >
            {PLATFORMS.map((p) => (
              <motion.div
                key={p.id}
                variants={shouldReduce ? {} : fadeUp}
                className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
              >
                <PlatformIcon platform={p.id} className="w-7 h-7" />
                <span className="text-sm font-medium text-neutral-700">{p.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">How it works</p>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Set up in three steps</h2>
        </div>

        <motion.div
          variants={shouldReduce ? {} : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative"
        >
          {[
            {
              n: 1,
              icon: Link2,
              title: 'Connect your tools',
              desc: 'OAuth into any combination of Asana, Trello, Jira, Monday, or Linear in seconds.',
            },
            {
              n: 2,
              icon: Sparkles,
              title: 'Describe what you want',
              desc: "Tell us in plain language: 'When a task is marked Done in Asana, close the card in Trello.' We handle the rest.",
            },
            {
              n: 3,
              icon: RefreshCw,
              title: 'Stay in sync, automatically',
              desc: 'Bi-directional, real-time sync powered by webhooks. No polling. No delays.',
            },
          ].map((step) => (
            <motion.div
              key={step.n}
              variants={shouldReduce ? {} : fadeUp}
              className="flex flex-col items-start p-6 rounded-xl bg-white border border-neutral-200 shadow-sm"
            >
              <span className="text-xs font-semibold text-brand-500 bg-brand-50 rounded-full w-6 h-6 flex items-center justify-center mb-4">
                {step.n}
              </span>
              <step.icon className="w-6 h-6 text-neutral-700 mb-3" />
              <h3 className="text-base font-semibold text-neutral-900 mb-2">{step.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature highlights */}
      <section className="py-4 px-6 max-w-screen-xl mx-auto space-y-0">
        {[
          {
            label: 'Plain language setup',
            title: 'Describe it in plain English',
            body: "No dropdowns, no complex rule builders. Just tell the LLM what you want and it configures the sync for you.",
            visual: (
              <div className="rounded-xl border border-neutral-200 shadow-md overflow-hidden bg-white p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-neutral-800 max-w-[80%]">
                    Hi! Describe what you want to sync between your platforms.
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-brand-500 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white max-w-[80%]">
                    When a task is Done in Asana, close the card in Trello.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-neutral-800 max-w-[80%]">
                    Got it! I'll watch Asana for status changes and move Trello cards automatically.
                  </div>
                </div>
              </div>
            ),
            flip: false,
          },
          {
            label: 'Real-time sync',
            title: 'Bi-directional, real-time',
            body: 'Changes flow both ways, instantly. Powered by webhooks — not polling. Your team never sees stale data.',
            visual: (
              <div className="rounded-xl border border-neutral-200 shadow-md overflow-hidden bg-neutral-50 p-8 flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                    <PlatformIcon platform="asana" className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-neutral-500">Asana</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-brand-500" />
                  <div className="w-16 h-px bg-brand-200" />
                  <ArrowRight className="w-4 h-4 text-brand-500 rotate-180" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                    <PlatformIcon platform="trello" className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-neutral-500">Trello</span>
                </div>
              </div>
            ),
            flip: true,
          },
        ].map((feature) => (
          <motion.div
            key={feature.title}
            initial={shouldReduce ? {} : { opacity: 0, y: 24 }}
            whileInView={shouldReduce ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            className={cn(
              'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16',
              feature.flip && 'lg:[&>*:first-child]:order-2'
            )}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-500 mb-3">{feature.label}</p>
              <h2 className="text-3xl font-bold text-neutral-900 tracking-tight mb-4">{feature.title}</h2>
              <p className="text-base text-neutral-500 leading-relaxed">{feature.body}</p>
            </div>
            <div>{feature.visual}</div>
          </motion.div>
        ))}
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-brand-500 text-white text-center px-6">
        <h2 className="text-3xl font-bold mb-3 tracking-tight">Ready to stop copy-pasting tasks?</h2>
        <p className="text-brand-100 mb-8 text-base">Free during beta. No credit card required.</p>
        <a
          href="#get-started"
          className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 bg-white text-brand-600 hover:bg-brand-50 shadow-md text-sm px-6 py-3"
        >
          Get started free →
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-50 border-t border-neutral-200 py-12 px-6">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row gap-8 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M8 14C8 10.686 10.686 8 14 8" stroke="#4f6ef7" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M20 14C20 17.314 17.314 20 14 20" stroke="#4f6ef7" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span className="font-semibold text-neutral-900 text-sm">Kanban Sync</span>
            </div>
            <p className="text-sm text-neutral-500">Sync your tasks across every platform.</p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-900 uppercase tracking-widest mb-1">Product</p>
              <Link to="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Dashboard</Link>
              <a href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Pricing</a>
              <a href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Docs</a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-900 uppercase tracking-widest mb-1">Legal</p>
              <a href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Privacy</a>
              <a href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Terms</a>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto mt-8 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Kanban Sync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
