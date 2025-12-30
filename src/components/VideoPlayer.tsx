import { useMemo } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const videoEmbed = useMemo(() => {
    if (!videoUrl) return null;

    const playlistId = getYouTubePlaylistId(videoUrl);
    const youtubeId = getYouTubeVideoId(videoUrl);

    if (youtubeId) {
      return {
        type: "youtube" as const,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0`,
        thumbnailUrl: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      };
    }

    if (playlistId) {
      return {
        type: "youtube_playlist" as const,
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0`,
        thumbnailUrl: thumbnail,
      };
    }

    const vimeoId = getVimeoVideoId(videoUrl);
    if (vimeoId) {
      return {
        type: "vimeo" as const,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
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
    <div className="space-y-3">
      <div className="video-container">
        {videoEmbed.type === "native" ? (
          <video
            src={videoEmbed.embedUrl}
            className="absolute inset-0 h-full w-full"
            controls
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
        )}

        {/* Title overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent z-10 pointer-events-none">
          <h2 className="font-display font-semibold text-foreground text-lg line-clamp-2">{title}</h2>
        </div>

        {/* Fallback visual (when no thumbnail is available and iframe hasn't rendered yet) */}
        {!videoEmbed.thumbnailUrl && videoEmbed.type === "native" && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Play className="w-20 h-20 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {videoUrl && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir no YouTube/Vimeo
          </Button>
        </div>
      )}
    </div>
  );
}
