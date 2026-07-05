'use client';

import { useEffect, useRef, useState } from 'react';

type PortalUiPreviewProps = {
  src: string;
  /** Intrinsic iframe document width before scale. */
  width: number;
  /** Intrinsic iframe document height before scale. */
  height: number;
  title: string;
  className?: string;
};

export function PortalUiPreview({
  src,
  width,
  height,
  title,
  className = '',
}: PortalUiPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateScale = () => {
      const { width: containerWidth, height: containerHeight } = node.getBoundingClientRect();
      if (containerWidth <= 0 || containerHeight <= 0) return;
      setScale(Math.min(containerWidth / width, containerHeight / height));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-neutral-100 ${className}`}
      aria-hidden
    >
      <iframe
        src={src}
        title={title}
        tabIndex={-1}
        loading="eager"
        className="pointer-events-none absolute left-0 top-0 border-0"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
