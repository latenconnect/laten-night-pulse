import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Lock, Search, User, Plus, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useConversations, Conversation, useEncryptionKeys } from '@/hooks/useDirectMessages';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import DMChatView from './DMChatView';
import NewConversationSheet from './NewConversationSheet';

interface DMInboxProps {
  trigger?: React.ReactNode;
}

const ConversationItem = ({ 
  conversation, 
  onClick,
  index
}: { 
  conversation: Conversation; 
  onClick: () => void;
  index: number;
}) => {
  const timeAgo = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })
    : '';

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 500, damping: 30 }}
      onClick={onClick}
      whileTap={{ scale: 0.98, backgroundColor: 'hsl(var(--muted))' }}
      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-all duration-200 text-left group"
    >
      <div className="relative">
        <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
          <AvatarImage src={conversation.participantAvatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-medium">
            {conversation.participantName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className={cn(
            "font-semibold truncate text-[15px]",
            conversation.unreadCount > 0 && "text-foreground"
          )}>
            {conversation.participantName}
          </h4>
          {timeAgo && (
            <span className={cn(
              "text-[11px] shrink-0",
              conversation.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {timeAgo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span className="truncate">End-to-end encrypted</span>
        </div>
      </div>
      {conversation.unreadCount > 0 ? (
        <div className="shrink-0">
          <Badge className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-primary text-primary-foreground shadow-[0_0_10px_hsla(270,91%,65%,0.4)]">
            {conversation.unreadCount}
          </Badge>
        </div>
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.button>
  );
};

export const DMInbox: React.FC<DMInboxProps> = ({ trigger }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);

  const { data: conversations, isLoading } = useConversations();
  const { hasKeys, initializeKeys, isInitializing } = useEncryptionKeys();

  const filteredConversations = conversations?.filter(c =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

  const handleConversationClick = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const handleNewConversation = (conversation: { 
    id: string; 
    participantId: string; 
    participantName: string; 
    participantAvatar: string | null;
  }) => {
    setActiveConversation({
      ...conversation,
      unreadCount: 0,
    });
    setShowNewConversation(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
              <MessageCircle className="w-5 h-5" />
              {totalUnread > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary rounded-full text-[10px] font-semibold flex items-center justify-center text-primary-foreground px-1 shadow-[0_0_10px_hsla(270,91%,65%,0.5)]"
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </motion.span>
              )}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
          {/* Header - iOS style */}
          <SheetHeader className="px-4 py-4 border-b border-border/50 bg-card/80 backdrop-blur-xl safe-top-padding">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_hsla(270,91%,65%,0.3)]">
                  <MessageCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <SheetTitle className="text-lg font-bold">Messages</SheetTitle>
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNewConversation(true)}
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-5 h-5 text-primary" />
              </motion.button>
            </div>
            {/* Security badge */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <Lock className="w-3 h-3" />
              <span>All messages are end-to-end encrypted</span>
            </div>
          </SheetHeader>

          {/* Search - Modern style */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10 rounded-full bg-muted/50 border-0 h-10 text-[15px] placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Initialize encryption - Modern card */}
          {!hasKeys && !isInitializing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 p-8"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center border border-border/50">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">Secure Messaging</h3>
                <p className="text-sm text-muted-foreground max-w-[260px]">
                  Enable end-to-end encryption to start private, secure conversations
                </p>
              </div>
              <Button onClick={initializeKeys} className="rounded-full px-8 shadow-[0_0_20px_hsla(270,91%,65%,0.3)]">
                <Lock className="w-4 h-4 mr-2" />
                Enable Encryption
              </Button>
            </motion.div>
          )}

          {isInitializing && (
            <div className="flex flex-col items-center gap-4 p-8">
              <div className="w-20 h-20 rounded-3xl bg-muted animate-pulse" />
              <Skeleton className="w-32 h-5" />
              <p className="text-sm text-muted-foreground">Setting up encryption...</p>
            </div>
          )}

          {/* Conversations list */}
          {hasKeys && (
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-14 h-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4 p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {searchQuery ? 'No results found' : 'No messages yet'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Try a different search' : 'Start a new conversation'}
                    </p>
                  </div>
                  {!searchQuery && (
                    <Button 
                      variant="outline" 
                      className="rounded-full"
                      onClick={() => setShowNewConversation(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Message
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="p-2">
                  <AnimatePresence>
                    {filteredConversations.map((conversation, index) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        onClick={() => handleConversationClick(conversation)}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Active chat */}
      {activeConversation && (
        <DMChatView
          conversationId={activeConversation.id}
          participantId={activeConversation.participantId}
          participantName={activeConversation.participantName}
          participantAvatar={activeConversation.participantAvatar}
          isOpen={!!activeConversation}
          onClose={() => setActiveConversation(null)}
        />
      )}

      {/* New conversation */}
      <NewConversationSheet
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onConversationCreated={handleNewConversation}
      />
    </>
  );
};

export default DMInbox;
