import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Wand2, Save, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CourseCreationModal } from "./CourseCreationModal";
import ReactMarkdown from 'react-markdown';

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
      content: "Hello! I'm here to help you create a customized version of the **AutoNateAI: Thinking Wizard Course** - a 10-session journey through graph theory and mental models.\n\nThis course teaches structured thinking using graphs, mental models, and cognitive frameworks. I can help tailor the themes, examples, and applications to your specific needs.\n\n**What's your background?** Are you interested in:\n- Business/entrepreneurship applications?\n- Academic/research focus?\n- Personal development?\n- Professional skills?\n\nTell me about your goals and I'll help customize the course content!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
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
      // Call edge function for an actual AI response based on chat history
      const { data, error } = await supabase.functions.invoke('ai-course-generator', {
        body: {
          action: 'planning_chat',
          payload: {
            chatHistory: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
          }
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.reply || 'I could not generate a response right now.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

    } catch (error) {
      console.error('Error in conversation:', error);
      toast.error('Failed to continue conversation');
      setIsLoading(false);
    }
  };

  const generateCoursePlan = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    setGenerationStatus('Starting course generation...');
    
    try {
      setGenerationStatus('Analyzing conversation and creating course structure...');
      
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

      setGenerationStatus('Course plan generated successfully!');
      toast.success('Course plan created and saved to database!');
      onCoursePlanned?.(response.data);
      
      // Clear status after success
      setTimeout(() => {
        setGenerationStatus('');
        setIsGenerating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error generating course plan:', error);
      toast.error('Failed to generate course plan: ' + (error as Error).message);
      setGenerationStatus('');
      setIsGenerating(false);
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
                <div className="text-sm prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
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
        {generationStatus && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
            <span className="text-sm">{generationStatus}</span>
          </div>
        )}
        
        {canGenerate && !isGenerating && (
          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={isLoading}
            className="w-full gap-2"
            size="lg"
          >
            <Wand2 className="w-4 h-4" />
            Generate AutoNateAI Course Plan
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
            disabled={!input.trim() || isLoading || isGenerating}
            size="lg"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <CourseCreationModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          setShowConfirmModal(false);
          await generateCoursePlan();
        }}
      />
    </div>
  );
}