import { motion } from 'framer-motion'
import { Shield, Mail } from 'lucide-react'

export default function LoginModal({ onClose, onLogin }) {
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
        className="glass-strong rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl text-center"
      >
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent-light/20 flex items-center justify-center glow-accent">
            <Shield size={28} className="text-accent-light" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-1">
          Cognitive Sanctuary
        </h2>
        <p className="text-sm text-text-secondary mb-8">
          Login to start chatting with your documents
        </p>

        {/* Google Button (mock) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-bg-card border border-border text-sm font-medium text-text-primary hover:bg-bg-card-hover transition-all cursor-pointer mb-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </motion.button>

        {/* Email Button (mock) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-black/40 border border-border text-sm font-medium text-text-primary hover:bg-black/60 transition-all cursor-pointer"
        >
          <Mail size={18} className="text-accent-light" />
          Email login
        </motion.button>

        <p className="text-[11px] text-text-muted mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </motion.div>
  )
}
