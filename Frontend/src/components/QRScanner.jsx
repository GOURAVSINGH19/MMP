import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * QRScanner Component using html5-qrcode library
 * @param {Function} onScanSuccess - Triggered on successful QR capture
 * @param {Function} onScanError - (Optional) Triggered on capture errors
 */
export default function QRScanner({ onScanSuccess, onScanError }) {
  useEffect(() => {
    // Component Mount: Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      'mmp-qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success callback
        onScanSuccess(decodedText);
      },
      (error) => {
        // Error callback (optional, ignore to prevent console flooding)
        if (onScanError) {
          onScanError(error);
        }
      }
    );

    // Component Unmount: Clean up scanner resources
    return () => {
      scanner.clear().catch((err) => {
        console.error('❌ Failed to clear html5-qrcode scanner instances:', err);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-black shadow-inner relative">
      <div id="mmp-qr-reader" className="w-full" />
    </div>
  );
}
