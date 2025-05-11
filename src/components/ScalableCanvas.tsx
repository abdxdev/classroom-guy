"use client";
import React, { useRef, useState, useEffect, RefObject } from 'react';

const ScalableCanvas: React.FC<{
  captureRef: RefObject<HTMLDivElement | null>;
  width?: number | string;
  height?: number | string;
  children: React.ReactNode;
}> = ({ captureRef, width = '100%', height = '100%', children }) => {
  const [scale, setScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scaleContent = () => {
      if (!contentRef.current || !captureRef.current) return;
      const tempDiv = contentRef.current.cloneNode(true) as HTMLElement;
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.transform = 'none';
      tempDiv.style.width = 'auto';
      tempDiv.style.height = 'auto';
      document.body.appendChild(tempDiv);
      const contentHeight = tempDiv.scrollHeight;
      const contentWidth = tempDiv.scrollWidth;
      const containerHeight = captureRef.current.clientHeight;
      const containerWidth = captureRef.current.clientWidth;
      document.body.removeChild(tempDiv);
      const heightRatio = containerHeight / contentHeight;
      const widthRatio = containerWidth / contentWidth;
      const newScale = Math.min(heightRatio, widthRatio) * 0.9;
      const limitedScale = Math.min(Math.max(newScale, 0.1), 3);
      setScale(limitedScale);
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
      }}
    >
      <div
        ref={contentRef}
        className="p-4"
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          display: 'inline-block',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScalableCanvas;