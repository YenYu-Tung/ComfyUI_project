import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Square, Circle, Pencil, Eraser, ZoomIn, ZoomOut, Undo2, Redo2 } from 'lucide-react';
import ToolButton from './ToolButton';
import LayerPanel from './LayerPanel';
import { LayerData } from '../types';
import { 
  createOffscreenCanvas, 
  clearCanvas, 
  compositeLayersToCanvas,
  getCanvasImageData,
  putImageDataToCanvas
} from '../utils/canvas';

type Tool = 'pencil' | 'rectangle' | 'circle' | 'eraser';
type DrawingShape = { startX: number; startY: number; endX: number; endY: number };

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [zoom, setZoom] = useState(100);
  const displayContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const activeContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [baseImageData, setBaseImageData] = useState<ImageData | null>(null);
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const canUndo = layers[activeLayerIndex]?.historyIndex > 0;
  const canRedo = layers[activeLayerIndex]?.historyIndex < (layers[activeLayerIndex]?.history.length ?? 0) - 1;

  const saveToHistory = useCallback(() => {
    if (!layers[activeLayerIndex]) return;
    
    const currentLayer = layers[activeLayerIndex];
    const newImageData = getCanvasImageData(currentLayer.canvas);
    
    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const layer = { ...newLayers[activeLayerIndex] };
      
      // Remove any redo states
      layer.history = layer.history.slice(0, layer.historyIndex + 1);
      layer.history.push(newImageData);
      layer.historyIndex = layer.history.length - 1;
      
      newLayers[activeLayerIndex] = layer;
      return newLayers;
    });
  }, [activeLayerIndex, layers]);

  const undo = useCallback(() => {
    if (!canUndo) return;

    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const layer = { ...newLayers[activeLayerIndex] };
      
      layer.historyIndex--;
      putImageDataToCanvas(layer.canvas, layer.history[layer.historyIndex]);
      
      newLayers[activeLayerIndex] = layer;
      return newLayers;
    });
    
    updateDisplayCanvas();
  }, [activeLayerIndex, canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const layer = { ...newLayers[activeLayerIndex] };
      
      layer.historyIndex++;
      putImageDataToCanvas(layer.canvas, layer.history[layer.historyIndex]);
      
      newLayers[activeLayerIndex] = layer;
      return newLayers;
    });
    
    updateDisplayCanvas();
  }, [activeLayerIndex, canRedo]);

  const addLayer = useCallback(() => {
    if (!canvasRef.current) return;

    const { width, height } = canvasRef.current;
    const newCanvas = createOffscreenCanvas(width, height);
    const initialImageData = getCanvasImageData(newCanvas);
    
    const newLayer: LayerData = {
      id: crypto.randomUUID(),
      name: `Layer ${layers.length + 1}`,
      isVisible: true,
      canvas: newCanvas,
      history: [initialImageData],
      historyIndex: 0
    };

    setLayers(prev => [...prev, newLayer]);
    setActiveLayerIndex(layers.length);
  }, [layers.length]);

  const deleteLayer = useCallback((index: number) => {
    if (layers.length <= 1) return;

    setLayers(prev => prev.filter((_, i) => i !== index));
    if (activeLayerIndex >= index) {
      setActiveLayerIndex(prev => Math.max(0, prev - 1));
    }
  }, [layers.length, activeLayerIndex]);

  const toggleLayerVisibility = useCallback((index: number) => {
    setLayers(prev => 
      prev.map((layer, i) => 
        i === index ? { ...layer, isVisible: !layer.isVisible } : layer
      )
    );
  }, []);

  const updateDisplayCanvas = useCallback(() => {
    if (!displayContextRef.current) return;
    compositeLayersToCanvas(displayContextRef.current, layers);
  }, [layers]);

  useEffect(() => {
    updateDisplayCanvas();
  }, [updateDisplayCanvas]);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(dpr, dpr);
    displayContextRef.current = context;

    if (!isInitialized) {
      const initialCanvas = createOffscreenCanvas(canvas.width, canvas.height);
      const initialImageData = getCanvasImageData(initialCanvas);
      
      const initialLayer: LayerData = {
        id: crypto.randomUUID(),
        name: 'Layer 1',
        isVisible: true,
        canvas: initialCanvas,
        history: [initialImageData],
        historyIndex: 0
      };
      
      setLayers([initialLayer]);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      initializeCanvas();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [initializeCanvas]);

  useEffect(() => {
    if (layers[activeLayerIndex]) {
      const context = layers[activeLayerIndex].canvas.getContext('2d');
      if (context) {
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = lineWidth;
        context.lineCap = 'round';
        activeContextRef.current = context;
      }
    }
  }, [color, lineWidth, activeLayerIndex, layers]);

  const getAdjustedCoordinates = (e: React.MouseEvent): { offsetX: number; offsetY: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { offsetX: 0, offsetY: 0 };
    
    const scaleX = (rect.width * (100 / zoom)) / rect.width;
    const scaleY = (rect.height * (100 / zoom)) / rect.height;
    
    return {
      offsetX: (e.clientX - rect.left) * scaleX,
      offsetY: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!activeContextRef.current || !layers[activeLayerIndex].isVisible) return;

    const coords = getAdjustedCoordinates(e);
    
    if (tool === 'pencil' || tool === 'eraser') {
      activeContextRef.current.beginPath();
      activeContextRef.current.moveTo(coords.offsetX, coords.offsetY);
    } else {
      const canvas = layers[activeLayerIndex].canvas;
      const context = canvas.getContext('2d');
      if (context) {
        setBaseImageData(context.getImageData(0, 0, canvas.width, canvas.height));
      }
      setCurrentShape({ startX: coords.offsetX, startY: coords.offsetY, endX: coords.offsetX, endY: coords.offsetY });
    }
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !activeContextRef.current || !layers[activeLayerIndex].isVisible) return;
    
    const coords = getAdjustedCoordinates(e);

    if (tool === 'pencil' || tool === 'eraser') {
      if (tool === 'eraser') {
        activeContextRef.current.globalCompositeOperation = 'destination-out';
      }
      activeContextRef.current.lineTo(coords.offsetX, coords.offsetY);
      activeContextRef.current.stroke();
      if (tool === 'eraser') {
        activeContextRef.current.globalCompositeOperation = 'source-over';
      }
      updateDisplayCanvas();
    } else if (baseImageData && currentShape) {
      const context = layers[activeLayerIndex].canvas.getContext('2d');
      if (context) {
        context.putImageData(baseImageData, 0, 0);
        const shape = { ...currentShape, endX: coords.offsetX, endY: coords.offsetY };
        drawShape(shape, context);
        setCurrentShape(shape);
        updateDisplayCanvas();
      }
    }
  };

  const drawShape = (shape: DrawingShape, context: CanvasRenderingContext2D) => {
    const { startX, startY, endX, endY } = shape;
    context.beginPath();

    if (tool === 'rectangle') {
      const width = endX - startX;
      const height = endY - startY;
      context.fillRect(startX, startY, width, height);
      context.strokeRect(startX, startY, width, height);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );
      context.beginPath();
      context.arc(startX, startY, radius, 0, 2 * Math.PI);
      context.fill();
      context.stroke();
    }
  };

  const stopDrawing = () => {
    if (activeContextRef.current) {
      activeContextRef.current.closePath();
      if (isDrawing) {
        saveToHistory();
      }
    }
    setIsDrawing(false);
    setCurrentShape(null);
    setBaseImageData(null);
  };

  const clearActiveLayer = () => {
    const activeLayer = layers[activeLayerIndex];
    if (activeLayer) {
      const context = activeLayer.canvas.getContext('2d');
      if (context) {
        clearCanvas(context);
        updateDisplayCanvas();
        saveToHistory();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    const newZoom = Math.min(Math.max(zoom + delta, 25), 400);
    setZoom(newZoom);
    
    if (canvasRef.current) {
      canvasRef.current.style.transform = `scale(${newZoom / 100})`;
      canvasRef.current.style.transformOrigin = 'center center';
    }
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.min(Math.max(zoom + delta, 25), 400);
    setZoom(newZoom);
    
    if (canvasRef.current) {
      canvasRef.current.style.transform = `scale(${newZoom / 100})`;
      canvasRef.current.style.transformOrigin = 'center center';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Tools Panel */}
      <div className="w-64 bg-white p-4 shadow-lg flex flex-col">
        <h2 className="text-xl font-bold mb-4">Drawing Tools</h2>
        
        {/* Tool Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <ToolButton
            isActive={tool === 'pencil'}
            onClick={() => setTool('pencil')}
            icon={Pencil}
          />
          <ToolButton
            isActive={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            icon={Eraser}
          />
          <ToolButton
            isActive={tool === 'rectangle'}
            onClick={() => setTool('rectangle')}
            icon={Square}
          />
          <ToolButton
            isActive={tool === 'circle'}
            onClick={() => setTool('circle')}
            icon={Circle}
          />
        </div>

        {/* Undo/Redo Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo2 className="w-4 h-4" />
            Redo
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Zoom: {zoom}%
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => adjustZoom(-5)}
                className="p-1 rounded hover:bg-gray-100"
                disabled={zoom <= 25}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => adjustZoom(5)}
                className="p-1 rounded hover:bg-gray-100"
                disabled={zoom >= 400}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="25"
            max="400"
            value={zoom}
            onChange={(e) => adjustZoom(parseInt(e.target.value) - zoom)}
            className="w-full"
          />
        </div>

        {/* Color Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        {/* Line Width */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brush Size: {lineWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Clear Layer Button */}
        <button
          onClick={clearActiveLayer}
          className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors mb-6"
        >
          Clear Layer
        </button>

        {/* Layer Panel */}
        <LayerPanel
          layers={layers}
          activeLayerIndex={activeLayerIndex}
          onAddLayer={addLayer}
          onSelectLayer={setActiveLayerIndex}
          onToggleLayerVisibility={toggleLayerVisibility}
          onDeleteLayer={deleteLayer}
        />
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 p-4 overflow-auto"
        onWheel={handleWheel}
      >
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full bg-white rounded-lg shadow-lg cursor-crosshair transition-transform"
          />
        </div>
      </div>
    </div>
  );
}