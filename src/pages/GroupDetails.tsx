import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, MapPin, UserPlus, MoreVertical, Trash2, LogOut, Share2, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePartyGroups, usePartyGroupMembers } from '@/hooks/usePartyGroups';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import MobileLayout from '@/components/layouts/MobileLayout';

const GroupDetails: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, inviteToGroup, leaveGroup, deleteGroup, setGroupEvent } = usePartyGroups();
  const { members, loading: membersLoading } = usePartyGroupMembers(groupId || '');
  const { following } = useFriends();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const group = groups.find(g => g.id === groupId);
  const isCreator = group?.created_by === user?.id;
  const isAdmin = members.some(m => m.user_id === user?.id && m.role === 'admin');

  if (!group) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Group not found</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
            Go back
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const handleInvite = async () => {
    if (selectedFriends.length === 0) return;
    
    const success = await inviteToGroup(group.id, selectedFriends);
    if (success) {
      setSelectedFriends([]);
      setIsInviteOpen(false);
    }
  };

  const handleLeave = async () => {
    if (isCreator) {
      const confirmed = window.confirm('This will delete the group. Are you sure?');
      if (confirmed) {
        await deleteGroup(group.id);
        navigate('/explore');
      }
    } else {
      await leaveGroup(group.id);
      navigate('/explore');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/groups/${group.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: `Join my party group: ${group.name}`,
          url: shareUrl
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    }
  };

  const toggleFriendSelection = (userId: string) => {
    setSelectedFriends(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter friends not already in group
  const memberIds = new Set(members.map(m => m.user_id));
  const availableFriends = following.filter(f => {
    const targetId = f.following_id;
    return !memberIds.has(targetId) &&
      f.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const acceptedMembers = members.filter(m => m.status === 'accepted');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">{group.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {acceptedMembers.length + 1} members
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Group
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLeave}
                  className="text-destructive focus:text-destructive"
                >
                  {isCreator ? (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Group
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Group
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Event Card */}
          {group.event ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/event/${group.event!.id}`)}
              className="p-4 rounded-2xl bg-primary/5 border border-primary/20 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                <Calendar className="w-4 h-4" />
                Linked Event
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {group.event.name}
              </h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{format(new Date(group.event.start_time), 'MMM d, HH:mm')}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {group.event.location_name}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="p-4 rounded-2xl bg-muted/30 border border-dashed border-border text-center">
              <Link className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No event linked yet
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/explore')}
              >
                Browse Events
              </Button>
            </div>
          )}

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Members</h2>
              {isAdmin && (
                <Sheet open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                    <SheetHeader>
                      <SheetTitle>Invite Friends</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <Input
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                      
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {availableFriends.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            No friends to invite
                          </p>
                        ) : (
                          availableFriends.map(friend => (
                            <div
                              key={friend.id}
                              onClick={() => toggleFriendSelection(friend.following_id)}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                selectedFriends.includes(friend.following_id)
                                  ? 'bg-primary/10 border border-primary/30'
                                  : 'bg-card border border-border hover:border-primary/20'
                              }`}
                            >
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={friend.profile?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {friend.profile?.display_name?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium flex-1">
                                {friend.profile?.display_name || 'Unknown'}
                              </span>
                              {selectedFriends.includes(friend.following_id) && (
                                <Badge variant="secondary">Selected</Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleInvite}
                        disabled={selectedFriends.length === 0}
                      >
                        Invite {selectedFriends.length > 0 ? `(${selectedFriends.length})` : ''}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            <div className="space-y-2">
              {/* Creator */}
              {members.filter(m => m.role === 'admin').map(member => (
                <MemberRow key={member.id} member={member} isCreator />
              ))}

              {/* Accepted Members */}
              {acceptedMembers.filter(m => m.role !== 'admin').map(member => (
                <MemberRow key={member.id} member={member} />
              ))}

              {/* Pending Members */}
              {pendingMembers.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground pt-2">Pending</p>
                  {pendingMembers.map(member => (
                    <MemberRow key={member.id} member={member} pending />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

interface MemberRowProps {
  member: {
    id: string;
    profile?: {
      display_name: string | null;
      avatar_url: string | null;
    };
    role: string;
  };
  isCreator?: boolean;
  pending?: boolean;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, isCreator, pending }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border ${pending ? 'opacity-50' : ''}`}>
      <Avatar className="w-10 h-10">
        <AvatarImage src={member.profile?.avatar_url || undefined} />
        <AvatarFallback>
          {member.profile?.display_name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {member.profile?.display_name || 'Unknown'}
        </p>
        {isCreator && (
          <p className="text-xs text-muted-foreground">Creator</p>
        )}
        {pending && (
          <p className="text-xs text-muted-foreground">Invite pending</p>
        )}
      </div>
      {isCreator && (
        <Badge variant="outline" className="text-xs">Admin</Badge>
      )}
    </div>
  );
};

export default GroupDetails;
