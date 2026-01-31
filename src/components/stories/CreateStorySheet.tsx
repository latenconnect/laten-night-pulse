import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStories } from '@/hooks/useStories';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Camera, Video, Type, Sticker, MapPin, AtSign, Clock, 
  X, Send, Loader2, Palette, AlignCenter, ChevronDown,
  Users, Lock, Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface CreateStorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEXT_FONTS = [
  { value: 'default', label: 'Classic' },
  { value: 'serif', label: 'Elegant' },
  { value: 'mono', label: 'Typewriter' }
];

const TEXT_SIZES = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' }
];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', 
  '#FFE66D', '#95E1D3', '#DDA0DD', '#87CEEB',
  '#FF69B4', '#7B68EE', '#00CED1', '#FF4500'
];

const TEXT_BACKGROUNDS = [
  null, 
  'rgba(0,0,0,0.5)', 
  'rgba(255,255,255,0.3)',
  'rgba(255,107,107,0.6)',
  'rgba(78,205,196,0.6)'
];

const STICKER_EMOJIS = ['🔥', '❤️', '😂', '😍', '🎉', '🙌', '💯', '✨', '🎵', '🍾', '🥂', '💃', '🕺', '🎧', '🌙', '⭐'];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Everyone', icon: Globe },
  { value: 'followers', label: 'Followers', icon: Users },
  { value: 'close_friends', label: 'Close Friends', icon: Users },
  { value: 'private', label: 'Only Me', icon: Lock }
];

type EditorMode = 'none' | 'text' | 'stickers' | 'visibility';

interface StickerData {
  id: string;
  type: 'emoji' | 'location' | 'mention' | 'time';
  content: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const CreateStorySheet: React.FC<CreateStorySheetProps> = ({
  open,
  onOpenChange
}) => {
  const { uploadStory } = useStories();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState('default');
  const [textSize, setTextSize] = useState('medium');
  const [textBackground, setTextBackground] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [visibility, setVisibility] = useState('public');
  const [editorMode, setEditorMode] = useState<EditorMode>('none');
  const [uploading, setUploading] = useState(false);
  const [draggedSticker, setDraggedSticker] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error(t('stories.invalidImage'));
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error(t('stories.invalidVideo'));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('stories.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    setMediaType(type);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddSticker = (emoji: string) => {
    const newSticker: StickerData = {
      id: Date.now().toString(),
      type: 'emoji',
      content: emoji,
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1
    };
    setStickers([...stickers, newSticker]);
  };

  const handleAddLocationSticker = () => {
    const location = prompt(t('stories.enterLocation'));
    if (location) {
      const newSticker: StickerData = {
        id: Date.now().toString(),
        type: 'location',
        content: location,
        x: 50,
        y: 30,
        rotation: 0,
        scale: 1
      };
      setStickers([...stickers, newSticker]);
    }
  };

  const handleAddMentionSticker = () => {
    const username = prompt(t('stories.enterUsername'));
    if (username) {
      const newSticker: StickerData = {
        id: Date.now().toString(),
        type: 'mention',
        content: username.replace('@', ''),
        x: 50,
        y: 70,
        rotation: 0,
        scale: 1
      };
      setStickers([...stickers, newSticker]);
    }
  };

  const handleAddTimeSticker = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newSticker: StickerData = {
      id: Date.now().toString(),
      type: 'time',
      content: timeString,
      x: 80,
      y: 10,
      rotation: 0,
      scale: 1
    };
    setStickers([...stickers, newSticker]);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error(t('stories.selectMedia'));
      return;
    }

