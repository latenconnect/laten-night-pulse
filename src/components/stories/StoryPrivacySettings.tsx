import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserMinus, Plus, X, Search, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface StoryPrivacySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoryPrivacySettings: React.FC<StoryPrivacySettingsProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [closeFriends, setCloseFriends] = useState<UserProfile[]>([]);
  const [hiddenUsers, setHiddenUsers] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('close_friends');

  useEffect(() => {
    if (open && user) {
      fetchPrivacySettings();
    }
  }, [open, user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch close friends
      const { data: closeFriendsData } = await supabase
        .from('close_friends')
        .select('friend_id')
        .eq('user_id', user.id);

      if (closeFriendsData && closeFriendsData.length > 0) {
        const friendIds = closeFriendsData.map(cf => cf.friend_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', friendIds);
        setCloseFriends(profiles || []);
      } else {
        setCloseFriends([]);
      }

      // Fetch hidden users
      const { data: hiddenData } = await supabase
        .from('story_hidden_from')
        .select('hidden_user_id')
        .eq('user_id', user.id);

      if (hiddenData && hiddenData.length > 0) {
        const hiddenIds = hiddenData.map(h => h.hidden_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', hiddenIds);
        setHiddenUsers(profiles || []);
      } else {
        setHiddenUsers([]);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .neq('id', user?.id)
        .ilike('display_name', `%${query}%`)
        .limit(10);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addCloseFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('close_friends')
        .insert({
          user_id: user.id,
          friend_id: friendId
        });

      if (error) throw error;

      toast.success(t('stories.addedToCloseFriends'));
      fetchPrivacySettings();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding close friend:', error);
      toast.error(t('common.error'));
    }
  };

  const removeCloseFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('close_friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);

      if (error) throw error;

      toast.success(t('stories.removedFromCloseFriends'));
      fetchPrivacySettings();
    } catch (error) {
      console.error('Error removing close friend:', error);
      toast.error(t('common.error'));
    }
  };

  const hideFromUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('story_hidden_from')
        .insert({
          user_id: user.id,
          hidden_user_id: userId
        });

      if (error) throw error;

      toast.success(t('stories.hiddenFromUser'));
      fetchPrivacySettings();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error hiding from user:', error);
      toast.error(t('common.error'));
    }
  };

  const unhideFromUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('story_hidden_from')
        .delete()
        .eq('user_id', user.id)
        .eq('hidden_user_id', userId);

      if (error) throw error;

      toast.success(t('stories.unhiddenFromUser'));
      fetchPrivacySettings();
    } catch (error) {
      console.error('Error unhiding from user:', error);
      toast.error(t('common.error'));
    }
  };

  const isCloseFriend = (userId: string) => closeFriends.some(cf => cf.id === userId);
  const isHidden = (userId: string) => hiddenUsers.some(h => h.id === userId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>{t('stories.privacySettings')}</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="close_friends" className="gap-2">
              <Users className="w-4 h-4" />
              {t('stories.closeFriends')}
            </TabsTrigger>
            <TabsTrigger value="hidden" className="gap-2">
              <UserMinus className="w-4 h-4" />
              {t('stories.hiddenFrom')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="close_friends" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('stories.closeFriendsDescription')}
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('stories.searchUsers')}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {(profile.display_name || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {profile.display_name || 'User'}
                      </span>
                    </div>
                    {isCloseFriend(profile.id) ? (
                      <Button size="sm" variant="ghost" disabled>
                        <Check className="w-4 h-4 text-primary" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addCloseFriend(profile.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Current Close Friends */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('stories.yourCloseFriends')} ({closeFriends.length})
              </h4>
              {closeFriends.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('stories.noCloseFriends')}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {closeFriends.map((friend) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback>
                            {(friend.display_name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {friend.display_name || 'User'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCloseFriend(friend.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hidden" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('stories.hiddenFromDescription')}
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('stories.searchUsers')}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {(profile.display_name || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {profile.display_name || 'User'}
                      </span>
                    </div>
                    {isHidden(profile.id) ? (
                      <Button size="sm" variant="ghost" disabled>
                        <Check className="w-4 h-4 text-primary" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => hideFromUser(profile.id)}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Currently Hidden Users */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('stories.hiddenFromList')} ({hiddenUsers.length})
              </h4>
              {hiddenUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('stories.noHiddenUsers')}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {hiddenUsers.map((hiddenUser) => (
                    <motion.div
                      key={hiddenUser.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={hiddenUser.avatar_url || undefined} />
                          <AvatarFallback>
                            {(hiddenUser.display_name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {hiddenUser.display_name || 'User'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => unhideFromUser(hiddenUser.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default StoryPrivacySettings;