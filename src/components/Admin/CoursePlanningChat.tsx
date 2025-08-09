import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Wand2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CoursePlanningChatProps {
  onCoursePlanned?: (courseData: any) => void;
}

export function CoursePlanningChat({ onCoursePlanned }: CoursePlanningChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI course planning assistant. Tell me about the course you'd like to create. What topic, learning objectives, and target audience do you have in mind?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Enable generation after some conversation
    if (messages.length >= 4) {
      setCanGenerate(true);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simple AI response for planning conversation
      const planningPrompts = [
        "That sounds interesting! Can you tell me more about the specific learning outcomes you want to achieve?",
        "Great! What's the target audience for this course? What's their current knowledge level?",
        "Perfect! How would you like to structure the learning journey? Any specific methodologies or approaches you prefer?",
        "Excellent! Based on our discussion, I have a good understanding of your vision. When you're ready, use the 'Generate Course Plan' button to create the structured course outline.",
        "I can help refine those ideas further. What aspects would you like to explore more deeply?"
      ];

      const response = planningPrompts[Math.min(messages.length - 1, planningPrompts.length - 1)];

      setTimeout(() => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error in conversation:', error);
      toast.error('Failed to continue conversation');
      setIsLoading(false);
    }
  };

  const generateCoursePlan = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-course-generator', {
        body: {
          action: 'plan_course',
          payload: {
            courseDescription: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
            chatHistory: messages,
            userId: user.id
          }
        }
      });

      if (response.error) throw response.error;

      toast.success('Course plan generated successfully!');
      onCoursePlanned?.(response.data);
      
    } catch (error) {
      console.error('Error generating course plan:', error);
      toast.error('Failed to generate course plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Course Planning Assistant</h3>
        </div>
        <Badge variant="secondary">AI Powered</Badge>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <Card className={`max-w-[80%] p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot className="w-4 h-4" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 space-y-3">
        {canGenerate && (
          <Button
            onClick={generateCoursePlan}
            disabled={isLoading}
            className="w-full gap-2"
            size="lg"
          >
            <Wand2 className="w-4 h-4" />
            Generate Course Plan
          </Button>
        )}
        
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your course vision..."
            className="flex-1 min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}