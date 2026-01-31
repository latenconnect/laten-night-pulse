import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStories } from '@/hooks/useStories';
import { Camera, Type, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEXT_POSITIONS = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' }
];

const TEXT_COLORS = [
  '#FFFFFF',
  '#000000',
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#DDA0DD',
  '#87CEEB'
];

const CreateStoryDialog: React.FC<CreateStoryDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { uploadStory } = useStories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState('bottom');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [showTextOptions, setShowTextOptions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    const result = await uploadStory(
      selectedFile,
      {
        textOverlay: textOverlay || undefined,
        textPosition,
        textColor
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
    setTextOverlay('');
    setTextPosition('bottom');
    setTextColor('#FFFFFF');
    setShowTextOptions(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {!previewUrl ? (
            // File selection
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[9/16] max-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Camera className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground">Tap to add photo</p>
            </div>
          ) : (
            // Preview
            <div className="relative aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden bg-black">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />

              {/* Text Overlay Preview */}
              {textOverlay && (
                <div
                  className={`absolute left-4 right-4 text-center ${
                    textPosition === 'top' 
                      ? 'top-8' 
                      : textPosition === 'center'
                        ? 'top-1/2 -translate-y-1/2'
                        : 'bottom-8'
                  }`}
                >
                  <p
                    className="text-lg font-bold px-3 py-1.5 rounded-lg"
                    style={{ 
                      color: textColor,
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    {textOverlay}
                  </p>
                </div>
              )}

              {/* Clear button */}
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Text toggle */}
              <button
                onClick={() => setShowTextOptions(!showTextOptions)}
                className={`absolute top-2 left-2 p-2 rounded-full ${
                  showTextOptions ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white'
                }`}
              >
                <Type className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text Options */}
          {showTextOptions && previewUrl && (
            <div className="mt-4 space-y-4 p-4 rounded-xl bg-muted/50">
              <div className="space-y-2">
                <Label>Text overlay</Label>
                <Input
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Add text to your story..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <div className="flex gap-2">
                  {TEXT_POSITIONS.map(pos => (
                    <Button
                      key={pos.value}
                      variant={textPosition === pos.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTextPosition(pos.value)}
                    >
                      {pos.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {TEXT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        textColor === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {previewUrl && (
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full mt-4"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post Story
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;
