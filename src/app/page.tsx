"use client";
import React, { useRef } from 'react';
import domtoimage from 'dom-to-image-more';
import ScalableCanvas from '../components/ScalableCanvas';

interface Item {
  id: number;
  title: string;
  description: string;
}

const items: Item[] = [
  { id: 4, title: 'Item 4', description: 'Description 4' },
  { id: 5, title: 'Item 5', description: 'Description 5' },
  { id: 5, title: 'Item 5', description: 'Description 5' },
  { id: 5, title: 'Item 5', description: 'Description 5' },
  { id: 5, title: 'Item 5', description: 'Description 5' },
];

const frameSize = 640;

export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!captureRef.current) return;
    const element = captureRef.current;
    const { width, height } = element.getBoundingClientRect();
    try {
      const dataUrl = await domtoimage.toPng(element, {
        width,
        height,
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

    <div className="mt-8 flex flex-col items-center">
      <ScalableCanvas captureRef={captureRef} width={frameSize} height={frameSize}>
        <div className='flex flex-col items-center justify-center w-full h-full p-4 bg-gray-100'>
          {items.map((item: Item) => (
            <div key={item.id} className="border border-gray-300 p-3 rounded bg-white">
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </ScalableCanvas>
      <button onClick={handleExport} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Export as PNG
      </button>
    </div>
  );
}
