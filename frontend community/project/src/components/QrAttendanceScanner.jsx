import { useEffect, useRef } from 'react';

export default function QrAttendanceScanner({ onScan, onError }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let active = true;
    let controls;

    import('@zxing/browser').then(({ BrowserMultiFormatReader }) => {
      if (!active) return;
      const reader = new BrowserMultiFormatReader();
      return reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, scannerControls) => {
        if (!result || !active) return;
        active = false;
        scannerControls.stop();
        onScan(result.getText());
      }).then((startedControls) => {
        controls = startedControls;
        if (!active) controls.stop();
      });
    }).catch((error) => {
      if (active) {
        active = false;
        onError(error);
      }
    });

    return () => {
      active = false;
      controls?.stop();
    };
  }, [onError, onScan]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="aspect-video w-full rounded-2xl bg-slate-950 object-cover"
    />
  );
}
