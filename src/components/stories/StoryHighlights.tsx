import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Highlight {
  id: string;
  name: string;
  cover_image: string | null;
  item_count: number;
}

interface StoryHighlightsProps {
  userId: string;
  isOwnProfile?: boolean;
}

const StoryHighlights: React.FC<StoryHighlightsProps> = ({ userId, isOwnProfile = false }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('story_highlights')
        .select(`
          id,
          name,
          cover_image,
          story_highlight_items(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHighlights(
        (data || []).map(h => ({
          id: h.id,
          name: h.name,
          cover_image: h.cover_image,
          item_count: (h.story_highlight_items as any)?.[0]?.count || 0
        }))
      );
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHighlight = async () => {
    if (!newHighlightName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('story_highlights')
        .insert({
          user_id: user.id,
          name: newHighlightName.trim()
        });

      if (error) throw error;

      toast.success(t('stories.highlightCreated'));
      setNewHighlightName('');
      setShowCreateDialog(false);
      fetchHighlights();
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast.error(t('stories.highlightError'));
    }
  };

  const handleUpdateHighlight = async () => {
    if (!editingHighlight || !newHighlightName.trim()) return;

    try {
      const { error } = await supabase
        .from('story_highlights')
        .update({ name: newHighlightName.trim() })
        .eq('id', editingHighlight.id);

      if (error) throw error;

      toast.success(t('stories.highlightUpdated'));
      setNewHighlightName('');
      setEditingHighlight(null);
      fetchHighlights();
    } catch (error) {
      console.error('Error updating highlight:', error);
      toast.error(t('stories.highlightError'));
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    try {
      const { error } = await supabase
        .from('story_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;

      toast.success(t('stories.highlightDeleted'));
      fetchHighlights();
    } catch (error) {
      console.error('Error deleting highlight:', error);
      toast.error(t('stories.highlightError'));
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-muted/50 animate-pulse" />
            <div className="w-12 h-3 rounded-full bg-muted/50 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* Create New Highlight Button (own profile only) */}
        {isOwnProfile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateDialog(true)}
            className="flex flex-col items-center gap-2 min-w-[64px]"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {t('stories.new')}
            </span>
          </motion.button>
        )}

        {/* Highlights */}
        {highlights.map((highlight) => (
          <motion.div
            key={highlight.id}
            className="flex flex-col items-center gap-2 min-w-[64px] relative group"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedHighlight(highlight)}
              className="relative"
            >
              <div className="w-16 h-16 rounded-full ring-2 ring-muted-foreground/20 overflow-hidden bg-muted">
                {highlight.cover_image ? (
                  <img
                    src={highlight.cover_image}
                    alt={highlight.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📸
                  </div>
                )}
              </div>
            </motion.button>
            
            <span className="text-[10px] text-foreground font-medium truncate max-w-[64px]">
              {highlight.name}
            </span>

            {isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute -top-1 -right-1 p-1 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingHighlight(highlight);
                      setNewHighlightName(highlight.name);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteHighlight(highlight.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </motion.div>
        ))}
      </div>

      {/* Create Highlight Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('stories.createHighlight')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newHighlightName}
              onChange={(e) => setNewHighlightName(e.target.value)}
              placeholder={t('stories.highlightName')}
              maxLength={30}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateHighlight} disabled={!newHighlightName.trim()}>
                {t('common.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Highlight Dialog */}
      <Dialog open={!!editingHighlight} onOpenChange={() => setEditingHighlight(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('stories.editHighlight')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newHighlightName}
              onChange={(e) => setNewHighlightName(e.target.value)}
              placeholder={t('stories.highlightName')}
              maxLength={30}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingHighlight(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateHighlight} disabled={!newHighlightName.trim()}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoryHighlights;