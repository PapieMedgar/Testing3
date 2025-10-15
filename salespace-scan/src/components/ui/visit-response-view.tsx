import React from 'react';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';

interface ResponseValue {
  [key: string]: string | number | boolean | null | undefined | ResponseValue | Array<string | number> | Record<string, unknown>;
}

interface VisitResponseViewProps {
  title: string;
  data: ResponseValue;
  level?: number;
}

const formatKey = (key: string) => {
  return key
    .split(/(?=[A-Z])|_/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatValue = (value: ResponseValue[keyof ResponseValue], level: number): React.ReactNode => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    // Check if it's a base64 image
    if (value.startsWith('data:image')) {
      return <img src={value} alt="Visit" className="max-w-md rounded-lg shadow-sm cursor-pointer" onClick={() => window.open(value, '_blank')} />;
    }
    // Check if it's an image URL
    if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <img src={value} alt="Visit" className="max-w-md rounded-lg shadow-sm cursor-pointer" onClick={() => window.open(value, '_blank')} />;
    }
    return value || 'N/A';
  }
  
  // Handle array of images
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    // Check if array contains image URLs or base64 images
    if (value[0].startsWith('data:image') || value[0].match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {value.map((img, index) => (
            <img 
              key={index} 
              src={img} 
              alt={`Visit ${index + 1}`} 
              className="max-w-full rounded-lg shadow-sm cursor-pointer" 
              onClick={() => window.open(img, '_blank')}
            />
          ))}
        </div>
      );
    }
    return value.join(', ');
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return <NestedObject data={value as ResponseValue} level={level + 1} />;
  }
  return String(value);
};

const NestedObject = ({ data, level = 0 }: { data: ResponseValue; level: number }) => {
  if (!data || Object.keys(data).length === 0) return <span className="text-gray-500">No data</span>;

  return (
    <div className="grid gap-1">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <div className="font-medium text-sm text-gray-700 w-1/3">{formatKey(key)}:</div>
          <div className="text-gray-600 flex-1">
            {formatValue(value as ResponseValue[keyof ResponseValue], level)}
          </div>
        </div>
      ))}
    </div>
  );
};

export const VisitResponseView: React.FC<VisitResponseViewProps> = ({
  title,
  data,
  level = 0
}) => {
  return (
    <div className="space-y-1">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
      )}
      <div className="text-sm">
        <NestedObject data={data} level={level} />
      </div>
    </div>
  );
};
