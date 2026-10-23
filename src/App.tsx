import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Flame,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  ChefHat,
  ArrowRight,
  RefreshCw,
  UtensilsCrossed,
  ShieldCheck,
  Mic,
  Award,
  Check,
} from 'lucide-react';
import { RescueResponse, ConversationMessage, SampleMishap } from './types';
import { compressImage, CompressionResult } from './utils/imageCompressor';
import { useVoiceDictation } from './utils/useVoiceDictation';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { RescueResultsView } from './components/RescueResultsView';
import { FunMascot } from './components/FunMascot';

import { SAMPLE_MISHAPS } from './data/sampleMishaps';

const SHARED_APP_URL = 'https://ais-pre-gncui5dtvv33az5clweulj-279845690615.us-west1.run.app';

export default function App() {
  // Input states
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>('image/jpeg');
  const [compressionInfo, setCompressionInfo] = useState<{ origKB: number; compKB: number } | null>(null);

  const [dishName, setDishName] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedIssueCategory, setSelectedIssueCategory] = useState<string | null>(null);
  const [isSampleScenario, setIsSampleScenario] = useState(false);

  // Flow & AI states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'analyzing' | 'troubleshooting' | 'planning'>('analyzing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<RescueResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Modals & inputs
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const [customCameraCallback, setCustomCameraCallback] = useState<((dataUrl: string) => void) | null>(null);
  const [isFrontCameraCapture, setIsFrontCameraCapture] = useState(false);
  const [isSelfieDetectedInClient, setIsSelfieDetectedInClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenLiveCamera = (callback?: (dataUrl: string) => void) => {
    if (callback) {
      setCustomCameraCallback(() => callback);
    } else {
      setCustomCameraCallback(null);
    }
    setIsCameraModalOpen(true);
  };

  // Hands-free microphone voice dictation
  const { isListening, isSupported: isVoiceSupported, toggleListening } = useVoiceDictation({
    onTranscript: (text) => {
      setProblemDescription(text);
    },
    onError: (err) => {
      setErrorMessage(err);
    },
  });

  // Clean, focused issue chips with warm culinary accents
  const issueOptions = [
    { label: 'Separated sauce', query: 'The sauce broke into oil with grainy curdled clumps', emoji: '🧈' },
    { label: 'Garlic burning', query: 'Garlic is catching and turning dark black on the bottom', emoji: '🧄' },
    { label: 'Too salty', query: 'I added too much salt and the sauce/broth is overwhelmingly salty', emoji: '🧂' },
    { label: 'Watery / boiling', query: 'Food is pooling in water and steaming instead of getting crispy', emoji: '💧' },
    { label: 'Raw inside', query: 'Outside looks browned, but inside is still raw and pink', emoji: '🍗' },
  ];

  // Handle image compression when a photo is selected
  const handleProcessImage = async (fileOrDataUrl: File | string, isFront = false, isSample = false) => {
    try {
      setIsFrontCameraCapture(isFront);
      setIsSampleScenario(isSample);
      setIsLoading(true);
      setLoadingPhase('analyzing');
      const compressed: CompressionResult = await compressImage(fileOrDataUrl, 960, 960, 0.72);
      setPhotoDataUrl(compressed.dataUrl);
      setPhotoBase64(compressed.base64);
      setPhotoMimeType(compressed.mimeType);
      setCompressionInfo({
        origKB: compressed.originalSizeKB,
        compKB: compressed.compressedSizeKB,
      });

      // Browser-native FaceDetector check if available
      let faceDetected = false;
      if (!isSample && typeof window !== 'undefined' && 'FaceDetector' in window) {
        try {
          const img = new Image();
          img.src = compressed.dataUrl;
          await new Promise((resolve) => {
            if (img.complete) resolve(null);
            else img.onload = () => resolve(null);
          });
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
          const faces = await detector.detect(img);
          if (faces && faces.length > 0) {
            faceDetected = true;
          }
        } catch {
          // ignore detector error
        }
      }
      setIsSelfieDetectedInClient(faceDetected);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Image processing failed:', err);
      setErrorMessage('Failed to process photo. Please try uploading another image.');
      setIsLoading(false);
    }
  };

  // Handle native file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImage(file, false, false);
      e.target.value = '';
    }
  };

  const [activeSampleLoadingId, setActiveSampleLoadingId] = useState<string | null>(null);

  // Select a preset mishap with real photographic food and auto-validation
  const handleSelectSampleMishap = async (sample: SampleMishap) => {
    setActiveSampleLoadingId(sample.id);
    setIsSampleScenario(true);
    setDishName(sample.foodName);
    setProblemDescription(sample.description);
    setSelectedIssueCategory(sample.category);
    setPhotoDataUrl(sample.previewImage);
    const cleanB64 = sample.previewImage.includes('base64,')
      ? sample.previewImage.split('base64,')[1]
      : sample.previewImage;
    setPhotoBase64(cleanB64);
    setPhotoMimeType('image/jpeg');
    setErrorMessage(null);

    // Directly trigger rescue request with this scenario's verified payload
    await handleRescueSubmit(undefined, {
      imageBase64: cleanB64,
      mimeType: 'image/jpeg',
      problemDescription: sample.description,
      issueCategory: sample.category,
      dishName: sample.foodName,
      isFrontCamera: false,
      isSelfieDetected: false,
      isSampleScenario: true,
    });
    setActiveSampleLoadingId(null);
  };

  interface RescueOverridePayload {
    imageBase64: string | null;
    mimeType: string;
    problemDescription: string;
    issueCategory: string | null;
    dishName: string;
    isFrontCamera: boolean;
    isSelfieDetected: boolean;
    isSampleScenario: boolean;
  }

  // Submit diagnosis request to server-side Gemini
  const handleRescueSubmit = async (e?: React.FormEvent, overridePayload?: RescueOverridePayload) => {
    if (e) e.preventDefault();

    const targetPayload = overridePayload || {
      imageBase64: photoBase64,
      mimeType: photoMimeType,
      problemDescription: problemDescription.trim(),
      issueCategory: selectedIssueCategory,
      dishName: dishName.trim(),
      isFrontCamera: isFrontCameraCapture,
      isSelfieDetected: isSelfieDetectedInClient || isFrontCameraCapture,
      isSampleScenario,
    };

    if (!targetPayload.imageBase64 && !targetPayload.problemDescription.trim()) {
      setErrorMessage('Please snap a photo or describe what is going wrong with your food.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingPhase('analyzing');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000); // 60 seconds timeout

    try {
      console.log('[/api/rescue] sending request payload with 60s timeout...', {
        isSample: targetPayload.isSampleScenario,
        dish: targetPayload.dishName,
      });

      const response = await fetch('/api/rescue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(targetPayload),
      });
      clearTimeout(timeoutId);

      let result: any = null;
      try {
        result = await response.json();
      } catch (parseErr) {
        console.error('[/api/rescue JSON parse error]:', parseErr);
      }

      console.log('[/api/rescue full server response]:', {
        status: response.status,
        ok: response.ok,
        body: result,
      });

      if (!response.ok || !result || !result.success) {
        const errorText =
          result?.error ||
          (response.status >= 500
            ? "Couldn't reach the AI, please try again"
            : 'Failed to diagnose your food. Please try again.');
        setErrorMessage(errorText);
        return;
      }

      const diagnosisData: RescueResponse = result.data;
      console.log('[/api/rescue diagnosisData received]:', diagnosisData);
      setCurrentDiagnosis(diagnosisData);

      // Seed multi-turn conversation history
      const initialHistory: ConversationMessage[] = [
        {
          role: 'user',
          text: `Dish: ${targetPayload.dishName || diagnosisData.foodIdentified}. Issue: ${targetPayload.problemDescription || targetPayload.issueCategory || 'See photo'}`,
          imageBase64: targetPayload.imageBase64 || undefined,
          mimeType: targetPayload.mimeType,
          timestamp: Date.now(),
        },
        {
          role: 'model',
          text: `Diagnosis: ${diagnosisData.diagnosis}. Steps: ${diagnosisData.rescuePlan?.map((s) => `${s.stepNumber}. ${s.instruction}`).join(' ') || 'No rescue steps.'}`,
          timestamp: Date.now(),
          diagnosisData,
        },
      ];
      setConversationHistory(initialHistory);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[/api/rescue request error]:', err);
      const isTimeout =
        err.name === 'AbortError' ||
        err.message?.includes('aborted') ||
        err.message?.includes('Load failed') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('timeout');

      setErrorMessage(
        isTimeout
          ? 'That took too long, please try again'
          : (err.message || 'Something went wrong while diagnosing your dinner. Please try again.')
      );
    } finally {
      setIsLoading(false);
      setActiveSampleLoadingId(null);
    }
  };

  // Multi-turn follow-up request to server
  const handleSendFollowUp = async (userText: string, newImage: string | null) => {
    setIsFollowUpLoading(true);
    setErrorMessage(null);

    let compressedNewB64: string | null = null;
    let newMime = 'image/jpeg';

    if (newImage) {
      try {
        const compressed = await compressImage(newImage, 960, 960, 0.72);
        compressedNewB64 = compressed.base64;
        newMime = compressed.mimeType;
      } catch (e) {
        console.warn('Failed to compress follow-up image:', e);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000); // 60 seconds timeout

    try {
      console.log('[/api/follow-up] sending request with 60s timeout...');
      const response = await fetch('/api/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          conversationHistory,
          newImageBase64: compressedNewB64,
          newMimeType: newMime,
          userMessage: userText,
          previousDiagnosis: currentDiagnosis,
        }),
      });
      clearTimeout(timeoutId);

      let result: any = null;
      try {
        result = await response.json();
      } catch (parseErr) {
        console.error('[/api/follow-up JSON parse error]:', parseErr);
      }

      console.log('[/api/follow-up full server response]:', {
        status: response.status,
        ok: response.ok,
        body: result,
      });

      if (!response.ok || !result || !result.success) {
        const errorText =
          result?.error ||
          (response.status >= 500
            ? "Couldn't reach the AI, please try again"
            : 'Failed to evaluate follow-up. Please retry.');
        setErrorMessage(errorText);
        return;
      }

      const updatedDiagnosis: RescueResponse = result.data;
      console.log('[/api/follow-up updated diagnosis received]:', updatedDiagnosis);
      setCurrentDiagnosis(updatedDiagnosis);

      // Append to conversation history
      setConversationHistory((prev) => [
        ...prev,
        {
          role: 'user',
          text: userText,
          imageBase64: compressedNewB64 || undefined,
          mimeType: newMime,
          timestamp: Date.now(),
        },
        {
          role: 'model',
          text: `Updated Diagnosis: ${updatedDiagnosis.diagnosis}`,
          timestamp: Date.now(),
          diagnosisData: updatedDiagnosis,
        },
      ]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[/api/follow-up error]:', err);
      const isTimeout =
        err.name === 'AbortError' ||
        err.message?.includes('aborted') ||
        err.message?.includes('Load failed') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('timeout');

      setErrorMessage(
        isTimeout
          ? 'That took too long, please try again'
          : (err.message || 'Could not process follow-up. Please try again.')
      );
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Reset to troubleshooting home screen
  const handleStartOver = () => {
    setCurrentDiagnosis(null);
    setPhotoDataUrl(null);
    setPhotoBase64(null);
    setIsFrontCameraCapture(false);
    setIsSelfieDetectedInClient(false);
    setCompressionInfo(null);
    setDishName('');
    setProblemDescription('');
    setSelectedIssueCategory(null);
    setIsSampleScenario(false);
    setConversationHistory([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans antialiased selection:bg-amber-200">
      
      {/* Refined Masthead Navigation */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200/70 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div
            onClick={handleStartOver}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-100 flex items-center justify-center shadow-xs group-hover:bg-[#C2410C] transition-colors">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-serif font-bold text-stone-900 tracking-tight">
                  Save My Dinner
                </span>
                <span className="text-[11px] font-medium text-stone-500 hidden sm:inline">
                  · Stove-side rescue
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">


            {currentDiagnosis && (
              <button
                onClick={handleStartOver}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 flex items-center space-x-1.5 transition active:scale-95 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Fix</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">Something Went Wrong</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleRescueSubmit()}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 text-rose-500 hover:text-rose-800 rounded-lg transition cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* View Switch: Results View vs Main Form */}
        {currentDiagnosis ? (
          <RescueResultsView
            diagnosis={currentDiagnosis}
            originalImage={photoDataUrl}
            userProblem={problemDescription}
            onStartOver={handleStartOver}
            onSendFollowUp={handleSendFollowUp}
            isFollowUpLoading={isFollowUpLoading}
            onOpenLiveCamera={handleOpenLiveCamera}
          />
        ) : (
          <div className="space-y-8">
            
            {/* Clean Hero Header */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
                Cooking mishap? Let’s save your dinner.
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed max-w-xl">
                Snap a quick photo of your pot or pan, or describe what's going wrong. Get plain-English steps right now before food is ruined.
              </p>
            </div>

            {/* Fun Mascot */}
            <div>
              <FunMascot />
            </div>

            {/* Unified Troubleshooter Card */}
            <form onSubmit={handleRescueSubmit} className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-xs space-y-6">
              
              {/* Photo Upload / Viewfinder Trigger */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Photo of your dish <span className="font-normal text-stone-400 lowercase">(optional, but helps a lot)</span>
                </label>

                {photoDataUrl ? (
                  /* Photo Loaded Preview Card */
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 flex items-center justify-center">
                    <img
                      src={photoDataUrl}
                      alt="Food to rescue"
                      className="w-full h-52 sm:h-60 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end justify-between p-4">
                      <div className="text-white text-xs space-y-0.5">
                        <span className="font-semibold text-emerald-400 flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1" /> Photo attached
                        </span>
                        <span className="text-[11px] text-stone-300">Ready for visual diagnosis</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsCameraModalOpen(true)}
                          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-medium backdrop-blur-sm transition cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoDataUrl(null);
                            setPhotoBase64(null);
                            setIsFrontCameraCapture(false);
                            setIsSelfieDetectedInClient(false);
                            setCompressionInfo(null);
                            setIsSampleScenario(false);
                          }}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Clean Photo Action Buttons */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="py-4 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center space-x-2.5 transition active:scale-[0.98] shadow-xs cursor-pointer group"
                    >
                      <Camera className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-sm">Snap Live Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-4 px-4 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center space-x-2.5 transition active:scale-[0.98] cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-stone-500" />
                      <span className="font-semibold text-sm">Upload from Device</span>
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Dish Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  What are you making? <span className="font-normal text-stone-400 lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Cream sauce, seared chicken breast, stir-fry, tomato sauce"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-emerald-600 transition"
                />
              </div>

              {/* Problem Description & Voice Dictation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    What's going wrong right now?
                  </label>
                  
                  {isVoiceSupported && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                        isListening
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                      }`}
                      title="Speak using microphone"
                    >
                      <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-rose-600' : 'text-stone-500'}`} />
                      <span>{isListening ? 'Listening...' : 'Dictate'}</span>
                    </button>
                  )}
                </div>

                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe what you see, smell, or taste. (e.g., The sauce broke into an oily puddle with little grainy clumps, or the garlic is catching and turning dark black...)"
                  className={`w-full p-4 rounded-xl bg-stone-50 border text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-emerald-600 transition resize-none min-h-[90px] ${
                    isListening ? 'border-rose-400 ring-2 ring-rose-200' : 'border-stone-200'
                  }`}
                />
              </div>

              {/* Common Emergencies Quick Select */}
              <div className="space-y-2 pt-1">
                <span className="block text-xs font-semibold text-stone-500">
                  Or pick a common mishap:
                </span>
                <div className="flex flex-wrap gap-2">
                  {issueOptions.map((opt) => {
                    const isSelected = selectedIssueCategory === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedIssueCategory(null);
                          } else {
                            setSelectedIssueCategory(opt.label);
                            if (opt.query && (!problemDescription || issueOptions.some(o => o.query === problemDescription))) {
                              setProblemDescription(opt.query);
                            }
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 font-medium'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <span>{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading || (!photoBase64 && !problemDescription.trim())}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base text-white flex items-center justify-center space-x-2 shadow-md transition active:scale-[0.99] cursor-pointer ${
                  isLoading || (!photoBase64 && !problemDescription.trim())
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                    : 'bg-[#C2410C] hover:bg-[#9A3412] shadow-orange-950/15'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-bounce text-lg">🍳</span>
                    <span>Analyzing your food...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 text-amber-300" />
                    <span>Fix My Dinner</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

            </form>

            {/* Clean Sample Mishaps Section with Real Food Photography */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600 flex items-center space-x-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-stone-400" />
                  <span>Try an Example Cooking Mishap</span>
                </h2>
                <span className="text-xs text-stone-400 font-medium">1-tap demo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_MISHAPS.map((mishap) => {
                  const isCurrentLoading = activeSampleLoadingId === mishap.id;
                  return (
                    <div
                      key={mishap.id}
                      onClick={() => {
                        if (!isLoading) {
                          handleSelectSampleMishap(mishap);
                        }
                      }}
                      className={`p-3.5 rounded-2xl bg-white border transition flex items-center space-x-3.5 group ${
                        isCurrentLoading
                          ? 'border-[#C2410C] ring-2 ring-orange-200 bg-orange-50/30'
                          : isLoading
                          ? 'opacity-60 cursor-not-allowed border-stone-200'
                          : 'border-stone-200 hover:border-amber-400 hover:shadow-xs cursor-pointer'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                        <img
                          src={mishap.previewImage}
                          alt={mishap.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate group-hover:text-[#C2410C] transition-colors">
                          {mishap.title}
                        </h3>
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {mishap.foodName}
                        </p>
                        <div className="mt-1">
                          {isCurrentLoading ? (
                            <span className="text-[11px] text-[#C2410C] font-semibold inline-flex items-center space-x-1">
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              <span>Diagnosing...</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-800 font-semibold inline-flex items-center">
                              Run test rescue →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gentle Food Safety Note */}
            <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200/70 text-stone-500 text-xs flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0" />
              <p className="leading-relaxed">
                <strong>Food safety reminder:</strong> Always use a meat thermometer to confirm internal temperature (165°F for poultry, 145°F for pork).
              </p>
            </div>

          </div>
        )}
      </main>

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setCustomCameraCallback(null);
        }}
        onCapture={(dataUrl, isFront) => {
          if (customCameraCallback) {
            customCameraCallback(dataUrl);
            setCustomCameraCallback(null);
          } else {
            if (currentDiagnosis) {
              setCurrentDiagnosis(null);
              setConversationHistory([]);
            }
            handleProcessImage(dataUrl, Boolean(isFront), false);
          }
        }}
      />



    </div>
  );
}
