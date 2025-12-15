import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnail?: string;
  title: string;
  onComplete?: () => void;
}

export function VideoPlayer({ videoUrl, thumbnail, title, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Placeholder video player UI - will be enhanced with actual video functionality
  return (
    <div className="video-container group">
      {/* Video/Thumbnail */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-20 h-20 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Play Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        <div className={cn(
          "w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300",
          "shadow-glow hover:scale-110",
          isPlaying && "opacity-0 group-hover:opacity-100"
        )}>
          {isPlaying ? (
            <Pause className="w-8 h-8 text-primary-foreground" fill="currentColor" />
          ) : (
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          )}
        </div>
      </button>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        {/* Progress Bar */}
        <div className="relative h-1 bg-muted rounded-full mb-4 cursor-pointer group/progress">
          <div 
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute h-3 w-3 bg-primary rounded-full -top-1 opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-card/50 transition-colors">
              <SkipBack className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg hover:bg-card/50 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-foreground" />
              ) : (
                <Play className="w-5 h-5 text-foreground" />
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-card/50 transition-colors">
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg hover:bg-card/50 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-foreground" />
              ) : (
                <Volume2 className="w-5 h-5 text-foreground" />
              )}
            </button>
            <span className="text-sm text-muted-foreground ml-2">0:00 / 10:30</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-card/50 transition-colors">
              <Maximize className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Title Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent z-10">
        <h2 className="font-display font-semibold text-foreground text-lg">{title}</h2>
      </div>
    </div>
  );
}
