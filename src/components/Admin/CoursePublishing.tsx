import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, AlertTriangle, Check, Clock } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

interface CoursePublishingProps {
  courses: Course[];
  onCoursesUpdate: () => void;
}

export function CoursePublishing({ courses, onCoursesUpdate }: CoursePublishingProps) {
  const [publishingCourse, setPublishingCourse] = useState<Course | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishedCourse, setPublishedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const published = courses.find(course => course.is_published);
    setPublishedCourse(published || null);
  }, [courses]);

  const handlePublishClick = (course: Course) => {
    setPublishingCourse(course);
    
    // If there's already a published course, show confirmation dialog
    if (publishedCourse && publishedCourse.id !== course.id) {
      setShowConfirmDialog(true);
    } else {
      // If no published course or this is the published course being unpublished
      publishCourse(course);
    }
  };

  const publishCourse = async (course: Course) => {
    setLoading(true);
    try {
      // If there's a different published course, unpublish it first
      if (publishedCourse && publishedCourse.id !== course.id) {
        await supabase
          .from('courses')
          .update({ is_published: false })
          .eq('id', publishedCourse.id);
      }

      // Toggle the target course's published status
      const newPublishedStatus = !course.is_published;
      
      const { error } = await supabase
        .from('courses')
        .update({ is_published: newPublishedStatus })
        .eq('id', course.id);

      if (error) throw error;

      toast.success(
        newPublishedStatus 
          ? `"${course.title}" is now published and live!`
          : `"${course.title}" has been unpublished.`
      );
      
      onCoursesUpdate();
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Failed to update course publication status');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setPublishingCourse(null);
    }
  };

  const confirmPublish = () => {
    if (publishingCourse) {
      publishCourse(publishingCourse);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Course Publishing</h3>
          <p className="text-sm text-muted-foreground">
            Manage which course version is live for students
          </p>
        </div>
        {publishedCourse && (
          <Badge variant="default" className="gap-2">
            <Rocket className="w-3 h-3" />
            Live: {publishedCourse.title}
          </Badge>
        )}
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{course.title}</h4>
                  {course.is_published && (
                    <Badge variant="default" className="gap-1 text-xs">
                      <Rocket className="w-3 h-3" />
                      Live
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {course.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created: {formatDate(course.created_at)}
                  </span>
                  {course.published_at && (
                    <span className="flex items-center gap-1">
                      <Rocket className="w-3 h-3" />
                      Published: {formatDate(course.published_at)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={course.is_published ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handlePublishClick(course)}
                  disabled={loading}
                  className="gap-2"
                >
                  {course.is_published ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Replace Published Course?
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                You are about to replace the currently published course 
                <span className="font-medium"> "{publishedCourse?.title}"</span> with 
                <span className="font-medium"> "{publishingCourse?.title}"</span>.
              </p>
              <p>
                This will immediately change what students see on the frontend. 
                The current course will be unpublished and the new course will go live.
              </p>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to continue?
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPublish}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Yes, Replace Course
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}