import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface SaveSuccessProps {
  show: boolean;
  message?: string;
}

export function SaveSuccess({ show, message = "Salvo com sucesso!" }: SaveSuccessProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl shadow-emerald-500/30"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Check className="w-5 h-5" strokeWidth={3} />
            </motion.div>
          </motion.div>
          <span className="font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing save success state
import { useState, useCallback } from 'react';

export function useSaveSuccess(duration = 2500) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const triggerSuccess = useCallback((message?: string) => {
    setSuccessMessage(message || "Salvo com sucesso!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), duration);
  }, [duration]);

  return { showSuccess, successMessage, triggerSuccess };
}
