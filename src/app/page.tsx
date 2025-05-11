"use client";
import React, { useRef } from 'react';
import domtoimage from 'dom-to-image';
import ScalableCanvas from '@/components/ScalableCanvas';

const frameSize = 640;

export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!captureRef.current) return;
    const element = captureRef.current;
    try {
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = 'component.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <ScalableCanvas
        captureRef={captureRef}
        width={frameSize}
        height={frameSize}
        className='bg-amber-100'
      >
        <div 
          className='flex flex-col w-full h-full p-4 bg-gray-100'
        >
          <div className="border border-gray-300 p-3 rounded bg-white">
            <h3 className="font-bold mb-1">Item</h3>
            <p>description</p>
            <p>Additional information about the item.</p>
          </div>
          <div className="border border-gray-300 p-3 rounded bg-white">
            <h3 className="font-bold mb-1">Item</h3>
            <p>description</p>
            <p>Additional information about the item.</p>
          </div>
          <div className="border border-gray-300 p-3 rounded bg-white">
            <h3 className="font-bold mb-1">Item</h3>
            <p>description</p>
            <p>Additional information about the item.</p>
          </div>
          <div className="border border-gray-300 p-3 rounded bg-white">
            <h3 className="font-bold mb-1">Item</h3>
            <p>description</p>
            <p>Additional information about the item.</p>
          </div>
          <div className="border border-gray-300 p-3 rounded bg-white">
            <h3 className="font-bold mb-1">Item</h3>
            <p>description</p>
            <p>Additional information about the item.</p>
          </div>
        </div>
      </ScalableCanvas>
      <button onClick={handleExport} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Export as PNG
      </button>
    </div>
  );
}
