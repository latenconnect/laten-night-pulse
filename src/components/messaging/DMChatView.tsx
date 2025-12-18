import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lock, ArrowLeft, MoreVertical, Shield, User, Image, Paperclip, Check, CheckCheck, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  useTypingIndicator,
  useUploadDMFile,
  DecryptedMessage 
} from '@/hooks/useDirectMessages';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DMChatViewProps {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const MessageBubble = ({ message }: { message: DecryptedMessage }) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm');
  };

  const renderContent = () => {
    if (message.messageType === 'image' && message.fileUrl) {
      return (
        <div className="space-y-1">
          <img 
            src={message.fileUrl} 
            alt="Shared image" 
            className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          {message.content && message.content !== '[Image]' && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === 'file' && message.fileUrl) {
      return (
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 shrink-0" />
          <a 
            href={message.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm underline hover:no-underline truncate max-w-[150px]"
          >
            {message.fileName || 'Download file'}
          </a>
          {message.fileSize && (
            <span className="text-xs opacity-70">
              ({(message.fileSize / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
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
        {renderContent()}
        <div className={cn(
          'flex items-center gap-1 mt-1',
          message.isMine ? 'justify-end' : ''
        )}>
          <span className={cn(
            'text-[10px]',
            message.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            {formatTime(message.createdAt)}
          </span>
          {message.isMine && (
            message.readAt ? (
              <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
            ) : (
              <Check className="w-3 h-3 text-primary-foreground/70" />
            )
          )}
        </div>
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

const TypingIndicator = ({ name }: { name: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center gap-2 text-muted-foreground text-sm pl-2"
  >
    <div className="flex gap-1">
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
        className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
      />
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
        className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
      />
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
        className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
      />
    </div>
    <span>{name} is typing...</span>
  </motion.div>
);

export const DMChatView: React.FC<DMChatViewProps> = ({
  conversationId,
  participantId,
  participantName,
  participantAvatar,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Fetch user profile for sender name
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      return data;
    },
    enabled: !!user,
  });
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingTime = useRef<number>(0);

  const { messages, isLoading } = useConversationMessages(conversationId, participantId);
  const { data: recipientPublicKey, isLoading: keyLoading } = useUserPublicKey(participantId);
  const { publicKey: myPublicKey, hasKeys, initializeKeys, isInitializing } = useEncryptionKeys();
  const { isOtherTyping, setTyping } = useTypingIndicator(conversationId, participantId);
  const sendMessage = useSendMessage();
  const uploadFile = useUploadDMFile();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    const now = Date.now();
    if (now - lastTypingTime.current > 2000) {
      setTyping(true);
      lastTypingTime.current = now;
    }
  }, [setTyping]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || !recipientPublicKey || sendMessage.isPending) return;

    setTyping(false);

    let fileData;
    if (selectedFile) {
      try {
        fileData = await uploadFile.mutateAsync(selectedFile);
      } catch {
        return;
      }
    }

    const messageType = selectedFile?.type.startsWith('image/') ? 'image' : selectedFile ? 'file' : 'text';
    const messageContent = newMessage.trim() || (messageType === 'image' ? '[Image]' : '[File]');

    await sendMessage.mutateAsync({
      conversationId,
      recipientId: participantId,
      recipientPublicKey,
      message: messageContent,
      messageType,
      fileUrl: fileData?.url,
      fileName: fileData?.name,
      fileSize: fileData?.size,
      fileMimeType: fileData?.mimeType,
      senderName: profile?.display_name || 'Someone',
    });

    setNewMessage('');
    clearSelectedFile();
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
  const isSending = sendMessage.isPending || uploadFile.isPending;

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
              
              {/* Typing indicator */}
              <AnimatePresence>
                {isOtherTyping && <TypingIndicator name={participantName} />}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* File preview */}
        {selectedFile && (
          <div className="px-4 py-2 border-t border-border bg-card/50">
            <div className="flex items-center gap-2">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Paperclip className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearSelectedFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/50">
          {!recipientPublicKey && !keyLoading && (
            <p className="text-sm text-muted-foreground text-center mb-2">
              {participantName} hasn't set up secure messaging yet
            </p>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canSendMessage || isSending}
              className="shrink-0"
            >
              <Image className="w-5 h-5" />
            </Button>
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={canSendMessage ? "Type a message..." : "Waiting for encryption..."}
              disabled={!canSendMessage || isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={(!newMessage.trim() && !selectedFile) || !canSendMessage || isSending}
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