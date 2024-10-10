import React from 'react';
import { Plus } from 'lucide-react';
import Layer from './Layer';
import { LayerData } from '../types';

interface LayerPanelProps {
  layers: LayerData[];
  activeLayerIndex: number;
  onAddLayer: () => void;
  onSelectLayer: (index: number) => void;
  onToggleLayerVisibility: (index: number) => void;
  onDeleteLayer: (index: number) => void;
}

export default function LayerPanel({
  layers,
  activeLayerIndex,
  onAddLayer,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayer,
}: LayerPanelProps) {
  return (
    <div className="border-t mt-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Layers</h3>
        <button
          onClick={onAddLayer}
          className="p-1 hover:bg-gray-100 rounded"
          title="Add new layer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        {layers.map((layer, index) => (
          <Layer
            key={layer.id}
            name={layer.name}
            isVisible={layer.isVisible}
            isActive={index === activeLayerIndex}
            onToggleVisibility={() => onToggleLayerVisibility(index)}
            onSelect={() => onSelectLayer(index)}
            onDelete={() => onDeleteLayer(index)}
          />
        ))}
      </div>
    </div>
  );
}