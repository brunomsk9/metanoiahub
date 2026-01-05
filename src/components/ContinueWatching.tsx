import { Play, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseProgress {
  id: string;
  title: string;
  thumbnail: string;
  trackTitle: string;
  progress: number;
  duration: string;
  lastWatched?: string;
}

interface ContinueWatchingProps {
  courses: CourseProgress[];
  onSelect: (id: string) => void;
}

export function ContinueWatching({ courses, onSelect }: ContinueWatchingProps) {
  if (courses.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-display font-semibold text-foreground">
        Continuar de onde parei
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((course, index) => (
          <CourseCard 
            key={course.id} 
            course={course} 
            onSelect={onSelect}
            delay={index * 100}
          />
        ))}
      </div>
    </section>
  );
}

interface CourseCardProps {
  course: CourseProgress;
  onSelect: (id: string) => void;
  delay?: number;
}

function CourseCard({ course, onSelect, delay = 0 }: CourseCardProps) {
  return (
    <div 
      className="group cursor-pointer animate-fade-in rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSelect(course.id)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-card/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-primary ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-primary font-medium mb-1">{course.trackTitle}</p>
        <h3 className="text-sm font-display font-semibold text-foreground line-clamp-2 mb-3">
          {course.title}
        </h3>
        
        {/* Progress Bar */}
        <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${course.progress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{course.progress}% concluído</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration}
          </span>
        </div>
      </div>
    </div>
  );
}

interface TrackCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  coursesCount: number;
  onClick: (id: string) => void;
  isBase?: boolean;
  isLocked?: boolean;
}

export function TrackCard({ id, title, description, thumbnail, coursesCount, onClick, isBase, isLocked }: TrackCardProps) {
  const handleClick = () => {
    if (!isLocked) {
      onClick(id);
    }
  };

  return (
    <div 
      className={`group rounded-2xl overflow-hidden bg-card border shadow-sm transition-all duration-300 ${
        isLocked 
          ? 'cursor-not-allowed opacity-70 border-border' 
          : 'cursor-pointer border-border hover:shadow-xl hover:-translate-y-1'
      } ${isBase ? 'ring-2 ring-primary/50' : ''}`}
      onClick={handleClick}
    >
      <div className="aspect-[16/9] overflow-hidden relative">
        <img
          src={thumbnail}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isLocked ? 'grayscale' : 'group-hover:scale-110'
          }`}
        />
        {isLocked && (
          <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
            <div className="bg-card/90 rounded-full p-3">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        )}
        {isBase && !isLocked && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
              Jornada Metanoia
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className={`text-lg font-display font-semibold mb-2 transition-colors ${
          isLocked ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              Complete a Jornada Metanoia primeiro
            </span>
          ) : (
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {coursesCount} cursos
            </span>
          )}
        </div>
      </div>
    </div>
  );
}