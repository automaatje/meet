import { useEffect, useRef, useState } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import type { DetectedObject, ObjectType } from '../../lib/visualizer/types';

interface CanvasEditorProps {
  photoUrl: string;
  objects: DetectedObject[];
  onObjectsChange: (objects: DetectedObject[]) => void;
  isDrawingMode: boolean;
}

export default function CanvasEditor({
  photoUrl,
  objects,
  onObjectsChange,
  isDrawingMode
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<DetectedObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [dragObject, setDragObject] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeObject, setResizeObject] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const getRelativePos = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawingMode) return;

    const pos = getRelativePos(e);
    setDrawing(true);
    setStartPos(pos);
    setCurrentRect({
      id: `temp-${Date.now()}`,
      type: 'window',
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !currentRect) return;

    const pos = getRelativePos(e);
    setCurrentRect({
      ...currentRect,
      width: pos.x - startPos.x,
      height: pos.y - startPos.y
    });
  };

  const handleMouseUp = () => {
    if (!drawing || !currentRect) return;

    if (Math.abs(currentRect.width) > 20 && Math.abs(currentRect.height) > 20) {
      const normalizedRect = {
        ...currentRect,
        id: `object-${Date.now()}`,
        x: currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x,
        y: currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y,
        width: Math.abs(currentRect.width),
        height: Math.abs(currentRect.height)
      };
      onObjectsChange([...objects, normalizedRect]);
    }

    setDrawing(false);
    setCurrentRect(null);
  };

  const handleObjectClick = (objectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDrawingMode) {
      setSelectedObject(objectId);
    }
  };

  const handleTypeChange = (objectId: string, type: ObjectType) => {
    onObjectsChange(
      objects.map(obj => obj.id === objectId ? { ...obj, type } : obj)
    );
  };

  const handleDelete = (objectId: string) => {
    onObjectsChange(objects.filter(obj => obj.id !== objectId));
    setSelectedObject(null);
  };

  const getTypeLabel = (type: ObjectType) => {
    const labels = {
      window: 'Kozijn',
      door: 'Deur',
      exterior_door: 'Buitendeur'
    };
    return labels[type];
  };

  const getTypeColor = (type: ObjectType) => {
    const colors = {
      window: 'border-blue-500 bg-blue-500/10',
      door: 'border-green-500 bg-green-500/10',
      exterior_door: 'border-purple-500 bg-purple-500/10'
    };
    return colors[type];
  };

  return (
    <div className="relative w-full h-full pointer-events-none">
      <div
        ref={containerRef}
        className={`relative w-full h-full ${isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (drawing) handleMouseUp();
        }}
      >
        <img
          src={photoUrl}
          alt="Visualization"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        >
          {objects.map((obj) => (
            <g key={obj.id}>
              <rect
                x={obj.x}
                y={obj.y}
                width={obj.width}
                height={obj.height}
                className={`${getTypeColor(obj.type)} ${selectedObject === obj.id ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}
                style={{ strokeWidth: 2, pointerEvents: 'all', cursor: 'move' }}
                onClick={(e) => handleObjectClick(obj.id, e as any)}
              />
              <text
                x={obj.x + obj.width / 2}
                y={obj.y - 8}
                textAnchor="middle"
                className="fill-white text-xs font-medium pointer-events-none"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {getTypeLabel(obj.type)}
              </text>
            </g>
          ))}

          {currentRect && drawing && (
            <rect
              x={currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x}
              y={currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y}
              width={Math.abs(currentRect.width)}
              height={Math.abs(currentRect.height)}
              className="border-blue-500 bg-blue-500/10"
              style={{ strokeWidth: 2, strokeDasharray: '5,5' }}
            />
          )}
        </svg>

        {objects.map((obj) => (
          <div
            key={`menu-${obj.id}`}
            className="absolute bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 pointer-events-auto"
            style={{
              left: obj.x + obj.width + 8,
              top: obj.y,
              zIndex: 20
            }}
          >
            <select
              value={obj.type}
              onChange={(e) => handleTypeChange(obj.id, e.target.value as ObjectType)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="window">Kozijn</option>
              <option value="door">Deur</option>
              <option value="exterior_door">Buitendeur</option>
            </select>
            <button
              onClick={() => handleDelete(obj.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
