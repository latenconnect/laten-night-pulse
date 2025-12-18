import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lock, ArrowLeft, MoreVertical, Shield, User, Image, Paperclip, Check, CheckCheck, X, Smile, Pencil, Trash2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  useConversationMessages, 
  useSendMessage, 
  useUserPublicKey,
  useEncryptionKeys,
  useTypingIndicator,
  useUploadDMFile,
  useMessageReactions,
  useEditMessage,
  useDeleteMessage,
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

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

interface MessageBubbleProps {
  message: DecryptedMessage;
  onReact: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  reactions: { emoji: string; count: number; isMine: boolean }[];
}

const MessageBubble = ({ message, onReact, onEdit, onDelete, reactions }: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm');
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <p className="text-sm italic text-muted-foreground">This message was deleted</p>
      );
    }

    if (message.messageType === 'image' && message.fileUrl) {
      return (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-xl">
            <img 
              src={message.fileUrl} 
              alt="Shared image" 
              className="max-w-[220px] rounded-xl cursor-pointer hover:opacity-90 transition-all duration-200"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
          </div>
          {message.content && message.content !== '[Image]' && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === 'file' && message.fileUrl) {
      return (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-background/20">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Paperclip className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline truncate block"
            >
              {message.fileName || 'Download file'}
            </a>
            {message.fileSize && (
              <span className="text-xs opacity-70">
                {(message.fileSize / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>
      );
    }

    return <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        'flex gap-2 max-w-[85%] group relative',
        message.isMine ? 'ml-auto flex-row-reverse' : ''
      )}
      onMouseEnter={() => !message.isDeleted && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Actions menu - Apple-style floating bubble */}
      <AnimatePresence>
        {showActions && !message.isDeleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              'absolute -top-12 flex items-center gap-0.5 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-xl z-20',
              message.isMine ? 'right-0' : 'left-0'
            )}
          >
            {EMOJI_OPTIONS.slice(0, 4).map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  onReact(emoji);
                  setShowActions(false);
                }}
                className="text-lg hover:scale-110 transition-transform p-1.5 rounded-full hover:bg-muted/50"
              >
                {emoji}
              </motion.button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  className="p-1.5 rounded-full hover:bg-muted/50"
                >
                  <Smile className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-card/95 backdrop-blur-xl border-border/50" side="top" align="center">
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        onReact(emoji);
                        setShowActions(false);
                      }}
                      className="text-xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-muted/50"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {message.isMine && message.messageType === 'text' && (
              <>
                <div className="w-px h-5 bg-border/50 mx-0.5" />
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    onEdit();
                    setShowActions(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted/50"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-1">
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-[20px] px-4 py-2.5 shadow-sm',
            message.isMine
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-card border border-border/50 rounded-bl-md'
          )}
        >
          {renderContent()}
        </div>

        {/* Meta info */}
        <div className={cn(
          'flex items-center gap-1.5 px-1',
          message.isMine ? 'justify-end' : ''
        )}>
          <span className="text-[11px] text-muted-foreground/70">
            {formatTime(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-[10px] text-muted-foreground/50">• edited</span>
          )}
          {message.isMine && (
            <div className="flex items-center">
              {message.readAt ? (
                <CheckCheck className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Check className="w-3.5 h-3.5 text-muted-foreground/50" />
              )}
            </div>
          )}
        </div>

        {/* Reactions - pill style like iMessage */}
        {reactions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex flex-wrap gap-1',
              message.isMine ? 'justify-end' : ''
            )}
          >
            {reactions.map((r, index) => (
              <motion.button
                key={`${r.emoji}-${index}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => onReact(r.emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs backdrop-blur-sm transition-all duration-200',
                  r.isMine 
                    ? 'bg-primary/20 border border-primary/30 shadow-[0_0_10px_hsla(270,91%,65%,0.2)]' 
                    : 'bg-card/80 border border-border/50 hover:bg-muted/50'
                )}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span className="text-muted-foreground font-medium">{r.count}</span>}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const DateDivider = ({ date }: { date: Date }) => {
  const getDateLabel = () => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="flex items-center justify-center my-6">
      <span className="text-[11px] font-medium text-muted-foreground/60 bg-muted/30 backdrop-blur-sm px-3 py-1 rounded-full">
        {getDateLabel()}
      </span>
    </div>
  );
};

const TypingIndicator = ({ name }: { name: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center gap-2 px-4 py-2"
  >
    <div className="flex items-center gap-1.5 bg-card border border-border/50 rounded-full px-3 py-2">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -4, 0],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.8, 
              delay: i * 0.15,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-1">{name}</span>
    </div>
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
  const [editingMessage, setEditingMessage] = useState<DecryptedMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingTime = useRef<number>(0);

  const { messages, isLoading } = useConversationMessages(conversationId, participantId);
  const { data: recipientPublicKey, isLoading: keyLoading } = useUserPublicKey(participantId);
  const { publicKey: myPublicKey, hasKeys, initializeKeys, isInitializing } = useEncryptionKeys();
  const { isOtherTyping, setTyping } = useTypingIndicator(conversationId, participantId);
  const { toggleReaction, getReactionsForMessage } = useMessageReactions(conversationId);
  const sendMessage = useSendMessage();
  const uploadFile = useUploadDMFile();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();

  // Auto-scroll to bottom
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

  // Set edit message content
  useEffect(() => {
    if (editingMessage) {
      setNewMessage(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    const now = Date.now();
    if (now - lastTypingTime.current > 2000) {
      setTyping(true);
      lastTypingTime.current = now;
    }
  }, [setTyping]);

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

    // Handle edit mode
    if (editingMessage) {
      await editMessage.mutateAsync({
        messageId: editingMessage.id,
        conversationId,
        newContent: newMessage.trim(),
        recipientPublicKey,
      });
      setEditingMessage(null);
      setNewMessage('');
      return;
    }

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
    if (e.key === 'Escape' && editingMessage) {
      setEditingMessage(null);
      setNewMessage('');
    }
  };

  const handleDelete = (message: DecryptedMessage) => {
    if (confirm('Delete this message? This cannot be undone.')) {
      deleteMessage.mutate({ messageId: message.id, conversationId });
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
  const isSending = sendMessage.isPending || uploadFile.isPending || editMessage.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
        {/* Header - iOS style */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl safe-top-padding">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="shrink-0 h-9 w-9 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarImage src={participantAvatar || undefined} />
                <AvatarFallback className="bg-muted">
                  <User className="w-5 h-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] truncate">{participantName}</h3>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4">
          {/* Encryption notice - Modern card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center backdrop-blur-sm border border-border/50">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">End-to-end encrypted</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Only you and {participantName} can read these messages
              </p>
            </div>
          </motion.div>

          {/* Initialize keys if needed */}
          {!hasKeys && !isInitializing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="font-semibold">Set Up Secure Messaging</h4>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Enable end-to-end encryption to start private conversations
                </p>
              </div>
              <Button onClick={initializeKeys} variant="default" className="rounded-full px-6">
                <Lock className="w-4 h-4 mr-2" />
                Enable Encryption
              </Button>
            </motion.div>
          )}

          {isInitializing && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse" />
              <Skeleton className="w-32 h-4" />
              <p className="text-sm text-muted-foreground">Setting up encryption...</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && hasKeys && (
            <div className="space-y-4 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={cn('flex gap-2', i % 2 === 0 ? '' : 'justify-end')}>
                  <Skeleton className={cn('h-14 rounded-[20px]', i % 2 === 0 ? 'w-48' : 'w-36')} />
                </div>
              ))}
            </div>
          )}

          {/* Messages list */}
          {!isLoading && hasKeys && (
            <div className="space-y-1 py-4">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <DateDivider date={new Date(date)} />
                  <div className="space-y-2">
                    {msgs.map((msg) => {
                      const reactions = getReactionsForMessage(msg.id);
                      const groupedReactions = reactions.reduce((acc, r) => {
                        const existing = acc.find(g => g.emoji === r.emoji);
                        if (existing) {
                          existing.count++;
                          existing.isMine = existing.isMine || r.isMine;
                        } else {
                          acc.push({ emoji: r.emoji, count: 1, isMine: r.isMine });
                        }
                        return acc;
                      }, [] as { emoji: string; count: number; isMine: boolean }[]);

                      return (
                        <MessageBubble 
                          key={msg.id} 
                          message={msg}
                          onReact={(emoji) => toggleReaction(msg.id, emoji)}
                          onEdit={() => setEditingMessage(msg)}
                          onDelete={() => handleDelete(msg)}
                          reactions={groupedReactions}
                        />
                      );
                    })}
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

        {/* Edit mode indicator - iOS style banner */}
        <AnimatePresence>
          {editingMessage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50 bg-primary/5 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-primary">Editing</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {editingMessage.content}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={() => {
                    setEditingMessage(null);
                    setNewMessage('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File preview - Modern card */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50 bg-card/50 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                {previewUrl ? (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-xl" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-border/50 rounded-xl" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center">
                    <Paperclip className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearSelectedFile}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input - iOS style */}
        <div className="p-3 border-t border-border/50 bg-card/80 backdrop-blur-xl safe-bottom-nav">
          {!recipientPublicKey && !keyLoading && (
            <p className="text-xs text-muted-foreground text-center mb-2 px-4">
              {participantName} hasn't enabled secure messaging yet
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            {!editingMessage && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={!canSendMessage || isSending}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                <Image className="w-5 h-5" />
              </motion.button>
            )}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={editingMessage ? "Edit message..." : canSendMessage ? "Message" : "Waiting for encryption..."}
                disabled={!canSendMessage || isSending}
                className="rounded-full bg-muted/50 border-0 pr-4 pl-4 h-10 text-[15px] placeholder:text-muted-foreground/60"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={(!newMessage.trim() && !selectedFile) || !canSendMessage || isSending}
              className={cn(
                "shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                (newMessage.trim() || selectedFile) && canSendMessage && !isSending
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsla(270,91%,65%,0.4)]"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DMChatView;
