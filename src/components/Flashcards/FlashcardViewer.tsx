import { useState, useEffect, useRef } from "react";
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
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && flashcards.length > 1) {
      nextCard();
    }
    if (isRightSwipe && flashcards.length > 1) {
      prevCard();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

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
    <Card 
      className={`glass transition-all duration-300 cursor-pointer ${fullscreen ? 'h-96' : 'h-full'} ${isFlipped ? 'neon-border' : ''}`} 
      onClick={toggleFlip}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent className="flex items-center justify-center h-full p-4 sm:p-8">
        <div className="text-center space-y-4">
          {!isFlipped ? (
            <>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text">{currentCard.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Click or swipe to reveal concept</p>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">{currentCard.title}</h3>
              <p className="text-base sm:text-lg lg:text-xl leading-relaxed">{currentCard.content}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-lg font-semibold">
          Concept {currentIndex + 1} of {flashcards.length}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={toggleFlip}>
            <RotateCcw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Flip</span>
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

      <div className="flex-1 mb-4">
        <FlashcardContent />
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={prevCard} disabled={flashcards.length <= 1}>
          <ChevronLeft className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        
        <div className="flex gap-1 sm:gap-2">
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

        <Button variant="outline" size="sm" onClick={nextCard} disabled={flashcards.length <= 1}>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 sm:ml-2" />
        </Button>
      </div>
    </div>
  );
}