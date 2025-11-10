import { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, Minus, Download, Undo2, Redo2, Eye, EyeOff, Trash2, Copy, Moon, Sun, Edit2, Save, Check, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ColorPicker from './ColorPicker';

export interface GradientStop {
  id: string;
  color: string;
  position: number;
  alpha?: number;
}

export interface GradientPoint {
  id: string;
  name?: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  radius: number;
  edgeType?: 'soft' | 'hard';
  shape: 'blob' | 'circle' | 'square' | 'rectangle';
  focusX: number;
  focusY: number;
  gradientType: 'solid' | 'linear' | 'radial';
  gradientColors: string[];
  gradientStops?: GradientStop[];
  image?: string;
  imageScale?: number;
  borderThickness?: number;
  borderBlur?: number;
  width?: number;
  height?: number;
}

interface GradientCanvasProps {
  onPointsChange?: (points: GradientPoint[]) => void;
}

export default function GradientCanvas({ onPointsChange }: GradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<GradientPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
  const [draggingRadius, setDraggingRadius] = useState<string | null>(null);
  const [draggingFocus, setDraggingFocus] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panJustEnded, setPanJustEnded] = useState(false);
  const [dragJustEnded, setDragJustEnded] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [gridColor, setGridColor] = useState('#404040');
  const [showOverlays, setShowOverlays] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#333333');
  const [history, setHistory] = useState<GradientPoint[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

  const [topLabel, setTopLabel] = useState('Sustainability');
  const [rightLabel, setRightLabel] = useState('Price');
  const [bottomLabel, setBottomLabel] = useState('People');
  const [leftLabel, setLeftLabel] = useState('Quality');

  const [fontFamily, setFontFamily] = useState('Satoshi');
  const [fontSize, setFontSize] = useState(14);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Maps management state
  const [maps, setMaps] = useState<Array<{ id: string; title: string; points: GradientPoint[]; settings: any }>>([]);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editingMapTitle, setEditingMapTitle] = useState('');
  const [isLoadingMaps, setIsLoadingMaps] = useState(false);

  const saveToHistory = useCallback((newPoints: GradientPoint[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPoints)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPoints(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPoints(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  // Maps management functions
  const loadMaps = useCallback(async () => {
    setIsLoadingMaps(true);
    try {
      const response = await fetch('/api/maps');
      const data = await response.json();
      setMaps(data);
    } catch (error) {
      console.error('Failed to load maps:', error);
    } finally {
      setIsLoadingMaps(false);
    }
  }, []);

  const createMap = useCallback(async () => {
    try {
      const settings = {
        backgroundColor,
        showGrid,
        gridSize,
        gridOpacity,
        gridColor,
        showOverlays,
        topLabel,
        rightLabel,
        bottomLabel,
        leftLabel,
        fontFamily,
        fontSize,
        fontColor,
        pan,
        zoom
      };

      const response = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Map',
          points: JSON.stringify(points),
          settings: JSON.stringify(settings)
        })
      });

      const newMap = await response.json();
      setMaps([...maps, newMap]);
      setCurrentMapId(newMap.id);
    } catch (error) {
      console.error('Failed to create map:', error);
    }
  }, [points, backgroundColor, showGrid, gridSize, gridOpacity, gridColor, showOverlays, topLabel, rightLabel, bottomLabel, leftLabel, fontFamily, fontSize, fontColor, pan, zoom, maps]);

  const saveCurrentMap = useCallback(async () => {
    if (!currentMapId) return;

    try {
      const settings = {
        backgroundColor,
        showGrid,
        gridSize,
        gridOpacity,
        gridColor,
        showOverlays,
        topLabel,
        rightLabel,
        bottomLabel,
        leftLabel,
        fontFamily,
        fontSize,
        fontColor,
        pan,
        zoom
      };

      const response = await fetch(`/api/maps/${currentMapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: JSON.stringify(points),
          settings: JSON.stringify(settings)
        })
      });

      const updatedMap = await response.json();
      setMaps(maps.map(m => m.id === currentMapId ? updatedMap : m));
    } catch (error) {
      console.error('Failed to save map:', error);
    }
  }, [currentMapId, points, backgroundColor, showGrid, gridSize, gridOpacity, gridColor, showOverlays, topLabel, rightLabel, bottomLabel, leftLabel, fontFamily, fontSize, fontColor, pan, zoom, maps]);

  const loadMap = useCallback(async (mapId: string) => {
    try {
      const response = await fetch(`/api/maps/${mapId}`);
      const map = await response.json();

      const loadedPoints = typeof map.points === 'string' ? JSON.parse(map.points) : map.points;
      const loadedSettings = typeof map.settings === 'string' ? JSON.parse(map.settings) : map.settings;

      setPoints(loadedPoints);
      setCurrentMapId(map.id);

      if (loadedSettings) {
        if (loadedSettings.backgroundColor) setBackgroundColor(loadedSettings.backgroundColor);
        if (loadedSettings.showGrid !== undefined) setShowGrid(loadedSettings.showGrid);
        if (loadedSettings.gridSize) setGridSize(loadedSettings.gridSize);
        if (loadedSettings.gridOpacity) setGridOpacity(loadedSettings.gridOpacity);
        if (loadedSettings.gridColor) setGridColor(loadedSettings.gridColor);
        if (loadedSettings.showOverlays !== undefined) setShowOverlays(loadedSettings.showOverlays);
        if (loadedSettings.topLabel) setTopLabel(loadedSettings.topLabel);
        if (loadedSettings.rightLabel) setRightLabel(loadedSettings.rightLabel);
        if (loadedSettings.bottomLabel) setBottomLabel(loadedSettings.bottomLabel);
        if (loadedSettings.leftLabel) setLeftLabel(loadedSettings.leftLabel);
        if (loadedSettings.fontFamily) setFontFamily(loadedSettings.fontFamily);
        if (loadedSettings.fontSize) setFontSize(loadedSettings.fontSize);
        if (loadedSettings.fontColor) setFontColor(loadedSettings.fontColor);
        if (loadedSettings.pan) setPan(loadedSettings.pan);
        if (loadedSettings.zoom) setZoom(loadedSettings.zoom);
      }
    } catch (error) {
      console.error('Failed to load map:', error);
    }
  }, []);

  const updateMapTitle = useCallback(async (mapId: string, title: string) => {
    try {
      const response = await fetch(`/api/maps/${mapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });

      const updatedMap = await response.json();
      setMaps(maps.map(m => m.id === mapId ? updatedMap : m));
      setEditingMapId(null);
    } catch (error) {
      console.error('Failed to update map title:', error);
    }
  }, [maps]);

  const deleteMap = useCallback(async (mapId: string) => {
    try {
      await fetch(`/api/maps/${mapId}`, {
        method: 'DELETE'
      });

      setMaps(maps.filter(m => m.id !== mapId));
      if (currentMapId === mapId) {
        setCurrentMapId(null);
      }
    } catch (error) {
      console.error('Failed to delete map:', error);
    }
  }, [maps, currentMapId]);

  useEffect(() => {
    loadMaps();
  }, [loadMaps]);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: GradientPoint = {
      id: `point-${Date.now()}`,
      name: `Point ${points.length + 1}`,
      x: x - pan.x,
      y: y - pan.y,
      color: '#3b82f6',
      opacity: 1,
      radius: 150,
      edgeType: 'soft',
      shape: 'blob',
      focusX: 0,
      focusY: 0,
      gradientType: 'solid',
      gradientColors: ['#3b82f6', '#8b5cf6'],
      gradientStops: [
        { id: 'stop-1', color: '#3b82f6', position: 0 },
        { id: 'stop-2', color: '#8b5cf6', position: 100 }
      ],
      borderThickness: 8,
      borderBlur: 0,
    };
    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    saveToHistory(newPoints);
    setSelectedPoint(newPoint.id);
  }, [points, saveToHistory, pan]);

  const duplicatePoint = useCallback((pointId: string) => {
    const point = points.find(p => p.id === pointId);
    if (point) {
      const newPoint = {
        ...point,
        id: `point-${Date.now()}`,
        name: point.name ? `${point.name} Copy` : `Point ${points.length + 1} Copy`,
        x: point.x + 20,
        y: point.y + 20,
      };
      const newPoints = [...points, newPoint];
      setPoints(newPoints);
      saveToHistory(newPoints);
      setSelectedPoint(newPoint.id);
    }
  }, [points, saveToHistory]);

  const deletePoint = useCallback((pointId: string) => {
    const newPoints = points.filter(p => p.id !== pointId);
    setPoints(newPoints);
    saveToHistory(newPoints);
    if (selectedPoint === pointId) {
      setSelectedPoint(null);
    }
  }, [points, selectedPoint, saveToHistory]);

  const updatePoint = useCallback((pointId: string, updates: Partial<GradientPoint>) => {
    const newPoints = points.map(p => p.id === pointId ? { ...p, ...updates } : p);
    setPoints(newPoints);
  }, [points]);

  const getCursorPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    // Account for zoom transformation - get position relative to scaled canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  }, []);

  const getHoveredElement = useCallback((x: number, y: number) => {
    // Check focus handles first (highest priority for selected point)
    for (const point of points) {
      if (point.id === selectedPoint) {
        const screenX = point.x + pan.x;
        const screenY = point.y + pan.y;

        // Check pink focus handle with larger hit area for easier interaction
        const focusX = screenX + point.focusX;
        const focusY = screenY + point.focusY;
        const focusDistance = Math.sqrt((focusX - x) ** 2 + (focusY - y) ** 2);
        // Use 12px for hover (larger than visual 10px) to make it easier to grab
        if (focusDistance <= 12) {
          return { type: 'focus' as const, id: point.id };
        }

        // Check radius handle
        const radiusDistance = Math.sqrt((screenX + point.radius - x) ** 2 + (screenY - y) ** 2);
        if (radiusDistance <= 8) {
          return { type: 'radius' as const, id: point.id };
        }
      }
    }

    // Check points - now checking INSIDE the entire shape, not just circumference
    for (const point of points) {
      const screenX = point.x + pan.x;
      const screenY = point.y + pan.y;

      // Check based on shape - inside the entire area
      if (point.shape === 'circle' || point.shape === 'blob') {
        const distance = Math.sqrt((screenX - x) ** 2 + (screenY - y) ** 2);
        if (distance <= point.radius) {
          return { type: 'point' as const, id: point.id };
        }
      } else if (point.shape === 'square') {
        const size = point.radius * 2;
        const halfSize = size / 2;
        const isInside = (
          Math.abs(x - screenX) <= halfSize &&
          Math.abs(y - screenY) <= halfSize
        );
        if (isInside) {
          return { type: 'point' as const, id: point.id };
        }
      } else if (point.shape === 'rectangle') {
        const width = point.radius * 3;
        const height = point.radius * 1.5;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const isInside = (
          Math.abs(x - screenX) <= halfWidth &&
          Math.abs(y - screenY) <= halfHeight
        );
        if (isInside) {
          return { type: 'point' as const, id: point.id };
        }
      }
    }

    return null;
  }, [points, selectedPoint, pan]);

  const renderGradient = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Don't paint background - let CSS grid show through
    // ctx.fillStyle = backgroundColor;
    // ctx.fillRect(0, 0, width, height);

    // Draw center quadrant lines
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    ctx.setLineDash([]);

    points.forEach(point => {
      const screenX = point.x + pan.x;
      const screenY = point.y + pan.y;
      const focusX = screenX + point.focusX;
      const focusY = screenY + point.focusY;
      
      // Apply gradient based on shape
      ctx.globalCompositeOperation = 'screen';
      
      // For solid type, just use solid color without gradient
      if (point.gradientType === 'solid') {
        const color = hexToRgb(point.color);
        if (color) {
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${point.opacity})`;
        }
      } else {
        // Create gradient based on gradientType and shape
        let gradient: CanvasGradient;
        
        // Determine dimensions based on shape
        let gradientWidth = point.radius;
        let gradientHeight = point.radius;
        
        if (point.shape === 'rectangle') {
          gradientWidth = point.radius * 3;
          gradientHeight = point.radius * 1.5;
        } else if (point.shape === 'square') {
          gradientWidth = point.radius * 2;
          gradientHeight = point.radius * 2;
        }
        
        if (point.gradientType === 'linear') {
          // Linear gradient from focus to edge
          const angle = Math.atan2(point.focusY, point.focusX);
          const maxDim = Math.max(gradientWidth, gradientHeight);
          const startX = screenX + Math.cos(angle) * maxDim;
          const startY = screenY + Math.sin(angle) * maxDim;
          const endX = screenX - Math.cos(angle) * maxDim;
          const endY = screenY - Math.sin(angle) * maxDim;
          gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        } else {
          // Radial gradient for radial type
          const maxDim = Math.max(gradientWidth, gradientHeight);
          gradient = ctx.createRadialGradient(
            focusX, focusY, 0,
            screenX, screenY, maxDim
          );
        }
        
        // Add color stops for multi-color gradients
        const colors = point.gradientColors?.length >= 2 ? point.gradientColors : [point.color, point.color];
        
        if (point.gradientStops && point.gradientStops.length >= 2) {
          const sortedStops = [...point.gradientStops].sort((a, b) => a.position - b.position);
          sortedStops.forEach((stop) => {
            const rgb = hexToRgb(stop.color);
            if (rgb) {
              const position = stop.position / 100; // Convert percentage to 0-1 range
              const stopAlpha = stop.alpha !== undefined ? stop.alpha / 100 : 1;
              const opacity = point.edgeType === 'soft' 
                ? point.opacity * stopAlpha * (1 - position)
                : (position < 0.8 ? point.opacity * stopAlpha : point.opacity * stopAlpha * (1 - (position - 0.8) / 0.2));
              gradient.addColorStop(position, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
            }
          });
        } else {
          // Fallback to evenly-spaced colors if gradientStops not available
          colors.forEach((color, i) => {
            const rgb = hexToRgb(color);
            if (rgb) {
              const position = i / (colors.length - 1);
              const opacity = point.edgeType === 'soft' 
                ? point.opacity * (1 - position)
                : (position < 0.8 ? point.opacity : point.opacity * (1 - (position - 0.8) / 0.2));
              gradient.addColorStop(position, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
            }
          });
        }
        
        ctx.fillStyle = gradient;
      }
      
      // Draw shape
      if (point.shape === 'blob') {
        // For blob shapes, use clipping to constrain the fill
        ctx.save();
        ctx.beginPath();
        ctx.arc(screenX, screenY, point.radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillRect(screenX - point.radius, screenY - point.radius, point.radius * 2, point.radius * 2);
        ctx.restore();
      } else if (point.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(screenX, screenY, point.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (point.shape === 'square') {
        const size = point.radius * 2;
        ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
      } else if (point.shape === 'rectangle') {
        const width = point.radius * 3;
        const height = point.radius * 1.5;
        ctx.fillRect(screenX - width / 2, screenY - height / 2, width, height);
      }
      
      ctx.globalCompositeOperation = 'source-over';
    });

    // Render images without borders (simple clipped image with opacity and scale)
    points.forEach(point => {
      if (point.image && loadedImages.has(point.image)) {
        const screenX = point.x + pan.x;
        const screenY = point.y + pan.y;
        const img = loadedImages.get(point.image)!;
        const radius = point.radius;
        const imageShape = point.shape || 'circle';
        const imageScale = point.imageScale || 1;

        // Use point.width/height if available, otherwise calculate from radius
        const width = point.width || (imageShape === 'rectangle' ? radius * 3 : radius * 2);
        const height = point.height || (imageShape === 'rectangle' ? radius * 1.5 : radius * 2);

        ctx.save();

        // Apply opacity
        ctx.globalAlpha = point.opacity;

        // Clip to shape
        ctx.beginPath();
        if (imageShape === 'circle' || imageShape === 'blob') {
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        } else if (imageShape === 'square') {
          ctx.rect(screenX - width / 2, screenY - height / 2, width, height);
        } else if (imageShape === 'rectangle') {
          ctx.rect(screenX - width / 2, screenY - height / 2, width, height);
        }
        ctx.clip();

        // Draw image inside shape with scale applied
        if (imageShape === 'circle' || imageShape === 'blob') {
          const imgSize = radius * 2 * imageScale;
          ctx.drawImage(
            img,
            screenX - imgSize / 2,
            screenY - imgSize / 2,
            imgSize,
            imgSize
          );
        } else if (imageShape === 'square') {
          const scaledWidth = width * imageScale;
          const scaledHeight = height * imageScale;
          ctx.drawImage(
            img,
            screenX - scaledWidth / 2,
            screenY - scaledHeight / 2,
            scaledWidth,
            scaledHeight
          );
        } else if (imageShape === 'rectangle') {
          const scaledWidth = width * imageScale;
          const scaledHeight = height * imageScale;
          ctx.drawImage(
            img,
            screenX - scaledWidth / 2,
            screenY - scaledHeight / 2,
            scaledWidth,
            scaledHeight
          );
        }

        ctx.restore();
      }
    });

    if (showOverlays) {
      points.forEach(point => {
        const screenX = point.x + pan.x;
        const screenY = point.y + pan.y;
        
        ctx.strokeStyle = point.id === selectedPoint ? '#3b82f6' : '#ffffff';
        ctx.lineWidth = point.id === selectedPoint ? 3 : 2;
        ctx.fillStyle = point.color;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (point.id === selectedPoint) {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          
          if (point.shape === 'circle' || point.shape === 'blob') {
            ctx.beginPath();
            ctx.arc(screenX, screenY, point.radius, 0, Math.PI * 2);
            ctx.stroke();
          } else if (point.shape === 'square') {
            const size = point.radius * 2;
            ctx.strokeRect(screenX - size / 2, screenY - size / 2, size, size);
          } else if (point.shape === 'rectangle') {
            const width = point.radius * 3;
            const height = point.radius * 1.5;
            ctx.strokeRect(screenX - width / 2, screenY - height / 2, width, height);
          }
          
          ctx.setLineDash([]);

          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(screenX + point.radius, screenY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const focusX = screenX + point.focusX;
          const focusY = screenY + point.focusY;
          
          // Draw direction line from main point to focus point
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(focusX, focusY);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Draw focus point with glow effect
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = draggingFocus === point.id ? 20 : 10;
          ctx.fillStyle = '#ec4899';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(focusX, focusY, draggingFocus === point.id ? 12 : 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
    }
  }, [points, selectedPoint, pan, showOverlays, backgroundColor, loadedImages, draggingFocus]);

  const renderLabels = useCallback(() => {
    const canvas = textCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = fontColor;
    ctx.font = `${fontSize}px ${fontFamily}, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top label
    ctx.fillText(topLabel, width / 2, 20);
    
    // Right label - rotated text
    ctx.save();
    ctx.translate(width - 20, height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(rightLabel, 0, 0);
    ctx.restore();
    
    // Bottom label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bottomLabel, width / 2, height - 35);
    
    // Left label - rotated text
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(leftLabel, 0, 0);
    ctx.restore();
  }, [topLabel, rightLabel, bottomLabel, leftLabel, fontFamily, fontSize, fontColor]);

  useEffect(() => {
    const newLoadedImages = new Map<string, HTMLImageElement>();
    
    points.forEach(point => {
      if (point.image && !loadedImages.has(point.image)) {
        const img = new Image();
        img.src = point.image;
        img.onload = () => {
          newLoadedImages.set(point.image!, img);
          setLoadedImages(prev => new Map(prev).set(point.image!, img));
        };
      } else if (point.image && loadedImages.has(point.image)) {
        newLoadedImages.set(point.image, loadedImages.get(point.image)!);
      }
    });
  }, [points]);

  useEffect(() => {
    renderGradient();
  }, [renderGradient]);

  useEffect(() => {
    renderLabels();
  }, [renderLabels]);

  useEffect(() => {
    if (onPointsChange) {
      onPointsChange(points);
    }
  }, [points, onPointsChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCursorPosition(e);
    if (!pos) return;

    if (draggingPoint || draggingRadius || draggingFocus || isPanning) {
      handleMouseMove(e);
      return;
    }

    const hovered = getHoveredElement(pos.x, pos.y);
    
    if (e.shiftKey) {
      setCursorStyle('grab');
    } else if (hovered?.type === 'point') {
      setCursorStyle('move');
    } else if (hovered?.type === 'radius') {
      setCursorStyle('nwse-resize');
    } else if (hovered?.type === 'focus') {
      setCursorStyle('grab');
    } else {
      setCursorStyle('crosshair');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning || draggingPoint || draggingRadius || draggingFocus || e.shiftKey || panJustEnded || dragJustEnded) {
      return;
    }
    
    const pos = getCursorPosition(e);
    if (!pos) return;

    const hovered = getHoveredElement(pos.x, pos.y);
    
    if (hovered?.type === 'point') {
      setSelectedPoint(hovered.id);
      return;
    }

    if (!hovered) {
      addPoint(pos.x, pos.y);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCursorPosition(e);
    if (!pos) return;

    // Clear flags on any mousedown
    if (panJustEnded) {
      setPanJustEnded(false);
    }
    if (dragJustEnded) {
      setDragJustEnded(false);
    }

    if (e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setCursorStyle('grabbing');
      return;
    }

    const hovered = getHoveredElement(pos.x, pos.y);
    
    if (hovered?.type === 'point') {
      setDraggingPoint(hovered.id);
      setSelectedPoint(hovered.id);
      setCursorStyle('grabbing');
      return;
    }

    if (hovered?.type === 'radius') {
      setDraggingRadius(hovered.id);
      return;
    }

    if (hovered?.type === 'focus') {
      setDraggingFocus(hovered.id);
      setCursorStyle('grabbing');
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCursorPosition(e);
    if (!pos) return;

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingPoint) {
      updatePoint(draggingPoint, { x: pos.x - pan.x, y: pos.y - pan.y });
    } else if (draggingRadius) {
      const point = points.find(p => p.id === draggingRadius);
      if (point) {
        const screenX = point.x + pan.x;
        const screenY = point.y + pan.y;
        const newRadius = Math.sqrt((pos.x - screenX) ** 2 + (pos.y - screenY) ** 2);
        const clampedRadius = Math.max(20, newRadius);
        
        // For square image shapes, also update width and height
        if (point.image && point.shape === 'square') {
          updatePoint(draggingRadius, { 
            radius: clampedRadius, 
            width: clampedRadius * 2, 
            height: clampedRadius * 2 
          });
        } else {
          updatePoint(draggingRadius, { radius: clampedRadius });
        }
      }
    } else if (draggingFocus) {
      const point = points.find(p => p.id === draggingFocus);
      if (point) {
        const screenX = point.x + pan.x;
        const screenY = point.y + pan.y;
        updatePoint(draggingFocus, { 
          focusX: pos.x - screenX, 
          focusY: pos.y - screenY 
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingPoint || draggingRadius || draggingFocus) {
      saveToHistory(points);
      setDragJustEnded(true);
    }
    if (isPanning) {
      setPanJustEnded(true);
    }
    setDraggingPoint(null);
    setDraggingRadius(null);
    setDraggingFocus(null);
    setIsPanning(false);
    setCursorStyle('crosshair');
  };

  const handleExport = () => {
    const gradientCanvas = canvasRef.current;
    const labelCanvas = textCanvasRef.current;
    if (!gradientCanvas || !labelCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1200;
    exportCanvas.height = 800;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    ctx.drawImage(gradientCanvas, 0, 0);

    ctx.drawImage(labelCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = 'gradient.png';
    link.href = exportCanvas.toDataURL();
    link.click();
  };

  const selectedPointData = points.find(p => p.id === selectedPoint);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden fixed inset-0">
      <div className="flex flex-col flex-1 h-screen">
        <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card">
          <h1 className="text-sm font-semibold">Gradient Canvas</h1>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  data-testid="button-undo"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  data-testid="button-redo"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleExport}
                  data-testid="button-export"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export PNG</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsDarkMode(!isDarkMode);
                    setBackgroundColor(isDarkMode ? '#f5f5f5' : '#333333');
                    setFontColor(isDarkMode ? '#000000' : '#ffffff');
                  }}
                  data-testid="button-theme-toggle"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div 
          className="relative flex-1 overflow-hidden"
          style={{ 
            backgroundColor,
            backgroundImage: showGrid ? (() => {
              const rgb = hexToRgb(gridColor);
              const gridColorWithOpacity = rgb 
                ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${gridOpacity})`
                : `rgba(64, 64, 64, ${gridOpacity})`;
              return `
                linear-gradient(${gridColorWithOpacity} 1px, transparent 1px),
                linear-gradient(90deg, ${gridColorWithOpacity} 1px, transparent 1px)
              `;
            })() : 'none',
            backgroundSize: showGrid ? `${gridSize * zoom}px ${gridSize * zoom}px` : undefined,
            backgroundPosition: showGrid ? `calc(50% + ${pan.x * zoom}px) calc(50% + ${pan.y * zoom}px)` : undefined
          }}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800}
                    className="block"
                    style={{ 
                      cursor: cursorStyle,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center center'
                    }}
                    onClick={handleCanvasClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    data-testid="canvas-gradient"
                  />
                  <canvas
                    ref={textCanvasRef}
                    width={1200}
                    height={800}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ 
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center center'
                    }}
                    data-testid="canvas-labels"
                  />
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              {selectedPoint && (
                <>
                  <ContextMenuItem onClick={() => duplicatePoint(selectedPoint)} data-testid="menu-duplicate">
                    Duplicate Point
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => deletePoint(selectedPoint)} data-testid="menu-delete">
                    Delete Point
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>

          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-md px-3 py-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              data-testid="button-zoom-out"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xs text-white font-mono w-12 text-center" data-testid="text-zoom">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              data-testid="button-zoom-in"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-md px-3 py-2">
            <p className="text-xs text-white">
              {draggingPoint && '🔵 Moving Point'}
              {draggingFocus && '💗 Adjusting Focus'}
              {draggingRadius && '🔷 Adjusting Radius'}
              {isPanning && '✋ Panning Canvas'}
              {!draggingPoint && !draggingFocus && !draggingRadius && !isPanning && 'Hold Shift to Pan • Click to Add Point • Drag Pink Focus Point to Adjust Gradient'}
            </p>
          </div>
        </div>
      </div>

      <div className="w-80 border-l border-border bg-card flex flex-col h-screen overflow-y-auto">
        <Tabs defaultValue="points" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b border-border bg-transparent h-12 sticky top-0 bg-card z-10">
            <TabsTrigger value="points" data-testid="tab-points">Points</TabsTrigger>
            <TabsTrigger value="canvas" data-testid="tab-canvas">Canvas</TabsTrigger>
            <TabsTrigger value="labels" data-testid="tab-labels">Labels</TabsTrigger>
            <TabsTrigger value="maps" data-testid="tab-maps">Maps</TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="p-4 space-y-4 mt-0">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3">Gradient Points</h3>
              {points.length === 0 ? (
                <p className="text-sm text-muted-foreground">Click on canvas to add points</p>
              ) : (
                <div className="space-y-2">
                  {points.map((point, index) => (
                    <div
                      key={point.id}
                      className={`flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer ${
                        selectedPoint === point.id ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => setSelectedPoint(point.id)}
                      data-testid={`point-item-${point.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-md border border-border"
                          style={{ backgroundColor: point.color }}
                        />
                        <div>
                          <div className="text-sm font-medium">{point.name || `Point ${index + 1}`}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {Math.round(point.x)}, {Math.round(point.y)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicatePoint(point.id);
                          }}
                          data-testid={`button-duplicate-${point.id}`}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePoint(point.id);
                          }}
                          data-testid={`button-delete-${point.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPointData && (
              <>
                <div className="pt-4 border-t border-border space-y-4">
                  <div>
                    <Label htmlFor="point-name" className="text-xs uppercase tracking-wide mb-2 block">Point Name</Label>
                    <Input
                      id="point-name"
                      type="text"
                      value={selectedPointData.name || ''}
                      onChange={(e) => {
                        updatePoint(selectedPointData.id, { name: e.target.value });
                        saveToHistory(points.map(p => p.id === selectedPointData.id ? { ...p, name: e.target.value } : p));
                      }}
                      placeholder={`Point ${points.findIndex(p => p.id === selectedPointData.id) + 1}`}
                      className="h-9"
                      data-testid="input-point-name"
                    />
                  </div>
                  
                  <ColorPicker
                    point={selectedPointData}
                    onUpdate={(updates) => {
                      updatePoint(selectedPointData.id, updates);
                      saveToHistory(points.map(p => p.id === selectedPointData.id ? { ...p, ...updates } : p));
                    }}
                    hideClose={true}
                  />
                </div>

              </>
            )}
          </TabsContent>

          <TabsContent value="canvas" className="p-4 space-y-4 mt-0">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3">Canvas Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bg-color" className="text-xs uppercase tracking-wide">Background Color</Label>
                  <Input
                    id="bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 mt-1"
                    data-testid="input-bg-color"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-overlays" className="text-xs uppercase tracking-wide">Show Overlays</Label>
                  <Switch
                    id="show-overlays"
                    checked={showOverlays}
                    onCheckedChange={setShowOverlays}
                    data-testid="switch-overlays"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3">Grid Customization</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid" className="text-xs uppercase tracking-wide">Show Grid</Label>
                  <Switch
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                    data-testid="switch-grid"
                  />
                </div>

                {showGrid && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs uppercase tracking-wide">Grid Size</Label>
                        <span className="text-xs text-muted-foreground font-mono" data-testid="text-grid-size">
                          {gridSize}px
                        </span>
                      </div>
                      <Slider
                        value={[gridSize]}
                        onValueChange={([v]) => setGridSize(v)}
                        min={10}
                        max={50}
                        step={5}
                        data-testid="slider-grid-size"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs uppercase tracking-wide">Grid Opacity</Label>
                        <span className="text-xs text-muted-foreground font-mono" data-testid="text-grid-opacity">
                          {Math.round(gridOpacity * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[gridOpacity * 100]}
                        onValueChange={([v]) => setGridOpacity(v / 100)}
                        max={100}
                        step={5}
                        data-testid="slider-grid-opacity"
                      />
                    </div>

                    <div>
                      <Label htmlFor="grid-color" className="text-xs uppercase tracking-wide">Grid Color</Label>
                      <Input
                        id="grid-color"
                        type="color"
                        value={gridColor}
                        onChange={(e) => setGridColor(e.target.value)}
                        className="h-10 mt-1"
                        data-testid="input-grid-color"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3">Pan Controls</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Hold Shift and drag to pan around the canvas.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPan({ x: 0, y: 0 });
                  setZoom(1);
                }}
                data-testid="button-reset-view"
              >
                Reset View
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="labels" className="p-4 space-y-4 mt-0">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3">Quadrant Labels</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="top-label" className="text-xs uppercase tracking-wide">Top Label</Label>
                  <Input
                    id="top-label"
                    value={topLabel}
                    onChange={(e) => setTopLabel(e.target.value)}
                    className="mt-1"
                    data-testid="input-top-label"
                  />
                </div>

                <div>
                  <Label htmlFor="right-label" className="text-xs uppercase tracking-wide">Right Label</Label>
                  <Input
                    id="right-label"
                    value={rightLabel}
                    onChange={(e) => setRightLabel(e.target.value)}
                    className="mt-1"
                    data-testid="input-right-label"
                  />
                </div>

                <div>
                  <Label htmlFor="bottom-label" className="text-xs uppercase tracking-wide">Bottom Label</Label>
                  <Input
                    id="bottom-label"
                    value={bottomLabel}
                    onChange={(e) => setBottomLabel(e.target.value)}
                    className="mt-1"
                    data-testid="input-bottom-label"
                  />
                </div>

                <div>
                  <Label htmlFor="left-label" className="text-xs uppercase tracking-wide">Left Label</Label>
                  <Input
                    id="left-label"
                    value={leftLabel}
                    onChange={(e) => setLeftLabel(e.target.value)}
                    className="mt-1"
                    data-testid="input-left-label"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3">Typography</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="font-family" className="text-xs uppercase tracking-wide">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger id="font-family" className="mt-1" data-testid="select-font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Satoshi">Satoshi</SelectItem>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs uppercase tracking-wide">Font Size</Label>
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-font-size">
                      {fontSize}px
                    </span>
                  </div>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => setFontSize(v)}
                    min={10}
                    max={32}
                    step={1}
                    data-testid="slider-font-size"
                  />
                </div>

                <div>
                  <Label htmlFor="font-color" className="text-xs uppercase tracking-wide">Font Color</Label>
                  <Input
                    id="font-color"
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="h-10 mt-1"
                    data-testid="input-font-color"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="maps" className="p-4 space-y-4 mt-0">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide">Map Management</h3>
                <Button
                  size="sm"
                  onClick={createMap}
                  data-testid="button-create-map"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Map
                </Button>
              </div>

              {currentMapId && (
                <div className="p-3 bg-accent/50 rounded-lg mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Current Map</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveCurrentMap}
                      data-testid="button-save-current-map"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {isLoadingMaps ? (
                <p className="text-sm text-muted-foreground">Loading maps...</p>
              ) : maps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No maps yet. Create your first map to get started.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {maps.map((map) => (
                    <div
                      key={map.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        currentMapId === map.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                      data-testid={`map-item-${map.id}`}
                    >
                      <div className="flex-1 mr-2">
                        {editingMapId === map.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingMapTitle}
                              onChange={(e) => setEditingMapTitle(e.target.value)}
                              className="h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateMapTitle(map.id, editingMapTitle);
                                } else if (e.key === 'Escape') {
                                  setEditingMapId(null);
                                }
                              }}
                              data-testid={`input-map-title-${map.id}`}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateMapTitle(map.id, editingMapTitle)}
                              data-testid={`button-save-title-${map.id}`}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingMapId(null)}
                              data-testid={`button-cancel-title-${map.id}`}
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer"
                            onClick={() => loadMap(map.id)}
                          >
                            <div className="text-sm font-medium">{map.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof map.points === 'string' ? JSON.parse(map.points).length : map.points.length} points
                              {map.settings && (() => {
                                const settings = typeof map.settings === 'string' ? JSON.parse(map.settings) : map.settings;
                                return settings.topLabel ? ` • ${settings.topLabel}, ${settings.rightLabel}, ${settings.bottomLabel}, ${settings.leftLabel}` : '';
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingMapId !== map.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingMapId(map.id);
                              setEditingMapTitle(map.title);
                            }}
                            data-testid={`button-edit-${map.id}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => deleteMap(map.id)}
                          data-testid={`button-delete-${map.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
