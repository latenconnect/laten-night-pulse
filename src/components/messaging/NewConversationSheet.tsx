import React, { useState } from 'react';
import { Search, User, Lock, Loader2 } from 'lucide-react';
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
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
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
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>New Message</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          {searchQuery.length < 2 ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Type at least 2 characters to search
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : searchResults?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <User className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {searchResults?.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleStartConversation(result)}
                  disabled={createConversation.isPending}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card/80 transition-colors text-left',
                    createConversation.isPending && 'opacity-50'
                  )}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={result.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {result.display_name || 'Unknown User'}
                    </h4>
                    <div className="flex items-center gap-1 text-xs">
                      {result.hasEncryption ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Secure messaging ready
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Encryption not set up
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NewConversationSheet;
