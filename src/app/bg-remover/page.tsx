'use client';

import { useEffect, useRef, useState } from 'react';

export default function BgRemover() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState(30);
  const [blur, setBlur] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        if (originalCanvasRef.current) {
          const ctx = originalCanvasRef.current.getContext('2d');
          if (ctx) {
            originalCanvasRef.current.width = img.width;
            originalCanvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBg = () => {
    if (!image || !originalCanvasRef.current || !resultCanvasRef.current) return;

    setIsProcessing(true);
    setProgress(0);

    const originalCtx = originalCanvasRef.current.getContext('2d');
    const resultCtx = resultCanvasRef.current.getContext('2d');
    if (!originalCtx || !resultCtx) return;

    resultCanvasRef.current.width = image.width;
    resultCanvasRef.current.height = image.height;

    // Get image data
    const imageData = originalCtx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;

    // Create a mask for background removal
    const mask = createMask(data, image.width, image.height, threshold);
    
    // Apply the mask
    applyMask(resultCtx, image, mask, image.width, image.height, blur);

    setIsProcessing(false);
    setProgress(100);
  };

  const createMask = (data: Uint8ClampedArray, width: number, height: number, threshold: number) => {
    const mask = new Uint8ClampedArray(width * height);
    const visited = new Uint8ClampedArray(width * height);
    const queue: [number, number][] = [];

    // Start from the borders
    for (let x = 0; x < width; x++) {
      enqueue(queue, visited, x, 0, width);
      enqueue(queue, visited, x, height - 1, width);
    }

    for (let y = 0; y < height; y++) {
      enqueue(queue, visited, 0, y, width);
      enqueue(queue, visited, width - 1, y, width);
    }

    // Flood fill from borders
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const idx = y * width + x;

      if (mask[idx] === 1) continue;

      mask[idx] = 1; // Mark as background

      // Update progress
      setProgress(Math.min(50, (queue.length / (width * height) * 50)));

      // Check neighbors
      const neighbors: [number, number][] = [
        [x+1, y], [x-1, y], [x, y+1], [x, y-1],
        [x+1, y+1], [x+1, y-1], [x-1, y+1], [x-1, y-1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (visited[ny * width + nx] === 1) continue;

        const origIdx = idx * 4;
        const newIdx = (ny * width + nx) * 4;

        const dr = data[origIdx] - data[newIdx];
        const dg = data[origIdx + 1] - data[newIdx + 1];
        const db = data[origIdx + 2] - data[newIdx + 2];

        const colorDiff = Math.sqrt(dr*dr + dg*dg + db*db);

        if (colorDiff < threshold * 2.55) {
          enqueue(queue, visited, nx, ny, width);
        }
      }
    }

    return mask;
  };

  const enqueue = (queue: [number, number][], visited: Uint8ClampedArray, x: number, y: number, width: number) => {
    const idx = y * width + x;
    if (visited[idx] === 0) {
      queue.push([x, y]);
      visited[idx] = 1;
    }
  };

  const applyMask = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, mask: Uint8ClampedArray, width: number, height: number, blurAmount: number) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(image, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      setProgress(50 + (y / height * 50));
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pixelIdx = idx * 4;

        if (mask[idx] === 1) {
          data[pixelIdx + 3] = 0;
        }
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    if (blurAmount > 0) {
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = width;
      blurCanvas.height = height;
      const blurCtx = blurCanvas.getContext('2d');
      if (!blurCtx) return;

      blurCtx.drawImage(tempCanvas, 0, 0);
      blurCtx.filter = `blur(${blurAmount}px)`;
      blurCtx.drawImage(tempCanvas, 0, 0);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(blurCanvas, 0, 0);
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  };

  const handleDownload = () => {
    if (!resultCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'removed-background.png';
    link.href = resultCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-3xl mx-auto p-5 font-sans text-gray-800 leading-relaxed">
      <h1 className="text-center text-3xl font-bold text-blue-600 mb-8">Background Remover</h1>
      
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer transition-colors hover:border-blue-600"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-gray-600">Click or drag an image here to upload</p>
        <input
          title="Upload Image"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {image && (
        <div className="bg-gray-50 p-5 rounded-lg mb-5">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="mb-4">
            <label htmlFor="threshold" className="block mb-2">Sensitivity: {threshold}</label>
            <input
              type="range"
              id="threshold"
              min="1"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="blur" className="block mb-2">Edge Smoothness: {blur}</label>
            <input
              type="range"
              id="blur"
              min="0"
              max="10"
              value={blur}
              onChange={(e) => setBlur(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="relative h-8 bg-gray-100 rounded-lg mt-5 overflow-hidden">
          <div
            className="absolute h-full bg-blue-600 rounded-lg transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute w-full text-center text-white font-bold leading-8 text-shadow">
            Processing: {Math.round(progress)}%
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-5 justify-center my-5">
        <div>
          <h3 className="text-lg font-semibold mb-2">Original</h3>
          <canvas 
            ref={originalCanvasRef} 
            className={`max-w-full h-auto border border-gray-300 rounded-lg ${image ? 'block' : 'hidden'}`}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Result</h3>
          <canvas 
            ref={resultCanvasRef} 
            className={`max-w-full h-auto border border-gray-300 rounded-lg ${image ? 'block' : 'hidden'}`}
          />
        </div>
      </div>
      
      <div className="flex justify-center gap-3 mt-5">
        <button
          className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
            !image || isProcessing 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleRemoveBg}
          disabled={!image || isProcessing}
        >
          Remove Background
        </button>
        <button
          className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
            !image || isProcessing || progress < 100
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleDownload}
          disabled={!image || isProcessing || progress < 100}
        >
          Download Result
        </button>
      </div>
    </div>
  );
} 