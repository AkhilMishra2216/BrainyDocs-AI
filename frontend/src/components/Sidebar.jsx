import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Upload,
  User,
  LogIn,
  LogOut,
  Trash2,
} from 'lucide-react'

const navItems = [
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'chat', label: 'Chat History', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
]

export default function Sidebar({
  documents,
  activeNav,
  onNavChange,
  onUploadClick,
  user,
  onLoginClick,
  onLogoutClick,
  onDeleteDocument,
}) {
  return (
    <aside className="w-[240px] min-w-[240px] h-full bg-bg-sidebar border-r border-border flex flex-col">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-lg font-bold text-accent-light tracking-tight">
          BrainyDocs AI
        </h1>
        <p className="text-[11px] text-text-muted uppercase tracking-widest mt-0.5">
          Premium Productivity
        </p>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <p className="text-[10px] text-text-muted uppercase tracking-wider px-2 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeNav === item.id
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 cursor-pointer border-none ${
                isActive
                  ? 'bg-accent/15 text-accent-light'
                  : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </motion.button>
          )
        })}

        {/* Active Files */}
        {documents.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] text-text-muted uppercase tracking-wider px-2 mb-2">
              Active Files
            </p>
            {documents.map((doc) => (
              <div
                key={doc.file_id}
                className="group flex items-center justify-between px-3 py-2 text-sm text-text-secondary rounded-lg hover:bg-bg-card transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText size={14} className="text-accent shrink-0" />
                  <span className="truncate">{doc.filename}</span>
                </div>
                <button 
                  onClick={() => onDeleteDocument(doc.file_id)}
                  className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent p-0 flex shrink-0"
                  title="Delete Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <div className="mt-6 px-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
              Documents
            </p>
            <div className="flex flex-col items-center py-6 text-text-muted">
              <FileText size={28} className="mb-2 opacity-40" />
              <p className="text-xs text-center">
                Your library is currently empty
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-2">
        {!user && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLoginClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary bg-bg-card hover:bg-bg-card-hover transition-all cursor-pointer border border-border"
          >
            <LogIn size={16} />
            Sign In
          </motion.button>
        )}
        {user && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg-card">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <User size={16} className="text-accent-light" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
                <p className="text-[10px] text-text-muted">Authenticated</p>
              </div>
            </div>
            <button
              onClick={onLogoutClick}
              className="text-text-muted hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-1 shrink-0"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUploadClick}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <Upload size={16} />
          Upload Document
        </motion.button>
      </div>
    </aside>
  )
}
