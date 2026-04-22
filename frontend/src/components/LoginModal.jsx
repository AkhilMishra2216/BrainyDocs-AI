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

        {/* Admin Login */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-accent border-none text-white text-sm font-semibold hover:bg-accent-light transition-all cursor-pointer mb-3"
        >
          <Shield size={18} className="text-white" />
          Login as Admin
        </motion.button>

        <p className="text-[11px] text-text-muted mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </motion.div>
  )
}
