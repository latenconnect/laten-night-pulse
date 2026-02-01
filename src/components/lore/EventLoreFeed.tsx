import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Image, Plus, X, Play, Eye, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useEventLore, LoreClip } from '@/hooks/useEventLore';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface EventLoreFeedProps {
  eventId: string;
  variant?: 'compact' | 'full';
}

export const EventLoreFeed: React.FC<EventLoreFeedProps> = ({ 
  eventId,
  variant = 'full' 
}) => {
  const { user } = useAuth();
  const { clips, loading, uploadClip, deleteClip, incrementViewCount } = useEventLore(eventId);
  const [selectedClip, setSelectedClip] = useState<LoreClip | null>(null);
  const [showUploadSheet, setShowUploadSheet] = useState(false);

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="animate-pulse flex gap-3 overflow-x-auto">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-20 h-28 rounded-xl bg-muted flex-shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-purple-400" />
            <span className="font-semibold text-sm">Event Lore</span>
            {clips.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {clips.length} clips
              </Badge>
            )}
          </div>
          
          <Sheet open={showUploadSheet} onOpenChange={setShowUploadSheet}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh]">
              <UploadClipForm 
                onUpload={async (file, caption, type) => {
                  await uploadClip(file, caption, type);
                  setShowUploadSheet(false);
                }}
              />
            </SheetContent>
          </Sheet>
        </div>

        {clips.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {clips.map(clip => (
              <ClipThumbnail 
                key={clip.id} 
                clip={clip} 
                onClick={() => {
                  setSelectedClip(clip);
                  incrementViewCount(clip.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No vibe clips yet</p>
            <p className="text-xs">Be the first to capture the moment!</p>
          </div>
        )}

        <ClipViewerSheet 
          clip={selectedClip}
          isOwner={selectedClip?.user_id === user?.id}
          onClose={() => setSelectedClip(null)}
          onDelete={async () => {
            if (selectedClip) {
              await deleteClip(selectedClip.id);
              setSelectedClip(null);
            }
          }}
        />
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-400" />
            Event Lore
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
              24h
            </Badge>
          </div>
          
          <Sheet open={showUploadSheet} onOpenChange={setShowUploadSheet}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Clip
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <SheetTitle>Share a vibe clip</SheetTitle>
              </SheetHeader>
              <UploadClipForm 
                onUpload={async (file, caption, type) => {
                  await uploadClip(file, caption, type);
                  setShowUploadSheet(false);
                }}
              />
            </SheetContent>
          </Sheet>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clips.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {clips.map(clip => (
              <ClipThumbnail 
                key={clip.id} 
                clip={clip} 
                size="large"
                onClick={() => {
                  setSelectedClip(clip);
                  incrementViewCount(clip.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No vibe clips yet</p>
            <p className="text-xs mt-1">Capture the moment - clips expire 24h after the event!</p>
          </div>
        )}

        <ClipViewerSheet 
          clip={selectedClip}
          isOwner={selectedClip?.user_id === user?.id}
          onClose={() => setSelectedClip(null)}
          onDelete={async () => {
            if (selectedClip) {
              await deleteClip(selectedClip.id);
              setSelectedClip(null);
            }
          }}
        />
      </CardContent>
    </Card>
  );
};

interface ClipThumbnailProps {
  clip: LoreClip;
  size?: 'small' | 'large';
  onClick: () => void;
}

const ClipThumbnail: React.FC<ClipThumbnailProps> = ({ clip, size = 'small', onClick }) => {
  const isVideo = clip.media_type === 'video';
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden flex-shrink-0 bg-muted ${
        size === 'large' ? 'aspect-[9/16]' : 'w-20 h-28'
      }`}
    >
      {isVideo ? (
        <video 
          src={clip.media_url} 
          className="absolute inset-0 w-full h-full object-cover"
          muted
        />
      ) : (
        <img 
          src={clip.media_url} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {isVideo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Play className="h-6 w-6 text-white/80 fill-white/80" />
        </div>
      )}
      
      <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1">
        <Avatar className="h-4 w-4 border border-white/30">
          <AvatarImage src={clip.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-[8px]">
            {clip.profile?.display_name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-0.5 text-[10px] text-white/80">
          <Eye className="h-2.5 w-2.5" />
          {clip.view_count}
        </div>
      </div>
    </motion.button>
  );
};

interface ClipViewerSheetProps {
  clip: LoreClip | null;
  isOwner: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

const ClipViewerSheet: React.FC<ClipViewerSheetProps> = ({ clip, isOwner, onClose, onDelete }) => {
  if (!clip) return null;
  
  const isVideo = clip.media_type === 'video';

  return (
    <Sheet open={!!clip} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <div className="relative h-full bg-black">
          {isVideo ? (
            <video 
              src={clip.media_url}
              className="absolute inset-0 w-full h-full object-contain"
              controls
              autoPlay
            />
          ) : (
            <img 
              src={clip.media_url}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            {isOwner && (
              <Button 
                size="icon" 
                variant="ghost"
                className="bg-black/50 hover:bg-red-500/50"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="icon" 
              variant="ghost"
              className="bg-black/50"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-8 w-8 border-2 border-white/30">
                <AvatarImage src={clip.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {clip.profile?.display_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-white">
                  {clip.profile?.display_name || 'Anonymous'}
                </p>
                <p className="text-xs text-white/60">
                  {formatDistanceToNow(new Date(clip.created_at))} ago
                </p>
              </div>
            </div>
            
            {clip.caption && (
              <p className="text-sm text-white/90">{clip.caption}</p>
            )}
            
            <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {clip.view_count} views
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires {formatDistanceToNow(new Date(clip.expires_at))}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface UploadClipFormProps {
  onUpload: (file: File, caption: string, type: 'video' | 'image' | 'meme') => Promise<void>;
}

const UploadClipForm: React.FC<UploadClipFormProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setMediaType(selectedFile.type.startsWith('video') ? 'video' : 'image');
    
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await onUpload(file, caption, mediaType);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative aspect-[9/16] max-h-[40vh] rounded-xl overflow-hidden bg-black mx-auto">
          {mediaType === 'video' ? (
            <video src={preview} className="w-full h-full object-contain" controls />
          ) : (
            <img src={preview} alt="" className="w-full h-full object-contain" />
          )}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-black/50"
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="aspect-[9/16] max-h-[40vh] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex gap-4 mb-3">
            <div className="p-3 rounded-full bg-purple-500/20">
              <Video className="h-6 w-6 text-purple-400" />
            </div>
            <div className="p-3 rounded-full bg-pink-500/20">
              <Image className="h-6 w-6 text-pink-400" />
            </div>
          </div>
          <p className="text-sm font-medium">Tap to select</p>
          <p className="text-xs text-muted-foreground">Video or photo up to 50MB</p>
        </div>
      )}

      <Input
        placeholder="Add a caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={150}
      />

      <Button 
        className="w-full" 
        disabled={!file || uploading}
        onClick={handleUpload}
      >
        {uploading ? 'Uploading...' : 'Share Vibe Clip'}
      </Button>
    </div>
  );
};
