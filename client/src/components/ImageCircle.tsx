import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, X, Circle, Square } from 'lucide-react';
import { GradientPoint, GradientStop } from './GradientCanvas';
import GradientStopSlider from './GradientStopSlider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImageCircleProps {
  point: GradientPoint;
  onUpdate: (updates: Partial<GradientPoint>) => void;
}

export default function ImageCircle({ point, onUpdate }: ImageCircleProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(point.image || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        const imageShape = point.shape || 'circle';
        if (imageShape === 'square') {
          onUpdate({ 
            image: dataUrl, 
            width: point.width || point.radius * 2,
            height: point.height || point.radius * 2
          });
        } else {
          onUpdate({ image: dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onUpdate({ image: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getGradientCSS = () => {
    const stops = point.gradientStops || [
      { id: 'stop-1', color: '#3b82f6', position: 0 },
      { id: 'stop-2', color: '#8b5cf6', position: 100 }
    ];
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const colorStops = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
    return `conic-gradient(${colorStops})`;
  };

  const borderThickness = point.borderThickness || 8;
  const borderBlur = point.borderBlur || 0;
  const imageShape = point.shape || 'circle';
  const width = point.width || point.radius * 2;
  const height = point.height || point.radius * 2;
  const previewSize = imageShape === 'square' ? Math.max(width, height) / 2 : 200;

  const getShapeClasses = () => {
    switch (imageShape) {
      case 'circle':
        return 'rounded-full';
      case 'square':
        return 'rounded-none';
      default:
        return 'rounded-full';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs uppercase tracking-wide mb-2 block">Image Shape</Label>
        
        <div className="relative flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg">
          {previewUrl ? (
            <div className="relative">
              <div className="relative" style={{ 
                width: imageShape === 'square' ? `${width / 2}px` : '200px', 
                height: imageShape === 'square' ? `${height / 2}px` : '200px' 
              }}>
                {/* Gradient border with blur */}
                <div 
                  className={`absolute inset-0 ${getShapeClasses()}`}
                  style={{
                    background: getGradientCSS(),
                    filter: borderBlur > 0 ? `blur(${borderBlur / 2}px)` : 'none',
                  }}
                />
                {/* Inner shape mask for image */}
                <div 
                  className={`absolute ${getShapeClasses()} bg-cover bg-center`}
                  style={{ 
                    backgroundImage: `url(${previewUrl})`,
                    top: `${borderThickness / 2}px`,
                    left: `${borderThickness / 2}px`,
                    right: `${borderThickness / 2}px`,
                    bottom: `${borderThickness / 2}px`,
                  }}
                  data-testid="image-circle-preview"
                />
              </div>
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                onClick={handleRemoveImage}
                data-testid="button-remove-image"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">Upload an image</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-image"
              >
                Choose File
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          data-testid="input-file"
        />
      </div>

      {previewUrl && (
        <>
          <div className="pt-4 border-t border-border space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide mb-2 block">Shape</Label>
              <Select value={imageShape} onValueChange={(value) => {
                if (value === 'square') {
                  onUpdate({ 
                    shape: value as 'circle' | 'square',
                    width: point.width || point.radius * 2,
                    height: point.height || point.radius * 2
                  });
                } else {
                  onUpdate({ shape: value as 'circle' | 'square' });
                }
              }}>
                <SelectTrigger data-testid="select-image-shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" />
                      Circle
                    </div>
                  </SelectItem>
                  <SelectItem value="square">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      Square
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {imageShape === 'square' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs uppercase tracking-wide">Width</Label>
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-shape-width">
                      {point.width || point.radius * 2}px
                    </span>
                  </div>
                  <Slider
                    value={[point.width || point.radius * 2]}
                    onValueChange={([v]) => onUpdate({ width: v })}
                    min={50}
                    max={600}
                    step={5}
                    data-testid="slider-shape-width"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs uppercase tracking-wide">Height</Label>
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-shape-height">
                      {point.height || point.radius * 2}px
                    </span>
                  </div>
                  <Slider
                    value={[point.height || point.radius * 2]}
                    onValueChange={([v]) => onUpdate({ height: v })}
                    min={50}
                    max={600}
                    step={5}
                    data-testid="slider-shape-height"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3">Border Gradient</h3>
            <GradientStopSlider
              stops={point.gradientStops || [
                { id: 'stop-1', color: '#3b82f6', position: 0 },
                { id: 'stop-2', color: '#8b5cf6', position: 100 }
              ]}
              onChange={(stops) => {
                const colors = stops.map(s => s.color);
                onUpdate({ gradientStops: stops, gradientColors: colors });
              }}
              gradientType={point.gradientType as 'linear' | 'radial'}
              onGradientTypeChange={(type) => onUpdate({ gradientType: type })}
            />
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs uppercase tracking-wide">Border Thickness</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-border-thickness">
                  {borderThickness}px
                </span>
              </div>
              <Slider
                value={[borderThickness]}
                onValueChange={([v]) => onUpdate({ borderThickness: v })}
                min={2}
                max={30}
                step={1}
                data-testid="slider-border-thickness"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs uppercase tracking-wide">Border Blur</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-border-blur">
                  {borderBlur}px
                </span>
              </div>
              <Slider
                value={[borderBlur]}
                onValueChange={([v]) => onUpdate({ borderBlur: v })}
                min={0}
                max={20}
                step={1}
                data-testid="slider-border-blur"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
