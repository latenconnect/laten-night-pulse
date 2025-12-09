import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserMinus, Users, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFriends, UserProfile } from '@/hooks/useFriends';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

const FriendsSearch: React.FC = () => {
  const { user } = useAuth();
  const {
    followers,
    following,
    friends,
    pendingRequests,
    loading,
    followUser,
    unfollowUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    getConnectionStatus
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      setSearching(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleFollow = async (userId: string) => {
    setActionLoading(userId);
    await followUser(userId);
    setActionLoading(null);
  };

  const handleUnfollow = async (userId: string) => {
    setActionLoading(userId);
    await unfollowUser(userId);
    setActionLoading(null);
  };

  const handleSendFriendRequest = async (userId: string) => {
    setActionLoading(userId);
    await sendFriendRequest(userId);
    setActionLoading(null);
  };

  const handleAccept = async (connectionId: string, requesterId: string) => {
    setActionLoading(connectionId);
    await acceptFriendRequest(connectionId, requesterId);
    setActionLoading(null);
  };

  const handleReject = async (connectionId: string) => {
    setActionLoading(connectionId);
    await rejectFriendRequest(connectionId);
    setActionLoading(null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect with Friends</h3>
        <p className="text-muted-foreground">Log in to find and connect with friends</p>
      </div>
    );
  }

  const renderUserCard = (
    profile: UserProfile,
    showConnectionButtons = true
  ) => {
    const { isFollowing, isFriend, hasPendingRequest } = getConnectionStatus(profile.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              {(profile.display_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{profile.display_name || 'User'}</p>
            {profile.city && (
              <p className="text-sm text-muted-foreground">{profile.city}</p>
            )}
          </div>
        </div>

        {showConnectionButtons && (
          <div className="flex gap-2">
            {isFriend ? (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                Friends
              </Badge>
            ) : hasPendingRequest ? (
              <Badge variant="outline">Request Sent</Badge>
            ) : isFollowing ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnfollow(profile.id)}
                  disabled={actionLoading === profile.id}
                >
                  {actionLoading === profile.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSendFriendRequest(profile.id)}
                  disabled={actionLoading === profile.id}
                >
                  Add Friend
                </Button>
              </div>
            ) : (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFollow(profile.id)}
                  disabled={actionLoading === profile.id}
                >
                  {actionLoading === profile.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Follow'
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSendFriendRequest(profile.id)}
                  disabled={actionLoading === profile.id}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for friends..."
          className="pl-10"
        />
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchQuery.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {searching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(profile => (
                <div key={profile.id}>
                  {renderUserCard(profile)}
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                No users found
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connections Tabs */}
      {!searchQuery && (
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="requests" className="relative">
              Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-4 space-y-2">
            {pendingRequests.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No pending friend requests
              </p>
            ) : (
              pendingRequests.map(request => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(request.profile?.display_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.profile?.display_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(request.id, request.follower_id)}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="friends" className="mt-4 space-y-2">
            {friends.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No friends yet. Send friend requests to connect!
              </p>
            ) : (
              friends.map(friend => (
                <div key={friend.id}>
                  {friend.profile && renderUserCard(friend.profile, false)}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-4 space-y-2">
            {following.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                You're not following anyone yet
              </p>
            ) : (
              following.map(conn => (
                <div key={conn.id}>
                  {conn.profile && renderUserCard(conn.profile)}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4 space-y-2">
            {followers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No followers yet
              </p>
            ) : (
              followers.map(conn => (
                <div key={conn.id}>
                  {conn.profile && renderUserCard(conn.profile)}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default FriendsSearch;
