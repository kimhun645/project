import { useEffect, useRef, useState } from 'react';

interface UseBarcodeScannerOptions {
  onScan?: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  timeout?: number;
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  timeout = 100
}: UseBarcodeScannerOptions = {}) {
  const [scannerDetected, setScannerDetected] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const scannerInputRef = useRef<string>('');
  const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for scanner input
      const isEnter = event.key === 'Enter';
      const isValidChar = /^[a-zA-Z0-9\-_./\s]$/.test(event.key);
      
      if (isValidChar || isEnter) {
        // Clear existing timeout
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }

        if (isEnter) {
          // Process the accumulated input
          if (scannerInputRef.current.length >= minLength) {
            const scannedCode = scannerInputRef.current.trim();
            setScannerDetected(true);
            setLastScannedCode(scannedCode);
            
            // Call the callback if provided
            if (onScan) {
              onScan(scannedCode);
            }
            
            // Reset scanner detection after 3 seconds
            setTimeout(() => setScannerDetected(false), 3000);
          }
          
          // Reset the input buffer
          scannerInputRef.current = '';
        } else {
          // Accumulate characters
          scannerInputRef.current += event.key;
          
          // Set timeout to reset buffer if typing is too slow (human typing)
          scannerTimeoutRef.current = setTimeout(() => {
            scannerInputRef.current = '';
          }, timeout);
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [enabled, onScan, minLength, timeout]);

  const resetScanner = () => {
    scannerInputRef.current = '';
    setScannerDetected(false);
    setLastScannedCode('');
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
    }
  };

  return {
    scannerDetected,
    lastScannedCode,
    resetScanner
  };
}
