import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-900 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-nexus-400/10 blur-[120px] rounded-full animate-pulse" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_40px_rgba(6,232,225,0.3)] mb-8"
        >
          N
        </motion.div>

        {/* Loading Bar */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-nexus-400 to-accent-500"
          />
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-gray-500 text-xs font-bold uppercase tracking-[0.3em]"
        >
          Entering Nexus...
        </motion.p>
      </div>
    </div>
  )
}
