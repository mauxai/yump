"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { Button, Badge, CreditsRing } from "./ui";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher, type LangOption } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { FadeImage } from "./FadeImage";
import { useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";

// Build-time flag: the public demo ships with AI editing disabled so visitors
// can preview the editor without spending credits or hitting the model.
const isDemo = process.env.NEXT_PUBLIC_IS_DEMO_MODE === "true";

type EditVersion = {
  id: string;
  parentId: string | null;
  prompt: string;
  image: string;
  createdAt: string;
};

type ProjectData = {
  id: string;
  name: string;
  originalImage: string;
  edits: EditVersion[];
};

type Point = { x: number; y: number }; // normalized [0..1] in image natural space

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Load an image from a data URL / URL, resolving once pixels are ready. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load source image"));
    img.src = src;
  });
}


/** Composite the source image with the lasso outline drawn on top → PNG data URL. */
async function compositeWithSelection(
  sourceDataUrl: string,
  points: Point[],
  sketchColor = "#00e676",
): Promise<string> {
  const img = await loadImage(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  ctx.drawImage(img, 0, 0);

  if (points.length >= 3) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x * canvas.width, points[0].y * canvas.height);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * canvas.width, points[i].y * canvas.height);
    }
    ctx.closePath();

    const w = canvas.width;
    ctx.fillStyle = sketchColor + "38"; // 0x38/255 ≈ 22% opacity
    ctx.fill();

    ctx.lineWidth = Math.max(5, w / 280);
    ctx.setLineDash([Math.max(14, w / 120), Math.max(8, w / 200)]);
    ctx.strokeStyle = sketchColor;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = Math.max(4, w / 400);
    ctx.stroke();
    ctx.restore();
  }
  return canvas.toDataURL("image/png");
}

/** Composite brush strokes onto the source image for AI submission.
 *  Uses full-opacity bright green + bezier smoothing so the AI can clearly read the sketch shape. */
