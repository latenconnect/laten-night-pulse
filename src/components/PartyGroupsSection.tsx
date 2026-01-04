import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Calendar, MapPin, ChevronRight, Music, Check, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePartyGroups, PartyGroup } from '@/hooks/usePartyGroups';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreatePartyGroupSheet from './CreatePartyGroupSheet';

interface PartyGroupsSectionProps {
  eventId?: string;
  eventName?: string;
  compact?: boolean;
}

const PartyGroupsSection: React.FC<PartyGroupsSectionProps> = ({
  eventId,
  eventName,
  compact = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groups, pendingInvites, loading, respondToInvite, refetch } = usePartyGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!user) return null;

  const handleAcceptInvite = async (memberId: string) => {
    await respondToInvite(memberId, 'accepted');
  };

  const handleDeclineInvite = async (memberId: string) => {
    await respondToInvite(memberId, 'declined');
  };

  const hasPendingInvites = pendingInvites.length > 0;

  if (compact) {
    return (
      <>
        <Sheet>
          <SheetTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              <span>Go with friends</span>
              {hasPendingInvites && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingInvites.length}
                </span>
              )}
            </motion.button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Party Groups</SheetTitle>
            </SheetHeader>
            <GroupsContent
              groups={groups}
              pendingInvites={pendingInvites}
              loading={loading}
              onAccept={handleAcceptInvite}
              onDecline={handleDeclineInvite}
              onCreateClick={() => setIsCreateOpen(true)}
              navigate={navigate}
            />
          </SheetContent>
        </Sheet>
        <CreatePartyGroupSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          eventId={eventId}
          eventName={eventName}
          onGroupCreated={refetch}
        />
      </>
    );
  }

  return (
    <section className="mb-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Party Groups</h2>
            <p className="text-xs text-muted-foreground">Plan events with friends</p>
          </div>
        </div>
        {hasPendingInvites && (
          <Badge variant="destructive" className="animate-pulse">
            {pendingInvites.length} invite{pendingInvites.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Pending Invites */}
      <AnimatePresence>
        {pendingInvites.map(invite => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  You're invited to a group
                </p>
                <p className="text-xs text-muted-foreground">
                  Tap to accept or decline
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeclineInvite(invite.id)}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvite(invite.id)}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Groups List */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-64 h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6 px-4"
        >
          <div className="p-4 rounded-full bg-muted inline-block mb-3">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Create a group to plan parties with friends
          </p>
          <Button size="sm" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </motion.div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Create New Card */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsCreateOpen(true)}
            className="flex-shrink-0 w-24 h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Plus className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">New</span>
          </motion.div>

          {/* Group Cards */}
          {groups.map((group, index) => (
            <GroupCard key={group.id} group={group} index={index} navigate={navigate} />
          ))}
        </div>
      )}

      {/* Create Party Group Sheet */}
      <CreatePartyGroupSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        eventId={eventId}
        eventName={eventName}
        onGroupCreated={refetch}
      />
    </section>
  );
};

interface GroupCardProps {
  group: PartyGroup;
  index: number;
  navigate: (path: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, index, navigate }) => {
  const displayMembers = group.members?.slice(0, 4) || [];
  const extraCount = (group.member_count || 1) - 4;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/groups/${group.id}`)}
      className="flex-shrink-0 w-64 p-4 rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/30 transition-colors"
    >
      {/* Header with Cover Image or Icon */}
      <div className="flex items-start gap-3 mb-3">
        {group.cover_image ? (
          <Avatar className="w-12 h-12 rounded-xl">
            <AvatarImage src={group.cover_image} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
              {group.name[0]}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
          <p className="text-xs text-muted-foreground">
            {group.member_count || 1} member{(group.member_count || 1) > 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      {/* Genres */}
      {group.genres && group.genres.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {group.genres.slice(0, 2).map(genre => (
            <Badge key={genre} variant="secondary" className="text-xs px-2 py-0">
              <Music className="w-2.5 h-2.5 mr-1" />
              {genre}
            </Badge>
          ))}
          {group.genres.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              +{group.genres.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Event or Venue */}
      {group.event ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3 h-3" />
          <span className="truncate">{group.event.name}</span>
        </div>
      ) : group.preferred_venue ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{group.preferred_venue.name}</span>
        </div>
      ) : null}

      {/* Member Avatars */}
      {displayMembers.length > 0 && (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {displayMembers.map((member, i) => (
              <Avatar key={member.user_id} className="w-7 h-7 border-2 border-card">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {member.profile?.display_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {extraCount > 0 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                <span className="text-xs text-muted-foreground">+{extraCount}</span>
              </div>
            )}
          </div>
          <span className="ml-2 text-xs text-muted-foreground">Members</span>
        </div>
      )}
    </motion.div>
  );
};

interface GroupsContentProps {
  groups: PartyGroup[];
  pendingInvites: Array<{ id: string }>;
  loading: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCreateClick: () => void;
  navigate: (path: string) => void;
}

const GroupsContent: React.FC<GroupsContentProps> = ({
  groups,
  pendingInvites,
  loading,
  onAccept,
  onDecline,
  onCreateClick,
  navigate
}) => {
  return (
    <div className="mt-6 space-y-4 overflow-y-auto max-h-[60vh]">
      {/* Pending Invites */}
      {pendingInvites.map(invite => (
        <div
          key={invite.id}
          className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between"
        >
          <span className="text-sm font-medium">Group Invite</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => onDecline(invite.id)}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => onAccept(invite.id)}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Create Button */}
      <Button onClick={onCreateClick} variant="outline" className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Create New Group
      </Button>

      {/* Groups List */}
      {groups.map(group => (
        <div
          key={group.id}
          onClick={() => navigate(`/groups/${group.id}`)}
          className="p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {group.cover_image ? (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={group.cover_image} />
                  <AvatarFallback>{group.name[0]}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {group.member_count || 1} members
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          
          {/* Member Avatars */}
          {group.members && group.members.length > 0 && (
            <div className="flex -space-x-2 mt-2">
              {group.members.slice(0, 5).map((member) => (
                <Avatar key={member.user_id} className="w-6 h-6 border-2 border-card">
                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.profile?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PartyGroupsSection;
