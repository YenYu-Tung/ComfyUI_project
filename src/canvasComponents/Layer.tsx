import React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface LayerProps {
  name: string;
  isVisible: boolean;
  isActive: boolean;
  onToggleVisibility: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

export default function Layer({
  name,
  isVisible,
  isActive,
  onToggleVisibility,
  onSelect,
  onDelete,
}: LayerProps) {
  return (
    <div
      className={`flex items-center p-2 rounded ${
        isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <button
        className="p-1 hover:bg-gray-200 rounded"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
      >
        {isVisible ? (
          <Eye className="w-4 h-4 text-gray-600" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
      </button>
      <span className="flex-1 mx-2 text-sm truncate">{name}</span>
      <button
        className="p-1 hover:bg-gray-200 rounded"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}