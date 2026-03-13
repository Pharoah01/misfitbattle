/**
 * Live Preview Component
 * Renders HTML/CSS in a sandboxed iframe
 */

import React, { useEffect, useRef } from 'react';

interface LivePreviewProps {
  htmlCode: string;
  cssCode: string;
  className?: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ htmlCode, cssCode, className = '' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const previewHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 100%;
              height: 100vh;
              overflow: hidden;
            }
            ${cssCode}
          </style>
        </head>
        <body>
          ${htmlCode}
        </body>
      </html>
    `;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHTML);
        iframeDoc.close();
      }
    } catch (error) {
    }
  }, [htmlCode, cssCode]);

  return (
    <div className={`relative w-full h-full rounded-lg overflow-hidden border border-dark-border ${className}`}>
      <iframe
        ref={iframeRef}
        title="Live Preview"
        sandbox="allow-same-origin"
        className="w-full h-full border-0 bg-white"
        style={{ backgroundColor: '#FFFFFF' }}
      />
    </div>
  );
};
