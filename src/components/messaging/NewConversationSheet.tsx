import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Lock, Loader2, ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCreateConversation } from '@/hooks/useDirectMessages';
import { cn } from '@/lib/utils';

interface NewConversationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: {
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar: string | null;
  }) => void;
}

interface UserResult {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  hasEncryption: boolean;
}

export const NewConversationSheet: React.FC<NewConversationSheetProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const createConversation = useCreateConversation();

  // Search users
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];

      // Search profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .neq('id', user?.id)
        .ilike('display_name', `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      // Check which users have encryption set up
      const userIds = profiles.map(p => p.id);
      const { data: encryptionKeys } = await supabase
        .from('user_encryption_keys')
        .select('user_id')
        .in('user_id', userIds);

      const encryptedUserIds = new Set(encryptionKeys?.map(k => k.user_id) || []);

      return profiles.map(p => ({
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        hasEncryption: encryptedUserIds.has(p.id),
      })) as UserResult[];
    },
    enabled: searchQuery.length >= 2,
  });

  const handleStartConversation = async (selectedUser: UserResult) => {
    try {
      const conversation = await createConversation.mutateAsync(selectedUser.id);
      
      onConversationCreated({
        id: conversation.id,
        participantId: selectedUser.id,
        participantName: selectedUser.display_name || 'Unknown User',
        participantAvatar: selectedUser.avatar_url,
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
        {/* Header - iOS style */}
        <SheetHeader className="px-2 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl safe-top-padding">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <SheetTitle className="text-lg font-bold">New Message</SheetTitle>
          </div>
        </SheetHeader>

        {/* Search - Modern style */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="pl-10 rounded-full bg-muted/50 border-0 h-10 text-[15px] placeholder:text-muted-foreground/60"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          {searchQuery.length < 2 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Search for people</p>
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            </motion.div>
          ) : isLoading ? (
            <div className="flex justify-center p-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Loader2 className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          ) : searchResults?.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {searchResults?.map((result, index) => (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 500, damping: 30 }}
                    onClick={() => handleStartConversation(result)}
                    disabled={createConversation.isPending}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-all text-left group',
                      createConversation.isPending && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={result.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-medium">
                          {(result.display_name || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {result.hasEncryption && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate text-[15px]">
                        {result.display_name || 'Unknown User'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[12px]">
                        {result.hasEncryption ? (
                          <span className="text-green-500 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Secure messaging ready
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Encryption not enabled
                          </span>
                        )}
                      </div>
                    </div>
                    {createConversation.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NewConversationSheet;
