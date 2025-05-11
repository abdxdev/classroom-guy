import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import domtoimage from 'dom-to-image'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const handleExport = async (captureRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
  if (!captureRef.current) return;
  const element = captureRef.current;
  
  try {

    const options = {
      width: element.clientWidth,
      height: element.clientWidth,
      style: {
        'transform': 'none',
        'width': `${element.clientWidth}px`,
        'height': `${element.clientWidth}px`
      }
    };
    
    const dataUrl = await domtoimage.toPng(element, options);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
  }
};