async function compositeBrushMask(
  sourceDataUrl: string,
  strokes: Point[][],
  radius: number,
  sketchColor = "#00c853",
): Promise<string> {
  const img = await loadImage(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;
  // Keep stroke width proportional to what the user drew on screen.
  const lineWidth = Math.max(2, radius * w * 1.2);

  ctx.strokeStyle = sketchColor;
  ctx.fillStyle = sketchColor;
  ctx.globalAlpha = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = lineWidth;

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    if (stroke.length === 1) {
      ctx.arc(stroke[0].x * w, stroke[0].y * h, lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    // Bezier smoothing — same midpoint technique used in the live canvas.
    ctx.moveTo(stroke[0].x * w, stroke[0].y * h);
    for (let i = 1; i < stroke.length - 1; i++) {
      const mx = ((stroke[i].x + stroke[i + 1].x) / 2) * w;
      const my = ((stroke[i].y + stroke[i + 1].y) / 2) * h;
      ctx.quadraticCurveTo(stroke[i].x * w, stroke[i].y * h, mx, my);
    }
    ctx.lineTo(stroke[stroke.length - 1].x * w, stroke[stroke.length - 1].y * h);
    ctx.stroke();
  }

  // Output as JPEG to keep payload size small.
  return canvas.toDataURL("image/jpeg", 0.88);
}

type ModelOption = { id: string; label: string; isDefault: boolean; creditCost: number; provider?: string };

type ToolId = "none" | "lasso" | "crop" | "heal" | "brush" | "color";

// Static shortcut map used by the keyboard handler (no translations needed here)
const TOOL_SHORTCUTS: Record<string, ToolId> = { v: "none", l: "lasso", c: "crop", b: "brush", h: "heal", a: "color" };
const ACTION_SHORTCUTS: Record<string, string> = {
  e: "Enhance the overall image quality — sharpen fine details, reduce noise, and improve clarity while keeping it natural.",
  k: "Remove the background completely and isolate the subject on a clean white or transparent background.",
};

type EffectPresetData = { id: string; label: string; icon: string; prompt: string; category: string; categoryColor: string };

export function Editor({
  project,
  userName,
  initialCredits,
  brand,
  models = [],
  sketchColor = "#00e676",
  suggestedPrompts = [] as string[],
  effectCategories = [] as { title: string; color: string; effects: EffectPresetData[] }[],
  templates = [] as { id: string; title: string; imageUrl: string; prompt: string; category: string }[],
  languages = [] as LangOption[],
}: {
  project: ProjectData;
  userName: string;
  initialCredits: { used: number; total: number };
  brand: { name: string; logo: string };
  models?: ModelOption[];
  sketchColor?: string;
  suggestedPrompts?: string[];
  effectCategories?: { title: string; color: string; effects: EffectPresetData[] }[];
  templates?: { id: string; title: string; imageUrl: string; prompt: string; category: string }[];
  languages?: LangOption[];
}) {
  const { t } = useT();

  // In demo mode every AI edit is short-circuited with a toast instead of
  // calling the model. Guards the entry of each run*Edit handler so it covers
  // the generate button and every apply button uniformly.
  function blockedInDemo(): boolean {
    if (!isDemo) return false;
    toast.info(t("editor.demoDisabled"));
    return true;
  }

  const originalVersion: EditVersion = useMemo(
    () => ({
      id: "__original__",
      parentId: null,
      prompt: "Original upload",
      image: project.originalImage,
      createdAt: new Date(0).toISOString(),
    }),
    [project.originalImage],
  );

  const lsKey = (k: string) => `6amimg_${project.id}_${k}`;

  const [versions, setVersions] = useState<EditVersion[]>([
    originalVersion,
    ...project.edits,
  ]);
  const [cursor, setCursor] = useState<number>(() => {
    const saved = localStorage.getItem(lsKey("cursor"));
    if (saved !== null) {
      const n = parseInt(saved, 10);
      const initialLen = 1 + project.edits.length;
      if (!isNaN(n) && n >= 0 && n < initialLen) return n;
    }
    return 1 + project.edits.length - 1; // last version
  });

  // Persist cursor to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem(lsKey("cursor"), String(cursor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  // Sync state when fresh server data arrives (e.g., navigating away and back
  // after an edit revalidates the cache). We detect "fresh" by looking for
  // edit IDs from the server that the local `versions` state hasn't seen yet.
  const serverEditsKey = project.edits.map((e) => e.id).join(",");
  useEffect(() => {
    const localIds = new Set(versions.slice(1).map((v) => v.id));
    const hasUnknownFromServer = project.edits.some((e) => !localIds.has(e.id));
    if (hasUnknownFromServer) {
      const next = [originalVersion, ...project.edits];
      setVersions(next);
      setCursor(next.length - 1); // jump to latest on new server data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverEditsKey, originalVersion]);

  const defaultModel = models.find((m) => m.isDefault) ?? models[0] ?? null;
  const [selectedModelId, setSelectedModelId] = useState<string | null>(() => {
    const validIds = new Set(models.map((m) => m.id));
    const saved = localStorage.getItem(lsKey("model"));
    return (saved && validIds.has(saved)) ? saved : (defaultModel?.id ?? null);
  });
  const [regionModelId, setRegionModelId] = useState<string | null>(() => {
    const validIds = new Set(models.map((m) => m.id));
    const saved = localStorage.getItem(lsKey("regionModel"));
    return (saved && validIds.has(saved)) ? saved : (defaultModel?.id ?? null);
  });

  // Persist model selections to localStorage.
  useEffect(() => {
    if (selectedModelId) localStorage.setItem(lsKey("model"), selectedModelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModelId]);
  useEffect(() => {
    if (regionModelId) localStorage.setItem(lsKey("regionModel"), regionModelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionModelId]);

  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [pendingTemplateImageUrl, setPendingTemplateImageUrl] = useState<string | null>(null);
  const [pendingTemplatePrompt, setPendingTemplatePrompt] = useState<string | null>(null);
  const [credits, setCredits] = useState(initialCredits);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobilePanelTab, setMobilePanelTab] = useState<"history" | "effects" | "templates">("history");

  // Cost of the currently selected model (for the main prompt bar + heal)
  const selectedModelCost = models.find((m) => m.id === selectedModelId)?.creditCost ?? 1;
  // Cost of the region/brush model (lasso popup + brush tool)
  const regionModelCost = models.find((m) => m.id === regionModelId)?.creditCost ?? 1;
  const [generating, setGenerating] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- Lasso tool state ---
  const [tool, setTool] = useState<ToolId>("none");
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [regionPrompt, setRegionPrompt] = useState("");
  const imgRef = useRef<HTMLImageElement | null>(null);
  // Aspect ratio of the canvas image, learned from the fast LQIP, so the
  // blur-up placeholder can reserve the correct space before the full image loads.
  const [canvasAspect, setCanvasAspect] = useState<{ w: number; h: number } | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Crop tool state
  const [cropStart, setCropStart] = useState<Point | null>(null);
  const [cropEnd, setCropEnd] = useState<Point | null>(null);
  const [cropDrawing, setCropDrawing] = useState(false);

  // Spot heal tool state
  const [healStrokes, setHealStrokes] = useState<Point[][]>([]);
  const [healBrushPos, setHealBrushPos] = useState<Point | null>(null);
  const [healDrawing, setHealDrawing] = useState(false);

  // Brush tool state — canvas-based real-time painting
  const [brushStrokes, setBrushStrokes] = useState<Point[][]>([]);
  const [brushDrawing, setBrushDrawing] = useState(false);
  const [brushPrompt, setBrushPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(0.03); // normalized radius
  const [brushType, setBrushType] = useState<"soft" | "pen" | "pencil" | "eraser">("soft");
  const brushCanvasRef = useRef<HTMLCanvasElement | null>(null);     // committed strokes
  const brushLiveCanvasRef = useRef<HTMLCanvasElement | null>(null); // current in-progress stroke
  const brushCurrentStroke = useRef<Point[]>([]);                    // points of live stroke

  // Custom cursor tracking (for brush/heal tools)
  const [toolCursorPos, setToolCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Color tune panel state
  const [colorAdj, setColorAdj] = useState({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, fade: 0 });

  // Zoom / pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number; cx: number; cy: number } | null>(null);

  // Right-click context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    if (!ctxMenu) return;
    function close() { setCtxMenu(null); }
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [ctxMenu]);

  const current = versions[cursor];
  const canUndo = cursor > 0;
  const canRedo = cursor < versions.length - 1;

  const undo = () => canUndo && setCursor((c) => c - 1);
  const redo = () => canRedo && setCursor((c) => c + 1);

  const clearSelection = () => {
    setPoints([]);
    setDrawing(false);
    setRegionPrompt("");
  };

  // Activate a tool mode; switching clears all selection/drawing state.
  const setActiveTool = (t: ToolId) => {
    setTool(t);
    clearSelection();
    setCropStart(null);
    setCropEnd(null);
    setCropDrawing(false);
    setHealStrokes([]);
    setHealBrushPos(null);
    setHealDrawing(false);
    setBrushStrokes([]);
    brushCurrentStroke.current = [];
    setBrushDrawing(false);
    setBrushPrompt("");
    const bc = brushCanvasRef.current;
    if (bc) bc.getContext("2d")?.clearRect(0, 0, bc.width, bc.height);
    const blc = brushLiveCanvasRef.current;
    if (blc) blc.getContext("2d")?.clearRect(0, 0, blc.width, blc.height);
  };

  // Zoom helpers
  function zoomTo(newZoom: number, cursorX?: number, cursorY?: number) {
    const clamped = Math.max(0.1, Math.min(12, newZoom));
    if (cursorX !== undefined && cursorY !== undefined && canvasAreaRef.current) {
      const rect = canvasAreaRef.current.getBoundingClientRect();
      const cx = cursorX - (rect.left + rect.width / 2);
      const cy = cursorY - (rect.top + rect.height / 2);
      const r = clamped / zoom;
      setPan((p) => ({ x: cx * (1 - r) + p.x * r, y: cy * (1 - r) + p.y * r }));
    }
    setZoom(clamped);
  }

  function fitToScreen() { setZoom(1); setPan({ x: 0, y: 0 }); }

  function onWheelZoom(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    zoomTo(zoom * factor, e.clientX, e.clientY);
  }

  function onCanvasPanDown(e: React.PointerEvent<HTMLDivElement>) {
    if (tool !== "none") return;
    panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    setIsPanning(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* harmless */ }
  }
  function onCanvasPanMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanning || !panStartRef.current) return;
    setPan({ x: panStartRef.current.px + e.clientX - panStartRef.current.mx,
              y: panStartRef.current.py + e.clientY - panStartRef.current.my });
  }
  function onCanvasPanUp() { setIsPanning(false); panStartRef.current = null; }

  function onCanvasDblClick(e: React.MouseEvent<HTMLDivElement>) {
    if (tool !== "none") return;
    if (zoom >= 2) { fitToScreen(); } else { zoomTo(zoom * 2, e.clientX, e.clientY); }
  }

  // Non-passive touch handlers for pinch-to-zoom (must be attached via useEffect to set passive:false)
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        pinchStartRef.current = {
          dist,
          zoom,
          cx: (t0.clientX + t1.clientX) / 2,
          cy: (t0.clientY + t1.clientY) / 2,
        };
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const { cx, cy } = pinchStartRef.current;
        zoomTo(pinchStartRef.current.zoom * (dist / pinchStartRef.current.dist), cx, cy);
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchStartRef.current = null;
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove",  handleTouchMove,  { passive: false });
    el.addEventListener("touchend",   handleTouchEnd,   { passive: true  });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove",  handleTouchMove);
      el.removeEventListener("touchend",   handleTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, pan]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ── Modifier shortcuts (work everywhere) ──────────────────────────────
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        if (!isEditable) { e.preventDefault(); undo(); }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        if (!isEditable) { e.preventDefault(); redo(); }
        return;
      }

      if (isEditable) return;  // don't steal keypresses from inputs

      const k = e.key;

      // ── Hold Space → compare ───────────────────────────────────────────────
      if (k === " ") { e.preventDefault(); setShowBefore(true); return; }

      // ── Escape → clear selection ───────────────────────────────────────────
      if (k === "Escape") {
        if (points.length > 0) { e.preventDefault(); clearSelection(); }
        if (cropStart) { e.preventDefault(); setCropStart(null); setCropEnd(null); }
        if (healStrokes.length > 0) { e.preventDefault(); setHealStrokes([]); }
        return;
      }

      // ── Tool rail shortcuts ────────────────────────────────────────────────
      const lk = k.toLowerCase();
      if (TOOL_SHORTCUTS[lk] !== undefined) {
        e.preventDefault();
        const id = TOOL_SHORTCUTS[lk];
        setActiveTool(tool === id ? "none" : id);
        return;
      }
      if (ACTION_SHORTCUTS[lk] !== undefined) {
        e.preventDefault();
        setPrompt(ACTION_SHORTCUTS[lk]);
        return;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === " ") setShowBefore(false);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRedo, canUndo, tool, points.length]);

  // Map pointer event → normalized coordinates within the image element.
  function pointToImage(clientX: number, clientY: number): Point | null {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (generating) return;
    const p = pointToImage(e.clientX, e.clientY);
    if (!p) return;
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* harmless */ }

    if (tool === "lasso") {
      setPoints([p]); setDrawing(true); setRegionPrompt("");
    } else if (tool === "crop") {
      setCropStart(p); setCropEnd(p); setCropDrawing(true);
    } else if (tool === "heal") {
      setHealStrokes((prev) => [...prev, [p]]); setHealDrawing(true);
    } else if (tool === "brush") {
      brushCurrentStroke.current = [p];
      setBrushDrawing(true);
      paintLiveStroke();
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = pointToImage(e.clientX, e.clientY);
    if (!p) return;
    if (tool === "heal") setHealBrushPos(p);
    if (tool === "brush" || tool === "heal") setToolCursorPos({ x: e.clientX, y: e.clientY });

    if (tool === "lasso" && drawing) {
      setPoints((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.003) return prev;
        return [...prev, p];
      });
    } else if (tool === "crop" && cropDrawing) {
      setCropEnd(p);
    } else if (tool === "heal" && healDrawing) {
      setHealStrokes((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        const lastPt = last[last.length - 1];
        if (lastPt && Math.hypot(lastPt.x - p.x, lastPt.y - p.y) < 0.008) return prev;
        copy[copy.length - 1] = [...last, p];
        return copy;
      });
    } else if (tool === "brush" && brushDrawing) {
      brushCurrentStroke.current = [...brushCurrentStroke.current, p];
      paintLiveStroke();
    }
  }

  function onPointerUp() {
    if (tool === "lasso" && drawing) {
      setDrawing(false);
      setPoints((prev) => (prev.length > 3 ? [...prev, prev[0]] : []));
    } else if (tool === "crop") {
      setCropDrawing(false);
    } else if (tool === "heal") {
      setHealDrawing(false);
    } else if (tool === "brush") {
      const completedStroke = [...brushCurrentStroke.current];
      commitLiveStroke();
      brushCurrentStroke.current = [];
      setBrushDrawing(false);
      if (completedStroke.length > 0) {
        setBrushStrokes((prev) => [...prev, completedStroke]);
      }
    }
  }

  function syncCanvasSize(canvas: HTMLCanvasElement, w: number, h: number) {
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  /** Draw a full stroke path (with bezier smoothing) onto ctx. */
  function drawStrokePath(ctx: CanvasRenderingContext2D, stroke: Point[], w: number, h: number) {
    if (stroke.length === 0) return;
    const r = brushSize * w;
    applyBrushCtxStyle(ctx, r);
    ctx.beginPath();
    if (stroke.length === 1) {
      ctx.arc(stroke[0].x * w, stroke[0].y * h, Math.max(1, ctx.lineWidth / 2), 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.moveTo(stroke[0].x * w, stroke[0].y * h);
    for (let i = 1; i < stroke.length - 1; i++) {
      const mx = ((stroke[i].x + stroke[i + 1].x) / 2) * w;
      const my = ((stroke[i].y + stroke[i + 1].y) / 2) * h;
      ctx.quadraticCurveTo(stroke[i].x * w, stroke[i].y * h, mx, my);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last.x * w, last.y * h);
    ctx.stroke();
  }

  /** Redraw the live (in-progress) stroke on the live canvas from scratch. */
  function paintLiveStroke() {
    // Eraser must draw directly on the base canvas so destination-out takes effect immediately.
    if (brushType === "eraser") {
      const base = brushCanvasRef.current;
      const img = imgRef.current;
      if (!base || !img) return;
      const w = img.clientWidth, h = img.clientHeight;
      syncCanvasSize(base, w, h);
      drawStrokePath(base.getContext("2d")!, brushCurrentStroke.current, w, h);
      return;
    }
    const canvas = brushLiveCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const w = img.clientWidth, h = img.clientHeight;
    syncCanvasSize(canvas, w, h);
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    drawStrokePath(ctx, brushCurrentStroke.current, w, h);
  }

  /** Commit the live stroke onto the base canvas and clear the live canvas. */
  function commitLiveStroke() {
    const base = brushCanvasRef.current;
    const live = brushLiveCanvasRef.current;
    const img = imgRef.current;
    if (!base || !img) return;
    const w = img.clientWidth, h = img.clientHeight;
    syncCanvasSize(base, w, h);
    // Eraser strokes were already drawn to the base canvas in real-time during drag.
    if (brushType !== "eraser") {
      drawStrokePath(base.getContext("2d")!, brushCurrentStroke.current, w, h);
    }
    if (live) { live.getContext("2d")?.clearRect(0, 0, live.width, live.height); }
  }

  function applyBrushCtxStyle(ctx: CanvasRenderingContext2D, r: number) {
    const SKETCH_COLOR = sketchColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    // Dark halo makes strokes pop on both bright and dark image areas.
    ctx.shadowColor = "rgba(0,0,0,0.75)";
    ctx.shadowBlur = Math.max(2, r * 0.3);
    switch (brushType) {
      case "pen":
        ctx.strokeStyle = SKETCH_COLOR;
        ctx.fillStyle = SKETCH_COLOR;
        ctx.lineWidth = Math.max(1.5, r * 0.14);
        break;
      case "pencil":
        ctx.strokeStyle = SKETCH_COLOR;
        ctx.fillStyle = SKETCH_COLOR;
        ctx.lineWidth = Math.max(2, r * 0.24);
        ctx.setLineDash([r * 1.2, r * 0.5]);
        break;
      case "eraser":
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = r * 2;
        break;
      default: // soft brush
        ctx.strokeStyle = SKETCH_COLOR;
        ctx.fillStyle = SKETCH_COLOR;
        ctx.lineWidth = r * 1.0;
    }
  }

  async function parseEditResponse(res: Response) {
    const text = await res.text();
    if (!text) {
      throw new Error(
        res.status === 413 ? "Image is too large to upload — try a smaller file" :
        res.status === 504 ? "Request timed out — the AI took too long" :
        `Server error (${res.status || "no response"})`
      );
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Unexpected server response (${res.status})`);
    }
  }

  // --- Full-image edit (bottom bar) ---
  async function runFullEdit() {
    if (blockedInDemo()) return;
    if (!prompt.trim()) {
      setErr("Describe the edit you want first.");
      return;
    }
    if (credits.used + selectedModelCost > credits.total) {
      setErr("Not enough credits for this model. Please upgrade your plan.");
      return;
    }
    setErr(null);
    setGenerating(true);
    try {
      const parentId = cursor === 0 ? null : current.id;
      const tplUrl = pendingTemplateImageUrl;
      const tplPrompt = pendingTemplatePrompt;
      setPendingTemplateImageUrl(null);
      setPendingTemplatePrompt(null);
      const res = await fetch(`/api/v1/projects/${project.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          parentId,
          aiModelId: selectedModelId,
          ...(tplUrl ? { templateImageUrl: tplUrl } : {}),
          ...(tplPrompt ? { templatePrompt: tplPrompt } : {}),
        }),
      });
      const data = await parseEditResponse(res);
      if (!res.ok) throw new Error(data.error || "Edit failed");

      const base = versions.slice(0, cursor + 1);
      const next: EditVersion = {
        id: data.edit.id,
        parentId: data.edit.parentId,
        prompt: data.edit.prompt,
        image: data.edit.image,
        createdAt: data.edit.createdAt,
      };
      setVersions([...base, next]);
      setCursor(base.length);
      setCredits({ used: data.creditsUsed, total: data.creditsTotal });
      setPrompt("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Edit failed");
    } finally {
      setGenerating(false);
    }
  }

  // --- Region edit (lasso popup) ---
  async function runRegionEdit() {
    if (blockedInDemo()) return;
    const text = regionPrompt.trim();
    if (!text) return;
    if (points.length < 3) {
      setErr("Draw a selection first.");
      return;
    }
    if (credits.used + regionModelCost > credits.total) {
      setErr("Not enough credits for this model. Please upgrade your plan.");
      return;
    }
    setErr(null);
    setGenerating(true);
    try {
      const composite = await compositeWithSelection(current.image, points, sketchColor);
      const parentId = cursor === 0 ? null : current.id;
      const res = await fetch(`/api/v1/projects/${project.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          parentId,
          sourceImageOverride: composite,
          isRegionEdit: true,
          aiModelId: regionModelId,
        }),
      });
      const data = await parseEditResponse(res);
      if (!res.ok) throw new Error(data.error || "Edit failed");

      const base = versions.slice(0, cursor + 1);
      const next: EditVersion = {
        id: data.edit.id,
        parentId: data.edit.parentId,
        prompt: `[region] ${data.edit.prompt}`,
        image: data.edit.image,
        createdAt: data.edit.createdAt,
      };
      setVersions([...base, next]);
      setCursor(base.length);
      setCredits({ used: data.creditsUsed, total: data.creditsTotal });
      clearSelection();
      setTool("none");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Edit failed");
    } finally {
      setGenerating(false);
    }
  }

  // --- Crop (client-side canvas — instant, no credits) ---
  async function runCropEdit() {
    if (!cropStart || !cropEnd) return;
    const x1 = Math.min(cropStart.x, cropEnd.x);
    const y1 = Math.min(cropStart.y, cropEnd.y);
    const x2 = Math.max(cropStart.x, cropEnd.x);
    const y2 = Math.max(cropStart.y, cropEnd.y);
    if (x2 - x1 < 0.02 || y2 - y1 < 0.02) return;
    const img = await loadImage(current.image);
    const pw = Math.round((x2 - x1) * img.naturalWidth);
    const ph = Math.round((y2 - y1) * img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = pw; canvas.height = ph;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, x1 * img.naturalWidth, y1 * img.naturalHeight, pw, ph, 0, 0, pw, ph);
    const dataUrl = canvas.toDataURL("image/png");
    const base = versions.slice(0, cursor + 1);
    const next: EditVersion = {
      id: `crop_${Date.now()}`,
      parentId: cursor === 0 ? null : current.id,
      prompt: `[crop] ${Math.round(x1 * 100)}%–${Math.round(x2 * 100)}% × ${Math.round(y1 * 100)}%–${Math.round(y2 * 100)}%`,
      image: dataUrl,
      createdAt: new Date().toISOString(),
    };
    setVersions([...base, next]);
    setCursor(base.length);
    setActiveTool("none");
  }

  const BRUSH_TYPE_MODIFIERS: Record<string, string> = {
    soft:   "Apply with soft, feathered, blended edges.",
    pen:    "Apply with sharp, precise, hard edges.",
    pencil: "Apply with a textured, grainy, hand-drawn pencil style.",
  };

  // --- Brush edit (paint mask → AI) ---
  function clearBrushCanvas() {
    const canvas = brushCanvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    const live = brushLiveCanvasRef.current;
    if (live) live.getContext("2d")?.clearRect(0, 0, live.width, live.height);
    setBrushStrokes([]);
    brushCurrentStroke.current = [];
  }

  async function runBrushEdit() {
    if (blockedInDemo()) return;
    if (brushStrokes.length === 0) return;
    if (credits.used + regionModelCost > credits.total) { setErr("Not enough credits for this model. Please upgrade your plan."); return; }
    const modifier = BRUSH_TYPE_MODIFIERS[brushType] ?? "";
    const userPrompt = brushPrompt.trim();
    // "__sketch__" is a sentinel: the server knows to use its sketch-to-image wrapper instead.
    const storedPrompt = userPrompt
      ? [userPrompt, modifier].filter(Boolean).join(" ")
      : "__sketch__";
    setErr(null); setGenerating(true);
    try {
      const composite = await compositeBrushMask(current.image, brushStrokes, brushSize, sketchColor);
      const parentId = cursor === 0 ? null : current.id;
      const res = await fetch(`/api/v1/projects/${project.id}/edit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: storedPrompt, parentId, sourceImageOverride: composite, isBrushEdit: true, aiModelId: regionModelId }),
      });
      const data = await parseEditResponse(res);
      if (!res.ok) throw new Error(data.error || "Edit failed");
      const base = versions.slice(0, cursor + 1);
      const label = userPrompt ? `[brush] ${userPrompt}` : "[brush] sketch-to-image";
      setVersions([...base, { id: data.edit.id, parentId: data.edit.parentId, prompt: label, image: data.edit.image, createdAt: data.edit.createdAt }]);
      setCursor(base.length);
      setCredits({ used: data.creditsUsed, total: data.creditsTotal });
      clearBrushCanvas();
      setActiveTool("none");
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Edit failed"); }
    finally { setGenerating(false); }
  }

  // --- Spot heal edit ---
  async function runHealEdit() {
    if (blockedInDemo()) return;
    if (healStrokes.length === 0) return;
    if (credits.used + selectedModelCost > credits.total) { setErr("Not enough credits for this model. Please upgrade your plan."); return; }
    setErr(null); setGenerating(true);
    try {
      const composite = await compositeBrushMask(current.image, healStrokes, 0.025);
      const parentId = cursor === 0 ? null : current.id;
      const res = await fetch(`/api/v1/projects/${project.id}/edit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Remove and heal the areas marked with colored circles. Fill them in naturally, matching the surrounding background and texture seamlessly.", parentId, sourceImageOverride: composite, isRegionEdit: true, aiModelId: selectedModelId }),
      });
      const data = await parseEditResponse(res);
      if (!res.ok) throw new Error(data.error || "Edit failed");
      const base = versions.slice(0, cursor + 1);
      setVersions([...base, { id: data.edit.id, parentId: data.edit.parentId, prompt: `[heal] ${healStrokes.length} strokes`, image: data.edit.image, createdAt: data.edit.createdAt }]);
      setCursor(base.length);
      setCredits({ used: data.creditsUsed, total: data.creditsTotal });
      setActiveTool("none");
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Edit failed"); }
    finally { setGenerating(false); }
  }

  // --- Color tune ---
  function runColorEdit() {
    const parts: string[] = [];
    if (colorAdj.brightness !== 0) parts.push(`${colorAdj.brightness > 0 ? "increase" : "decrease"} brightness by ${Math.abs(colorAdj.brightness)}%`);
    if (colorAdj.contrast !== 0) parts.push(`${colorAdj.contrast > 0 ? "increase" : "decrease"} contrast by ${Math.abs(colorAdj.contrast)}%`);
    if (colorAdj.saturation !== 0) parts.push(`${colorAdj.saturation > 0 ? "boost" : "reduce"} saturation by ${Math.abs(colorAdj.saturation)}%`);
    if (colorAdj.warmth !== 0) parts.push(colorAdj.warmth > 0 ? `add ${colorAdj.warmth}% warm golden tones` : `add ${Math.abs(colorAdj.warmth)}% cool blue tones`);
    if (colorAdj.fade !== 0) parts.push(`add ${colorAdj.fade}% matte fade`);
    if (parts.length === 0) return;
    setPrompt(`Adjust the image: ${parts.join(", ")}. Keep the composition and subjects unchanged.`);
    setActiveTool("none");
  }

  function download() {
    const a = document.createElement("a");
    a.href = showBefore ? originalVersion.image : current.image;
    a.download = `${project.name}-v${cursor}.png`;
    a.click();
  }

  const displayImage = showBefore ? originalVersion.image : current.image;
  // Blur-up placeholder for the canvas. data: URLs (crop/region results) are
  // instant and have no DB row → no LQIP, keep the canvas exactly as-is.
  const displayVersionId = showBefore ? "__original__" : current.id;
  const canvasLqip = displayImage.startsWith("data:")
    ? null
    : `/api/v1/projects/${project.id}/thumb?lqip=1&v=${
        displayVersionId === "__original__" ? "original" : displayVersionId
      }`;
  // Learn the displayed image's true dimensions from the LQIP response headers
  // (orientation-aware). Reset + refetch whenever the displayed image changes.
  useEffect(() => {
    setCanvasAspect(null);
    if (!canvasLqip) return;
    let cancelled = false;
    fetch(canvasLqip)
      .then((r) => {
        const w = Number(r.headers.get("X-Img-W"));
        const h = Number(r.headers.get("X-Img-H"));
        if (!cancelled && w > 0 && h > 0) setCanvasAspect({ w, h });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canvasLqip]);
  // Exact pixel box the blur should occupy — the same fit the full <img> gets:
  // min(natural, maxBox) preserving aspect, never upscaling past natural size.
  const canvasBlurStyle = (() => {
    if (!canvasAspect || !viewport) return undefined;
    const lg = viewport.w >= 1024;
    const maxW = viewport.w - (lg ? 660 : 16);
    const maxH = viewport.h - (lg ? 220 : 168);
    if (maxW <= 0 || maxH <= 0) return undefined;
    const scale = Math.min(maxW / canvasAspect.w, maxH / canvasAspect.h, 1);
    return { width: Math.round(canvasAspect.w * scale), height: Math.round(canvasAspect.h * scale) };
  })();
  const selectionValid = points.length >= 4 && !drawing;

  // Centroid of the polygon (in normalized coords) for popup positioning.
  const centroid = useMemo(() => {
    if (points.length === 0) return null;
    let sx = 0;
    let sy = 0;
    for (const p of points) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / points.length, y: sy / points.length };
  }, [points]);

  return (
    <div className="h-dvh max-w-[100vw] grid grid-rows-[auto_1fr] bg-bg-0 overflow-hidden">
      {/* Top bar */}
      <div className="h-12 flex items-center gap-2 px-3 md:px-4 border-b border-line bg-bg-1 min-w-0">
        <Link href="/" className="flex items-center gap-1 text-fg-1 text-[13px] hover:text-fg-0 shrink-0">
          <Icon name="arrowLeft" size={14} />
          <span className="hidden sm:inline">{t("nav.projects")}</span>
        </Link>
        <div className="w-px h-5 bg-line shrink-0 hidden sm:block" />
        <div className="hidden md:flex items-center gap-[10px] shrink-0">
          <div className="w-7 h-7 rounded-[7px] bg-accent flex items-center justify-center text-[var(--accent-fg)] font-bold text-[14px] overflow-hidden">
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo} alt="" className="w-full h-full object-cover" />
            ) : (brand.name.trim().charAt(0).toUpperCase() || "?")}
          </div>
          <div className="font-semibold tracking-tight text-[15px]">{brand.name}</div>
        </div>
        <div className="w-px h-5 bg-line shrink-0 hidden md:block" />
        <div className="text-[12px] md:text-[13px] font-medium truncate min-w-0 flex-1">{project.name}</div>
        <Badge tone="muted" className="hidden sm:inline-flex shrink-0">{t("editor.autosaved")}</Badge>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 h-[30px] px-[8px] md:px-[10px] bg-bg-2 border border-line-2 rounded-md">
            <CreditsRing used={credits.used} total={credits.total} size={16} />
            <span className="mono text-[11px] md:text-[12px]">
              {credits.total - credits.used}
              <span className="text-fg-3 hidden sm:inline">/{credits.total}</span>
            </span>
          </div>
          <Button variant="primary" size="sm" icon="download" onClick={download}>
            <span className="hidden sm:inline">{t("editor.export")}</span>
          </Button>
          <div className="w-px h-6 bg-line hidden md:block" />
          <div className="hidden md:block"><ThemeToggle /></div>
          <LanguageSwitcher languages={languages} />
          <NotificationBell />
          <div className="hidden lg:flex items-center gap-2 h-[30px] px-[10px] rounded-md bg-bg-2 border border-line-2 text-[13px]">
            <Icon name="user" size={14} className="text-fg-2" />
            {userName}
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })}>
            <Icon name="logout" size={14} />
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-[80px_260px_1fr_280px] overflow-hidden min-h-0">
        {/* Tool rail — desktop only */}
        <div className="hidden lg:contents">
        <ToolRail
          tool={tool}
          onSetTool={(t: ToolId) => setActiveTool(t)}
          onQuickAction={(p: string) => setPrompt(p)}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
        />
        </div>

        {/* Effects panel — LEFT side, desktop only */}
        <div className="hidden lg:flex lg:flex-col border-r border-line bg-bg-1 overflow-hidden">
          <EffectsPanelLeft
            onApply={(p: string, tplUrl?: string, tplPrompt?: string) => {
              setPrompt(p);
              setPendingTemplateImageUrl(tplUrl ?? null);
              setPendingTemplatePrompt(tplPrompt ?? null);
            }}
            categories={effectCategories}
            templates={templates}
            selectedModelId={selectedModelId}
            models={models}
          />
        </div>

        {/* Canvas + prompt bar */}
        <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto] overflow-hidden bg-bg-0">
          <div
            ref={canvasAreaRef}
            className="relative overflow-hidden"
            style={{
              background:
                "repeating-conic-gradient(rgba(255,255,255,0.015) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
            }}
            onWheel={onWheelZoom}
            onPointerDown={onCanvasPanDown}
            onPointerMove={onCanvasPanMove}
            onPointerUp={onCanvasPanUp}
            onPointerCancel={onCanvasPanUp}
            onDoubleClick={onCanvasDblClick}
          >
            {/* Floating undo/redo */}
            <div className="absolute top-[14px] left-1/2 -translate-x-1/2 flex gap-1 p-1 bg-bg-2 border border-line-2 rounded-[7px] shadow-card z-10">
              <FloatBtn icon="undo" label="Undo" onClick={undo} disabled={!canUndo} />
              <FloatBtn icon="redo" label="Redo" onClick={redo} disabled={!canRedo} />
            </div>

            {/* Left: shortcut badges row — desktop only */}
            <div className="absolute top-[14px] left-[14px] z-10 hidden lg:flex items-center gap-[5px]">
              <ShortcutBadge kbd="⌘Z" label={t("editor.undo")} tip={t("editor.tipUndo")} disabled={!canUndo} tipSide="right" />
              <ShortcutBadge kbd="⌘Y" label={t("editor.redo")} tip={t("editor.tipRedo")} disabled={!canRedo} tipSide="right" />
              <div className="w-px h-4 bg-line-2 mx-[2px]" />
              <ShortcutBadge kbd="L" label={t("editor.lasso")} tip={t("editor.tipLasso")} active={tool === "lasso"} tipSide="right" />
              <ShortcutBadge kbd="Space" label={t("editor.original")} tip={t("editor.tipCompare")} tipSide="right" />
              <ShortcutBadge kbd="Esc" label={t("common.clear")} tip={t("editor.tipClear")} disabled={points.length === 0} tipSide="right" />
            </div>

            {/* Brush type panel — desktop only, floats on left edge of canvas */}
            {tool === "brush" && (
              <div className="hidden lg:block">
                <BrushTypePanel
                  brushType={brushType}
                  onBrushTypeChange={setBrushType}
                  brushSize={brushSize}
                  onBrushSizeChange={setBrushSize}
                />
              </div>
            )}

            {/* Right: active tool hint — desktop only */}
            {tool !== "none" && (
              <div className="absolute top-[14px] right-[14px] z-10 hidden lg:block px-[10px] py-[6px] bg-bg-2 border border-line-2 rounded-md text-[11px] text-fg-2 mono">
                {tool === "lasso" && t("editor.hintLasso")}
                {tool === "crop"  && t("editor.hintCrop")}
                {tool === "heal"  && t("editor.hintHeal")}
                {tool === "brush" && t("editor.hintBrush")}
                {tool === "color" && t("editor.hintColor")}
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center pt-10"
              style={{ pointerEvents: tool === "none" ? "none" : "auto" }}>
              <div
                className="relative inline-grid"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  pointerEvents: "auto",
                  cursor:
                    tool === "heal" || tool === "brush" ? "none"
                    : tool === "lasso" || tool === "crop" ? "crosshair"
                    : tool === "none"
                      ? isPanning ? "grabbing" : zoom > 1 ? "grab" : "default"
                      : "default",
                  // cursor:none hides the default pointer; custom cursor is rendered below
                }}>
                {/* Blur-up placeholder, grid-stacked behind the canvas. Sized via
                    the LQIP's own aspect (scaled up) + the same max constraints, so
                    it reserves the exact box the full image will occupy. The full
                    image, opaque once loaded, covers it. */}
                {canvasLqip && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={canvasLqip}
                    alt=""
                    aria-hidden
                    draggable={false}
                    style={canvasBlurStyle}
                    className={`[grid-area:1/1] place-self-center block rounded-sm object-cover pointer-events-none select-none ${
                      canvasBlurStyle ? "" : "h-0 w-0 opacity-0"
                    }`}
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={displayImage}
                  alt="editing canvas"
                  className="[grid-area:1/1] place-self-center block max-h-[calc(100dvh-168px)] lg:max-h-[calc(100dvh-220px)] max-w-[calc(100vw-16px)] lg:max-w-[calc(100vw-660px)] rounded-sm shadow-[0_12px_60px_rgba(0,0,0,0.5)] select-none"
                  draggable={false}
                  style={{
                    cursor: "inherit",
                    touchAction: "none",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onPointerLeave={() => { setHealBrushPos(null); brushCurrentStroke.current = []; setToolCursorPos(null); }}
                  onContextMenu={onContextMenu}
                />

                {/* SVG overlay for the selection polygon — pointer-events: none so it doesn't
                    intercept pointer events meant for the <img>. */}
                {points.length > 0 && (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <path
                      d={`M ${points
                        .map((p) => `${p.x * 100} ${p.y * 100}`)
                        .join(" L ")}`}
                      fill={sketchColor}
                      fillOpacity="0.18"
                      stroke={sketchColor}
                      strokeWidth="0.6"
                      strokeDasharray="1.6 0.8"
                      filter={`drop-shadow(0 0 1px rgba(0,0,0,0.8)) drop-shadow(0 0 3px ${sketchColor})`}
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}

                {/* ── Crop overlay ─────────────────────────────────────── */}
                {tool === "crop" && cropStart && cropEnd && (() => {
                  const x1 = Math.min(cropStart.x, cropEnd.x) * 100;
                  const y1 = Math.min(cropStart.y, cropEnd.y) * 100;
                  const w  = Math.abs(cropEnd.x - cropStart.x) * 100;
                  const h  = Math.abs(cropEnd.y - cropStart.y) * 100;
                  return (
                    <>
                      {/* Dark vignette outside crop */}
                      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5,
                        background: `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55))`,
                        WebkitMaskImage: `linear-gradient(black,black)`,
                        clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${y1}%, ${x1}% ${y1}%, ${x1}% ${y1+h}%, ${x1+w}% ${y1+h}%, ${x1+w}% ${y1}%, 0% ${y1}%)`,
                      }} />
                      {/* Crop rect */}
                      <div className="absolute pointer-events-none" style={{ zIndex: 6,
                        left: `${x1}%`, top: `${y1}%`, width: `${w}%`, height: `${h}%`,
                        border: "2px solid white",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
                      }}>
                        {/* Rule-of-thirds grid */}
                        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.2) 1px,transparent 1px)", backgroundSize: "33.33% 33.33%" }} />
                        {/* Corner handles */}
                        {(["tl","tr","bl","br"] as const).map((c) => (
                          <div key={c} className={`absolute w-[14px] h-[14px] border-white border-[2.5px] ${c.includes("t") ? "top-0" : "bottom-0"} ${c.includes("l") ? "left-0" : "right-0"}`}
                            style={{ borderRight: c.includes("l") ? "none" : undefined, borderLeft: c.includes("r") ? "none" : undefined,
                                     borderBottom: c.includes("t") ? "none" : undefined, borderTop: c.includes("b") ? "none" : undefined }} />
                        ))}
                      </div>
                      {/* Apply / Cancel buttons */}
                      {!cropDrawing && w > 2 && h > 2 && (
                        <div className="absolute flex gap-2" style={{ zIndex: 7,
                          left: `${x1 + w}%`, top: `${y1 + h}%`, transform: "translate(-100%, 8px)" }}>
                          <button onClick={runCropEdit} className="px-3 py-1.5 rounded-md bg-accent text-[var(--accent-fg)] text-[12px] font-medium shadow-lg hover:brightness-110">{t("editor.applyCrop")}</button>
                          <button onClick={() => { setCropStart(null); setCropEnd(null); }} className="px-3 py-1.5 rounded-md bg-bg-1 border border-line-2 text-[12px] text-fg-1 hover:bg-bg-2">{t("common.cancel")}</button>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ── Spot Heal overlay ────────────────────────────────── */}
                {tool === "heal" && (
                  <>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                      {healStrokes.map((stroke, si) =>
                        stroke.map((p, pi) => (
                          <circle key={`${si}-${pi}`} cx={p.x * 100} cy={p.y * 100} r="2.5"
                            fill="var(--accent)" fillOpacity="0.55" vectorEffect="non-scaling-stroke" />
                        ))
                      )}
                    </svg>
                    {healBrushPos && (
                      <div className="absolute pointer-events-none rounded-full border-2 border-accent"
                        style={{ zIndex: 6, left: `${healBrushPos.x * 100}%`, top: `${healBrushPos.y * 100}%`,
                          width: 32, height: 32, transform: "translate(-50%,-50%)", background: "var(--accent-soft)" }} />
                    )}
                    {healStrokes.length > 0 && !healDrawing && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 7 }}>
                        <button onClick={runHealEdit} disabled={generating} className="px-3 py-1.5 rounded-md bg-accent text-[var(--accent-fg)] text-[12px] font-medium shadow-lg hover:brightness-110 disabled:opacity-50">{t("editor.applyHeal")}</button>
                        <button onClick={() => setHealStrokes([])} className="px-3 py-1.5 rounded-md bg-bg-1 border border-line-2 text-[12px] text-fg-1 hover:bg-bg-2">{t("common.clear")}</button>
                      </div>
                    )}
                  </>
                )}

                {/* ── Brush overlay — canvas-based real-time painting ── */}
                {tool === "brush" && (
                  <>
                    <canvas
                      ref={brushCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 5 }}
                    />
                    <canvas
                      ref={brushLiveCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 6 }}
                    />
                    {/* Brush prompt popup — desktop only (floats inside canvas) */}
                    {brushStrokes.length > 0 && (
                      <div className={`hidden lg:flex lg:flex-col lg:gap-1 absolute bottom-3 left-1/2 -translate-x-1/2 transition-opacity duration-150 ${brushDrawing ? "opacity-0 pointer-events-none" : "opacity-100"}`} style={{ zIndex: 7 }}>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[rgba(16,18,22,0.92)] border border-accent-line backdrop-blur-md shadow-card min-w-[400px]">
                          <Icon name="sparkles" size={14} className="text-accent shrink-0" />
                          <input
                            value={brushPrompt}
                            onChange={(e) => setBrushPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") runBrushEdit(); if (e.key === "Escape") clearBrushCanvas(); }}
                            placeholder={t("editor.describeEdit")}
                            className="flex-1 h-8 bg-transparent outline-none text-white text-[13px] placeholder:text-[rgba(255,255,255,0.4)] min-w-0"
                          />
                          {models.length > 0 && (
                            <div className="flex items-center gap-1 border-l border-[rgba(255,255,255,0.12)] pl-2 ml-1 shrink-0">
                              <Icon name="cpu" size={11} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                              <select
                                value={regionModelId ?? ""}
                                onChange={(e) => setRegionModelId(e.target.value)}
                                className="h-7 pl-1 pr-5 bg-transparent text-[rgba(255,255,255,0.7)] text-[11px] mono outline-none appearance-none cursor-pointer hover:text-white transition-colors max-w-[120px]"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 2px center",
                                }}
                              >
                                {models.map((m) => (
                                  <option key={m.id} value={m.id} style={{ background: "#1c2027", color: "#f2f3f5" }}>
                                    {m.label}{m.isDefault ? " ★" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <button onClick={runBrushEdit} disabled={generating}
                            className="w-8 h-8 rounded-md inline-flex items-center justify-center bg-accent text-[var(--accent-fg)] disabled:opacity-40 hover:brightness-110 shrink-0">
                            <Icon name="arrowRight" size={14} />
                          </button>
                          <button onClick={clearBrushCanvas}
                            className="w-8 h-8 rounded-md inline-flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)] shrink-0">
                            <Icon name="close" size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Floating prompt popup — anchored near the lasso selection centroid */}
                {selectionValid && centroid && !generating && (
                  <RegionPromptPopup
                    centroid={centroid}
                    imgRef={imgRef}
                    canvasAreaRef={canvasAreaRef}
                    value={regionPrompt}
                    onChange={setRegionPrompt}
                    onSubmit={runRegionEdit}
                    onCancel={clearSelection}
                    credits={credits}
                    models={models}
                    selectedModelId={regionModelId}
                    onModelChange={setRegionModelId}
                  />
                )}

                {generating && <AIGeneratingOverlay />}
              </div>
            </div>

            {/* Right-click context menu */}
            {ctxMenu && (
              <ImageContextMenu
                x={ctxMenu.x}
                y={ctxMenu.y}
                tool={tool}
                canUndo={canUndo}
                canRedo={canRedo}
                selectionValid={selectionValid}
                generating={generating}
                onLasso={() => { setActiveTool(tool === "lasso" ? "none" : "lasso"); setCtxMenu(null); }}
                onUndo={() => { undo(); setCtxMenu(null); }}
                onRedo={() => { redo(); setCtxMenu(null); }}
                onClearSelection={() => { clearSelection(); setCtxMenu(null); }}
                onCompare={() => { setShowBefore(true); setCtxMenu(null); }}
                onDownload={() => { download(); setCtxMenu(null); }}
              />
            )}

            {/* Bottom status + zoom controls */}
            <div className="absolute bottom-[10px] left-4 right-4 flex items-center gap-2 z-10 pointer-events-none">
              {/* Zoom controls */}
              <div className="flex items-center gap-0 bg-bg-1 border border-line-2 rounded-md overflow-hidden shadow-card pointer-events-auto">
                <button
                  onClick={() => zoomTo(zoom / 1.25)}
                  className="w-7 h-7 flex items-center justify-center text-fg-2 hover:text-fg-0 hover:bg-bg-2 text-[16px] font-light transition-colors border-r border-line-2"
                  title="Zoom out (Ctrl+−)"
                >−</button>
                <button
                  onClick={fitToScreen}
                  className="px-2 h-7 mono text-[11px] text-fg-1 hover:text-accent hover:bg-bg-2 transition-colors min-w-[46px] text-center"
                  title="Reset zoom (Ctrl+0)"
                >{Math.round(zoom * 100)}%</button>
                <button
                  onClick={() => zoomTo(zoom * 1.25)}
                  className="w-7 h-7 flex items-center justify-center text-fg-2 hover:text-fg-0 hover:bg-bg-2 text-[14px] transition-colors border-l border-line-2"
                  title="Zoom in (Ctrl+=)"
                >+</button>
                <button
                  onClick={() => zoomTo(2)}
                  className="w-7 h-7 flex items-center justify-center text-fg-2 hover:text-fg-0 hover:bg-bg-2 transition-colors border-l border-line-2 text-[9px] mono font-bold"
                  title="Zoom to 200%"
                >2×</button>
                <button
                  onClick={fitToScreen}
                  className="w-7 h-7 flex items-center justify-center text-fg-2 hover:text-fg-0 hover:bg-bg-2 transition-colors border-l border-line-2 text-[9px] mono font-bold"
                  title="Fit to screen (Ctrl+0)"
                >FIT</button>
              </div>

              {/* Status text */}
              <div className="mono text-[11px] text-fg-2 flex items-center gap-2">
                <span>v{cursor}</span>
                {selectionValid && <><span>·</span><span className="text-accent">region selected</span></>}
                {showBefore && <><span>·</span><span className="text-accent">comparing original</span></>}
                {tool !== "none" && <><span>·</span><span className="text-accent capitalize">{tool} tool</span></>}
              </div>
            </div>

            {/* Custom brush/heal cursor — fixed to viewport position */}
            {toolCursorPos && (tool === "brush" || tool === "heal") && (
              <ToolCursor
                x={toolCursorPos.x}
                y={toolCursorPos.y}
                brushType={tool === "heal" ? "heal" : brushType}
              />
            )}
          </div>

          {/* Color tune panel */}
          {tool === "color" && (
            <ColorTunePanel
              adj={colorAdj}
              onChange={setColorAdj}
              onApply={runColorEdit}
              onClose={() => setActiveTool("none")}
            />
          )}

          {/* Mobile brush prompt — below canvas, only when strokes exist */}
          {tool === "brush" && brushStrokes.length > 0 && (
            <div className={`lg:hidden shrink-0 px-3 py-2 bg-bg-1 border-t border-line flex flex-col gap-2 transition-opacity duration-150 ${brushDrawing ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[rgba(16,18,22,0.92)] border border-accent-line shadow-card">
                <Icon name="sparkles" size={14} className="text-accent shrink-0" />
                <input
                  value={brushPrompt}
                  onChange={(e) => setBrushPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") runBrushEdit(); if (e.key === "Escape") clearBrushCanvas(); }}
                  placeholder={t("editor.describeEdit")}
                  className="flex-1 h-8 bg-transparent outline-none text-white text-[13px] placeholder:text-[rgba(255,255,255,0.4)] min-w-0"
                />
                <button onClick={runBrushEdit} disabled={generating}
                  className="w-8 h-8 rounded-md inline-flex items-center justify-center bg-accent text-[var(--accent-fg)] disabled:opacity-40 hover:brightness-110 shrink-0">
                  <Icon name="arrowRight" size={14} />
                </button>
                <button onClick={clearBrushCanvas}
                  className="w-8 h-8 rounded-md inline-flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)] shrink-0">
                  <Icon name="close" size={13} />
                </button>
              </div>
              {models.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[rgba(16,18,22,0.88)] border border-[rgba(255,255,255,0.1)] overflow-hidden">
                  <Icon name="cpu" size={11} className="text-[rgba(255,255,255,0.45)] shrink-0" />
                  <span className="text-[10px] text-[rgba(255,255,255,0.45)] shrink-0">Model</span>
                  <div className="relative flex-1 min-w-0 flex items-center px-2 py-[3px] rounded-md bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] overflow-hidden">
                    <select
                      value={regionModelId ?? ""}
                      onChange={(e) => setRegionModelId(e.target.value)}
                      className="w-full min-w-0 bg-transparent text-[rgba(255,255,255,0.85)] text-[11px] mono outline-none appearance-none cursor-pointer pr-5 truncate"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id} style={{ background: "#1c2027", color: "#f2f3f5" }}>
                          {m.label}{m.isDefault ? " ★" : ""} · {m.creditCost}cr
                        </option>
                      ))}
                    </select>
                    <Icon name="arrowRight" size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 text-[rgba(255,255,255,0.5)] pointer-events-none shrink-0" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prompt bar (full-image edit) */}
          <PromptBar
            prompt={prompt}
            setPrompt={setPrompt}
            run={runFullEdit}
            generating={generating}
            credits={credits}
            err={err}
            disabled={selectionValid}
            models={models}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            suggestedPrompts={suggestedPrompts}
          />
        </div>

        {/* Right panel: history + effects — desktop only */}
        <div className="hidden lg:contents">
          <RightPanel
            versions={versions}
            cursor={cursor}
            setCursor={setCursor}
            project={project}
          />
        </div>

        {/* ── Mobile bottom toolbar ─────────────────────────────── */}
        <div className="lg:hidden w-full max-w-full overflow-hidden flex items-center border-t border-line bg-bg-1 py-1 shrink-0">
          {([
            { id: "lasso",  icon: "cursor",   labelKey: "editor.lasso"   },
            { id: "brush",  icon: "brush",    labelKey: "editor.brush"   },
            { id: "heal",   icon: "sparkles", labelKey: "editor.heal"    },
            { id: "crop",   icon: "crop",     labelKey: "editor.crop"    },
            { id: "color",  icon: "sun",      labelKey: "editor.tune"    },
            { id: "_tpl",   icon: "image",    labelKey: "editor.tabTemplates" },
            { id: "_hist",  icon: "history",  labelKey: "editor.history" },
            { id: "_fx",    icon: "sparkles", labelKey: "editor.effects" },
          ] as { id: string; icon: IconName; labelKey: string }[]).map((tb) => {
            const isDrawer = tb.id === "_hist" || tb.id === "_fx" || tb.id === "_tpl";
            const isActive = !isDrawer && tool === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => {
                  if (tb.id === "_hist") { setMobilePanelTab("history"); setMobilePanelOpen(true); }
                  else if (tb.id === "_fx") { setMobilePanelTab("effects"); setMobilePanelOpen(true); }
                  else if (tb.id === "_tpl") { setMobilePanelTab("templates"); setMobilePanelOpen(true); }
                  else setActiveTool(tool === tb.id ? "none" : tb.id as ToolId);
                }}
                className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-[8px] transition-colors ${
                  isActive ? "bg-accent-soft text-accent" : "text-fg-3 hover:text-fg-0 hover:bg-bg-2"
                }`}
              >
                <Icon name={tb.icon} size={15} />
                <span className="text-[8px] font-medium truncate w-full text-center">{t(tb.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile slide-up drawer ────────────────────────────────── */}
      {mobilePanelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobilePanelOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-bg-1 rounded-t-[16px] border-t border-line flex flex-col max-h-[70vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-line-2" />
            </div>
            {/* Tab bar */}
            <div className="flex border-b border-line shrink-0">
              {(["templates", "effects", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobilePanelTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
                    mobilePanelTab === tab
                      ? "border-accent text-fg-0"
                      : "border-transparent text-fg-3 hover:text-fg-0"
                  }`}
                >
                  <Icon name={tab === "history" ? "history" : tab === "effects" ? "sparkles" : "image"} size={13} />
                  {tab === "history" ? t("editor.history") : tab === "effects" ? t("editor.effects") : t("editor.tabTemplates")}
                  {tab === "templates" && templates.length > 0 && (
                    <span className="px-1 py-px rounded text-[9px] bg-bg-2 text-fg-3 mono">{templates.length}</span>
                  )}
                </button>
              ))}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {mobilePanelTab === "history" ? (
                <HistoryContent
                  versions={versions}
                  cursor={cursor}
                  setCursor={(c) => { setCursor(c); setMobilePanelOpen(false); }}
                  project={project}
                />
              ) : mobilePanelTab === "templates" ? (
                <MobileTemplatesPanel
                  templates={templates}
                  models={models}
                  selectedModelId={selectedModelId}
                  onApply={(p: string, tplUrl: string, tplPrompt: string) => {
                    setPrompt(p);
                    setPendingTemplateImageUrl(tplUrl ?? null);
                    setPendingTemplatePrompt(tplPrompt ?? null);
                    setMobilePanelOpen(false);
                  }}
                />
              ) : (
                <EffectsPanel
                  onApply={(p) => { setPrompt(p); setMobilePanelOpen(false); }}
                  categories={effectCategories}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegionPromptPopup({
  centroid,
  imgRef,
  canvasAreaRef,
  value,
  onChange,
  onSubmit,
  onCancel,
  credits,
  models,
  selectedModelId,
  onModelChange,
}: {
  centroid: Point;
  imgRef: React.RefObject<HTMLImageElement>;
  canvasAreaRef: React.RefObject<HTMLDivElement>;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  credits: { used: number; total: number };
  models: ModelOption[];
  selectedModelId: string | null;
  onModelChange: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const regionModel = models.find((m) => m.id === selectedModelId) ?? models[0];
  const regionCreditCost = regionModel?.creditCost ?? 1;
  const regionRemaining = credits.total - credits.used;
  const out = regionCreditCost > regionRemaining;

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Compute centroid position in canvas-area-relative pixels
  const popupPos = useMemo(() => {
    const img = imgRef.current;
    const area = canvasAreaRef.current;
    if (!img || !area) return null;
    const imgRect  = img.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    // Centroid in canvas-area-relative pixels
    const cx = (imgRect.left - areaRect.left) + centroid.x * imgRect.width;
    const cy = (imgRect.top  - areaRect.top)  + centroid.y * imgRect.height;
    return { cx, cy, areaW: areaRect.width, areaH: areaRect.height };
  }, [centroid, imgRef, canvasAreaRef]);

  const POPUP_W = 400;
  const POPUP_H = 48;
  const OFFSET  = 18; // gap below centroid

  // Clamp so popup stays inside canvas area
  const style = useMemo((): React.CSSProperties => {
    if (!popupPos) return { bottom: 16, left: "50%", transform: "translateX(-50%)" };
    let left = popupPos.cx - POPUP_W / 2;
    let top  = popupPos.cy + OFFSET;
    // Flip above if not enough space below
    if (top + POPUP_H > popupPos.areaH - 12) top = popupPos.cy - POPUP_H - OFFSET;
    // Clamp horizontally
    left = Math.max(8, Math.min(left, popupPos.areaW - POPUP_W - 8));
    top  = Math.max(8, top);
    return { position: "absolute", left, top };
  }, [popupPos]);

  const pillCls = "flex items-center gap-[6px] pl-[10px] pr-[10px] py-[6px] rounded-[10px] bg-[rgba(16,18,22,0.94)] border border-accent-line backdrop-blur-md shadow-card";
  const creditBadge = out
    ? <span className="mono text-[10px] text-[#f87171] shrink-0 whitespace-nowrap">{regionRemaining}cr left</span>
    : <span className="mono text-[10px] text-[rgba(255,255,255,0.45)] shrink-0 whitespace-nowrap">{regionCreditCost}cr</span>;

  const inputEl = (ref?: React.RefObject<HTMLInputElement>) => (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && value.trim() && !out) { e.preventDefault(); onSubmit(); }
        else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      }}
      placeholder="Describe this area edit…"
      className="flex-1 min-w-0 h-8 bg-transparent border-0 outline-none text-white text-[13px] placeholder:text-[rgba(255,255,255,0.35)]"
    />
  );

  const actionBtns = (
    <>
      {creditBadge}
      <button
        onClick={() => (value.trim() && !out ? onSubmit() : undefined)}
        disabled={!value.trim() || out}
        title={out ? `Need ${regionCreditCost} credits` : "Generate (Enter)"}
        className="w-8 h-8 rounded-[7px] inline-flex items-center justify-center bg-accent text-[var(--accent-fg)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 shrink-0"
      >
        <Icon name="arrowRight" size={14} />
      </button>
      <button
        onClick={onCancel}
        title="Cancel (Esc)"
        className="w-7 h-7 rounded-[6px] inline-flex items-center justify-center text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.1)] shrink-0"
      >
        <Icon name="close" size={12} />
      </button>
    </>
  );

  return (
    <>
      {/* Mobile: pinned below undo/redo row */}
      <div className="lg:hidden absolute top-14 inset-x-2 z-20 flex flex-col gap-1">
        <div className={pillCls}>
          <Icon name="sparkles" size={13} className="text-accent shrink-0" />
          {inputEl(inputRef)}
          {actionBtns}
        </div>
        {/* Mobile model selector */}
        {models.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[rgba(16,18,22,0.88)] border border-[rgba(255,255,255,0.1)] backdrop-blur-md overflow-hidden">
            <Icon name="cpu" size={11} className="text-[rgba(255,255,255,0.45)] shrink-0" />
            <span className="text-[10px] text-[rgba(255,255,255,0.45)] shrink-0">Model</span>
            <div className="relative flex-1 min-w-0 flex items-center px-2 py-[3px] rounded-md bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] overflow-hidden">
              <select
                value={selectedModelId ?? ""}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[rgba(255,255,255,0.85)] text-[11px] mono outline-none appearance-none cursor-pointer pr-5 truncate"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} style={{ background: "#1c2027", color: "#f2f3f5" }}>
                    {m.label}{m.isDefault ? " ★" : ""} · {m.creditCost}cr
                  </option>
                ))}
              </select>
              <Icon name="arrowRight" size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 text-[rgba(255,255,255,0.5)] pointer-events-none shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Desktop: anchored near the selection centroid */}
      <div
        data-testid="region-popup"
        className="hidden lg:block z-20"
        style={{ ...style, width: POPUP_W }}
      >
        <div className={pillCls}>
          <Icon name="lasso" size={13} className="text-accent shrink-0" />
          {inputEl(inputRef)}
          {models.length > 0 && (
            <div className="flex items-center gap-1 border-l border-[rgba(255,255,255,0.12)] pl-2 shrink-0">
              <Icon name="cpu" size={11} className="text-[rgba(255,255,255,0.4)] shrink-0" />
              <select
                value={selectedModelId ?? ""}
                onChange={(e) => onModelChange(e.target.value)}
                className="h-7 pl-1 pr-5 bg-transparent text-[rgba(255,255,255,0.7)] text-[11px] mono outline-none appearance-none cursor-pointer hover:text-white transition-colors max-w-[110px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 2px center",
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} style={{ background: "#1c2027", color: "#f2f3f5" }}>
                    {m.label}{m.isDefault ? " ★" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {actionBtns}
        </div>
      </div>
    </>
  );
}

function ImageContextMenu({
  x,
  y,
  tool,
  canUndo,
  canRedo,
  selectionValid,
  generating,
  onLasso,
  onUndo,
  onRedo,
  onClearSelection,
  onCompare,
  onDownload,
}: {
  x: number;
  y: number;
  tool: ToolId;
  canUndo: boolean;
  canRedo: boolean;
  selectionValid: boolean;
  generating: boolean;
  onLasso: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearSelection: () => void;
  onCompare: () => void;
  onDownload: () => void;
}) {
  // Keep menu inside the viewport
  const menuW = 200;
  const menuH = 280;
  const left = x + menuW > window.innerWidth ? x - menuW : x;
  const top = y + menuH > window.innerHeight ? y - menuH : y;

  type Item =
    | { kind: "action"; icon: string; label: string; shortcut?: string; disabled?: boolean; danger?: boolean; onClick: () => void }
    | { kind: "sep" };

  const items: Item[] = [
    {
      kind: "action",
      icon: "lasso",
      label: tool === "lasso" ? "Exit Lasso" : "Lasso Select",
      shortcut: "L",
      disabled: generating,
      onClick: onLasso,
    },
    ...(selectionValid
      ? [{ kind: "action" as const, icon: "close", label: "Clear Selection", shortcut: "Esc", onClick: onClearSelection }]
      : []),
    { kind: "sep" },
    {
      kind: "action",
      icon: "undo",
      label: "Undo",
      shortcut: "⌘Z",
      disabled: !canUndo || generating,
      onClick: onUndo,
    },
    {
      kind: "action",
      icon: "redo",
      label: "Redo",
      shortcut: "⌘Y",
      disabled: !canRedo || generating,
      onClick: onRedo,
    },
    { kind: "sep" },
    {
      kind: "action",
      icon: "eye",
      label: "Compare Original",
      shortcut: "Space",
      disabled: generating,
      onClick: onCompare,
    },
    {
      kind: "action",
      icon: "download",
      label: "Download Image",
      onClick: onDownload,
    },
  ];

  return (
    <div
      className="fixed z-[200] py-1 rounded-[10px] border border-line-2 bg-bg-1 shadow-2xl"
      style={{ left, top, minWidth: menuW }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (item.kind === "sep") {
          return <div key={i} className="my-1 h-px bg-line mx-2" />;
        }
        return (
          <button
            key={i}
            type="button"
            disabled={item.disabled}
            onClick={item.onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors
              ${item.disabled
                ? "text-fg-3 cursor-not-allowed"
                : item.danger
                  ? "text-[var(--danger)] hover:bg-[rgba(var(--danger-rgb),0.08)]"
                  : "text-fg-0 hover:bg-bg-2"
              }`}
          >
            <Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={14} className={item.disabled ? "text-fg-3" : item.danger ? "text-[var(--danger)]" : "text-fg-2"} />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <kbd className="mono text-[10px] text-fg-3 bg-bg-2 border border-line-2 px-1.5 py-0.5 rounded">
                {item.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tool Rail ────────────────────────────────────────────────────────────────

type RailItem =
  | { kind: "mode";   id: ToolId;  icon: Parameters<typeof Icon>[0]["name"]; label: string; shortcut?: string }
  | { kind: "action"; icon: Parameters<typeof Icon>[0]["name"]; label: string; prompt: string; shortcut?: string }
  | { kind: "sep" }
  | { kind: "label"; text: string };

// RAIL_ITEMS is built inside ToolRail to support translations

function ToolRail({
  tool,
  onSetTool,
  onQuickAction,
  brushSize,
  onBrushSizeChange,
}: {
  tool: ToolId;
  onSetTool: (t: ToolId) => void;
  onQuickAction: (prompt: string) => void;
  brushSize: number;
  onBrushSizeChange: (s: number) => void;
}) {
  const { t } = useT();
  const RAIL_ITEMS: RailItem[] = [
    { kind: "label", text: t("editor.selectGroup") },
    { kind: "mode", id: "none",  icon: "cursor",   label: t("editor.moveSelect"),  shortcut: "V" },
    { kind: "mode", id: "lasso", icon: "lasso",    label: t("editor.lassoSelect"), shortcut: "L" },
    { kind: "mode", id: "crop",  icon: "crop",     label: t("editor.crop"),        shortcut: "C" },
    { kind: "sep" },
    { kind: "label", text: t("editor.retouchGroup") },
    { kind: "mode", id: "brush", icon: "brush",   label: t("editor.aiBrush"),     shortcut: "B" },
    { kind: "mode", id: "heal",  icon: "eraser",  label: t("editor.spotHeal"),    shortcut: "H" },
    { kind: "sep" },
    { kind: "label", text: t("editor.adjustGroup") },
    { kind: "mode", id: "color", icon: "sun",     label: t("editor.colorTone"),   shortcut: "A" },
    { kind: "sep" },
    { kind: "label", text: t("editor.aiQuickGroup") },
    { kind: "action", icon: "sparkles", label: t("editor.autoEnhance"), shortcut: "E",
      prompt: "Enhance the overall image quality — sharpen fine details, reduce noise, and improve clarity while keeping it natural." },
    { kind: "action", icon: "layers",   label: t("editor.removeBg"),    shortcut: "K",
      prompt: "Remove the background completely and isolate the subject on a clean white or transparent background." },
  ];
  const [flashed, setFlashed] = useState<string | null>(null);

  function fireAction(item: RailItem & { kind: "action" }) {
    setFlashed(item.label);
    onQuickAction(item.prompt);
    setTimeout(() => setFlashed(null), 900);
  }

  return (
    <div className="border-r border-line bg-bg-1 flex flex-col items-center py-2 gap-0 overflow-y-auto overflow-x-hidden scrollbar-none">
      {RAIL_ITEMS.map((item, i) => {
        if (item.kind === "sep") {
          return <div key={i} className="w-8 h-px bg-line my-[6px]" />;
        }
        if (item.kind === "label") {
          return (
            <div key={i} className="mono text-[9px] uppercase tracking-[0.8px] text-fg-3 mb-[2px] mt-1 w-full text-center">
              {item.text}
            </div>
          );
        }
        if (item.kind === "mode") {
          const active = tool === item.id;
          if (item.id === "brush") {
            return (
              <BrushRailButton
                key="brush"
                active={active}
                brushSize={brushSize}
                onBrushSizeChange={onBrushSizeChange}
                onClick={() => onSetTool(active ? "none" : "brush")}
              />
            );
          }
          return (
            <RailButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              shortcut={item.shortcut}
              active={active}
              onClick={() => onSetTool(active ? "none" : item.id)}
            />
          );
        }
        // action
        const isFlashed = flashed === item.label;
        return (
          <RailButton
            key={item.label}
            icon={item.icon}
            label={item.label}
            shortcut={item.shortcut}
            active={isFlashed}
            onClick={() => fireAction(item)}
          />
        );
      })}
    </div>
  );
}

function BrushRailButton({
  active,
  brushSize,
  onBrushSizeChange,
  onClick,
}: {
  active: boolean;
  brushSize: number;
  onBrushSizeChange: (s: number) => void;
  onClick: () => void;
}) {
  const [tip, setTip] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onPointerDown() {
    longPressRef.current = setTimeout(() => {
      setSizeOpen(true);
    }, 500);
  }
  function onPointerUp() {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }
  function onPointerLeave() {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }

  const sizePercent = Math.round(brushSize * 100);

  return (
    <div
      className="relative w-full flex justify-center"
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => { setTip(false); setSizeOpen(false); }}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        className={`w-11 h-11 rounded-lg inline-flex flex-col items-center justify-center gap-[3px] border transition-all ${
          active
            ? "bg-accent-soft border-accent-line text-accent"
            : "bg-transparent border-transparent text-fg-2 hover:bg-bg-2 hover:text-fg-0"
        }`}
      >
        <Icon name="brush" size={18} />
        <span className={`mono text-[10px] leading-none ${active ? "text-accent" : "text-fg-3"}`}>B</span>
      </button>

      {/* Size popover — appears on long press */}
      {sizeOpen && (
        <div
          className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 px-3 py-3 rounded-xl bg-bg-0 border border-line-2 shadow-card flex flex-col items-center gap-2 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-fg-2 mono whitespace-nowrap">Brush Size</span>
          <div className="flex items-center gap-2">
            <div
              className="rounded-full bg-accent"
              style={{ width: Math.max(6, sizePercent * 1.4), height: Math.max(6, sizePercent * 1.4) }}
            />
          </div>
          <input
            type="range" min={1} max={30}
            value={sizePercent}
            onChange={(e) => onBrushSizeChange(Number(e.target.value) / 100)}
            className="w-20 accent-[var(--accent)] cursor-pointer"
            style={{ writingMode: "horizontal-tb" }}
          />
          <span className="text-[10px] text-fg-3 mono">{sizePercent}px</span>
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-[7px] h-[7px] rotate-45 bg-bg-0 border-b border-l border-line-2" />
        </div>
      )}

      {/* Hover tooltip (only when size picker is closed) */}
      {tip && !sizeOpen && (
        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap px-[10px] py-[6px] rounded-md bg-bg-0 border border-line-2 shadow-card text-[11px] text-fg-1 pointer-events-none">
          AI Brush
          <kbd className="ml-2 mono text-[9px] text-fg-3 bg-bg-2 border border-line-2 px-1 py-0.5 rounded">B</kbd>
          <div className="text-[10px] text-fg-3 mt-0.5">Hold for size</div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-[7px] h-[7px] rotate-45 bg-bg-0 border-b border-l border-line-2" />
        </div>
      )}
    </div>
  );
}

function RailButton({
  icon,
  label,
  shortcut,
  active,
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick: () => void;
}) {
  const [tip, setTip] = useState(false);
  // Shorten label to max 2 words for the visible tag
  const shortLabel = label.split(" ").slice(0, 2).join(" ");
  return (
    <div
      className="relative w-full px-[5px]"
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <button
        type="button"
        onClick={onClick}
        className={`w-full pt-[7px] pb-[6px] rounded-lg inline-flex flex-col items-center justify-center gap-[4px] border transition-all ${
          active
            ? "bg-accent-soft border-accent-line text-accent"
            : "bg-transparent border-transparent text-fg-2 hover:bg-bg-2 hover:text-fg-0"
        }`}
      >
        <Icon name={icon} size={16} />
        <span
          className={`text-[9px] leading-tight font-medium text-center w-full px-[2px] truncate ${
            active ? "text-accent" : "text-fg-2"
          }`}
        >
          {shortLabel}
        </span>
        {shortcut && (
          <span className={`mono text-[8px] leading-none ${active ? "text-accent/60" : "text-fg-3"}`}>
            {shortcut}
          </span>
        )}
      </button>

      {/* Tooltip — appears to the right */}
      {tip && (
        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap px-[10px] py-[6px] rounded-md bg-bg-0 border border-line-2 shadow-card text-[11px] text-fg-1 pointer-events-none">
          {label}
          {shortcut && (
            <kbd className="ml-2 mono text-[9px] text-fg-3 bg-bg-2 border border-line-2 px-1 py-0.5 rounded">
              {shortcut}
            </kbd>
          )}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-[7px] h-[7px] rotate-45 bg-bg-0 border-b border-l border-line-2" />
        </div>
      )}
    </div>
  );
}

// ─── Brush Type Panel ─────────────────────────────────────────────────────────

type BrushTypeId = "soft" | "pen" | "pencil" | "eraser";

/** SVG stroke sample — each type has a visually unique shape, weight & texture */
// ─── Custom Tool Cursor ───────────────────────────────────────────────────────

// Each icon is designed with its drawing tip at (2, 22) in the 24×24 viewBox.
// Rendered at 22×22 px → tip is at ≈ (1.8, 20.2) px from the div's top-left.
// translateOffset moves the div so the tip lands exactly at (clientX, clientY).
const CURSOR_TIP_OFFSET = { x: -2, y: -20 }; // px — nudge tip to cursor hotspot

function ToolCursor({ x, y, brushType }: { x: number; y: number; brushType: BrushTypeId | "heal" }) {
  // All icons: drawing tip at bottom-left (≈ 2,22 in 24×24 viewBox).
  // Heal: center crosshair at (12,12) — use a different offset.
  const isHeal = brushType === "heal";
  const offset = isHeal
    ? { x: -11, y: -11 }   // center crosshair on cursor
    : CURSOR_TIP_OFFSET;

  const stroke = "white";
  const sw = "1.7";

  const icon = (() => {
    switch (brushType) {
      case "pen":
        // Nib tip at bottom-left (2,22); handle goes to top-right
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22 L18 4 L21 7 Z" fill="white" fillOpacity="0.15" />
            <path d="M2 22 L18 4" />
            <path d="M18 4 L21 7" />
            <path d="M2 22 L5 19" strokeOpacity="0.5" />
          </svg>
        );
      case "pencil":
        // Tip at bottom-left (2,22); pencil body to top-right
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22 L3 18 L16 5 L19 8 L6 21 Z" fill="white" fillOpacity="0.12" />
            <path d="M3 18 L16 5 L19 8 L6 21" />
            <path d="M2 22 L3 18 L6 21 Z" fill="white" fillOpacity="0.4" />
            <path d="M14 7 L17 10" strokeOpacity="0.55" />
          </svg>
        );
      case "eraser":
        // Eraser corner at bottom-left (2,20); body to top-right
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20 L8 22 L22 8 L16 2 L2 16 Z" fill="white" fillOpacity="0.12" />
            <path d="M2 20 L8 22 L22 8 L16 2 L2 16 Z" />
            <path d="M2 16 L8 22" strokeOpacity="0.5" />
          </svg>
        );
      case "heal":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
            <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
            <path d="M12 6v12M6 12h12" />
          </svg>
        );
      default: // soft brush — tip at bottom-left
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 3 L21 5 L7 17 Q4 20 2 22 Q4 19 5 17 L19 3 Z" fill="white" fillOpacity="0.12" />
            <path d="M19 3 L21 5 L7 17" />
            <path d="M7 17 Q4 20 2 22 Q4 19 5 17" strokeOpacity="0.7" />
          </svg>
        );
    }
  })();

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: x + offset.x,
        top: y + offset.y,
        filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.9)) drop-shadow(0 0 1px rgba(0,0,0,1))",
      }}
    >
      {icon}
    </div>
  );
}

function BrushStrokeSample({ id, active }: { id: BrushTypeId; active: boolean }) {
  const c = active ? "var(--accent)" : "var(--fg-1)";
  const op = active ? 1 : 0.55;
  switch (id) {
    case "soft":
      return (
        <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
          <path d="M4 10 Q22 2 40 10" stroke={c} strokeWidth="11" strokeLinecap="round" strokeOpacity={op * 0.18} />
          <path d="M4 10 Q22 2 40 10" stroke={c} strokeWidth="7"  strokeLinecap="round" strokeOpacity={op * 0.4} />
          <path d="M4 10 Q22 2 40 10" stroke={c} strokeWidth="4"  strokeLinecap="round" strokeOpacity={op * 0.85} />
        </svg>
      );
    case "pen":
      return (
        <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
          <path d="M4 15 L40 5" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={op} />
        </svg>
      );
    case "pencil":
      return (
        <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
          <path d="M4 14 Q22 4 40 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="4 2" strokeOpacity={op * 0.9} />
          <path d="M4 14 Q22 4 40 12" stroke={c} strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 4" strokeOpacity={op * 0.4} />
        </svg>
      );
    case "eraser":
      return (
        <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
          <path d="M4 14 Q22 6 40 14" stroke={c} strokeWidth="7" strokeLinecap="round" strokeOpacity={op * 0.15} />
          <path d="M4 14 Q22 6 40 14" stroke={c} strokeWidth="4" strokeLinecap="round" strokeOpacity={op * 0.3} strokeDasharray="6 3" />
          <path d="M4 14 Q22 6 40 14" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={op * 0.7} />
        </svg>
      );
  }
}

/** Stroke preview in size section */
function BrushSizeStroke({ brushSize, brushType }: { brushSize: number; brushType: BrushTypeId }) {
  const sw = Math.max(1.5, brushSize * 100 * 0.55);
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ overflow: "visible" }}>
      <path d="M6 18 Q18 10 30 18"
        stroke={brushType === "eraser" ? "var(--fg-3)" : "var(--accent)"}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={brushType === "pencil" ? "3 1.5" : undefined}
        strokeOpacity={0.9}
      />
    </svg>
  );
}

