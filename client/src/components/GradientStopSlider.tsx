import { useState, useRef, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface GradientStop {
  id: string;
  color: string;
  position: number;
}

interface GradientStopSliderProps {
  stops: GradientStop[];
  onChange: (stops: GradientStop[]) => void;
  gradientType: 'linear' | 'radial';
  onGradientTypeChange: (type: 'linear' | 'radial') => void;
}

export default function GradientStopSlider({ 
  stops, 
  onChange, 
  gradientType, 
  onGradientTypeChange 
}: GradientStopSliderProps) {
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  const getGradientCSS = useCallback(() => {
    const colorStops = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
    // Always use linear gradient for the slider, regardless of gradient type
    return `linear-gradient(to right, ${colorStops})`;
  }, [sortedStops]);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingStopId) return;
    
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: '#3b82f6',
      position: Math.round(position)
    };

    onChange([...stops, newStop]);
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
  };

  const handleRemoveStop = (stopId: string) => {
    onChange(stops.filter(stop => stop.id !== stopId));
  };

  const handleColorChange = (stopId: string, color: string) => {
    onChange(stops.map(stop => 
      stop.id === stopId ? { ...stop, color } : stop
    ));
  };

  const handlePositionChange = (stopId: string, position: number) => {
    const clampedPosition = Math.max(0, Math.min(100, position));
    onChange(stops.map(stop => 
      stop.id === stopId ? { ...stop, position: clampedPosition } : stop
    ));
  };

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

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs uppercase tracking-wide mb-2 block">Gradient Type</Label>
        <RadioGroup
          value={gradientType}
          onValueChange={(value) => onGradientTypeChange(value as 'linear' | 'radial')}
          className="flex gap-4"
          data-testid="radio-gradient-type"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="linear" id="linear" data-testid="radio-linear" />
            <Label htmlFor="linear" className="text-sm font-normal cursor-pointer">Linear</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="radial" id="radial" data-testid="radio-radial" />
            <Label htmlFor="radial" className="text-sm font-normal cursor-pointer">Radial</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide mb-2 block">Gradient Stops</Label>
        
        <div className="relative">
          <div
            ref={sliderRef}
            className="relative h-8 rounded-md cursor-crosshair border border-border"
            style={{ background: getGradientCSS() }}
            onClick={handleSliderClick}
            data-testid="gradient-slider"
          >
            {sortedStops.map(stop => (
              <div
                key={stop.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing z-10"
                style={{ left: `${stop.position}%` }}
                onMouseDown={(e) => handleStopMouseDown(stop.id, e)}
                data-testid={`gradient-stop-${stop.id}`}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: stop.color }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click to add stops • Drag to reposition
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide">Color Stops</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newStop: GradientStop = {
                id: `stop-${Date.now()}`,
                color: '#ec4899',
                position: 50
              };
              onChange([...stops, newStop]);
            }}
            data-testid="button-add-stop"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Stop
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedStops.map((stop, index) => (
            <div key={stop.id} className="flex items-center gap-2 p-2 rounded-md border border-border">
              <div className="relative flex-shrink-0">
                <Input
                  type="color"
                  value={stop.color}
                  onChange={(e) => handleColorChange(stop.id, e.target.value)}
                  className="w-8 h-8 p-0 border-2 border-border rounded cursor-pointer"
                  data-testid={`input-stop-color-picker-${stop.id}`}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  value={stop.color}
                  onChange={(e) => handleColorChange(stop.id, e.target.value)}
                  className="h-8 font-mono text-xs"
                  placeholder="#000000"
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
                    data-testid={`input-stop-position-${stop.id}`}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveStop(stop.id)}
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
