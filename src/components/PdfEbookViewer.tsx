import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Book, 
  Download, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2, 
  X,
  ExternalLink,
  BookOpen,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PdfEbookViewerProps {
  url: string;
  title?: string;
  type?: 'pdf' | 'ebook' | 'livro' | null;
  className?: string;
}

export function PdfEbookViewer({ url, title, type, className }: PdfEbookViewerProps) {
  const [showViewer, setShowViewer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to get PDF embed URL
  const getPdfEmbedUrl = (pdfUrl: string) => {
    if (pdfUrl.includes('drive.google.com/file/d/')) {
      const fileId = pdfUrl.match(/\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return pdfUrl;
  };

  const getPdfDownloadUrl = (pdfUrl: string) => {
    if (pdfUrl.includes('drive.google.com/file/d/')) {
      const fileId = pdfUrl.match(/\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return pdfUrl;
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'ebook':
        return {
          icon: BookOpen,
          label: 'Ebook',
          gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20',
          iconColor: 'text-violet-500',
          borderColor: 'border-violet-500/30',
          glowColor: 'shadow-violet-500/20',
          accentBg: 'bg-violet-500/10',
        };
      case 'livro':
        return {
          icon: Book,
          label: 'Livro Digital',
          gradient: 'from-amber-500/20 via-orange-500/10 to-yellow-500/20',
          iconColor: 'text-amber-500',
          borderColor: 'border-amber-500/30',
          glowColor: 'shadow-amber-500/20',
          accentBg: 'bg-amber-500/10',
        };
      default:
        return {
          icon: FileText,
          label: 'PDF da Aula',
          gradient: 'from-red-500/20 via-rose-500/10 to-pink-500/20',
          iconColor: 'text-red-500',
          borderColor: 'border-red-500/30',
          glowColor: 'shadow-red-500/20',
          accentBg: 'bg-red-500/10',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn("space-y-4", className)}
      >
        {/* Material Card */}
        <div 
          className={cn(
            "relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300",
            config.borderColor,
            showViewer ? "shadow-lg" : "hover:shadow-md",
            config.glowColor
          )}
        >
          {/* Gradient Background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none",
            config.gradient
          )} />
          
          {/* Subtle Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative p-5">
            <div className="flex items-start gap-4">
              {/* Icon Container */}
              <div className={cn(
                "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center",
                config.accentBg,
                "ring-1 ring-inset ring-white/10"
              )}>
                <Icon className={cn("w-7 h-7", config.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                    config.accentBg,
                    config.iconColor
                  )}>
                    <Sparkles className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {title || 'Material da Aula'}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {showViewer 
                    ? 'Role para baixo para visualizar o conteúdo' 
                    : 'Clique para visualizar ou baixar o material'
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewer(!showViewer)}
                className={cn(
                  "gap-2 transition-all duration-200",
                  showViewer && "bg-primary/10 border-primary/30 text-primary"
                )}
              >
                {showViewer ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Tela Cheia
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getPdfDownloadUrl(url), '_blank')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(url, '_blank')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Original
              </Button>
            </div>
          </div>
        </div>

        {/* Embedded Viewer */}
        <AnimatePresence>
          {showViewer && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className={cn(
                "relative rounded-xl overflow-hidden border bg-muted/30",
                config.borderColor
              )}>
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-background/90 via-background/60 to-transparent backdrop-blur-sm">
                  <span className="text-xs text-muted-foreground font-medium">
                    Visualizador de {config.label}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsFullscreen(true)}
                      className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setShowViewer(false)}
                      className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* PDF iFrame */}
                <div className="pt-12">
                  <iframe
                    src={getPdfEmbedUrl(url)}
                    className="w-full h-[600px] bg-white"
                    allow="autoplay"
                    title="Visualizador de PDF"
                  />
                </div>

                {/* Bottom Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 bg-background border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                config.accentBg
              )}>
                <Icon className={cn("w-4 h-4", config.iconColor)} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {title || config.label}
                </h3>
                <p className="text-xs text-muted-foreground">Modo tela cheia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getPdfDownloadUrl(url), '_blank')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                className="h-8 w-8"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 h-[calc(95vh-60px)]">
            <iframe
              src={getPdfEmbedUrl(url)}
              className="w-full h-full bg-white"
              allow="autoplay"
              title="Visualizador de PDF em tela cheia"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
