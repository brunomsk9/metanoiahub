import { useState, useMemo } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnail?: string;
  title: string;
  onComplete?: () => void;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Playlist-only URLs (no single video id)
  const playlistId = new URL(url, window.location.origin).searchParams.get("list");
  const hasVideoId = new URL(url, window.location.origin).searchParams.get("v");
  if (playlistId && !hasVideoId) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#/]+)/,
    /youtube\.com\/shorts\/([^&\n?#/]+)/,
    /youtube\.com\/live\/([^&\n?#/]+)/,
    /youtube-nocookie\.com\/embed\/([^&\n?#/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Fallback to v= param
  try {
    const u = new URL(url, window.location.origin);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

function getYouTubePlaylistId(url: string): string | null {
  try {
    const u = new URL(url, window.location.origin);
    return u.searchParams.get("list");
  } catch {
    return null;
  }
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

    const playlistId = getYouTubePlaylistId(videoUrl);
    const youtubeId = getYouTubeVideoId(videoUrl);

    if (youtubeId) {
      return {
        type: "youtube" as const,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`,
        thumbnailUrl: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      };
    }

    if (playlistId) {
      return {
        type: "youtube_playlist" as const,
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&rel=0`,
        thumbnailUrl: thumbnail,
      };
    }

    const vimeoId = getVimeoVideoId(videoUrl);
    if (vimeoId) {
      return {
        type: "vimeo" as const,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
        thumbnailUrl: thumbnail,
      };
    }

    // Direct video URL (mp4, webm, etc.)
    if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: "native" as const,
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
        videoEmbed.type === "native" ? (
          <video
            src={videoEmbed.embedUrl}
            className="absolute inset-0 h-full w-full"
            controls
            autoPlay
            poster={videoEmbed.thumbnailUrl || undefined}
            onEnded={onComplete}
          />
        ) : (
          <iframe
            src={videoEmbed.embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        )
      ) : (
        <>
          {/* Thumbnail */}
          <div className="absolute inset-0">
            {videoEmbed.thumbnailUrl ? (
              <img
                src={videoEmbed.thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-background/40 group-hover:from-background/90 transition-all duration-300" />

          {/* Play button */}
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center z-10"
            aria-label="Reproduzir vídeo"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-primary">
              <Play className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h2 className="font-display font-semibold text-foreground text-base sm:text-lg line-clamp-2 drop-shadow-md">
              {title}
            </h2>
          </div>
        </>
      )}
    </div>
  );
}
