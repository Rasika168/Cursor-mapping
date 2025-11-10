import ColorPicker from '../ColorPicker';
import { useState } from 'react';
import { GradientPoint } from '../GradientCanvas';

export default function ColorPickerExample() {
  const [point, setPoint] = useState<GradientPoint>({
    id: 'example-1',
    x: 100,
    y: 100,
    color: '#3b82f6',
    opacity: 1,
    radius: 150,
    edgeType: 'soft',
    shape: 'blob',
    focusX: 0,
    focusY: 0,
  });

  return (
    <div className="w-80 bg-card p-4">
      <ColorPicker
        point={point}
        onUpdate={(updates) => setPoint({ ...point, ...updates })}
        onClose={() => console.log('Close picker')}
      />
    </div>
  );
}
