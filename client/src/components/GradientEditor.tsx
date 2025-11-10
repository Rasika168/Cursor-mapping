import { useState, useRef, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X } from 'lucide-react';

export interface GradientStop {
  id: string;
  color: string;
  position: number;
  alpha?: number;
}

interface GradientEditorProps {
  stops: GradientStop[];
  onChange: (stops: GradientStop[]) => void;
  gradientType: 'linear' | 'radial';
  onGradientTypeChange: (type: 'linear' | 'radial') => void;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else {
      h = ((r - g) / diff + 4) / 6;
    }
  }
  
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h: number, s: number, v: number): RGB {
  h /= 360;
  s /= 100;
  v /= 100;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  let r = 0, g = 0, b = 0;
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export default function GradientEditor({ 
  stops, 
  onChange, 
  gradientType, 
  onGradientTypeChange 
}: GradientEditorProps) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(stops[0]?.id || null);
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);
  const [pickerDragging, setPickerDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const selectedStop = stops.find(s => s.id === selectedStopId);

  const getGradientCSS = useCallback(() => {
    const colorStops = sortedStops.map(stop => {
      const alpha = stop.alpha !== undefined ? stop.alpha / 100 : 1;
      const rgb = hexToRgb(stop.color);
      const color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      return `${color} ${stop.position}%`;
    }).join(', ');
    // Always use linear gradient for the slider, regardless of gradient type
    return `linear-gradient(to right, ${colorStops})`;
  }, [sortedStops]);

  const interpolateColor = useCallback((position: number): { color: string; alpha: number } => {
    if (sortedStops.length === 0) return { color: '#3b82f6', alpha: 100 };
    if (sortedStops.length === 1) return { color: sortedStops[0].color, alpha: sortedStops[0].alpha || 100 };

    let beforeStop = sortedStops[0];
    let afterStop = sortedStops[sortedStops.length - 1];

    for (let i = 0; i < sortedStops.length - 1; i++) {
      if (position >= sortedStops[i].position && position <= sortedStops[i + 1].position) {
        beforeStop = sortedStops[i];
        afterStop = sortedStops[i + 1];
        break;
      }
    }

    if (position <= sortedStops[0].position) {
      return { color: sortedStops[0].color, alpha: sortedStops[0].alpha || 100 };
    }
    if (position >= sortedStops[sortedStops.length - 1].position) {
      return { color: sortedStops[sortedStops.length - 1].color, alpha: sortedStops[sortedStops.length - 1].alpha || 100 };
    }

    const range = afterStop.position - beforeStop.position;
    const relativePosition = (position - beforeStop.position) / range;

    const beforeRgb = hexToRgb(beforeStop.color);
    const afterRgb = hexToRgb(afterStop.color);

    const r = Math.round(beforeRgb.r + (afterRgb.r - beforeRgb.r) * relativePosition);
    const g = Math.round(beforeRgb.g + (afterRgb.g - beforeRgb.g) * relativePosition);
    const b = Math.round(beforeRgb.b + (afterRgb.b - beforeRgb.b) * relativePosition);

    const beforeAlpha = beforeStop.alpha !== undefined ? beforeStop.alpha : 100;
    const afterAlpha = afterStop.alpha !== undefined ? afterStop.alpha : 100;
    const alpha = Math.round(beforeAlpha + (afterAlpha - beforeAlpha) * relativePosition);

    return { color: rgbToHex(r, g, b), alpha };
  }, [sortedStops]);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingStopId) return;
    
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

    const sampledColor = interpolateColor(position);

    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: sampledColor.color,
      position: Math.round(position),
      alpha: sampledColor.alpha
    };

    onChange([...stops, newStop]);
    setSelectedStopId(newStop.id);
  };

  const handleStopDrag = useCallback((e: MouseEvent) => {
    if (!draggingStopId || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

    onChange(stops.map(stop => 
      stop.id === draggingStopId 
        ? { ...stop, position: Math.round(position) }
        : stop
    ));
  }, [draggingStopId, stops, onChange]);

  const handleStopDragEnd = useCallback(() => {
    setDraggingStopId(null);
  }, []);

  const handleStopMouseDown = (stopId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingStopId(stopId);
    setSelectedStopId(stopId);
  };

  const handleRemoveStop = (stopId: string) => {
    onChange(stops.filter(stop => stop.id !== stopId));
    if (selectedStopId === stopId) {
      setSelectedStopId(stops.find(s => s.id !== stopId)?.id || null);
    }
  };

  const updateSelectedStopColor = (color: string) => {
    if (!selectedStopId) return;
    onChange(stops.map(stop => 
      stop.id === selectedStopId ? { ...stop, color } : stop
    ));
  };

  const handlePositionChange = (stopId: string, position: number) => {
    const clampedPosition = Math.max(0, Math.min(100, position));
    onChange(stops.map(stop => 
      stop.id === stopId ? { ...stop, position: clampedPosition } : stop
    ));
  };

  const handlePickerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setPickerDragging(true);
    handlePickerDrag(e.nativeEvent);
  };

  const handlePickerDrag = useCallback((e: MouseEvent) => {
    if (!pickerRef.current || !selectedStop) return;

    const rect = pickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;

    const rgb = hexToRgb(selectedStop.color);
    const currentHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const newRgb = hsvToRgb(currentHsv.h, s, v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);

    updateSelectedStopColor(newHex);
  }, [selectedStop]);

  const handlePickerDragEnd = useCallback(() => {
    setPickerDragging(false);
  }, []);

  useEffect(() => {
    if (draggingStopId) {
      window.addEventListener('mousemove', handleStopDrag);
      window.addEventListener('mouseup', handleStopDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleStopDrag);
        window.removeEventListener('mouseup', handleStopDragEnd);
      };
    }
  }, [draggingStopId, handleStopDrag, handleStopDragEnd]);

  useEffect(() => {
    if (pickerDragging) {
      window.addEventListener('mousemove', handlePickerDrag);
      window.addEventListener('mouseup', handlePickerDragEnd);
      return () => {
        window.removeEventListener('mousemove', handlePickerDrag);
        window.removeEventListener('mouseup', handlePickerDragEnd);
      };
    }
  }, [pickerDragging, handlePickerDrag, handlePickerDragEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStopId) {
        e.preventDefault();
        handleRemoveStop(selectedStopId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedStopId, stops.length]);

  if (!selectedStop) return null;

  const currentRgb = hexToRgb(selectedStop.color);
  const currentHsv = rgbToHsv(currentRgb.r, currentRgb.g, currentRgb.b);
  const hueRgb = hsvToRgb(currentHsv.h, 100, 100);
  const hueColor = rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);

  return (
    <div className="space-y-6">
      {/* Gradient Slider */}
      <div>
        <Label className="text-xs uppercase tracking-wide mb-2 block">Gradient Slider</Label>
        <div className="relative">
          <div
            ref={sliderRef}
            className="relative h-12 rounded-lg cursor-crosshair border-2 border-border"
            style={{ background: getGradientCSS() }}
            onClick={handleSliderClick}
            data-testid="gradient-slider"
          >
            {sortedStops.map(stop => (
              <div
                key={stop.id}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform ${
                  selectedStopId === stop.id ? 'scale-125' : 'scale-100'
                }`}
                style={{ left: `${stop.position}%` }}
                onMouseDown={(e) => handleStopMouseDown(stop.id, e)}
                onClick={(e) => { e.stopPropagation(); setSelectedStopId(stop.id); }}
                data-testid={`gradient-stop-${stop.id}`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-3 shadow-lg transition-all ${
                    selectedStopId === stop.id ? 'border-white ring-2 ring-primary' : 'border-white'
                  }`}
                  style={{ backgroundColor: stop.color }}
                />
              </div>
            ))}
          </div>
          
          {/* Position Labels */}
          <div className="flex justify-between mt-2">
            {sortedStops.map(stop => (
              <div 
                key={stop.id} 
                className="text-xs text-muted-foreground"
                style={{ position: 'absolute', left: `${stop.position}%`, transform: 'translateX(-50%)' }}
              >
                {stop.position}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Click to add stops • Drag to reposition • Press Delete to remove
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Picker Section */}
        <div className="space-y-4">
          <Label className="text-xs uppercase tracking-wide block">Color Picker</Label>
          
          {/* Spectrum Picker */}
          <div
            ref={pickerRef}
            className="relative w-full h-48 rounded-lg cursor-crosshair border-2 border-border overflow-hidden"
            style={{
              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${hueColor})`
            }}
            onMouseDown={handlePickerMouseDown}
            data-testid="color-picker-spectrum"
          >
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${currentHsv.s}%`,
                top: `${100 - currentHsv.v}%`,
                backgroundColor: selectedStop.color
              }}
            />
          </div>
        </div>

        {/* Color Controls Section */}
        <div className="space-y-4">
          {/* HEX Input */}
          <div>
            <Label className="text-xs uppercase tracking-wide mb-2 block">HEX</Label>
            <Input
              value={selectedStop.color.toUpperCase()}
              onChange={(e) => {
                const hex = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                  updateSelectedStopColor(hex);
                }
              }}
              className="font-mono text-lg"
              placeholder="#000000"
              data-testid="input-hex-color"
            />
          </div>

          {/* RGB Inputs */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">R</Label>
              <Input
                type="number"
                value={currentRgb.r}
                onChange={(e) => {
                  const r = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                  updateSelectedStopColor(rgbToHex(r, currentRgb.g, currentRgb.b));
                }}
                className="text-center"
                min="0"
                max="255"
                data-testid="input-rgb-r"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">G</Label>
              <Input
                type="number"
                value={currentRgb.g}
                onChange={(e) => {
                  const g = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                  updateSelectedStopColor(rgbToHex(currentRgb.r, g, currentRgb.b));
                }}
                className="text-center"
                min="0"
                max="255"
                data-testid="input-rgb-g"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">B</Label>
              <Input
                type="number"
                value={currentRgb.b}
                onChange={(e) => {
                  const b = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                  updateSelectedStopColor(rgbToHex(currentRgb.r, currentRgb.g, b));
                }}
                className="text-center"
                min="0"
                max="255"
                data-testid="input-rgb-b"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">A</Label>
              <Input
                type="number"
                value={selectedStop.alpha !== undefined ? selectedStop.alpha : 100}
                onChange={(e) => {
                  const alpha = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  onChange(stops.map(stop => 
                    stop.id === selectedStopId ? { ...stop, alpha } : stop
                  ));
                }}
                className="text-center"
                min="0"
                max="100"
                data-testid="input-alpha"
              />
            </div>
          </div>

          {/* Hue Slider */}
          <div>
            <Label className="text-xs uppercase tracking-wide mb-2 block">Hue</Label>
            <div className="relative">
              <Slider
                value={[currentHsv.h]}
                onValueChange={([h]) => {
                  const newRgb = hsvToRgb(h, currentHsv.s, currentHsv.v);
                  updateSelectedStopColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
                }}
                max={360}
                step={1}
                className="mb-2"
                data-testid="slider-hue"
              />
              <div 
                className="h-3 rounded-full w-full"
                style={{
                  background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
              />
            </div>
          </div>

          {/* Alpha/Opacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wide">Opacity</Label>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedStop.alpha !== undefined ? selectedStop.alpha : 100}%
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[selectedStop.alpha !== undefined ? selectedStop.alpha : 100]}
                onValueChange={([alpha]) => {
                  onChange(stops.map(stop => 
                    stop.id === selectedStopId ? { ...stop, alpha } : stop
                  ));
                }}
                max={100}
                step={1}
                className="mb-2"
                data-testid="slider-alpha"
              />
              <div 
                className="h-3 rounded-full w-full"
                style={{
                  background: `linear-gradient(to right, 
                    rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, 0), 
                    rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, 1))`,
                  backgroundImage: `
                    linear-gradient(to right, 
                      rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, 0), 
                      rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, 1)),
                    linear-gradient(45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #ccc 75%), 
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                  backgroundSize: '100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px',
                  backgroundPosition: '0 0, 0 0, 4px 0, 4px -4px, 0 4px'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stops List Panel - Full Width Below */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide">Stops List</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newStop: GradientStop = {
                id: `stop-${Date.now()}`,
                color: '#ec4899',
                position: 50,
                alpha: 100
              };
              onChange([...stops, newStop]);
              setSelectedStopId(newStop.id);
            }}
            data-testid="button-add-stop"
          >
            + Add Stop
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {sortedStops.map((stop) => (
            <div
              key={stop.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                selectedStopId === stop.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedStopId(stop.id)}
              data-testid={`stop-item-${stop.id}`}
            >
              <div
                className="w-10 h-10 rounded-md border-2 border-border flex-shrink-0 shadow-sm"
                style={{ backgroundColor: stop.color }}
              />
              <div className="flex-1 space-y-2">
                <Input
                  value={stop.color.toUpperCase()}
                  onChange={(e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                      onChange(stops.map(s => s.id === stop.id ? { ...s, color: hex } : s));
                    }
                  }}
                  className="h-8 font-mono text-xs"
                  placeholder="#000000"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`input-stop-color-${stop.id}`}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={stop.position}
                    onChange={(e) => handlePositionChange(stop.id, parseInt(e.target.value) || 0)}
                    className="h-8 text-xs"
                    min="0"
                    max="100"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`input-stop-position-${stop.id}`}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveStop(stop.id);
                }}
                className="h-8 w-8 flex-shrink-0"
                data-testid={`button-remove-stop-${stop.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
