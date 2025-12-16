import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function MentorChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center",
          "bg-primary text-primary-foreground shadow-md",
          "hover:scale-105 transition-transform duration-200",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Abrir Assistente"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Chat Panel */}
      {isOpen && <MentorChatPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}

interface MentorChatPanelProps {
  onClose: () => void;
}

function MentorChatPanel({ onClose }: MentorChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o assistente do Metanoia Hub. Como posso ajudá-lo hoje?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: { messages: apiMessages }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling mentor-chat:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, tive um problema para responder. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] animate-fade-in">
      <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Assistente</h3>
              <p className="text-[10px] text-muted-foreground">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-[300px] overflow-y-auto p-3 space-y-3 bg-background scrollbar-thin">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                message.role === 'user' 
                  ? "bg-primary" 
                  : "bg-muted"
              )}>
                {message.role === 'user' ? (
                  <User className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <Bot className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <div className={cn(
                "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="bg-muted px-3 py-2 rounded-lg rounded-bl-sm">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Digitando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-card border-t border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 h-9 px-3 rounded-md bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="h-9 w-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
