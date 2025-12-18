import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lock, ArrowLeft, MoreVertical, Shield, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useConversationMessages, 
  useSendMessage, 
  useUserPublicKey,
  useEncryptionKeys,
  DecryptedMessage 
} from '@/hooks/useDirectMessages';
import { useLanguage } from '@/context/LanguageContext';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface DMChatViewProps {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const MessageBubble = ({ message, showAvatar }: { message: DecryptedMessage; showAvatar?: boolean }) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-2 max-w-[80%]',
        message.isMine ? 'ml-auto flex-row-reverse' : ''
      )}
    >
      <div
        className={cn(
          'rounded-2xl px-4 py-2',
          message.isMine
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card border border-border rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
          'text-[10px] mt-1',
          message.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
};

const DateDivider = ({ date }: { date: Date }) => {
  const getDateLabel = () => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{getDateLabel()}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

export const DMChatView: React.FC<DMChatViewProps> = ({
  conversationId,
  participantId,
  participantName,
  participantAvatar,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading } = useConversationMessages(conversationId, participantId);
  const { data: recipientPublicKey, isLoading: keyLoading } = useUserPublicKey(participantId);
  const { publicKey: myPublicKey, hasKeys, initializeKeys, isInitializing } = useEncryptionKeys();
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || !recipientPublicKey || sendMessage.isPending) return;

    await sendMessage.mutateAsync({
      conversationId,
      recipientId: participantId,
      recipientPublicKey,
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, DecryptedMessage[]>);

  const canSendMessage = hasKeys && recipientPublicKey && !keyLoading;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={participantAvatar || undefined} />
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{participantName}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4">
          {/* Encryption notice */}
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Messages are end-to-end encrypted. Only you and {participantName} can read them.
            </p>
          </div>

          {/* Initialize keys if needed */}
          {!hasKeys && !isInitializing && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-muted-foreground text-center">
                Set up secure messaging to start chatting
              </p>
              <Button onClick={initializeKeys} variant="neon" size="sm">
                <Lock className="w-4 h-4 mr-2" />
                Enable Secure Messaging
              </Button>
            </div>
          )}

          {isInitializing && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Skeleton className="w-32 h-4" />
              <p className="text-sm text-muted-foreground">Setting up encryption...</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && hasKeys && (
            <div className="space-y-4 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={cn('flex gap-2', i % 2 === 0 ? '' : 'justify-end')}>
                  <Skeleton className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-36')} />
                </div>
              ))}
            </div>
          )}

          {/* Messages list */}
          {!isLoading && hasKeys && (
            <div className="space-y-2 py-4">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <DateDivider date={new Date(date)} />
                  <div className="space-y-2">
                    {msgs.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/50">
          {!recipientPublicKey && !keyLoading && (
            <p className="text-sm text-muted-foreground text-center mb-2">
              {participantName} hasn't set up secure messaging yet
            </p>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canSendMessage ? "Type a message..." : "Waiting for encryption..."}
              disabled={!canSendMessage || sendMessage.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || !canSendMessage || sendMessage.isPending}
              size="icon"
              variant="neon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DMChatView;
