import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, File, Trash2, CheckCircle } from 'lucide-react'

const ALLOWED = ['.pdf', '.docx', '.txt']

export default function UploadModal({ onClose, onUploadSuccess }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const addFiles = (fileList) => {
    const newFiles = Array.from(fileList)
      .filter((f) => ALLOWED.some((ext) => f.name.toLowerCase().endsWith(ext)))
      .map((f) => ({ file: f, progress: 0, status: 'pending', id: crypto.randomUUID() }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const handleUpload = async () => {
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const entry = files[i]
      if (entry.status === 'done') continue

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, progress: Math.min(f.progress + 15, 90) } : f
          )
        )
      }, 200)

      try {
        const formData = new FormData()
        formData.append('file', entry.file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()

        clearInterval(progressInterval)

        if (res.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, progress: 100, status: 'done' } : f
            )
          )
          onUploadSuccess(data.document)
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, status: 'error' } : f
            )
          )
        }
      } catch {
        clearInterval(progressInterval)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, status: 'error' } : f
          )
        )
      }
    }
    setUploading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Upload Documents
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Populate your workspace with new intelligence. Support for PDF,
              DOCX, and high-fidelity text files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-card hover:bg-bg-card-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer border-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-6 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center cursor-pointer transition-all ${
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/40'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
            <Upload size={22} className="text-accent-light" />
          </div>
          <p className="text-sm font-medium text-text-primary">
            Drag & drop files here
          </p>
          <p className="text-xs text-accent-light mt-1">
            or browse local storage
          </p>
          <div className="flex gap-2 mt-4">
            {['PDF', 'DOCX'].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-bg-card border border-border text-xs text-text-secondary"
              >
                <FileText size={12} />
                {t}
              </span>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-3">
              Selected Items
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <AnimatePresence>
                {files.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <File size={14} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {entry.file.name}
                      </p>
                      {entry.status === 'pending' && entry.progress > 0 && (
                        <div className="w-full h-1 rounded-full bg-bg-input mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-300"
                            style={{ width: `${entry.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {entry.status === 'done' ? (
                      <span className="text-xs text-success font-medium flex items-center gap-1">
                        <CheckCircle size={12} /> Ready
                      </span>
                    ) : entry.status === 'error' ? (
                      <span className="text-xs text-danger">Failed</span>
                    ) : entry.progress > 0 ? (
                      <span className="text-xs text-text-muted">
                        {entry.progress}%
                      </span>
                    ) : null}
                    <button
                      onClick={() => removeFile(entry.id)}
                      className="text-text-muted hover:text-danger transition-colors bg-transparent border-none cursor-pointer"
                    >
                      {entry.status === 'done' ? (
                        <Trash2 size={14} />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-3 h-3 rounded-full bg-accent/40" />
            End-to-end encrypted upload
          </div>
          <div className="flex gap-3">
            {files.every((f) => f.status === 'done') && files.length > 0 ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="btn-primary text-sm"
              >
                Done
              </motion.button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary bg-transparent border border-border hover:border-accent/30 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploading}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Start Analysis'}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
