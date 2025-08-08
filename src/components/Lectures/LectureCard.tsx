import { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

export type Lecture = {
  id: string;
  title: string;
  content: string; // markdown
};

export function LectureList({ lectures, onComplete }: { lectures: Lecture[]; onComplete: (id: string) => void }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {lectures.map((lec) => (
        <AccordionItem key={lec.id} value={lec.id} className="glass rounded-md">
          <AccordionTrigger className="text-left text-lg font-semibold">{lec.title}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{lec.content}</ReactMarkdown>
            </article>
            <Button onClick={() => onComplete(lec.id)}>Mark as read</Button>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
