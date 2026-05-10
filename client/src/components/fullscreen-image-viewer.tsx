import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

interface FullscreenImageViewerProps {
  imageUrl: string;
  altText?: string;
  isOpen: boolean;
  onClose: () => void;
  fallbackCategory?: string;
  title?: string;
  description?: string;
  year?: string;
  medium?: string;
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  
  return (
    <div 
      className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-50"
      data-testid="zoom-controls"
    >
      <button
        onClick={() => zoomOut()}
        className="text-white bg-black/60 hover:bg-black/80 p-3 rounded-full transition-colors backdrop-blur-sm"
        aria-label="Zoom out"
        data-testid="button-zoom-out"
      >
        <ZoomOut size={20} />
      </button>
      <button
        onClick={() => resetTransform()}
        className="text-white bg-black/60 hover:bg-black/80 p-3 rounded-full transition-colors backdrop-blur-sm"
        aria-label="Reset zoom"
        data-testid="button-zoom-reset"
      >
        <RotateCcw size={20} />
      </button>
      <button
        onClick={() => zoomIn()}
        className="text-white bg-black/60 hover:bg-black/80 p-3 rounded-full transition-colors backdrop-blur-sm"
        aria-label="Zoom in"
        data-testid="button-zoom-in"
      >
        <ZoomIn size={20} />
      </button>
    </div>
  );
}

export default function FullscreenImageViewer({
  imageUrl,
  altText = "Artwork image",
  isOpen,
  onClose,
  fallbackCategory,
  title,
  year,
  medium
}: FullscreenImageViewerProps) {
  const [key, setKey] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      setKey(prev => prev + 1);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-screen-xl w-screen h-screen max-h-screen p-0 bg-black/95 flex flex-col"
        data-testid="fullscreen-image-dialog"
      >
        <DialogTitle className="sr-only">{title || "Artwork Image"}</DialogTitle>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors z-50"
          aria-label="Close fullscreen view"
          data-testid="button-close-fullscreen"
        >
          <X size={24} />
        </button>
        
        <div className="flex-grow flex items-center justify-center overflow-hidden touch-none">
          <TransformWrapper
            key={key}
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            doubleClick={{ mode: "toggle", step: 2 }}
            panning={{ velocityDisabled: false }}
            limitToBounds={false}
          >
            <ZoomControls />
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
              }}
              contentStyle={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={imageUrl}
                alt={altText}
                className="max-h-[75vh] max-w-[95vw] object-contain select-none"
                draggable={false}
                data-testid="fullscreen-image"
                onError={(e) => {
                  console.error("Fullscreen image failed to load:", imageUrl);
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `/fallback-${fallbackCategory}.svg`;
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
        
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-xs text-center px-4 z-40">
          Pinch to zoom • Double-tap to toggle zoom • Drag to pan
        </div>
        
        {(title || medium || year) && (
          <div className="w-full bg-white/10 backdrop-blur-md text-white p-3 rounded-t-lg">
            {title && <h3 className="text-lg font-serif mb-1">{title}</h3>}
            {(medium || year) && (
              <p className="text-xs text-white/80">
                {medium}{medium && year ? `, ${year}` : year}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
