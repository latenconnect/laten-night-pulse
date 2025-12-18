import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Lock, Search, User, Plus } from 'lucide-react';
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
  onClick 
}: { 
  conversation: Conversation; 
  onClick: () => void;
}) => {
  const timeAgo = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
    : '';

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card/80 transition-colors text-left"
    >
      <Avatar className="w-12 h-12">
        <AvatarImage src={conversation.participantAvatar || undefined} />
        <AvatarFallback>
          <User className="w-5 h-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium truncate">{conversation.participantName}</h4>
          {timeAgo && (
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Lock className="w-3 h-3" />
          <span>Encrypted</span>
        </div>
      </div>
      {conversation.unreadCount > 0 && (
        <Badge variant="default" className="rounded-full px-2 py-0.5 text-xs">
          {conversation.unreadCount}
        </Badge>
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
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="w-5 h-5" />
              {(conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground">
                  {conversations?.reduce((sum, c) => sum + c.unreadCount, 0)}
                </span>
              )}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Messages
              </SheetTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNewConversation(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            {/* Security badge */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>End-to-end encrypted</span>
            </div>
          </SheetHeader>

          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Initialize encryption */}
          {!hasKeys && !isInitializing && (
            <div className="flex flex-col items-center gap-3 p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">Secure Messaging</h3>
              <p className="text-sm text-muted-foreground text-center">
                Set up end-to-end encryption to start private conversations
              </p>
              <Button onClick={initializeKeys} variant="neon">
                Enable Secure Messaging
              </Button>
            </div>
          )}

          {isInitializing && (
            <div className="flex flex-col items-center gap-3 p-6">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-32 h-4" />
              <p className="text-sm text-muted-foreground">Setting up encryption...</p>
            </div>
          )}

          {/* Conversations list */}
          {hasKeys && (
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowNewConversation(true)}
                  >
                    Start a conversation
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      onClick={() => handleConversationClick(conversation)}
                    />
                  ))}
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
