"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { 
  Pen, 
  Highlighter, 
  ArrowUpRight, 
  Circle, 
  Undo, 
  Trash2 
} from "lucide-react";
import { DemoHeader } from "./shared/demo-header";
import { 
  scaleImageToFit, 
  getCanvasCoords, 
  drawLine, 
  drawArrow, 
  drawCircle 
} from "@/lib/demo/canvas-utils";
import { DEMO_CONFIG } from "@/lib/demo/constants";
import type { AnnotationTool, Point } from "@/lib/demo/types";

interface DemoAnnotateProps {
  screenshot: string;
  onComplete: (dataUrl: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function DemoAnnotate({
  screenshot,
  onComplete,
  onSkip,
  onBack,
}: DemoAnnotateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<AnnotationTool>("pen");
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPosRef = useRef<Point | null>(null);
  const startPosRef = useRef<Point | null>(null);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxWidth = Math.min(DEMO_CONFIG.MAX_CANVAS_WIDTH, window.innerWidth - 48);
      const { width, height } = scaleImageToFit(img.width, img.height, maxWidth, DEMO_CONFIG.MAX_CANVAS_HEIGHT);

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Save initial state
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([imageData]);
    };
    img.src = screenshot;
  }, [screenshot]);

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsDrawing(true);
      const pos = getCanvasCoords(e, canvas);
      lastPosRef.current = pos;
      startPosRef.current = pos;
    },
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing || !lastPosRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const currentPos = getCanvasCoords(e, canvas);

      // For shapes, restore canvas state before redrawing
      if ((tool === "arrow" || tool === "circle") && history.length > 0) {
        ctx.putImageData(history[history.length - 1], 0, 0);
      }

      // Draw based on tool type
      if (tool === "pen" || tool === "highlighter") {
        drawLine(ctx, lastPosRef.current, currentPos, tool);
        lastPosRef.current = currentPos;
      } else if (tool === "arrow" && startPosRef.current) {
        drawArrow(ctx, startPosRef.current, currentPos);
      } else if (tool === "circle" && startPosRef.current) {
        drawCircle(ctx, startPosRef.current, currentPos);
      }
    },
    [isDrawing, tool, history]
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPosRef.current = null;
      startPosRef.current = null;

      // Save to history with limit
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prev) => [...prev.slice(-(DEMO_CONFIG.MAX_HISTORY_STATES - 1)), imageData]);
      }
    }
  }, [isDrawing]);

  const handleUndo = useCallback(() => {
    if (history.length <= 1) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const newHistory = history.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  }, [history]);

  const handleClear = useCallback(() => {
    if (history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.putImageData(history[0], 0, 0);
    setHistory([history[0]]);
  }, [history]);

  const handleComplete = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onComplete(canvas.toDataURL("image/png"));
  }, [onComplete]);

  const tools: { id: AnnotationTool; icon: React.ReactNode; label: string }[] = [
    { id: "pen", icon: <Pen size={20} />, label: "Pen" },
    { id: "highlighter", icon: <Highlighter size={20} />, label: "Highlight" },
    { id: "arrow", icon: <ArrowUpRight size={20} />, label: "Arrow" },
    { id: "circle", icon: <Circle size={20} />, label: "Circle" },
  ];

  return (
    <div className="space-y-6">
      <DemoHeader onBack={onBack} title="ANNOTATION MODE" icon={<Pen size={18} />} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-retro-black bg-stone-100 p-3 shadow-retro">
        <div className="flex gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`group relative flex h-10 w-10 items-center justify-center border-2 font-bold transition-all ${
                tool === t.id
                  ? "border-retro-black bg-retro-yellow text-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] translate-x-[-1px] translate-y-[-1px]"
                  : "border-stone-300 bg-white text-stone-500 hover:border-retro-black hover:text-retro-black hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div className="flex gap-2 border-l-2 border-stone-300 pl-4">
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="flex h-10 w-10 items-center justify-center border-2 border-stone-300 bg-white text-stone-500 transition-all hover:border-retro-black hover:text-retro-black disabled:opacity-50 disabled:hover:border-stone-300 disabled:hover:text-stone-500"
            title="Undo"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={handleClear}
            disabled={history.length <= 1}
            className="flex h-10 w-10 items-center justify-center border-2 border-stone-300 bg-white text-retro-red transition-all hover:border-retro-red hover:bg-retro-red/10 disabled:opacity-50 disabled:hover:border-stone-300 disabled:hover:bg-white"
            title="Clear all"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative flex justify-center overflow-hidden border-2 border-retro-black bg-[url('/grid-pattern.svg')] bg-center p-8 shadow-inner">
        <div className="absolute inset-0 bg-stone-50 opacity-50" />
        <div className="relative border-2 border-stone-300 bg-white shadow-lg">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="max-w-full cursor-crosshair touch-none"
            style={{ maxHeight: "60vh" }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row pt-4 border-t-2 border-stone-200">
        <button
          onClick={handleComplete}
          className="group flex flex-1 items-center justify-center gap-3 border-2 border-retro-black bg-retro-black px-6 py-4 font-mono text-base font-bold text-white shadow-retro transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-retro-blue hover:text-retro-black"
        >
          <Icon name="solar:check-circle-linear" size={20} />
          DONE ANNOTATING
        </button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 border-2 border-stone-200 bg-white px-6 py-4 font-mono text-sm font-bold text-stone-500 transition-all hover:border-retro-black hover:text-retro-black"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
