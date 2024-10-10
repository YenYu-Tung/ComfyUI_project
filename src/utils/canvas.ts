export function createOffscreenCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function clearCanvas(context: CanvasRenderingContext2D) {
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
}

export function compositeLayersToCanvas(
  targetContext: CanvasRenderingContext2D,
  layers: { canvas: HTMLCanvasElement; isVisible: boolean }[]
) {
  const { width, height } = targetContext.canvas;
  clearCanvas(targetContext);

  layers.forEach(layer => {
    if (layer.isVisible) {
      targetContext.drawImage(layer.canvas, 0, 0, width, height);
    }
  });
}

export function getCanvasImageData(canvas: HTMLCanvasElement): ImageData {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function putImageDataToCanvas(canvas: HTMLCanvasElement, imageData: ImageData) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  context.putImageData(imageData, 0, 0);
}