import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
}

export function CelebrationModal({ isOpen, onClose, trackTitle }: CelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti on open
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#6366f1', '#f59e0b', '#10b981', '#3b82f6']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#6366f1', '#f59e0b', '#10b981', '#3b82f6']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center border-none bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="space-y-6 py-6"
        >
          {/* Trophy Icon */}
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="relative mx-auto"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center mx-auto shadow-lg shadow-warning/30">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-8 h-8 text-warning" />
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-display font-bold text-foreground">
              Parabéns! 🎉
            </h2>
            <p className="text-muted-foreground">
              Você concluiu o <span className="font-semibold text-primary">{trackTitle}</span>
            </p>
          </motion.div>

          {/* Unlocked Message */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-success/10 rounded-xl p-4 border border-success/20"
          >
            <div className="flex items-center justify-center gap-2 text-success">
              <Lock className="w-5 h-5" />
              <span className="font-semibold">Jornada Metanoia concluída!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as trilhas foram desbloqueadas. Explore todo o conteúdo da plataforma.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Explorar Trilhas
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
