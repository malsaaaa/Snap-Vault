import React, { useState, useEffect } from 'react';

export function getSnapUrl(filePath) {
  if (!filePath) return '';
  return `snap://media/?path=${encodeURIComponent(filePath)}`;
}

export default function SmartImage({
  filePath,
  alt,
  className,
  style,
  loading = 'lazy',
  onLoad
}) {
  const [src, setSrc] = useState(() => getSnapUrl(filePath));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(getSnapUrl(filePath));
    setFailed(false);
  }, [filePath]);

  const handleError = async () => {
    if (!failed && window.snapAPI?.readDataUrl) {
      setFailed(true);
      try {
        const dataUrl = await window.snapAPI.readDataUrl(filePath);
        if (dataUrl) {
          setSrc(dataUrl);
        }
      } catch (err) {
        console.error('Failed to load image fallback:', err);
      }
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}
