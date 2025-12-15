import { Play, Clock } from "lucide-react";
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
      className="continue-card group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSelect(course.id)}
    >
      {/* Thumbnail */}
      <img
        src={course.thumbnail}
        alt={course.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      
      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
          <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
        </div>
      </div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p className="text-xs text-primary font-medium mb-1">{course.trackTitle}</p>
        <h3 className="text-sm font-display font-semibold text-foreground line-clamp-2 mb-2">
          {course.title}
        </h3>
        
        {/* Progress Bar */}
        <div className="relative h-1 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-300"
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
}

export function TrackCard({ id, title, description, thumbnail, coursesCount, onClick }: TrackCardProps) {
  return (
    <div 
      className="card-premium group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      onClick={() => onClick(id)}
    >
      <div className="aspect-[16/9] overflow-hidden rounded-t-xl">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        <p className="text-xs text-primary font-medium">{coursesCount} cursos</p>
      </div>
    </div>
  );
}
