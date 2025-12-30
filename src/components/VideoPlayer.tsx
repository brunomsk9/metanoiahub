import { useState, useMemo } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnail?: string;
  title: string;
  onComplete?: () => void;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Check if URL is a Vimeo video
function getVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function VideoPlayer({ videoUrl, thumbnail, title, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoEmbed = useMemo(() => {
    if (!videoUrl) return null;

    const youtubeId = getYouTubeVideoId(videoUrl);
    if (youtubeId) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`,
        thumbnailUrl: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      };
    }

    const vimeoId = getVimeoVideoId(videoUrl);
    if (vimeoId) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
        thumbnailUrl: thumbnail,
      };
    }

    // Direct video URL (mp4, webm, etc.)
    if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: 'native',
        embedUrl: videoUrl,
        thumbnailUrl: thumbnail,
      };
    }

    return null;
  }, [videoUrl, thumbnail]);

  if (!videoEmbed) {
    return (
      <div className="video-container flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">URL de vídeo inválida ou não suportada</p>
      </div>
    );
  }

  return (
    <div className="video-container group">
      {isPlaying ? (
        // Embedded player
        videoEmbed.type === 'native' ? (
          <video
            src={videoEmbed.embedUrl}
            className="absolute inset-0 w-full h-full"
            controls
            autoPlay
            onEnded={onComplete}
          />
        ) : (
          <iframe
            src={videoEmbed.embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        )
      ) : (
        <>
          {/* Thumbnail */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background">
            {videoEmbed.thumbnailUrl ? (
              <img 
                src={videoEmbed.thumbnailUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="w-20 h-20 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play Button */}
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className={cn(
              "w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300",
              "shadow-glow hover:scale-110"
            )}>
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </button>

          {/* Title Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent z-10">
            <h2 className="font-display font-semibold text-foreground text-lg">{title}</h2>
          </div>
        </>
      )}
    </div>
  );
}
