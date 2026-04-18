import { useEffect, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, X, Download, ExternalLink, Maximize2, Play, Pause, Timer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface LightboxItem {
  id: string;
  url: string;
  tipo: "foto" | "video" | string;
  descricao?: string | null;
}

interface Props {
  items: LightboxItem[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

const MediaLightbox = ({ items, startIndex, open, onClose }: Props) => {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showThumbs, setShowThumbs] = useState(true);
  const [slideshow, setSlideshow] = useState(false);
  const [slideInterval, setSlideInterval] = useState(3000);
  const dragRef = useRef<{ startX: number; startY: number; px: number; py: number } | null>(null);

  useEffect(() => { if (open) { setIndex(startIndex); setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); setSlideshow(false); } }, [open, startIndex]);

  const current = items[index];

  const next = useCallback(() => {
    setIndex(i => (i + 1) % items.length);
    setZoom(1); setRotation(0); setPan({ x: 0, y: 0 });
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + items.length) % items.length);
    setZoom(1); setRotation(0); setPan({ x: 0, y: 0 });
  }, [items.length]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 5));
      else if (e.key === "-") setZoom(z => Math.max(z - 0.25, 0.5));
      else if (e.key.toLowerCase() === "r") setRotation(r => (r + 90) % 360);
      else if (e.key === " ") { e.preventDefault(); setSlideshow(s => !s); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, next, prev, onClose]);

  // Slideshow timer (auto-advance) — pauses on videos, lets them play
  useEffect(() => {
    if (!open || !slideshow || items.length < 2) return;
    if (current?.tipo === "video") return; // video plays naturally; user can advance
    const t = setTimeout(() => next(), slideInterval);
    return () => clearTimeout(t);
  }, [slideshow, slideInterval, index, open, items.length, current?.tipo, next]);

  const handleDownload = () => {
    if (!current) return;
    const a = document.createElement("a");
    a.href = current.url;
    a.download = current.descricao || `media-${current.id}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFullscreen = () => {
    const el = document.getElementById("lightbox-stage");
    if (el?.requestFullscreen) el.requestFullscreen();
  };

  // Pan with mouse drag (when zoomed)
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1 || current?.tipo !== "foto") return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.px + (e.clientX - dragRef.current.startX), y: dragRef.current.py + (e.clientY - dragRef.current.startY) });
  };
  const onMouseUp = () => { dragRef.current = null; };

  // Wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    if (current?.tipo !== "foto") return;
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(5, z - e.deltaY * 0.002)));
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 gap-0 bg-black/95 border-0 [&>button]:hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white text-sm flex items-center gap-3">
            <span className="font-medium">{index + 1} / {items.length}</span>
            {current.descricao && <span className="text-white/70 truncate max-w-md">{current.descricao}</span>}
          </div>
          <div className="flex items-center gap-1">
            {current.tipo === "foto" && (
              <>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} title="Diminuir zoom">
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <span className="text-white/80 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.min(z + 0.25, 5))} title="Aumentar zoom">
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotacionar">
                  <RotateCw className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleFullscreen} title="Tela cheia">
              <Maximize2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => window.open(current.url, "_blank")} title="Abrir em nova aba">
              <ExternalLink className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleDownload} title="Baixar">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose} title="Fechar">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stage */}
        <div
          id="lightbox-stage"
          className="relative flex-1 flex items-center justify-center overflow-hidden select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          style={{ cursor: zoom > 1 && current.tipo === "foto" ? (dragRef.current ? "grabbing" : "grab") : "default" }}
        >
          {current.tipo === "foto" ? (
            <img
              src={current.url}
              alt={current.descricao || ""}
              draggable={false}
              className="max-w-full max-h-full object-contain transition-transform duration-150 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            />
          ) : (
            <video
              key={current.id}
              src={current.url}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          )}

          {/* Nav arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {items.length > 1 && showThumbs && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-3 px-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
              {items.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => { setIndex(i); setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); }}
                  className={cn(
                    "relative shrink-0 h-14 w-20 rounded overflow-hidden border-2 transition-all",
                    i === index ? "border-white scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  {m.tipo === "foto" ? (
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <Play className="h-4 w-4 text-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaLightbox;