const BRUSH_TYPES: { id: BrushTypeId; label: string; hint: string }[] = [
  { id: "soft",   label: "Brush",   hint: "Smooth, feathered stroke" },
  { id: "pen",    label: "Pen",     hint: "Hard, precise lines" },
  { id: "pencil", label: "Pencil",  hint: "Grainy, hand-drawn texture" },
  { id: "eraser", label: "Eraser",  hint: "Remove painted marks" },
];

function BrushTypePanel({
  brushType,
  onBrushTypeChange,
  brushSize,
  onBrushSizeChange,
}: {
  brushType: BrushTypeId;
  onBrushTypeChange: (t: BrushTypeId) => void;
  brushSize: number;
  onBrushSizeChange: (s: number) => void;
}) {
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-0 py-2 px-1.5 rounded-[12px] bg-bg-1 border border-line-2 shadow-card"
      style={{ backdropFilter: "blur(8px)", minWidth: 72 }}>
      {/* Header */}
      <div className="px-1 pb-1.5 text-[9px] mono uppercase tracking-[0.7px] text-fg-3 text-center">Brush</div>

      {BRUSH_TYPES.map((bt) => {
        const active = brushType === bt.id;
        return (
          <BrushTypeButton
            key={bt.id}
            bt={bt}
            active={active}
            onClick={() => onBrushTypeChange(bt.id)}
          />
        );
      })}

      {/* Divider */}
      <div className="w-full h-px bg-line my-1.5" />

      {/* Size control */}
      <div className="flex flex-col items-center gap-1 px-1">
        <span className="text-[9px] mono text-fg-3">Size</span>
        {/* Live stroke preview */}
        <div className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
          <BrushSizeStroke brushSize={brushSize} brushType={brushType} />
        </div>
        <input
          type="range" min={1} max={30}
          value={Math.round(brushSize * 100)}
          onChange={(e) => onBrushSizeChange(Number(e.target.value) / 100)}
          className="accent-[var(--accent)] cursor-pointer"
          style={{ writingMode: "vertical-lr", direction: "rtl", height: 90, width: 20 }}
        />
        <span className="text-[9px] mono text-fg-3">{Math.round(brushSize * 100)}</span>
      </div>
    </div>
  );
}

