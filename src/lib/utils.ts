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

export async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: RequestInit
): Promise<T> {
  let baseUrl = '';
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  } else {
    baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(normalizedEndpoint, baseUrl);

  if ((!options?.method || options.method === 'GET') && params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const fetchOptions: RequestInit = {
    ...options,
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
  };

  if (params && options?.method && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(params);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
