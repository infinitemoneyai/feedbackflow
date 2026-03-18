"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Pen,
  Highlighter,
  ArrowUpRight,
  Circle,
  Undo,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  scaleImageToFit,
  getCanvasCoords,
  drawLine,
  drawArrow,
  drawCircle,
} from "@/lib/demo/canvas-utils";
import type { AnnotationTool, Point } from "@/lib/demo/types";

const MAX_CANVAS_WIDTH = 900;
const MAX_CANVAS_HEIGHT = 550;
const MAX_HISTORY = 50;

interface ReviewAnnotateOverlayProps {
  screenshotDataUrl: string;
  onComplete: (annotatedDataUrl: string) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function ReviewAnnotateOverlay({
  screenshotDataUrl,
  onComplete,
  onSkip,
  onCancel,
}: ReviewAnnotateOverlayProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<AnnotationTool>("pen");
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPosRef = useRef<Point | null>(null);
  const startPosRef = useRef<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(MAX_CANVAS_WIDTH, window.innerWidth - 64);
      const { width, height } = scaleImageToFit(
        img.width,
        img.height,
        maxW,
        MAX_CANVAS_HEIGHT
      );
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      setHistory([ctx.getImageData(0, 0, width, height)]);
    };
    img.src = screenshotDataUrl;
  }, [screenshotDataUrl]);

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
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
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      if (!isDrawing || !lastPosRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const currentPos = getCanvasCoords(e, canvas);

      if ((tool === "arrow" || tool === "circle") && history.length > 0) {
        ctx.putImageData(history[history.length - 1], 0, 0);
      }

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
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;
    startPosRef.current = null;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), imageData]);
    }
  }, [isDrawing]);

  const handleUndo = useCallback(() => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const newHistory = history.slice(0, -1);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    setHistory(newHistory);
  }, [history]);

  const handleClear = useCallback(() => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.putImageData(history[0], 0, 0);
    setHistory([history[0]]);
  }, [history]);

  const handleDone = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onComplete(canvas.toDataURL("image/png"));
  }, [onComplete]);

  const tools: { id: AnnotationTool; icon: React.ReactNode; label: string }[] =
    [
      { id: "pen", icon: <Pen size={18} />, label: "Pen" },
      { id: "highlighter", icon: <Highlighter size={18} />, label: "Highlight" },
      { id: "arrow", icon: <ArrowUpRight size={18} />, label: "Arrow" },
      { id: "circle", icon: <Circle size={18} />, label: "Circle" },
    ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Annotate Screenshot</h3>
        <button
          onClick={onCancel}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex gap-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                tool === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          onClick={handleUndo}
          disabled={history.length <= 1}
          className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          title="Undo"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={handleClear}
          disabled={history.length <= 1}
          className="flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10 disabled:opacity-40"
          title="Clear all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
        <div className="rounded border bg-white shadow-sm">
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
      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip Annotation
        </Button>
        <Button size="sm" onClick={handleDone}>
          Done Annotating
        </Button>
      </div>
    </div>
  );
}