function BrushTypeButton({
  bt,
  active,
  onClick,
}: {
  bt: { id: BrushTypeId; label: string; hint: string };
  active: boolean;
  onClick: () => void;
}) {
  const [tip, setTip] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg inline-flex flex-col items-center justify-center py-1 px-1 gap-[1px] border transition-all ${
          active
            ? "bg-accent-soft border-accent-line"
            : "bg-transparent border-transparent hover:bg-bg-2"
        }`}
      >
        <BrushStrokeSample id={bt.id} active={active} />
        <span className={`mono text-[8px] leading-none ${active ? "text-accent" : "text-fg-3"}`}>{bt.label}</span>
      </button>
      {tip && (
        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap px-[10px] py-[6px] rounded-md bg-bg-0 border border-line-2 shadow-card text-[11px] text-fg-1 pointer-events-none">
          <div className="font-medium">{bt.label}</div>
          <div className="text-fg-3 text-[10px] mt-0.5">{bt.hint}</div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-[7px] h-[7px] rotate-45 bg-bg-0 border-b border-l border-line-2" />
        </div>
      )}
    </div>
  );
}

function ShortcutBadge({
  kbd,
  label,
  tip,
  disabled,
  active,
  tipSide = "right",
}: {
  kbd: string;
  label: string;
  tip: string;
  disabled?: boolean;
  active?: boolean;
  tipSide?: "left" | "right";
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div
        className={`flex items-center gap-[5px] h-[26px] px-[7px] rounded-md border text-[11px] mono transition-colors select-none cursor-default ${
          active
            ? "bg-accent-soft border-accent-line text-accent"
            : disabled
              ? "bg-bg-2 border-line-2 text-fg-3 opacity-40"
              : "bg-bg-2 border-line-2 text-fg-2"
        }`}
      >
        <kbd className={`font-mono text-[10px] font-semibold ${active ? "text-accent" : disabled ? "text-fg-3" : "text-fg-0"}`}>
          {kbd}
        </kbd>
        <span>{label}</span>
      </div>
      {show && (
        <div
          className="absolute top-1/2 -translate-y-1/2 z-50 whitespace-nowrap px-[10px] py-[6px] rounded-md bg-bg-0 border border-line-2 shadow-card text-[11px] text-fg-1 pointer-events-none"
          style={tipSide === "right" ? { left: "calc(100% + 10px)" } : { right: "calc(100% + 10px)" }}
        >
          {tip}
          {/* Arrow pointing back toward the badge */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[8px] h-[8px] rotate-45 bg-bg-0 border-line-2"
            style={
              tipSide === "right"
                ? { left: -5, borderBottom: "1px solid", borderLeft: "1px solid" }
                : { right: -5, borderTop: "1px solid", borderRight: "1px solid" }
            }
          />
        </div>
      )}
    </div>
  );
}

function FloatBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: "undo" | "redo";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative w-[30px] h-[26px] rounded-[4px] inline-flex items-center justify-center ${
        disabled ? "text-fg-3 cursor-not-allowed" : "text-fg-1 hover:bg-bg-3 cursor-pointer"
      }`}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}

