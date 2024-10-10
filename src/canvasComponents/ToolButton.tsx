import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: LucideIcon;
  iconProps?: {
    color?: string;
    strokeWidth?: number;
  };
}

export default function ToolButton({ isActive, onClick, icon: Icon, iconProps }: ToolButtonProps) {
  return (
    <button
      className={`p-2.5 rounded-xl flex items-center ${isActive ? 'bg-primary text-tint' : 'hover:bg-tint'}`}
      onClick={onClick}
    >
      <Icon className="w-5 h-5" {...iconProps} />
    </button>
  );
}