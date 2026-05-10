"use client";

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../hooks/use-toast";
import { projectApiRequest } from "../../../lib/projectApi";
import { Trash2, Plus, Edit, Send, Loader2, RefreshCw } from "lucide-react";
import { getStoredUserSession } from "../../../lib/userSession";

interface Lesson {
  _id: string;
  title: string;
  description: string;
  reward: number;
  noOfQuestions: number;
  status: "draft" | "published";
  coverImage?: string;
}

export default function Lessons() {
  const [location, setLocation] = useLocation();
  const isUserDashboard = location.startsWith("/user-dashboard");
  const apiBase = isUserDashboard ? "/user-hub" : "/hub";
  const createLessonUrl = isUserDashboard ? "/user-dashboard/create-lesson" : "/studio-dashboard/create-lesson";

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState("");
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
        title: "Lesson deleted",
        description: "The lesson has been removed successfully.",
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Lessons</h1>
          <p className="text-white/60">Create and manage educational content</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={fetchLessons}
            disabled={loading}
            className="text-white/60 hover:text-white"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button 
            className="bg-[#8B3EFE] hover:bg-[#7b35e6] gap-2"
            onClick={() => setLocation(createLessonUrl)}
          >
            <Plus className="w-4 h-4" />
            Create Lesson
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : lessons.length === 0 ? (
        <Card className="p-12 text-center bg-white/5 border-dashed border-white/10">
          <p className="text-white/40">No lessons created yet.</p>
          <Button 
            variant="link" 
            className="text-purple-400 mt-2"
            onClick={() => setLocation(createLessonUrl)}
          >
            Create your first lesson
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson._id} className="overflow-hidden bg-[#170F1F] border-white/10 flex flex-col">
              <div className="aspect-video relative overflow-hidden bg-black/40">
                {lesson.coverImage ? (
                  <img src={lesson.coverImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Send className="w-12 h-12 text-white/10" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    lesson.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {lesson.status}
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div>
                  <h3 className="text-lg font-bold text-white line-clamp-1">{lesson.title}</h3>
                  <p className="text-sm text-white/60 line-clamp-2 mt-1">{lesson.description}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-white/40 mt-auto pt-4 border-t border-white/5">
                  <span>{lesson.noOfQuestions} Questions</span>
                  <span className="text-purple-400 font-bold">{lesson.reward} XP</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-xs h-8"
                    onClick={() => setLocation(`${createLessonUrl}?edit=${lesson._id}`)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-white/10 text-xs h-8 ${
                      lesson.status === "published" ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"
                    }`}
                    onClick={() => togglePublish(lesson)}
                    disabled={publishingId === lesson._id}
                  >
                    {publishingId === lesson._id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        {lesson.status === "published" ? "Unpublish" : "Publish"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs h-8"
                    onClick={() => deleteLesson(lesson)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
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
