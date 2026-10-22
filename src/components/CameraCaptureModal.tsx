import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Image as ImageIcon, SwitchCamera, RotateCcw } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (fileOrDataUrl: string, isFrontCamera?: boolean) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isOpeningRef = useRef(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // Stop current video stream cleanly and release hardware
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch (e) {
            console.warn('Track stop error:', e);
          }
        });
      } catch (e) {
        console.warn('Stream cleanup error:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        console.warn('Video element pause error:', e);
      }
    }
  }, []);

  // Start video stream targeting desired camera
  const startCamera = useCallback(async (desiredMode: 'environment' | 'user' = 'environment') => {
    if (isOpeningRef.current) return;
    isOpeningRef.current = true;

    // First stop any lingering stream
    stopStream();
    setIsInitializing(true);
    setErrorMessage(null);

    // Give browser media hardware 120ms to completely release hardware lock
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage('Camera access is not supported by this browser. Use the photo button below.');
      setIsInitializing(false);
      isOpeningRef.current = false;
      return;
    }

    try {
      let stream: MediaStream;

      // Primary constraint: ideal facingMode and resolution
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: desiredMode === 'environment' ? { ideal: 'environment' } : { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (idealErr) {
        console.warn('Ideal constraints failed, trying basic facingMode:', idealErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: desiredMode },
            audio: false,
          });
        } catch (modeErr) {
          console.warn('FacingMode failed, trying generic video constraint:', modeErr);
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.defaultMuted = true;

        // Explicitly trigger play immediately
        try {
          await video.play();
          setIsInitializing(false);
          setHasPermission(true);
        } catch (playErr) {
          console.warn('Direct video.play() error, will wait for event:', playErr);
        }

        const handleReady = () => {
          video.play().catch(() => {});
          setIsInitializing(false);
          setHasPermission(true);
        };

        video.onloadedmetadata = handleReady;
        video.oncanplay = handleReady;
        video.onplaying = () => {
          setIsInitializing(false);
          setHasPermission(true);
        };

        // Safety fallback timer to prevent permanent spinner
        setTimeout(() => {
          if (stream.active && videoRef.current) {
            videoRef.current.play().catch(() => {});
            setIsInitializing(false);
            setHasPermission(true);
          }
        }, 1200);
      }
    } catch (err: any) {
      console.warn('Live camera access error:', err);
      setHasPermission(false);
      setIsInitializing(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was blocked. Tap below to snap with your phone camera app.');
      } else {
        setErrorMessage('Could not open camera. Tap "Restart Camera" or use your phone camera app.');
      }
    } finally {
      isOpeningRef.current = false;
    }
  }, [stopStream]);

  // When modal opens, initialize back camera
  useEffect(() => {
    if (isOpen) {
      setFacingMode('environment');
      startCamera('environment');
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Flip camera between back (environment) and front (user)
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from the live video feed
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const isFront = facingMode === 'user';

    setIsFlashing(true);
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        
        stopStream();
        setIsFlashing(false);
        onCapture(dataUrl, isFront);
        onClose();
      } catch (err) {
        console.error('Error capturing snapshot:', err);
        setIsFlashing(false);
      }
    }, 80);
  };

  // Direct phone camera capture fallback
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          stopStream();
          onCapture(reader.result as string, false);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-stone-900 border-b border-stone-800 z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
              {facingMode === 'environment' ? '📷 Back Camera (Pot & Pan)' : '🤳 Front Camera (Selfie)'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Restart Camera button */}
            <button
              onClick={() => startCamera(facingMode)}
              className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition active:scale-95 cursor-pointer"
              title="Restart camera stream"
            >
              <RotateCcw className="w-4 h-4 text-stone-300" />
            </button>

            {/* Flip camera button */}
            <button
              onClick={toggleCameraFacing}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-xl flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
              title="Flip between front and back camera"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Flip Camera</span>
            </button>

            <button
              onClick={() => {
                stopStream();
                onClose();
              }}
              className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition cursor-pointer"
              aria-label="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 min-h-[350px] bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isInitializing ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* Simple framing guide for non-chefs */}
          {!isInitializing && hasPermission && (
            <div className="absolute inset-8 pointer-events-none border-2 border-white/40 rounded-2xl flex flex-col justify-between p-3">
              <div className={`text-center text-xs font-semibold py-1.5 px-3.5 rounded-full mx-auto backdrop-blur-xs shadow-xs ${
                facingMode === 'environment' ? 'text-white/95 bg-black/60' : 'text-amber-100 bg-amber-900/80 border border-amber-500/50'
              }`}>
                {facingMode === 'environment' ? 'Aim phone at your pot or pan' : '🤳 Selfie Mode — flip camera to scan your cooking pan'}
              </div>
              <div className="text-center text-[11px] text-white/80 bg-black/40 py-1 px-3 rounded-full mx-auto backdrop-blur-xs">
                Tap the big shutter button below to snap
              </div>
            </div>
          )}

          {/* Initializing Spinner */}
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-stone-300 z-20">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-semibold">Opening {facingMode === 'environment' ? 'back' : 'front'} camera...</p>
              <p className="text-xs text-stone-500 mt-1">Getting ready to inspect your food</p>
            </div>
          )}

          {/* Camera Shutter Flash Effect */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-30 transition-opacity duration-100" />
          )}

          {/* Fallback Screen when permission denied or unavailable */}
          {!isInitializing && hasPermission === false && (
            <div className="p-6 text-center flex flex-col items-center justify-center space-y-4 z-20">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-white text-base font-bold">Camera Connection Issue</h3>
                <p className="text-stone-300 text-xs leading-relaxed max-w-xs mx-auto">
                  {errorMessage || 'Could not access camera.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>Retry Camera Stream</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition active:scale-[0.98] cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo with Phone App</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden native input with capture="environment" for native phone back-camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeFileChange}
        />

        {/* Bottom Control Bar */}
        <div className="px-6 py-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between">
          {/* Flip Camera button */}
          <button
            onClick={toggleCameraFacing}
            className="p-3 rounded-2xl text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-800 transition active:scale-95 flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
            title="Flip camera"
          >
            <SwitchCamera className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] text-stone-400">Flip</span>
          </button>

          {/* Shutter Button */}
          {hasPermission ? (
            <button
              onClick={takeSnapshot}
              disabled={isInitializing}
              className={`relative p-1 rounded-full bg-white/20 active:scale-95 transition cursor-pointer ${
                isInitializing ? 'opacity-40 cursor-not-allowed' : 'opacity-100'
              }`}
              aria-label="Snap Photo"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-stone-100 transition">
                <div className="w-14 h-14 rounded-full border-2 border-stone-900 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-[#D9381E]"></div>
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => startCamera(facingMode)}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center space-x-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Camera</span>
            </button>
          )}

          {/* Choose from Library button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-800 transition active:scale-95 flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
            title="Choose from photo library"
          >
            <ImageIcon className="w-5 h-5 text-stone-300" />
            <span className="text-[10px] text-stone-400">Photos</span>
          </button>
        </div>

      </div>
    </div>
  );
};
