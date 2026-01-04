import React, { useState, useRef } from 'react';
import { Camera, Music, MapPin, X, Upload, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface CreatePartyGroupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventName?: string;
  onGroupCreated: () => void;
}

const MUSIC_GENRES = [
  'House', 'Techno', 'Hip-Hop', 'R&B', 'EDM', 'Afrobeats',
  'Reggaeton', 'Latin', 'Pop', 'Rock', 'Disco', 'Drum & Bass',
  'Trance', 'Deep House', 'Commercial', 'Open Format'
];

interface Club {
  id: string;
  name: string;
  city: string;
  photos: string[] | null;
}

const CreatePartyGroupSheet: React.FC<CreatePartyGroupSheetProps> = ({
  open,
  onOpenChange,
  eventId,
  eventName,
  onGroupCreated
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Club | null>(null);
  const [venueSearch, setVenueSearch] = useState('');
  const [venueResults, setVenueResults] = useState<Club[]>([]);
  const [isSearchingVenue, setIsSearchingVenue] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showVenueSearch, setShowVenueSearch] = useState(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : prev.length < 5 ? [...prev, genre] : prev
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCoverImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const searchVenues = async (query: string) => {
    if (query.length < 2) {
      setVenueResults([]);
      return;
    }

    setIsSearchingVenue(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, city, photos')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(5);

      if (error) throw error;
      setVenueResults(data || []);
    } catch (error) {
      console.error('Error searching venues:', error);
    } finally {
      setIsSearchingVenue(false);
    }
  };

  const handleVenueSearchChange = (value: string) => {
    setVenueSearch(value);
    searchVenues(value);
  };

  const selectVenue = (venue: Club) => {
    setSelectedVenue(venue);
    setVenueSearch('');
    setVenueResults([]);
    setShowVenueSearch(false);
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImageFile || !user) return null;

    const fileExt = coverImageFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `party-groups/${fileName}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, coverImageFile, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  };

  const handleCreate = async () => {
    if (!name.trim() || !user) return;

    setIsCreating(true);
    try {
      // Upload cover image if provided
      let coverImageUrl = null;
      if (coverImageFile) {
        coverImageUrl = await uploadCoverImage();
      }

      // Create the group
      const { data, error } = await supabase
        .from('party_groups')
        .insert({
          name: name.trim(),
          event_id: eventId || null,
          description: eventId ? `Going to ${eventName}` : null,
          created_by: user.id,
          cover_image: coverImageUrl,
          genres: selectedGenres,
          preferred_venue_id: selectedVenue?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase.from('party_group_members').insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin',
        status: 'accepted',
        joined_at: new Date().toISOString()
      });

      toast.success('Group created!');
      
      // Reset form
      setName('');
      setSelectedGenres([]);
      setCoverImage(null);
      setCoverImageFile(null);
      setSelectedVenue(null);
      
      onGroupCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Create Party Group</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] mt-4 pr-2">
          <div className="space-y-6 pb-6">
            {/* Cover Image Upload */}
            <div className="flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden group"
              >
                {coverImage ? (
                  <>
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                  </div>
                )}
              </button>
              <p className="text-xs text-muted-foreground mt-2">Group profile picture</p>
            </div>

            {/* Group Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Group Name
              </label>
              <Input
                placeholder="e.g., Friday Squad"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Genres Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Music className="w-4 h-4 inline mr-1" />
                Music Interests (max 5)
              </label>
              <div className="flex flex-wrap gap-2">
                {MUSIC_GENRES.map(genre => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedGenres.includes(genre)
                        ? 'bg-primary hover:bg-primary/90'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Venue Selection (Optional) */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <MapPin className="w-4 h-4 inline mr-1" />
                Favorite Venue (optional)
              </label>
              
              {selectedVenue ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedVenue.photos?.[0]} />
                    <AvatarFallback>{selectedVenue.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{selectedVenue.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedVenue.city}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVenue(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search for a venue..."
                    value={venueSearch}
                    onChange={e => handleVenueSearchChange(e.target.value)}
                    onFocus={() => setShowVenueSearch(true)}
                  />
                  {isSearchingVenue && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  
                  {showVenueSearch && venueResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {venueResults.map(venue => (
                        <button
                          key={venue.id}
                          onClick={() => selectVenue(venue)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={venue.photos?.[0]} />
                            <AvatarFallback>{venue.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{venue.name}</p>
                            <p className="text-xs text-muted-foreground">{venue.city}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linked Event Info */}
            {eventId && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  Linked to event: {eventName}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Create Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreatePartyGroupSheet;
