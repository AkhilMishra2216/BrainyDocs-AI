import { motion } from 'framer-motion'
import { FileText, Download, Zap, Brain, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import ToggleSwitch from './ToggleSwitch'

export default function RightPanel({
  eli5Mode,
  deepMode,
  onEli5Toggle,
  onDeepToggle,
  sources,
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadSummary = async () => {
    try {
      setIsDownloading(true)
      const res = await fetch('/api/summary') // Note: upload_router is prefixed with /api in main.py, so it's /api/summary
      if (!res.ok) throw new Error('Failed to generate summary')
      
      const data = await res.json()
      
      const blob = new Blob([data.summary], { type: 'text/markdown' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BrainyDocs_Summary_${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Could not download summary. Are you logged in and are there documents uploaded?')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <aside className="w-[280px] min-w-[280px] h-full bg-bg-sidebar border-l border-border flex flex-col overflow-y-auto">
      {/* Intelligence Modes */}
      <div className="p-5 border-b border-border">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
          Intelligence Modes
        </h3>

        {/* ELI5 Mode */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-3 rounded-xl bg-bg-card mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Zap size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Explain Like I'm 5</p>
              <p className="text-[11px] text-text-muted">Simplified explanations</p>
            </div>
          </div>
          <ToggleSwitch enabled={eli5Mode} onToggle={onEli5Toggle} />
        </motion.div>

        {/* Deep Mode */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-3 rounded-xl bg-bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Brain size={16} className="text-accent-light" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Deep Mode</p>
              <p className="text-[11px] text-text-muted">
                Extensive cross-referencing
              </p>
            </div>
          </div>
          <ToggleSwitch enabled={deepMode} onToggle={onDeepToggle} />
        </motion.div>
      </div>

      {/* Verified Sources */}
      <div className="p-5 border-b border-border flex-1">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
          Verified Sources
        </h3>

        {sources.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-text-muted">
            <FileText size={24} className="mb-2 opacity-30" />
            <p className="text-xs text-center">
              Sources will appear here after you query your documents.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl bg-bg-card p-3 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-accent" />
                    <span className="text-xs font-medium text-text-primary truncate max-w-[160px]">
                      {source.metadata?.filename || 'Document'}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted">
                    Source {source.id}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
                  "{source.content?.substring(0, 150)}..."
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Related Concepts */}
      <div className="p-5 border-b border-border">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Related Concepts
        </h3>
        {sources.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-bg-card border border-border">
              <Sparkles size={14} className="text-accent shrink-0" />
              <span className="text-xs text-text-secondary truncate">
                Key Insights
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-bg-card border border-border">
              <Sparkles size={14} className="text-accent shrink-0" />
              <span className="text-xs text-text-secondary truncate">
                Cross-refs
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted">No related concepts yet.</p>
        )}
      </div>

      {/* Context Window */}
      <div className="p-5">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Context Window
        </h3>
        <div className="rounded-xl bg-bg-card p-3 border border-border">
          <div className="w-full h-1.5 rounded-full bg-bg-input overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: sources.length > 0 ? '35%' : '0%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light"
            />
          </div>
          <p className="text-[11px] text-text-muted">
            Your workspace context is at {sources.length > 0 ? '35' : '0'}%
            capacity. {sources.length === 0 && 'Add files to populate intelligence.'}
          </p>
        </div>

        {/* Download Report Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownloadSummary}
          disabled={isDownloading}
          className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-card border border-border text-sm transition-all cursor-pointer ${isDownloading ? 'text-accent opacity-70 cursor-not-allowed' : 'text-text-secondary hover:text-accent-light hover:border-accent/30'}`}
        >
          {isDownloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {isDownloading ? 'Generating...' : 'Download Summary Report'}
        </motion.button>
      </div>
    </aside>
  )
}
