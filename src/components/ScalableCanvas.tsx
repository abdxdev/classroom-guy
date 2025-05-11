"use client";
import React, { useRef, useState, useLayoutEffect, RefObject } from 'react';

const ScalableCanvas: React.FC<{
  captureRef: RefObject<HTMLDivElement | null>;
  width?: number | string;
  height?: number | string;
  children: React.ReactNode;
  className?: string;
}> = ({ captureRef, width = '100%', height = '100%', children, className }) => {
  const [scale, setScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scaleContent = () => {
      if (!contentRef.current || !captureRef.current) return;
      const el = contentRef.current;
      const prev = el.style.transform;
      el.style.transform = 'none';
      const contentWidth = el.scrollWidth;
      const contentHeight = el.scrollHeight;
      el.style.transform = prev;
      const containerWidth = captureRef.current.clientWidth;
      const containerHeight = captureRef.current.clientHeight;
      const ratio = Math.min(containerWidth / contentWidth, containerHeight / contentHeight);
      setScale(ratio);
    };
    scaleContent();
    window.addEventListener('resize', scaleContent);
    return () => window.removeEventListener('resize', scaleContent);
  }, [children, captureRef]);

  return (
    <div
      ref={captureRef}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className={`relative ${className}`}
    >
      <div
        ref={contentRef}
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScalableCanvas;