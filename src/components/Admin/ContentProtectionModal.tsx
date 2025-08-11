import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, MessageSquare, HelpCircle, Zap } from "lucide-react";

export interface ExistingContent {
  lectureId: string;
  lectureTitle: string;
  sessionNumber: number;
  lectureNumber: number;
  hasSlides: boolean;
  hasFlashcards: boolean;
  hasReflections: boolean;
  hasMCQ: boolean;
}

interface ContentProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedLectures: string[]) => void;
  existingContent: ExistingContent[];
  operationType: 'all' | 'session' | 'single';
  title: string;
}

export function ContentProtectionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  existingContent, 
  operationType,
  title 
}: ContentProtectionModalProps) {
  const [selectedLectures, setSelectedLectures] = useState<Set<string>>(new Set());

  const handleLectureToggle = (lectureId: string) => {
    const newSelected = new Set(selectedLectures);
    if (newSelected.has(lectureId)) {
      newSelected.delete(lectureId);
    } else {
      newSelected.add(lectureId);
    }
    setSelectedLectures(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLectures.size === existingContent.length) {
      setSelectedLectures(new Set());
    } else {
      setSelectedLectures(new Set(existingContent.map(content => content.lectureId)));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedLectures));
    setSelectedLectures(new Set());
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'slides': return <FileText className="w-4 h-4" />;
      case 'flashcards': return <Zap className="w-4 h-4" />;
      case 'reflections': return <MessageSquare className="w-4 h-4" />;
      case 'mcq': return <HelpCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getContentTypes = (content: ExistingContent) => {
    const types = [];
    if (content.hasSlides) types.push('slides');
    if (content.hasFlashcards) types.push('flashcards');
    if (content.hasReflections) types.push('reflections');
    if (content.hasMCQ) types.push('mcq');
    return types;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <DialogTitle>Content Already Exists</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>{title}</strong> would overwrite existing content for the following lectures. 
              Select which lectures you want to regenerate content for:
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedLectures.size === existingContent.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({existingContent.length} lectures)
              </label>
            </div>
            <Badge variant="outline">
              {selectedLectures.size} selected
            </Badge>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {existingContent.map((content) => (
                <div 
                  key={content.lectureId}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={content.lectureId}
                    checked={selectedLectures.has(content.lectureId)}
                    onCheckedChange={() => handleLectureToggle(content.lectureId)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        S{content.sessionNumber}L{content.lectureNumber}
                      </Badge>
                      <span className="font-medium text-sm">{content.lectureTitle}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground mr-2">Has:</span>
                      {getContentTypes(content).map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs gap-1">
                          {getContentTypeIcon(type)}
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedLectures.size === 0}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Regenerate {selectedLectures.size} Lecture{selectedLectures.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}