function PromptBar({
  prompt,
  setPrompt,
  run,
  generating,
  credits,
  err,
  disabled,
  models,
  selectedModelId,
  onModelChange,
  suggestedPrompts = [] as string[],
}: {
  prompt: string;
  setPrompt: (p: string) => void;
  run: () => void;
  generating: boolean;
  credits: { used: number; total: number };
  err: string | null;
  disabled?: boolean;
  models: ModelOption[];
  selectedModelId: string | null;
  onModelChange: (id: string) => void;
  suggestedPrompts?: string[];
}) {
  const { t } = useT();
  const activeModel = models.find((m) => m.id === selectedModelId) ?? models[0];
  const creditCost = activeModel?.creditCost ?? 1;
  const remaining = credits.total - credits.used;
  const out = creditCost > remaining;
  const inputRef = useRef<HTMLInputElement>(null);

  const lowCredit = remaining <= 10 && !out;

  return (
    <div className="border-t border-line bg-bg-1 px-3 pt-3 pb-3 lg:px-5 lg:pt-4 lg:pb-4">
      {/* Status row — desktop only */}
      <div className="hidden lg:flex items-center gap-[8px] mb-[10px] text-[12px] text-fg-2">
        <div
          className="w-[7px] h-[7px] rounded-full shrink-0 transition-all"
          style={{
            background: prompt.trim() ? "var(--accent)" : "var(--fg-3)",
            boxShadow: prompt.trim() ? "0 0 0 3px var(--accent-soft)" : "none",
          }}
        />
        <span className="truncate">
          {disabled ? (
            <>{t("editor.regionActive")}</>
          ) : prompt.trim() ? (
            <>{t("editor.readyToGenerate")}</>
          ) : (
            <>
              {t("editor.describeInEnglish")}{" "}
              <strong className="text-fg-0">{activeModel?.label ?? "AI"}</strong>{" "}
              {t("editor.willDoRest")}
            </>
          )}
        </span>

        {/* Credit cost — right side of status row */}
        <span
          className={`ml-auto mono text-[11px] shrink-0 transition-colors ${
            lowCredit
              ? "text-[var(--danger)] animate-pulse"
              : out
              ? "text-[var(--danger)]"
              : "text-fg-3"
          }`}
        >
          {out
            ? `${remaining} left`
            : lowCredit
            ? `⚠ ${remaining} left`
            : `${creditCost}cr/edit`}
        </span>
      </div>

      {err && (
        <div className="mb-3 text-[12px] text-[var(--danger)]">{err}</div>
      )}

      {/* Main input row — input and button same height */}
      <div className={`flex gap-2 items-center ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Prompt input */}
        <div className="flex-1 h-[42px] bg-bg-2 border border-line-2 rounded-lg flex items-center px-3 focus-within:border-accent-line transition-colors">
          <Icon name="sparkles" size={15} className="text-accent shrink-0" />
          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !generating) {
                e.preventDefault();
                run();
              }
            }}
            placeholder={t("editor.describeEditHint")}
            className="flex-1 h-full px-3 bg-transparent border-0 outline-none text-fg-0 text-[14px] min-w-0"
          />
          {/* Model selector — desktop */}
          {models.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 pr-2 shrink-0 border-l border-line-2 ml-1 pl-2">
              <Icon name="cpu" size={11} className="text-fg-3 shrink-0" />
              <select
                value={selectedModelId ?? ""}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={generating}
                title="Switch AI model"
                className="h-7 pl-1 pr-5 bg-transparent text-fg-2 text-[11px] mono outline-none appearance-none cursor-pointer hover:text-fg-0 transition-colors max-w-[130px] truncate"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236a6e77' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 2px center",
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}{m.isDefault ? " ★" : ""} · {m.creditCost}cr
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="hidden lg:block pr-1 pl-2 mono text-[11px] text-fg-3 shrink-0">⏎</div>
        </div>

        {/* Action button — same height as input */}
        {out ? (
          <Link
            href="/billing"
            className="shrink-0 w-11 lg:min-w-[140px] lg:w-auto h-[42px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--danger)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity lg:px-4"
          >
            <span className="hidden lg:inline">{t("editor.upgradePlan")}</span>
            <Icon name="arrowRight" size={14} />
          </Link>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={run}
            disabled={generating || !prompt.trim()}
            className="shrink-0 w-11 lg:w-auto lg:min-w-[120px] !h-[42px] !rounded-lg !px-0 lg:!px-4"
          >
            <span className="hidden lg:inline">{generating ? t("editor.generating") : t("editor.generate")}</span>
            <Icon name="arrowRight" size={16} />
          </Button>
        )}
      </div>

      {/* Mobile model selector */}
      {models.length > 0 && (
        <div className={`lg:hidden flex items-center gap-2 mt-2 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
          <Icon name="cpu" size={12} className="text-fg-3 shrink-0" />
          <span className="text-[11px] text-fg-3 shrink-0">Model</span>
          <div className="relative flex-1 min-w-0 flex items-center px-2.5 h-8 bg-bg-2 border border-line-2 rounded-md overflow-hidden focus-within:border-accent-line transition-colors">
            <select
              value={selectedModelId ?? ""}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={generating}
              className="w-full min-w-0 h-full bg-transparent text-fg-1 text-[12px] mono outline-none appearance-none cursor-pointer pr-6 truncate disabled:opacity-50"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}{m.isDefault ? " ★" : ""} · {m.creditCost}cr
                </option>
              ))}
            </select>
            <Icon name="arrowRight" size={11} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-fg-3 pointer-events-none shrink-0" />
          </div>
        </div>
      )}

      {/* Suggestion chips — desktop only */}
      {suggestedPrompts.length > 0 && (
        <div className="hidden lg:flex gap-[6px] mt-[10px] flex-wrap">
          <span className="mono text-[11px] text-fg-3 self-center mr-1">{t("editor.try")}</span>
          {suggestedPrompts.map((s) => (
            <button
              key={s}
              onClick={() => {
                setPrompt(s);
                inputRef.current?.focus();
              }}
              className="text-[11px] px-[9px] h-[22px] rounded-full border border-line-2 bg-transparent text-fg-2 hover:border-accent-line hover:text-accent transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── ColorTunePanel ──────────────────────────────────────────────────────────

function ColorTunePanel({
  adj,
  onChange,
  onApply,
  onClose,
}: {
  adj: { brightness: number; contrast: number; saturation: number; warmth: number; fade: number };
  onChange: (a: typeof adj) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const sliders: { key: keyof typeof adj; label: string; min: number }[] = [
    { key: "brightness", label: t("editor.brightness"), min: -100 },
    { key: "contrast",   label: t("editor.contrast"),   min: -100 },
    { key: "saturation", label: t("editor.saturation"), min: -100 },
    { key: "warmth",     label: t("editor.warmth"),     min: -100 },
    { key: "fade",       label: t("editor.fade"),       min: 0    },
  ];
  const hasChanges = Object.values(adj).some((v) => v !== 0);
  return (
    <div className="border-t border-line bg-bg-1 px-5 py-3 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="sun" size={14} className="text-accent" />
        <span className="text-[12px] font-semibold text-fg-0">{t("editor.colorTone")}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => onChange({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, fade: 0 })}
            disabled={!hasChanges}
            className="px-3 py-1 rounded-md bg-bg-2 border border-line-2 text-[11px] text-fg-1 hover:bg-bg-3 disabled:opacity-40">{t("editor.reset")}</button>
          <button onClick={onApply} disabled={!hasChanges}
            className="px-3 py-1 rounded-md bg-accent text-[var(--accent-fg)] text-[11px] font-medium hover:brightness-110 disabled:opacity-40">{t("editor.apply")}</button>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-fg-3 hover:text-fg-0 rounded">
            <Icon name="close" size={13} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {sliders.map(({ key, label, min }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-fg-2 font-medium">{label}</span>
              <span className="mono text-[10px] text-fg-3">{adj[key] > 0 ? `+${adj[key]}` : adj[key]}</span>
            </div>
            <input type="range" min={min} max={100} value={adj[key]}
              onChange={(e) => onChange({ ...adj, [key]: Number(e.target.value) })}
              className="w-full h-1 cursor-pointer accent-[var(--accent)]" />
            <div className="flex justify-between text-[8px] text-fg-3 mono">
              <span>{min}</span><span>0</span><span>+100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Effects data ────────────────────────────────────────────────────────────

// ─── RightPanel (History only) ───────────────────────────────────────────────

function RightPanel({
  versions,
  cursor,
  setCursor,
  project,
}: {
  versions: EditVersion[];
  cursor: number;
  setCursor: (c: number) => void;
  project: ProjectData;
}) {
  const { t } = useT();
  return (
    <div className="border-l border-line bg-bg-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-[42px] flex items-center gap-2 px-4 border-b border-line shrink-0">
        <Icon name="history" size={13} className="text-fg-2 shrink-0" />
        <span className="text-[12px] font-semibold text-fg-0">{t("editor.history")}</span>
        <span className="ml-auto mono text-[10px] text-fg-3 bg-bg-2 border border-line-2 px-[6px] py-[2px] rounded-full">
          v{versions.length - 1}
        </span>
      </div>
      <HistoryContent versions={versions} cursor={cursor} setCursor={setCursor} project={project} />
    </div>
  );
}

// ─── EffectsPanelLeft (left sidebar, 260px, Adobe-style) ─────────────────────

function EffectsPanelLeft({
  onApply,
  categories,
  templates = [],
  selectedModelId,
  models = [],
}: {
  onApply: (prompt: string, templateImageUrl?: string, templatePrompt?: string) => void;
  categories: { title: string; color: string; effects: EffectPresetData[] }[];
  templates?: { id: string; title: string; imageUrl: string; prompt: string; category: string }[];
  selectedModelId?: string | null;
  models?: ModelOption[];
}) {
  const { t } = useT();
  const [tab, setTab] = useState<"effects" | "templates">(() => {
    try { return (localStorage.getItem("editor:panel-tab") as "effects" | "templates") ?? "effects"; } catch { return "effects"; }
  });
  function switchTab(tab: "effects" | "templates") {
    setTab(tab);
    try { localStorage.setItem("editor:panel-tab", tab); } catch { /* ignore */ }
  }
  const [search, setSearch] = useState("");
  const [tplSearch, setTplSearch] = useState("");
  const [tplCategory, setTplCategory] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<string | null>(null);
  const [selectedTplId, setSelectedTplId] = useState<string | null>(null);

  const activeModelProvider = models.find((m) => m.id === selectedModelId)?.provider ?? models.find((m) => m.isDefault)?.provider;
  const isGeminiSelected = activeModelProvider === "google";

  function apply(eff: EffectPresetData) {
    setApplied(eff.id);
    onApply(eff.prompt);
    setTimeout(() => setApplied(null), 1100);
  }

  function toggleCat(title: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  const q = search.trim().toLowerCase();
  const filtered = categories
    .map((cat) => ({
      ...cat,
      effects: q
        ? cat.effects.filter(
            (e) =>
              e.label.toLowerCase().includes(q) ||
              e.prompt.toLowerCase().includes(q),
          )
        : cat.effects,
    }))
    .filter((cat) => cat.effects.length > 0);

  // Templates filtering
  const tplCategories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))).sort();
  const activeTplCategory = tplCategories.includes(tplCategory) ? tplCategory : "";
  const filteredTemplates = templates.filter((t) => {
    const matchCat = !activeTplCategory || t.category === activeTplCategory;
    const matchQ = !tplSearch.trim() || t.title.toLowerCase().includes(tplSearch.trim().toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab switcher */}
      <div className="flex shrink-0 border-b border-line">
        <button
          type="button"
          onClick={() => switchTab("effects")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-[36px] text-[11px] font-semibold transition-colors border-b-2 ${
            tab === "effects"
              ? "border-accent text-accent"
              : "border-transparent text-fg-2 hover:text-fg-0"
          }`}
        >
          <Icon name="sparkles" size={11} />
          {t("editor.tabEffects")}
        </button>
        <button
          type="button"
          onClick={() => switchTab("templates")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-[36px] text-[11px] font-semibold transition-colors border-b-2 ${
            tab === "templates"
              ? "border-accent text-accent"
              : "border-transparent text-fg-2 hover:text-fg-0"
          }`}
        >
          <Icon name="image" size={11} />
          {t("editor.tabTemplates")}
          {templates.length > 0 && (
            <span className="px-1 py-px rounded text-[9px] bg-bg-2 text-fg-3 font-normal mono">
              {templates.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Effects tab ── */}
      {tab === "effects" && (
        <>
          <div className="px-3 pt-[8px] pb-[7px] border-b border-line shrink-0">
            <div className="relative">
              <Icon name="search" size={12} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("editor.searchEffects")}
                className="w-full h-[28px] pl-[26px] pr-[26px] bg-bg-2 border border-line-2 rounded-[6px] text-[11px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent-line transition-colors"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-[7px] top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-0 transition-colors">
                  <Icon name="close" size={10} />
                </button>
              )}
            </div>
          </div>
          <div className="px-3 py-[5px] bg-bg-0 border-b border-line shrink-0 text-[10px] text-fg-3">
            {t("editor.pickEffectHint")} <span className="text-accent font-medium">{t("editor.generate")}</span>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
                <Icon name="sparkles" size={20} className="text-fg-3" />
                <p className="text-[11px] text-fg-2">{t("editor.noEffectsMatch")}</p>
                <p className="text-[10px] text-fg-3 break-all">&ldquo;{search}&rdquo;</p>
              </div>
            )}
            {filtered.map((cat) => {
              const isCollapsed = collapsed.has(cat.title);
              return (
                <div key={cat.title}>
                  <button
                    type="button"
                    onClick={() => toggleCat(cat.title)}
                    className="w-full flex items-center gap-2 px-3 py-[6px] hover:bg-bg-2 transition-colors"
                  >
                    <span className={`text-[9px] font-bold uppercase tracking-[0.8px] flex-1 text-left ${cat.color}`}>{cat.title}</span>
                    <span className="mono text-[9px] text-fg-3">{cat.effects.length}</span>
                    <Icon name="arrowRight" size={9} className={`text-fg-3 transition-transform duration-150 ${isCollapsed ? "rotate-0" : "rotate-90"}`} />
                  </button>
                  {!isCollapsed && (
                    <div className="px-2 pb-2 grid grid-cols-2 gap-[5px]">
                      {cat.effects.map((eff) => {
                        const isApplied = applied === eff.id;
                        return (
                          <button
                            key={eff.id}
                            type="button"
                            title={eff.prompt}
                            onClick={() => apply(eff)}
                            className={`flex flex-col items-center gap-[5px] px-1 py-[10px] rounded-[8px] border text-center transition-all duration-150 ${
                              isApplied
                                ? "bg-accent-soft border-accent-line text-accent"
                                : "bg-bg-1 border-line-2 text-fg-1 hover:border-accent-line hover:bg-accent-soft hover:text-accent"
                            }`}
                          >
                            <Icon name={eff.icon as IconName} size={15} className="shrink-0" />
                            <span className="text-[10px] font-medium leading-tight line-clamp-2 px-1">{eff.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Templates tab ── */}
      {tab === "templates" && (
        <>
          {/* Search + category filter */}
          <div className="px-3 pt-[8px] pb-[7px] border-b border-line shrink-0 flex flex-col gap-[6px]">
            <div className="relative">
              <Icon name="search" size={12} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
              <input
                value={tplSearch}
                onChange={(e) => setTplSearch(e.target.value)}
                placeholder={t("editor.searchTemplates")}
                className="w-full h-[28px] pl-[26px] pr-[26px] bg-bg-2 border border-line-2 rounded-[6px] text-[11px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent-line transition-colors"
              />
              {tplSearch && (
                <button type="button" onClick={() => setTplSearch("")} className="absolute right-[7px] top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-0 transition-colors">
                  <Icon name="close" size={10} />
                </button>
              )}
            </div>
            {tplCategories.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTplCategory("")}
                  className={`px-2 py-[2px] rounded-full text-[10px] font-medium transition-colors ${
                    !activeTplCategory ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 text-fg-2 hover:bg-bg-3"
                  }`}
                >
                  {t("editor.allCategories")}
                </button>
                {tplCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTplCategory(c === activeTplCategory ? "" : c)}
                    className={`px-2 py-[2px] rounded-full text-[10px] font-medium capitalize transition-colors ${
                      activeTplCategory === c ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 text-fg-2 hover:bg-bg-3"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gemini warning */}
          {isGeminiSelected && (
            <div className="mx-2 mt-2 shrink-0 flex items-start gap-1.5 px-2 py-1.5 rounded-[6px] bg-yellow-500/10 border border-yellow-500/25 text-yellow-600 dark:text-yellow-400">
              <Icon name="sparkles" size={11} className="mt-[1px] shrink-0" />
              <p className="text-[9.5px] leading-snug">{t("editor.geminiTemplateWarning")}</p>
            </div>
          )}

          {/* Templates grid */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
                <Icon name="image" size={20} className="text-fg-3" />
                <p className="text-[11px] text-fg-2">{t("editor.noTemplatesAvailable")}</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
                <Icon name="search" size={16} className="text-fg-3" />
                <p className="text-[11px] text-fg-2">{t("editor.noTemplatesMatch")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-[5px]">
                {filteredTemplates.map((tpl) => {
                  const isSelected = selectedTplId === tpl.id;
                  return (
                  <button
                    key={tpl.id}
                    type="button"
                    title={tpl.title}
                    onClick={() => {
                      setSelectedTplId(tpl.id);
                      onApply(`Apply template: ${tpl.title}`, tpl.imageUrl, tpl.prompt);
                      fetch("/api/v1/templates/use", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: tpl.id }),
                      }).catch(() => {});
                    }}
                    className={`group relative rounded-[8px] overflow-hidden border transition-all duration-150 aspect-video bg-bg-2 ${
                      isSelected
                        ? "border-accent ring-1 ring-accent"
                        : "border-line-2 hover:border-accent-line"
                    }`}
                  >
                    <FadeImage src={tpl.imageUrl} alt={tpl.title} className="group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 overflow-hidden">
                      <p className="text-white text-[9px] font-semibold leading-tight whitespace-nowrap group-hover:animate-marquee"
                        style={{ display: "inline-block", minWidth: "100%" }}>
                        {tpl.title}
                      </p>
                    </div>
                    {/* Hover tint */}
                    {!isSelected && <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    {/* Selected overlay */}
                    {isSelected && (
                      <>
                        <div className="absolute inset-0 bg-accent/20" />
                        <div className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center shadow-md">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </>
                    )}
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── EffectsPanel ─────────────────────────────────────────────────────────────

function EffectsPanel({
  onApply,
  categories,
}: {
  onApply: (prompt: string) => void;
  categories: { title: string; color: string; effects: EffectPresetData[] }[];
}) {
  const [applied, setApplied] = useState<string | null>(null);

  function apply(eff: EffectPresetData) {
    setApplied(eff.id);
    onApply(eff.prompt);
    setTimeout(() => setApplied(null), 1200);
  }

  if (categories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
        <Icon name="sparkles" size={24} className="text-fg-3" />
        <p className="text-[12px] text-fg-2">No effects configured.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-3 pt-3 pb-1 text-[11px] text-fg-2">
        Click an effect to fill the prompt, then press <span className="text-fg-0 font-medium">Generate</span>.
      </div>
      {categories.map((cat) => (
        <div key={cat.title} className="px-3 py-3">
          <div className={`text-[10px] font-semibold uppercase tracking-[0.7px] mb-2 ${cat.color}`}>
            {cat.title}
          </div>
          <div className="grid grid-cols-2 gap-[6px]">
            {cat.effects.map((eff) => {
              const active = applied === eff.id;
              return (
                <button
                  key={eff.id}
                  type="button"
                  title={eff.prompt}
                  onClick={() => apply(eff)}
                  className={`group flex items-center gap-[6px] px-[8px] py-[7px] rounded-[8px] border text-left transition-all ${
                    active
                      ? "bg-accent-soft border-accent-line text-accent"
                      : "bg-bg-2 border-line-2 text-fg-1 hover:border-accent-line hover:bg-accent-soft hover:text-accent"
                  }`}
                >
                  <Icon name={eff.icon as IconName} size={14} className="shrink-0" />
                  <span className="text-[11px] font-medium leading-tight truncate">{eff.label}</span>
                  {active && <Icon name="arrowRight" size={10} className="ml-auto text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MobileTemplatesPanel ─────────────────────────────────────────────────────

function MobileTemplatesPanel({
  templates,
  models,
  selectedModelId,
  onApply,
}: {
  templates: { id: string; title: string; imageUrl: string; prompt: string; category: string }[];
  models: ModelOption[];
  selectedModelId: string | null;
  onApply: (prompt: string, tplUrl: string, tplPrompt: string) => void;
}) {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeModelProvider = models.find((m) => m.id === selectedModelId)?.provider
    ?? models.find((m) => m.isDefault)?.provider;
  const isGemini = activeModelProvider === "google";

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))).sort();

  const filtered = templates.filter((tpl) => {
    const matchCat = !activeCategory || tpl.category === activeCategory;
    const matchQ = !search.trim() || tpl.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchCat && matchQ;
  });

  if (templates.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
        <Icon name="image" size={24} className="text-fg-3" />
        <p className="text-[12px] text-fg-2">{t("editor.noTemplatesAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Search */}
      <div className="px-3 pt-2 pb-2 shrink-0 flex flex-col gap-2">
        <div className="relative">
          <Icon name="search" size={12} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("editor.searchTemplates")}
            className="w-full h-[32px] pl-[26px] pr-[26px] bg-bg-2 border border-line-2 rounded-[8px] text-[12px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent-line"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 text-fg-3">
              <Icon name="close" size={11} />
            </button>
          )}
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory("")}
              className={`px-2.5 py-[3px] rounded-full text-[11px] font-medium transition-colors ${
                !activeCategory ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 text-fg-2"
              }`}
            >
              {t("editor.allCategories")}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c === activeCategory ? "" : c)}
                className={`px-2.5 py-[3px] rounded-full text-[11px] font-medium capitalize transition-colors ${
                  activeCategory === c ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 text-fg-2"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Gemini warning */}
        {isGemini && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-[6px] bg-yellow-500/10 border border-yellow-500/25 text-yellow-600 dark:text-yellow-400">
            <Icon name="sparkles" size={11} className="mt-[1px] shrink-0" />
            <p className="text-[10px] leading-snug">{t("editor.geminiTemplateWarning")}</p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Icon name="search" size={18} className="text-fg-3" />
            <p className="text-[12px] text-fg-2">{t("editor.noTemplatesMatch")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((tpl) => {
              const isSelected = selectedId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(tpl.id);
                    onApply(`Apply template: ${tpl.title}`, tpl.imageUrl, tpl.prompt);
                    fetch("/api/v1/templates/use", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: tpl.id }),
                    }).catch(() => {});
                  }}
                  className={`relative rounded-[10px] overflow-hidden border aspect-square bg-bg-2 transition-all ${
                    isSelected ? "border-accent ring-2 ring-accent" : "border-line-2"
                  }`}
                >
                  <FadeImage src={tpl.imageUrl} alt={tpl.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
                    <p className="text-white text-[9px] font-semibold leading-tight line-clamp-2 text-left">{tpl.title}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center shadow">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HistoryContent (extracted from old HistoryPanel) ─────────────────────────

function HistoryContent({
  versions,
  cursor,
  setCursor,
  project,
}: {
  versions: EditVersion[];
  cursor: number;
  setCursor: (c: number) => void;
  project: ProjectData;
}) {
  const { t } = useT();
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex flex-col gap-[6px] relative">
        <div className="absolute left-5 top-[10px] bottom-[10px] w-px bg-line" />
        {versions.map((v, i) => {
          const active = i === cursor;
          const ahead = i > cursor;
          return (
            <button
              key={v.id}
              onClick={() => setCursor(i)}
              className={`relative grid grid-cols-[40px_1fr_auto] gap-[10px] items-center p-[8px_10px] rounded-lg text-left cursor-pointer border ${
                active
                  ? "bg-bg-3 border-accent-line"
                  : "bg-transparent border-transparent hover:bg-bg-2"
              } ${ahead ? "opacity-50" : ""}`}
            >
              <div
                className={`relative w-10 h-8 rounded-[4px] overflow-hidden bg-bg-3 border ${
                  active ? "border-accent-line" : "border-line-2"
                }`}
              >
                <FadeImage
                  src={v.image}
                  // data: URLs (e.g. client-side crop) are already local/instant
                  // and have no DB row, so only remote images get a blur-up LQIP.
                  lqipSrc={
                    v.image.startsWith("data:")
                      ? undefined
                      : `/api/v1/projects/${project.id}/thumb?lqip=1&v=${
                          v.id === "__original__" ? "original" : v.id
                        }`
                  }
                  alt=""
                  sizes="40px"
                  draggable={false}
                />
              </div>
              <div className="min-w-0">
                <div className={`text-[12px] truncate ${active ? "text-fg-0 font-medium" : "text-fg-0"}`}>
                  {i === 0 ? <span className="text-fg-2">{t("editor.originalUpload")}</span> : v.prompt}
                </div>
                <div className="mono text-[10px] text-fg-3 mt-[2px]">
                  v{i} {i > 0 && `· ${formatTime(v.createdAt)}`}
                </div>
              </div>
              {active ? (
                <Badge tone="accent">NOW</Badge>
              ) : ahead ? (
                <Icon name="arrowRight" size={10} className="text-fg-3" />
              ) : null}
            </button>
          );
        })}
      </div>

      {cursor < versions.length - 1 && (
        <div className="mt-4 p-[10px] bg-bg-2 border border-line rounded-md text-[11px] text-fg-2 flex gap-2 items-start">
          <Icon name="info" size={12} className="text-info mt-[1px]" />
          <div>{t("editor.branchWarning")}</div>
        </div>
      )}

      <div className="mt-6">
        <div className="text-[11px] text-fg-2 uppercase tracking-wider mb-2">{t("editor.projectSection")}</div>
        <KV k={t("editor.nameLabel")} v={project.name} />
        <KV k={t("editor.versionsLabel")} v={String(versions.length)} mono />
      </div>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-[5px] text-[12px] border-b border-dashed border-line last:border-0">
      <span className="text-fg-2">{k}</span>
      <span className={`text-fg-0 ${mono ? "mono" : ""}`}>{v}</span>
    </div>
  );
}

function AIGeneratingOverlay() {
  const { t } = useT();
  const AI_MESSAGES = [
    t("editor.aiMsg1"),
    t("editor.aiMsg2"),
    t("editor.aiMsg3"),
    t("editor.aiMsg4"),
    t("editor.aiMsg5"),
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % AI_MESSAGES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const Corner = useCallback(
    ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
      const top = pos.startsWith("t");
      const left = pos.endsWith("l");
      return (
        <div
          className="absolute w-6 h-6"
          style={{
            ...(top ? { top: 14 } : { bottom: 14 }),
            ...(left ? { left: 14 } : { right: 14 }),
            animation: "ai-corner 2s ease-in-out infinite",
            animationDelay: pos === "tl" ? "0s" : pos === "tr" ? "0.5s" : pos === "bl" ? "1s" : "1.5s",
          }}
        >
          <div
            className="absolute"
            style={{
              top: top ? 0 : "auto",
              bottom: top ? "auto" : 0,
              left: left ? 0 : "auto",
              right: left ? "auto" : 0,
              width: 14,
              height: 14,
              borderTop: top ? "2px solid var(--accent)" : "none",
              borderBottom: !top ? "2px solid var(--accent)" : "none",
              borderLeft: left ? "2px solid var(--accent)" : "none",
              borderRight: !left ? "2px solid var(--accent)" : "none",
            }}
          />
        </div>
      );
    },
    [],
  );

  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-sm flex items-center justify-center"
      style={{ background: "rgba(6,8,10,0.78)", backdropFilter: "blur(2px)" }}>

      {/* Animated grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "ai-grid-fade 3s ease-in-out infinite",
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, var(--accent) 30%, rgba(255,255,255,0.9) 50%, var(--accent) 70%, transparent 100%)",
          boxShadow: "0 0 12px 3px var(--accent), 0 0 30px 6px var(--accent-soft)",
          animation: "ai-scan 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
        }}
      />

      {/* Corner brackets */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* Center content */}
      <div className="relative z-30 flex flex-col items-center gap-4 select-none">

        {/* Orb with pulsing rings */}
        <div className="relative flex items-center justify-center w-14 h-14">
          {/* Pulse rings */}
          <div
            className="absolute w-10 h-10 rounded-full border border-accent"
            style={{ animation: "ai-ring 2s ease-out infinite" }}
          />
          <div
            className="absolute w-10 h-10 rounded-full border border-accent"
            style={{ animation: "ai-ring 2s ease-out infinite", animationDelay: "0.7s" }}
          />
          <div
            className="absolute w-10 h-10 rounded-full border border-accent"
            style={{ animation: "ai-ring2 2s ease-out infinite", animationDelay: "1.4s" }}
          />
          {/* Core orb */}
          <div
            className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), var(--accent) 60%, var(--accent-soft))",
              animation: "ai-orb-pulse 1.8s ease-in-out infinite",
              boxShadow: "0 0 20px 4px var(--accent-soft), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            {/* Sparkle icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3L13.5 8.5H19L14.5 12L16 17.5L12 14L8 17.5L9.5 12L5 8.5H10.5L12 3Z" />
            </svg>
          </div>
        </div>

        {/* Status text */}
        <div className="flex flex-col items-center gap-1">
          <div
            key={msgIdx}
            className="mono text-[13px] font-medium text-white"
            style={{ animation: "ai-msg-in 0.35s ease-out both" }}
          >
            {AI_MESSAGES[msgIdx]}
          </div>
          {/* Animated dots */}
          <div className="flex gap-[5px] mt-[2px]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[5px] h-[5px] rounded-full bg-accent"
                style={{
                  animation: "ai-dot 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.22}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--accent), #fff)",
              animation: "ai-bar 60s linear forwards",
              boxShadow: "0 0 6px 1px var(--accent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
