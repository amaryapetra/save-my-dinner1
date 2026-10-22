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
} from 'lucide-react';
import { RescueResponse, ConversationMessage, SampleMishap } from './types';
import { compressImage, CompressionResult } from './utils/imageCompressor';
import { useVoiceDictation } from './utils/useVoiceDictation';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { RescueResultsView } from './components/RescueResultsView';
import { ProjectSubmissionModal } from './components/ProjectSubmissionModal';
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

  // Flow & AI states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'analyzing' | 'troubleshooting' | 'planning'>('analyzing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<RescueResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Modals & inputs
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [customCameraCallback, setCustomCameraCallback] = useState<((dataUrl: string) => void) | null>(null);
  const [isFrontCameraCapture, setIsFrontCameraCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenLiveCamera = (callback?: (dataUrl: string) => void) => {
    if (callback) {
      setCustomCameraCallback(() => callback);
    } else {
      setCustomCameraCallback(null);
    }
    setIsCameraModalOpen(true);
  };

  // Hands-free microphone voice dictation (Device Feature 2)
  const { isListening, isSupported: isVoiceSupported, toggleListening } = useVoiceDictation({
    onTranscript: (text) => {
      setProblemDescription(text);
    },
    onError: (err) => {
      setErrorMessage(err);
    },
  });

  // Fun visual emoji chips with friendly pastel palettes
  const issueChips = [
    { label: 'Too watery', icon: '💧', activeColor: 'bg-sky-500 text-white border-sky-600', idleColor: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100', query: 'There is way too much water in the pan and it won\'t thicken up' },
    { label: 'Too salty', icon: '🧂', activeColor: 'bg-amber-500 text-white border-amber-600', idleColor: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100', query: 'I poured in too much salt and it burns my tongue' },
    { label: 'Too dry', icon: '🏜️', activeColor: 'bg-orange-500 text-white border-orange-600', idleColor: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100', query: 'The food is drying out and looks tough or stuck' },
    { label: 'Not browning', icon: '🌫️', activeColor: 'bg-teal-600 text-white border-teal-700', idleColor: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100', query: 'The food is boiling and steaming instead of getting crispy or brown' },
    { label: 'Burning on bottom', icon: '🔥', activeColor: 'bg-red-500 text-white border-red-600', idleColor: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100', query: 'The food is catching and turning black on the bottom of the pan' },
    { label: 'Raw inside', icon: '🍗', activeColor: 'bg-rose-500 text-white border-rose-600', idleColor: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100', query: 'The outside looks browned, but the inside is still pink or raw' },
    { label: 'Something else', icon: '✨', activeColor: 'bg-purple-600 text-white border-purple-700', idleColor: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100', query: '' },
  ];

  // Handle image compression when a photo is selected
  const handleProcessImage = async (fileOrDataUrl: File | string, isFront = false) => {
    try {
      setIsFrontCameraCapture(isFront);
      setIsLoading(true);
      setLoadingPhase('analyzing');
      const compressed: CompressionResult = await compressImage(fileOrDataUrl, 1400, 1400, 0.82);
      setPhotoDataUrl(compressed.dataUrl);
      setPhotoBase64(compressed.base64);
      setPhotoMimeType(compressed.mimeType);
      setCompressionInfo({
        origKB: compressed.originalSizeKB,
        compKB: compressed.compressedSizeKB,
      });
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
      handleProcessImage(file);
    }
  };

  // Select a preset mishap
  const handleSelectSampleMishap = (sample: SampleMishap) => {
    setDishName(sample.foodName);
    setProblemDescription(sample.description);
    setSelectedIssueCategory(sample.category);
    handleProcessImage(sample.previewImage);
  };

  // Submit diagnosis request to server-side Gemini
  const handleRescueSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!photoBase64 && !problemDescription.trim()) {
      setErrorMessage('Please snap a photo or describe what is going wrong with your food.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingPhase('analyzing');

    try {
      const response = await fetch('/api/rescue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: photoBase64,
          mimeType: photoMimeType,
          problemDescription: problemDescription.trim(),
          issueCategory: selectedIssueCategory,
          dishName: dishName.trim(),
          isFrontCamera: isFrontCameraCapture,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to check food. Please check your connection and retry.');
      }

      const diagnosisData: RescueResponse = result.data;
      setCurrentDiagnosis(diagnosisData);

      // Seed multi-turn conversation history
      const initialHistory: ConversationMessage[] = [
        {
          role: 'user',
          text: `Dish: ${dishName || diagnosisData.foodIdentified}. Issue: ${problemDescription || selectedIssueCategory || 'See photo'}`,
          imageBase64: photoBase64 || undefined,
          mimeType: photoMimeType,
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
      console.error('Rescue error:', err);
      setErrorMessage(err.message || 'Something went wrong while diagnosing your dinner. Please try again.');
    } finally {
      setIsLoading(false);
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
        const compressed = await compressImage(newImage, 1200, 1200, 0.8);
        compressedNewB64 = compressed.base64;
        newMime = compressed.mimeType;
      } catch (e) {
        console.warn('Failed to compress follow-up image:', e);
      }
    }

    try {
      const response = await fetch('/api/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory,
          newImageBase64: compressedNewB64,
          newMimeType: newMime,
          userMessage: userText,
          previousDiagnosis: currentDiagnosis,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to evaluate follow-up. Please retry.');
      }

      const updatedDiagnosis: RescueResponse = result.data;
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
      console.error('Follow-up error:', err);
      setErrorMessage(err.message || 'Could not process follow-up. Please try again.');
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Reset to troubleshooting home screen
  const handleStartOver = () => {
    setCurrentDiagnosis(null);
    setPhotoDataUrl(null);
    setPhotoBase64(null);
    setCompressionInfo(null);
    setDishName('');
    setProblemDescription('');
    setSelectedIssueCategory(null);
    setConversationHistory([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans antialiased selection:bg-amber-200">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div
            onClick={handleStartOver}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            {/* Friendly Cooking Pan Logo */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-950/15 group-hover:scale-105 transition">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                <span>Save My Dinner</span>
                <span className="text-xs">🍳</span>
              </h1>
              <p className="text-[11px] text-stone-500 font-medium">
                Snap it. Fix it. Eat well.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSubmissionModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center space-x-1.5 transition active:scale-95"
              title="Project Details & Presentation Info"
            >
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>Project Hub</span>
            </button>

            {currentDiagnosis && (
              <button
                onClick={handleStartOver}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center space-x-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Fix</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between space-x-3 animate-fade-in shadow-xs">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">Quick Notice</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 text-rose-500 hover:text-rose-800 rounded-lg transition"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
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
          <div className="space-y-5">
            
            {/* Friendly Mascot Hero */}
            <FunMascot />

            {/* Simple Step 1: Photo Box */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
                  <span>Snap your pan or pot</span>
                </span>
                <span className="text-[11px] text-stone-400">Point at stove</span>
              </div>

              {photoDataUrl ? (
                /* Selected Photo Polaroid Preview */
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-stone-900 max-h-72 flex items-center justify-center group shadow-md">
                  <img
                    src={photoDataUrl}
                    alt="Food to fix"
                    className="w-full h-60 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                    <div className="text-white text-xs">
                      <span className="font-bold flex items-center text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Photo Loaded!
                      </span>
                      <span className="text-[11px] text-stone-300">Ready for instant advice</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="px-3 py-1.5 bg-white/25 hover:bg-white/40 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition"
                      >
                        Retake
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoDataUrl(null);
                          setPhotoBase64(null);
                          setCompressionInfo(null);
                        }}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Simple, Colorful Photo Buttons */
                <div className="grid grid-cols-2 gap-3">
                  {/* Big Green Camera Button */}
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex flex-col items-center justify-center space-y-1.5 shadow-md shadow-emerald-900/10 active:scale-95 transition cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-sm sm:text-base">Take Photo</span>
                    <span className="text-[11px] text-emerald-100 text-center">
                      Use camera
                    </span>
                  </button>

                  {/* Big Warm Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FCFAF6] hover:bg-stone-100 text-stone-800 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center space-y-1.5 active:scale-95 transition cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-stone-200/70 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-stone-600" />
                    </div>
                    <span className="font-bold text-sm sm:text-base">From Library</span>
                    <span className="text-[11px] text-stone-500 text-center">
                      Pick photo
                    </span>
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

            {/* Simple Step 2: Problem Form */}
            <form onSubmit={handleRescueSubmit} className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs space-y-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">2</span>
                  <span>What's going wrong?</span>
                </span>
                <span className="text-[11px] text-stone-400">Tap to select</span>
              </div>

              {/* Colorful Emoji Problem Chips */}
              <div className="flex flex-wrap gap-1.5">
                {issueChips.map((chip) => {
                  const isSelected = selectedIssueCategory === chip.label;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedIssueCategory(null);
                        } else {
                          setSelectedIssueCategory(chip.label);
                          if (chip.query && !problemDescription) {
                            setProblemDescription(chip.query);
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 border cursor-pointer flex items-center space-x-1 ${
                        isSelected ? chip.activeColor : chip.idleColor
                      }`}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dish Name Optional Input */}
              <div>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="What are you cooking? (e.g. Cream pasta, stir-fry, steak...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-emerald-600 transition"
                />
              </div>

              {/* Problem Description with Mic */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-500">
                    Tell us what happened:
                  </span>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${
                      isListening
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                    }`}
                    title="Speak using microphone"
                  >
                    <Mic className={`w-3 h-3 ${isListening ? 'text-rose-600' : 'text-emerald-700'}`} />
                    <span>{isListening ? 'Listening...' : '🎤 Speak Hands-Free'}</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="e.g. Sauce turned into melted oil with clumps, or bottom is smelling burnt... or tap the mic to speak!"
                    className={`w-full p-3 rounded-2xl bg-stone-50 border text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-emerald-600 transition resize-none min-h-[85px] ${
                      isListening ? 'border-rose-400 ring-2 ring-rose-200' : 'border-stone-200'
                    }`}
                  />
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading || (!photoBase64 && !problemDescription.trim())}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg text-white flex items-center justify-center space-x-2 shadow-lg transition active:scale-[0.98] ${
                  isLoading || (!photoBase64 && !problemDescription.trim())
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                    : 'bg-[#D9381E] hover:bg-[#C42C13] shadow-red-950/20 cursor-pointer'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Checking your food...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 text-amber-300" />
                    <span>Fix My Dinner 🚀</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>

            </form>

            {/* Fun Sample Scenarios with Colorful Illustrated Cards */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center">
                  <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                  Or tap an example to test
                </span>
                <span className="text-[11px] text-stone-400">Instant test</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_MISHAPS.map((mishap) => (
                  <button
                    key={mishap.id}
                    type="button"
                    onClick={() => handleSelectSampleMishap(mishap)}
                    className="p-3 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-sm text-left transition group flex items-center space-x-3 cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-stone-200 shadow-2xs group-hover:scale-105 transition">
                      <img src={mishap.previewImage} alt={mishap.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-bold text-stone-900 block group-hover:text-amber-800 transition truncate">
                        {mishap.title}
                      </span>
                      <span className="text-[11px] text-stone-500 line-clamp-1">
                        {mishap.foodName}
                      </span>
                      <span className="text-[10px] text-amber-700 font-semibold block pt-0.5">
                        Test this scenario →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gentle Food Safety note */}
            <div className="p-3.5 rounded-2xl bg-stone-100/60 border border-stone-200/80 text-stone-500 text-xs flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0" />
              <p className="leading-snug">
                <strong>Safety tip:</strong> Always check meats with a meat thermometer (165°F for chicken, 145°F for pork).
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
            handleProcessImage(dataUrl, Boolean(isFront));
          }
        }}
      />

      {/* 150-Point Canvas Project Submission & 2-Minute Demo Modal */}
      <ProjectSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        sharedAppUrl={SHARED_APP_URL}
      />

    </div>
  );
}
