"use client";

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../hooks/use-toast";
import { projectApiRequest } from "../../../lib/projectApi";
import { 
  BookOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  Send, 
  Eye, 
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface Lesson {
  _id: string;
  title: string;
  description: string;
  reward: number;
  status?: "draft" | "published";
  coverImage?: string;
  createdAt: string;
}

export default function Lessons() {
  const isUserDashboard = location.pathname.startsWith("/user-dashboard");
  const apiBase = isUserDashboard ? "/user-hub" : "/hub";
  const createLessonUrl = isUserDashboard ? "/user-dashboard/create-lesson" : "/studio-dashboard/create-lesson";

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const res = await projectApiRequest<{ lessons?: Lesson[] }>({
        method: "GET",
        endpoint: `${apiBase}/get-lessons`,
      });
      setLessons(res.lessons ?? []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load lessons",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (lesson: Lesson) => {
    const target = lesson.status === "published" ? "draft" : "published";
    const endpoint = target === "published" ? `${apiBase}/publish-lesson` : `${apiBase}/unpublish-lesson`;
    
    try {
      setPublishingId(lesson._id);
      await projectApiRequest({
        method: "PATCH",
        endpoint,
        data: { lessonId: lesson._id },
      });
      
      setLessons(prev => prev.map(l => 
        l._id === lesson._id ? { ...l, status: target } : l
      ));
      
      toast({
        title: target === "published" ? "Lesson Published" : "Lesson Unpublished",
        description: `"${lesson.title}" is now ${target}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update status",
      });
    } finally {
      setPublishingId("");
    }
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!confirm(`Are you sure you want to delete "${lesson.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await projectApiRequest({
        method: "DELETE",
        endpoint: `${apiBase}/delete-lesson?id=${lesson._id}`,
      });
      
      setLessons(prev => prev.filter(l => l._id !== lesson._id));
      toast({
        title: "Lesson Deleted",
        description: "The lesson has been permanently removed.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete lesson",
      });
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Lessons</h1>
          <p className="text-white/60 mt-1">Create and manage educational content for your hub.</p>
        </div>
        <Button 
          onClick={() => setLocation(createLessonUrl)}
          className="bg-[#8a3ffc] hover:bg-[#7a2feb] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Lesson
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-white/10 bg-white/[0.02]">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white">No lessons found</h3>
          <p className="text-white/40 mt-2 max-w-md mx-auto">
            You haven't created any lessons yet. Get started by creating your first educational module.
          </p>
          <Button 
            onClick={() => setLocation(createLessonUrl)}
            variant="outline" 
            className="mt-6 border-white/10 text-white hover:bg-white/5"
          >
            Create Your First Lesson
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Card 
              key={lesson._id}
              className="overflow-hidden border-white/10 bg-[#0d0d14] flex flex-col group transition-all hover:border-[#8a3ffc]/50"
            >
              {/* Thumbnail */}
              <div className="relative h-40 w-full bg-white/5">
                {lesson.coverImage ? (
                  <img 
                    src={lesson.coverImage} 
                    alt={lesson.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10 uppercase tracking-widest text-xs">
                    No Cover Image
                  </div>
                )}
                
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                  lesson.status === "published" 
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                    : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                }`}>
                  {lesson.status || "draft"}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white truncate">{lesson.title}</h3>
                  <p className="text-white/50 text-sm mt-2 line-clamp-2 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    {format(new Date(lesson.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold bg-purple-400/10 px-2 py-0.5 rounded">
                    {lesson.reward} XP
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => setLocation(`${createLessonUrl}?edit=${lesson._id}`)}
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/5 gap-2 text-xs"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                  
                  <Button 
                    onClick={() => togglePublish(lesson)}
                    disabled={publishingId === lesson._id}
                    variant="outline"
                    className={`border-white/10 gap-2 text-xs transition-all ${
                      lesson.status === "published"
                        ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                        : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                    }`}
                  >
                    {publishingId === lesson._id ? (
                      "..."
                    ) : lesson.status === "published" ? (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Publish
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={() => deleteLesson(lesson)}
                    variant="ghost"
                    className="col-span-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 gap-2 text-xs mt-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Lesson
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