    setUploading(true);
    const result = await uploadStory(
      selectedFile,
      {
        textOverlay: textOverlay || undefined,
        textPosition,
        textColor,
        textFont,
        textSize,
        textBackground,
        mediaType,
        visibility,
        stickers: stickers.map(s => ({
          sticker_type: s.type,
          content: s.content,
          position_x: s.x,
          position_y: s.y,
          rotation: s.rotation,
          scale: s.scale
        }))
      }
    );
    setUploading(false);

    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType('image');
    setTextOverlay('');
    setTextPosition('bottom');
    setTextColor('#FFFFFF');
    setTextFont('default');
    setTextSize('medium');
    setTextBackground(null);
    setStickers([]);
    setVisibility('public');
    setEditorMode('none');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const cycleTextPosition = () => {
    const positions: Array<'top' | 'center' | 'bottom'> = ['top', 'center', 'bottom'];
    const currentIndex = positions.indexOf(textPosition);
    setTextPosition(positions[(currentIndex + 1) % positions.length]);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-3xl bg-black">
        {!previewUrl ? (
          // Media Selection
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b border-white/10">
              <SheetTitle className="text-white">{t('stories.createStory')}</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 flex items-center justify-center gap-8 p-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10"
              >
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <span className="text-white font-medium">{t('stories.addPhoto')}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => videoInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-br from-accent/20 to-primary/20 border border-white/10"
              >
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                  <Video className="w-10 h-10 text-accent" />
                </div>
                <span className="text-white font-medium">{t('stories.addVideo')}</span>
              </motion.button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFileSelect(e, 'video')}
              className="hidden"
            />
          </div>
        ) : (
          // Story Editor
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 z-10">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="p-2 rounded-full bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditorMode(editorMode === 'visibility' ? 'none' : 'visibility')}
                  className="text-white gap-2"
                >
                  {VISIBILITY_OPTIONS.find(v => v.value === visibility)?.icon && (
                    <span className="w-4 h-4">
                      {React.createElement(VISIBILITY_OPTIONS.find(v => v.value === visibility)!.icon, { className: 'w-4 h-4' })}
                    </span>
                  )}
                  {VISIBILITY_OPTIONS.find(v => v.value === visibility)?.label}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 relative overflow-hidden">
              {mediaType === 'video' ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Text Overlay Preview */}
              {textOverlay && (
                <div
                  className={`absolute left-4 right-4 text-center pointer-events-none ${
                    textPosition === 'top' ? 'top-8' : 
                    textPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 
                    'bottom-32'
                  }`}
                >
                  <p
                    className={`inline-block font-bold px-4 py-2 rounded-xl ${
                      textSize === 'small' ? 'text-base' :
                      textSize === 'large' ? 'text-3xl' : 'text-xl'
                    } ${
                      textFont === 'serif' ? 'font-serif' :
                      textFont === 'mono' ? 'font-mono' : ''
                    }`}
                    style={{ 
                      color: textColor,
                      textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      backgroundColor: textBackground || 'transparent'
                    }}
                  >
                    {textOverlay}
                  </p>
                </div>
              )}

              {/* Stickers Preview */}
              {stickers.map((sticker) => (
                <motion.div
                  key={sticker.id}
                  className="absolute cursor-move"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`
                  }}
                  drag
                  dragMomentum={false}
                  onDrag={(_, info) => {
                    // Update position during drag
                  }}
                  onDragEnd={(_, info) => {
                    const container = document.querySelector('.preview-container');
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const newX = ((info.point.x - rect.left) / rect.width) * 100;
                    const newY = ((info.point.y - rect.top) / rect.height) * 100;
                    setStickers(stickers.map(s => 
                      s.id === sticker.id ? { ...s, x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) } : s
                    ));
                  }}
                  onDoubleClick={() => handleRemoveSticker(sticker.id)}
                >
                  {sticker.type === 'emoji' && (
                    <span className="text-5xl select-none">{sticker.content}</span>
                  )}
                  {sticker.type === 'location' && (
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-black select-none">
                      📍 {sticker.content}
                    </div>
                  )}
                  {sticker.type === 'mention' && (
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-white select-none">
                      @{sticker.content}
                    </div>
                  )}
                  {sticker.type === 'time' && (
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-mono text-white select-none">
                      {sticker.content}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Editor Panels */}
            <AnimatePresence>
              {editorMode === 'text' && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="absolute bottom-24 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent"
                >
                  <Input
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder={t('stories.addText')}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mb-4"
                    maxLength={100}
                    autoFocus
                  />

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/60 text-xs">{t('stories.font')}</span>
                    <div className="flex gap-2">
                      {TEXT_FONTS.map(font => (
                        <button
                          key={font.value}
                          onClick={() => setTextFont(font.value)}
                          className={`px-3 py-1.5 rounded-full text-xs ${
                            textFont === font.value 
                              ? 'bg-white text-black' 
                              : 'bg-white/10 text-white'
                          } ${font.value === 'serif' ? 'font-serif' : font.value === 'mono' ? 'font-mono' : ''}`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/60 text-xs">{t('stories.size')}</span>
                    <div className="flex gap-2">
                      {TEXT_SIZES.map(size => (
                        <button
                          key={size.value}
                          onClick={() => setTextSize(size.value)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            textSize === size.value 
                              ? 'bg-white text-black' 
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/60 text-xs">{t('stories.color')}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {TEXT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          className={`w-7 h-7 rounded-full border-2 ${
                            textColor === color ? 'border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">{t('stories.background')}</span>
                    <div className="flex gap-1.5">
                      {TEXT_BACKGROUNDS.map((bg, i) => (
                        <button
                          key={i}
                          onClick={() => setTextBackground(bg)}
                          className={`w-7 h-7 rounded-full border-2 ${
                            textBackground === bg ? 'border-white' : 'border-white/30'
                          } ${!bg ? 'bg-transparent' : ''}`}
                          style={{ backgroundColor: bg || 'transparent' }}
                        >
                          {!bg && <X className="w-4 h-4 text-white/50 mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={cycleTextPosition}
                    className="mt-3 flex items-center gap-2 text-white/60 text-xs"
                  >
                    <AlignCenter className="w-4 h-4" />
                    {t('stories.position')}: {textPosition}
                  </button>
                </motion.div>
              )}

              {editorMode === 'stickers' && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="absolute bottom-24 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent"
                >
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={handleAddLocationSticker}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      {t('stories.location')}
                    </button>
                    <button
                      onClick={handleAddMentionSticker}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm"
                    >
                      <AtSign className="w-4 h-4" />
                      {t('stories.mention')}
                    </button>
                    <button
                      onClick={handleAddTimeSticker}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      {t('stories.time')}
                    </button>
                  </div>

                  <div className="grid grid-cols-8 gap-2">
                    {STICKER_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleAddSticker(emoji)}
                        className="text-3xl p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {editorMode === 'visibility' && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="absolute bottom-24 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent"
                >
                  <p className="text-white/60 text-xs mb-3">{t('stories.whoCanSee')}</p>
                  <div className="flex flex-col gap-2">
                    {VISIBILITY_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setVisibility(option.value);
                          setEditorMode('none');
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          visibility === option.value 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <option.icon className="w-5 h-5" />
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Toolbar */}
            <div className="p-4 flex items-center justify-between bg-black/80 backdrop-blur-xl">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditorMode(editorMode === 'text' ? 'none' : 'text')}
                  className={`p-3 rounded-full ${
                    editorMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'
                  }`}
                >
                  <Type className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditorMode(editorMode === 'stickers' ? 'none' : 'stickers')}
                  className={`p-3 rounded-full ${
                    editorMode === 'stickers' ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'
                  }`}
                >
                  <Sticker className="w-5 h-5" />
                </button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="px-6 rounded-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.posting')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('stories.share')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CreateStorySheet;