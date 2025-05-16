import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import domtoimage from 'dom-to-image'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ExportOptions {
  width: number;
  height: number;
  style: {
    transform: string;
    width: string;
    height: string;
  };
}

export const handleExport = async (
  captureRef: React.RefObject<HTMLDivElement | null>, 
  filename: string
): Promise<boolean> => {
  if (!captureRef.current) {
    console.error('Export failed: No element reference provided');
    return false;
  }
  
  const element = captureRef.current;
  
  try {
    const options: ExportOptions = {
      width: element.clientWidth,
      height: element.clientHeight,
      style: {
        transform: 'none',
        width: `${element.clientWidth}px`,
        height: `${element.clientHeight}px`
      }
    };
    
    const dataUrl = await domtoimage.toPng(element, options);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (error) {
    console.error('Error exporting image:', error);
    return false;
  }
};

export function modifyString(str: string, replace: Record<string, string | number>) {
  return str.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmedKey = key.trim();
    return replace[trimmedKey] !== undefined ? replace[trimmedKey].toString() : `{{${trimmedKey}}}`;
  });
}