import { useRef, useState, useEffect } from 'react';
import { GradientPoint, GradientStop } from './GradientCanvas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Circle, Square, Waves, Upload, RectangleHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GradientEditor from './GradientEditor';

interface ColorPickerProps {
  point: GradientPoint;
  onUpdate: (updates: Partial<GradientPoint>) => void;
  onClose?: () => void;
  hideClose?: boolean;
}

export default function ColorPicker({ point, onUpdate, onClose, hideClose }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(point.color);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(point.image || null);

  // Sync previewUrl when point changes (for switching between points)
  useEffect(() => {
    setPreviewUrl(point.image || null);
    setHexInput(point.color);
  }, [point.id, point.image, point.color]);

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onUpdate({ color: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        onUpdate({ image: dataUrl });
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

  const rgb = hexToRgb(point.color);
  const hsb = rgbToHsb(rgb?.r || 0, rgb?.g || 0, rgb?.b || 0);

  const handleHsbChange = (h?: number, s?: number, b?: number) => {
    const newHsb = {
      h: h !== undefined ? h : hsb.h,
      s: s !== undefined ? s : hsb.s,
      b: b !== undefined ? b : hsb.b,
    };
    const newRgb = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex);
    onUpdate({ color: hex });
  };

  const handleRgbChange = (r?: number, g?: number, b?: number) => {
    const newRgb = {
      r: r !== undefined ? r : rgb?.r || 0,
      g: g !== undefined ? g : rgb?.g || 0,
      b: b !== undefined ? b : rgb?.b || 0,
    };
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex);
    onUpdate({ color: hex });
  };

  const presetColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1',
  ];

  const imageScale = point.imageScale || 1;

  return (
    <div className="space-y-4">
      {!hideClose && (
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide">Point Properties</h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8"
            data-testid="button-close-picker"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wide mb-2 block">Gradient Type</Label>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="solid"
                checked={point.gradientType === 'solid'}
                onCheckedChange={(checked) => {
                  if (checked) onUpdate({ gradientType: 'solid' });
                }}
                data-testid="checkbox-solid"
              />
              <Label htmlFor="solid" className="text-sm font-normal cursor-pointer">
                Solid
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="linear"
                checked={point.gradientType === 'linear'}
                onCheckedChange={(checked) => {
                  if (checked) onUpdate({ gradientType: 'linear' });
                }}
                data-testid="checkbox-linear"
              />
              <Label htmlFor="linear" className="text-sm font-normal cursor-pointer">
                Linear
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="radial"
                checked={point.gradientType === 'radial'}
                onCheckedChange={(checked) => {
                  if (checked) onUpdate({ gradientType: 'radial' });
                }}
                data-testid="checkbox-radial"
              />
              <Label htmlFor="radial" className="text-sm font-normal cursor-pointer">
                Radial
              </Label>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide mb-2 block">
            {point.gradientType !== 'solid' ? 'Gradient Colors' : 'Color'}
          </Label>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {presetColors.map(color => (
              <button
                key={color}
                className="w-full aspect-square rounded-md border-2 hover-elevate active-elevate-2"
                style={{
                  backgroundColor: color,
                  borderColor: point.color === color ? '#3b82f6' : 'transparent',
                }}
                onClick={() => {
                  setHexInput(color);
                  if (point.gradientType === 'solid') {
                    onUpdate({ color });
                  } else {
                    const stops = point.gradientStops || [];
                    if (stops.length > 0) {
                      const newStops = [...stops];
                      newStops[0] = { ...newStops[0], color };
                      onUpdate({ color, gradientStops: newStops });
                    }
                  }
                }}
                data-testid={`preset-color-${color}`}
              />
            ))}
          </div>

          {point.gradientType === 'solid' ? (
            <div className="mt-4 pt-4 border-t border-border">
              <GradientEditor
                stops={
                  point.gradientStops && point.gradientStops.length > 0
                    ? point.gradientStops
                    : [
                        { id: 'stop-1', color: point.color, position: 0 },
                        { id: 'stop-2', color: point.color, position: 100 },
                      ]
                }
                onChange={(stops) => {
                  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
                  const firstColor = sortedStops[0]?.color || point.color;
                  onUpdate({
                    color: firstColor,
                    gradientStops: stops,
                    gradientColors: sortedStops.map(s => s.color),
                    gradientType: 'solid',
                  });
                }}
                gradientType={'linear'}
                onGradientTypeChange={() => onUpdate({ gradientType: 'solid' })}
              />
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border">
              <GradientEditor
                stops={point.gradientStops || [
                  { id: 'stop-1', color: '#3b82f6', position: 0 },
                  { id: 'stop-2', color: '#8b5cf6', position: 100 }
                ]}
                onChange={(stops) => {
                  const colors = stops.map(s => s.color);
                  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
                  const firstColor = sortedStops.length > 0 ? sortedStops[0].color : point.color;
                  onUpdate({
                    gradientStops: stops,
                    gradientColors: colors,
                    color: firstColor,
                    gradientType: point.gradientType
                  });
                }}
                gradientType={point.gradientType as 'linear' | 'radial'}
                onGradientTypeChange={(type) => onUpdate({ gradientType: type })}
              />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <Label className="text-xs uppercase tracking-wide mb-2 block">Image Upload</Label>
          <div className="relative flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg">
            {previewUrl ? (
              <div className="relative">
                <div className="relative w-32 h-32">
                  <div 
                    className="absolute inset-0 bg-cover bg-center rounded-lg"
                    style={{ 
                      backgroundImage: `url(${previewUrl})`,
                      transform: `scale(${imageScale})`
                    }}
                    data-testid="image-preview"
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
              <div className="text-center">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-file"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                  data-testid="button-upload-image"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </Button>
              </div>
            )}
          </div>

          {previewUrl && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs uppercase tracking-wide">Image Scale</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-image-scale">
                  {imageScale.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[imageScale]}
                onValueChange={([v]) => onUpdate({ imageScale: v })}
                min={0.1}
                max={3}
                step={0.1}
                data-testid="slider-image-scale"
              />
            </div>
          )}
        </div>

        <Tabs defaultValue="hex" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hex" data-testid="tab-hex">HEX</TabsTrigger>
            <TabsTrigger value="hsb" data-testid="tab-hsb">HSB</TabsTrigger>
            <TabsTrigger value="rgb" data-testid="tab-rgb">RGB</TabsTrigger>
          </TabsList>

          <TabsContent value="hex" className="space-y-3">
            <div>
              <Label htmlFor="hex" className="text-xs">HEX Value</Label>
              <Input
                id="hex"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="font-mono mt-1"
                data-testid="input-hex"
              />
            </div>
          </TabsContent>

          <TabsContent value="hsb" className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Hue</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-hue">
                  {Math.round(hsb.h)}°
                </span>
              </div>
              <Slider
                value={[hsb.h]}
                onValueChange={([v]) => handleHsbChange(v)}
                max={360}
                step={1}
                data-testid="slider-hue"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Saturation</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-saturation">
                  {Math.round(hsb.s)}%
                </span>
              </div>
              <Slider
                value={[hsb.s]}
                onValueChange={([v]) => handleHsbChange(undefined, v)}
                max={100}
                step={1}
                data-testid="slider-saturation"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Brightness</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-brightness">
                  {Math.round(hsb.b)}%
                </span>
              </div>
              <Slider
                value={[hsb.b]}
                onValueChange={([v]) => handleHsbChange(undefined, undefined, v)}
                max={100}
                step={1}
                data-testid="slider-brightness"
              />
            </div>
          </TabsContent>

          <TabsContent value="rgb" className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Red</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-red">
                  {rgb?.r || 0}
                </span>
              </div>
              <Slider
                value={[rgb?.r || 0]}
                onValueChange={([v]) => handleRgbChange(v)}
                max={255}
                step={1}
                data-testid="slider-red"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Green</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-green">
                  {rgb?.g || 0}
                </span>
              </div>
              <Slider
                value={[rgb?.g || 0]}
                onValueChange={([v]) => handleRgbChange(undefined, v)}
                max={255}
                step={1}
                data-testid="slider-green"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Blue</Label>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-blue">
                  {rgb?.b || 0}
                </span>
              </div>
              <Slider
                value={[rgb?.b || 0]}
                onValueChange={([v]) => handleRgbChange(undefined, undefined, v)}
                max={255}
                step={1}
                data-testid="slider-blue"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t border-border">
          <Label className="text-xs uppercase tracking-wide mb-2 block">Shape</Label>
          <Select value={point.shape} onValueChange={(value) => onUpdate({ shape: value as 'blob' | 'circle' | 'square' | 'rectangle' })}>
            <SelectTrigger data-testid="select-shape">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blob">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4" />
                  Blob
                </div>
              </SelectItem>
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
              <SelectItem value="rectangle">
                <div className="flex items-center gap-2">
                  <RectangleHorizontal className="w-4 h-4" />
                  Rectangle
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs uppercase tracking-wide">Opacity</Label>
            <span className="text-xs text-muted-foreground font-mono" data-testid="text-opacity">
              {Math.round(point.opacity * 100)}%
            </span>
          </div>
          <Slider
            value={[point.opacity * 100]}
            onValueChange={([v]) => onUpdate({ opacity: v / 100 })}
            max={100}
            step={1}
            data-testid="slider-opacity"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs uppercase tracking-wide">Influence Radius</Label>
            <span className="text-xs text-muted-foreground font-mono" data-testid="text-radius">
              {Math.round(point.radius)}px
            </span>
          </div>
          <Slider
            value={[point.radius]}
            onValueChange={([v]) => {
              // For square image shapes, also update width and height
              if (point.image && point.shape === 'square') {
                onUpdate({ radius: v, width: v * 2, height: v * 2 });
              } else {
                onUpdate({ radius: v });
              }
            }}
            min={20}
            max={400}
            step={5}
            data-testid="slider-radius"
          />
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide mb-2 block">
            Gradient Direction
            <span className="text-muted-foreground ml-1">(Focus Point)</span>
          </Label>
          <div className="text-xs text-muted-foreground mb-2">
            Drag the pink handle on canvas to adjust gradient direction
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Focus X</Label>
              <Input
                type="number"
                value={Math.round(point.focusX)}
                onChange={(e) => onUpdate({ focusX: parseInt(e.target.value) || 0 })}
                className="mt-1"
                data-testid="input-focus-x"
              />
            </div>
            <div>
              <Label className="text-xs">Focus Y</Label>
              <Input
                type="number"
                value={Math.round(point.focusY)}
                onChange={(e) => onUpdate({ focusY: parseInt(e.target.value) || 0 })}
                className="mt-1"
                data-testid="input-focus-y"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => onUpdate({ focusX: 0, focusY: 0 })}
            data-testid="button-reset-focus"
          >
            Reset Focus
          </Button>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function rgbToHsb(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  const s = max === 0 ? 0 : (diff / max) * 100;
  const v = max * 100;

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else {
      h = ((r - g) / diff + 4) / 6;
    }
  }

  return { h: h * 360, s, b: v };
}

function hsbToRgb(h: number, s: number, b: number) {
  h /= 360;
  s /= 100;
  b /= 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);

  let r = 0, g = 0, bl = 0;
  switch (i % 6) {
    case 0: r = b; g = t; bl = p; break;
    case 1: r = q; g = b; bl = p; break;
    case 2: r = p; g = b; bl = t; break;
    case 3: r = p; g = q; bl = b; break;
    case 4: r = t; g = p; bl = b; break;
    case 5: r = b; g = p; bl = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(bl * 255)
  };
}
