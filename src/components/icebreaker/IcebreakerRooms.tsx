import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, UserPlus, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIcebreakerRooms, useIcebreakerChat, IcebreakerRoom } from '@/hooks/useIcebreakerRooms';
import { useAuth } from '@/context/AuthContext';

interface IcebreakerRoomsProps {
  eventId: string;
  variant?: 'compact' | 'full';
}

export const IcebreakerRooms: React.FC<IcebreakerRoomsProps> = ({ 
  eventId,
  variant = 'compact' 
}) => {
  const { rooms, loading, joinRoom } = useIcebreakerRooms(eventId);
  const [activeRoom, setActiveRoom] = useState<IcebreakerRoom | null>(null);

  const getRoomIcon = (type: IcebreakerRoom['room_type']) => {
    switch (type) {
      case 'rave_squad': return '🎉';
      case 'ride_share': return '🚗';
      case 'first_timers': return '👋';
      case 'solo_goers': return '🦸';
      default: return '💬';
    }
  };

  const getRoomColor = (type: IcebreakerRoom['room_type']) => {
    switch (type) {
      case 'rave_squad': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
      case 'ride_share': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'first_timers': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'solo_goers': return 'from-orange-500/20 to-amber-500/20 border-orange-500/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-muted rounded-lg" />
            <div className="h-12 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact' && rooms.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <span className="text-lg">Find Your Squad</span>
            </div>
            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">
              {rooms.length} rooms
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rooms.length > 0 ? (
            rooms.map(room => (
              <motion.button
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveRoom(room)}
                className={`w-full p-3 rounded-xl bg-gradient-to-r ${getRoomColor(room.room_type)} border flex items-center gap-3 text-left`}
              >
                <div className="text-2xl">{getRoomIcon(room.room_type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{room.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {room.member_count || 0}/{room.max_members} members
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat rooms yet</p>
              <p className="text-xs">The host hasn't created any icebreaker rooms</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!activeRoom} onOpenChange={() => setActiveRoom(null)}>
        <SheetContent side="bottom" className="h-[85vh]">
          {activeRoom && (
            <IcebreakerChatView 
              room={activeRoom} 
              onJoin={() => joinRoom(activeRoom.id)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

interface IcebreakerChatViewProps {
  room: IcebreakerRoom;
  onJoin: () => Promise<boolean>;
}

const IcebreakerChatView: React.FC<IcebreakerChatViewProps> = ({ room, onJoin }) => {
  const { user } = useAuth();
  const { messages, members, loading, sendMessage } = useIcebreakerChat(room.id);
  const [newMessage, setNewMessage] = useState('');
  const [joined, setJoined] = useState(false);

  const isMember = members.some(m => m.user_id === user?.id);

  const handleJoin = async () => {
    const success = await onJoin();
    if (success) setJoined(true);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-4">
        <SheetTitle className="flex items-center gap-2">
          <span className="text-xl">{room.room_type === 'rave_squad' ? '🎉' : '💬'}</span>
          {room.name}
        </SheetTitle>
        {room.description && (
          <p className="text-sm text-muted-foreground">{room.description}</p>
        )}
      </SheetHeader>

      {/* Members bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {members.length} members:
        </span>
        <div className="flex -space-x-2">
          {members.slice(0, 8).map(member => (
            <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {member.profile?.display_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
          ))}
          {members.length > 8 && (
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
              +{members.length - 8}
            </div>
          )}
        </div>
      </div>

      {!isMember && !joined ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Join this chat room</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect with others heading to this event
          </p>
          <Button onClick={handleJoin}>
            <UserPlus className="h-4 w-4 mr-2" />
            Join Room
          </Button>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 py-2">
              {messages.map(msg => {
                const isOwn = msg.user_id === user?.id;
                
                return (
                  <div 
                    key={msg.id}
                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {msg.profile?.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] ${isOwn ? 'text-right' : ''}`}>
                      {!isOwn && (
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {msg.profile?.display_name || 'Anonymous'}
                        </p>
                      )}
                      <div className={`inline-block px-3 py-2 rounded-2xl ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground rounded-br-md' 
                          : 'bg-muted rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!newMessage.trim()}>
                Send
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
