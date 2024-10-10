export interface StageState {
  history: ImageData[];
  thumbnailUrl: string | null;
  historyIndex: number;
  layers?: LayerData[];
}

export interface LayerData {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  isVisible: boolean;
  opacity: number;
  history: ImageData[];
  historyIndex: number;
}