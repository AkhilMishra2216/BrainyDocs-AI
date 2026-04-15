import { motion } from 'framer-motion'

export default function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer border-none ${
        enabled ? 'bg-accent' : 'bg-bg-input border border-border'
      }`}
      aria-checked={enabled}
      role="switch"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md ${
          enabled ? 'left-[22px] bg-white' : 'left-0.5 bg-text-muted'
        }`}
      />
    </button>
  )
}
