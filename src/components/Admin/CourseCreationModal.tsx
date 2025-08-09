import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface CourseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CourseCreationModal({ isOpen, onClose, onConfirm }: CourseCreationModalProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      await onConfirm();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Create New Course Version
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              This will create a completely new version of the course based on your conversation with the AI.
            </p>
            <p className="text-warning">
              <strong>Important:</strong> All existing lessons from the current course version will be archived to maintain version history.
            </p>
            <p>
              You can always access previous versions in the course management dashboard.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isCreating}>
            {isCreating ? "Creating Course..." : "Create New Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}