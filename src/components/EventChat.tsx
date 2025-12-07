import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trash2, BadgeCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEventChat, EventMessage } from '@/hooks/useEventChat';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventChatProps {
  eventId: string;
  hostUserId?: string;
  isHost?: boolean;
}

const MessageBubble = ({ 
  message, 
  isOwnMessage, 
  isHost,
  onDelete 
}: { 
  message: EventMessage; 
  isOwnMessage: boolean;
  isHost: boolean;
  onDelete: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-2 group",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : message.is_host_message 
              ? "bg-secondary/20 border border-secondary/50 rounded-bl-md"
              : "bg-muted rounded-bl-md"
        )}
      >
        {message.is_host_message && (
          <div className="flex items-center gap-1 text-xs text-secondary mb-1">
            <BadgeCheck className="h-3 w-3" />
            <span>Host</span>
          </div>
        )}
        <p className="text-sm break-words">{message.message}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
      {isOwnMessage && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </motion.div>
  );
};

export const EventChat = ({ eventId, hostUserId, isHost = false }: EventChatProps) => {
  const { messages, loading, sendMessage, deleteMessage } = useEventChat(eventId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    const isHostMessage = user?.id === hostUserId || isHost;
    const success = await sendMessage(newMessage, isHostMessage);
    if (success) {
      setNewMessage('');
      inputRef.current?.focus();
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Event Chat</h3>
          <span className="text-sm text-muted-foreground">({messages.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Messages */}
            <ScrollArea className="h-64 px-4" ref={scrollRef}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse text-muted-foreground">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Be the first to say hi!</p>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwnMessage={user?.id === message.user_id}
                      isHost={message.user_id === hostUserId}
                      onDelete={() => deleteMessage(message.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              {user ? (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-background/50 border-border/50"
                    disabled={isSending}
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground">
                  Sign in to join the conversation
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
