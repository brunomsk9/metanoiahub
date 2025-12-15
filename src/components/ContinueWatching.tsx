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
      className="group cursor-pointer animate-fade-in rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-amber-600 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-amber-600 font-medium mb-1">{course.trackTitle}</p>
        <h3 className="text-sm font-display font-semibold text-gray-900 line-clamp-2 mb-3">
          {course.title}
        </h3>
        
        {/* Progress Bar */}
        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${course.progress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
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
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={() => onClick(id)}
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center gap-2">
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            {coursesCount} cursos
          </span>
        </div>
      </div>
    </div>
  );
}