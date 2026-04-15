import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, Sparkles, Search, Link2, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-1 flex flex-col items-center justify-center px-8"
    >
      {/* Glowing sparkle icon */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-2xl bg-bg-card border border-border flex items-center justify-center mb-6 glow-accent"
      >
        <Sparkles size={36} className="text-accent-light animate-pulse-glow" />
      </motion.div>

      {/* Dot indicators */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            className="w-2 h-2 rounded-full bg-accent"
          />
        ))}
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-3">
        Ready to start?
      </h2>
      <p className="text-text-secondary text-center max-w-md mb-8 leading-relaxed">
        Upload your documents and start chatting with your knowledge. Our AI
        will help you summarize, extract, and synthesize information in seconds.
      </p>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          className="glass rounded-2xl p-5 cursor-pointer"
        >
          <Lightbulb size={18} className="text-accent-light mb-3" />
          <p className="text-sm font-semibold text-text-primary mb-1">
            "Summarize the key takeaways"
          </p>
          <p className="text-xs text-text-muted">
            Get a high-level overview of any PDF or long-form document.
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          className="glass rounded-2xl p-5 cursor-pointer"
        >
          <Link2 size={18} className="text-accent-light mb-3" />
          <p className="text-sm font-semibold text-text-primary mb-1">
            "Find correlations across files"
          </p>
          <p className="text-xs text-text-muted">
            Connect the dots between multiple reports and data points.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
          isUser
            ? 'bg-accent/20 border border-accent/30 text-text-primary'
            : 'glass text-text-primary'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-accent/30 flex items-center justify-center">
              <Sparkles size={12} className="text-accent-light" />
            </div>
            <span className="text-xs font-semibold text-accent-light uppercase tracking-wider">
              BrainyDocs AI
            </span>
          </div>
        )}
        <div className="text-sm leading-relaxed prose-invert prose-sm">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            {message.sources.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-muted mt-1">
                <span className="text-accent">◇</span>
                Source [{s.id}]: {s.metadata?.filename || 'Document'}
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-text-muted mt-2">
          {isUser ? 'YOU' : 'AI'} •{' '}
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 mb-4 px-5 py-3 glass rounded-2xl w-fit"
    >
      <Sparkles size={14} className="text-accent-light" />
      <span className="text-xs text-text-muted italic">
        Synthesizing cross-document insights…
      </span>
      <div className="flex gap-1 ml-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-accent"
          />
        ))}
      </div>
    </motion.div>
  )
}

export default function ChatWindow({ messages, onSend, isLoading }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-bg-primary">
      {/* Top Nav Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-6">
          {['Focus', 'Collaborate', 'Insights'].map((tab, i) => (
            <button
              key={tab}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors bg-transparent cursor-pointer ${
                i === 0
                  ? 'text-accent-light border-accent'
                  : 'text-text-muted border-transparent hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input border border-border">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search archive..."
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-muted w-32"
          />
        </div>
      </div>

      {/* Messages Area or Empty State */}
      {!hasMessages ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
          </AnimatePresence>
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Bar */}
      <div className="px-6 pb-4 pt-2">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 rounded-2xl bg-bg-input border border-border px-4 py-3 transition-all focus-within:border-accent/40 focus-within:glow-accent"
        >
          <button
            type="button"
            className="text-text-muted hover:text-accent-light transition-colors bg-transparent border-none cursor-pointer"
          >
            <Plus size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask questions about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-muted"
          />
          {input.trim() && (
            <span className="text-[10px] text-text-muted hidden sm:block">
              ⌘ + ENTER
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border-none cursor-pointer ${
              input.trim()
                ? 'bg-accent text-white'
                : 'bg-bg-card text-text-muted'
            }`}
          >
            <Send size={16} />
          </motion.button>
        </form>
        <p className="text-center text-[10px] text-text-muted mt-2 uppercase tracking-widest">
          BrainyDocs AI Model 1.0 · Experimental Deep Research Mode
        </p>
      </div>
    </main>
  )
}
