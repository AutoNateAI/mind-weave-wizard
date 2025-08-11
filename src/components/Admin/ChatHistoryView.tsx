import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  Eye, 
  Clock,
  Bot,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatSession {
  id: string;
  created_at: string;
  updated_at: string;
  chat_history: any;
  course_id: string | null;
  context_type: string;
  course?: {
    id: string;
    title: string;
    status: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatHistoryView() {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  const loadChatSessions = async () => {
    try {
      console.log('🔍 Loading chat sessions for user:', user?.email);
      
      // For admin users, query without user restriction since admin_user_id might not be set
      const { data, error } = await supabase
        .from('admin_chat_sessions')
        .select(`
          *,
          course:courses(id, title, status)
        `)
        .eq('context_type', 'course_planning')
        .order('updated_at', { ascending: false });

      console.log('📊 Chat sessions query result:', { data, error });

      if (error) throw error;
      
      // Transform the data to ensure chat_history is properly typed
      const transformedData = (data || []).map(session => ({
        ...session,
        chat_history: Array.isArray(session.chat_history) ? session.chat_history : []
      }));
      
      setChatSessions(transformedData);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessagePreview = (messages: any) => {
    const messagesArray = Array.isArray(messages) ? messages : [];
    if (messagesArray.length <= 1) return "New conversation";
    
    // Find first user message
    const firstUserMessage = messagesArray.find((msg: any) => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 100) + 
        (firstUserMessage.content.length > 100 ? '...' : '');
    }
    
    return "Conversation started";
  };

  const ChatMessages = ({ messages }: { messages: Message[] }) => (
    <ScrollArea className="h-[400px] pr-4">
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
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </Card>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat history...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Chat History</h2>
          <p className="text-muted-foreground">
            View your course planning conversations and their outcomes
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <MessageSquare className="w-3 h-3" />
          {chatSessions.length} Conversations
        </Badge>
      </div>

      {chatSessions.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">
              Start a conversation in the Course Planning tab to see your chat history here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {chatSessions.map((session) => (
            <Card key={session.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {session.course ? `Course: ${session.course.title}` : 'Planning Session'}
                    </span>
                    {session.course && (
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="w-3 h-3" />
                        Course Created
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {getMessagePreview(session.chat_history)}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Started: {formatDate(session.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated: {formatDate(session.updated_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {Array.isArray(session.chat_history) ? session.chat_history.length : 0} messages
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {session.course && (
                    <Badge variant="secondary">{session.course.status}</Badge>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-3 h-3" />
                        View Chat
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          {session.course ? `Planning: ${session.course.title}` : 'Course Planning Session'}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="mt-4">
                        {Array.isArray(session.chat_history) && session.chat_history.length > 0 ? (
                          <ChatMessages messages={session.chat_history} />
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No messages in this conversation.
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}