import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import domtoimage from 'dom-to-image'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const handleExport = async (captureRef: React.RefObject<HTMLDivElement | null>) => {
  if (!captureRef.current) return;
  const element = captureRef.current;

  try {
    const dataUrl = await domtoimage.toPng(element);

    const link = document.createElement('a');
    link.download = 'component.png';
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
  }
};