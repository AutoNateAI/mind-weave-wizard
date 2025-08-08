import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Maximize } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Flashcard = {
  id: string;
  title: string;
  content: string;
  order_index: number;
};

type FlashcardViewerProps = {
  sessionNumber: number;
  lectureNumber: number;
};

export function FlashcardViewer({ sessionNumber, lectureNumber }: FlashcardViewerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashcards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .order('order_index');

      if (error) {
        console.error('Error fetching flashcards:', error);
      } else {
        setFlashcards(data || []);
      }
      setLoading(false);
    };

    fetchFlashcards();
  }, [sessionNumber, lectureNumber]);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setIsFlipped(false);
  };

  const toggleFlip = () => setIsFlipped(!isFlipped);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No flashcards available for this section.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const FlashcardContent = ({ fullscreen = false }: { fullscreen?: boolean }) => (
    <Card className={`glass transition-all duration-300 cursor-pointer ${fullscreen ? 'h-96' : 'h-64'} ${isFlipped ? 'neon-border' : ''}`} onClick={toggleFlip}>
      <CardContent className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          {!isFlipped ? (
            <>
              <h3 className="text-xl font-bold gradient-text">{currentCard.title}</h3>
              <p className="text-sm text-muted-foreground">Click to reveal concept</p>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">{currentCard.title}</h3>
              <p className="text-base leading-relaxed">{currentCard.content}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Concept {currentIndex + 1} of {flashcards.length}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFlip}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <FlashcardContent fullscreen />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <FlashcardContent />

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={prevCard} disabled={flashcards.length <= 1}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          {flashcards.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
            />
          ))}
        </div>

        <Button variant="outline" onClick={nextCard} disabled={flashcards.length <= 1}>
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}