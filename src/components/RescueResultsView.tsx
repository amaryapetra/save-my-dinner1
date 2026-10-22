import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  HelpCircle,
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ChefHat,
  RotateCcw,
  Send,
  MessageSquare,
  ThumbsUp,
  XCircle,
  Eye,
  Info
} from 'lucide-react';
import { RescueResponse, ConversationMessage } from '../types';
import { RescueTimer } from './RescueTimer';

interface RescueResultsViewProps {
  diagnosis: RescueResponse;
  originalImage: string | null;
  userProblem: string;
  onStartOver: () => void;
  onSendFollowUp: (userText: string, newImage: string | null) => Promise<void>;
  isFollowUpLoading: boolean;
  onOpenLiveCamera: (callback?: (dataUrl: string) => void) => void;
}

export const RescueResultsView: React.FC<RescueResultsViewProps> = ({
  diagnosis,
  originalImage,
  userProblem,
  onStartOver,
  onSendFollowUp,
  isFollowUpLoading,
  onOpenLiveCamera,
}) => {
  const [fixStatus, setFixStatus] = useState<'pending' | 'saved' | 'not_yet'>('pending');
  const [followUpText, setFollowUpText] = useState('');
  const [followUpImage, setFollowUpImage] = useState<string | null>(null);
  const [showFollowUpPhotoOptions, setShowFollowUpPhotoOptions] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Quick feedback tags for "Not yet"
  const quickFollowUpTags = [
    'Still too watery',
    'Tastes bland now',
    'Curdling didn\'t smooth out',
    'Bottom smells burnt',
    'Chicken still pink in center',
    'Getting too thick',
  ];

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() && !followUpImage) return;
    await onSendFollowUp(followUpText, followUpImage);
    setFollowUpText('');
    setFollowUpImage(null);
    setShowFollowUpPhotoOptions(false);
  };

  const handleCopySummary = () => {
    const text = `🍽️ Save My Dinner Rescue Plan for ${diagnosis.foodIdentified}:\n` +
      `Diagnosis: ${diagnosis.diagnosis}\n\n` +
      `Rescue Steps:\n` +
      (diagnosis.rescuePlan || []).map((s) => `${s.stepNumber}. ${s.title}: ${s.instruction}`).join('\n') +
      `\n\nHow to know it worked: ${(diagnosis.howToKnowItsWorking || []).join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'immediate':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span>Do this right now</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Quick adjustment</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Easy fix</span>
          </span>
        );
    }
  };

  // Guard: If uploaded image is not food (e.g. selfie, keyboard, pet, random object)
  if (diagnosis.isFoodDetected === false) {
    const isSelfie =
      Boolean(diagnosis.isSelfie) ||
      diagnosis.foodIdentified?.toLowerCase().includes('selfie') ||
      diagnosis.nonFoodReason?.toLowerCase().includes('selfie') ||
      diagnosis.nonFoodReason?.toLowerCase().includes('person');

    return (
      <div className="w-full max-w-xl mx-auto space-y-5 animate-fade-in pb-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Camera className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              {isSelfie ? 'Selfie Detected' : 'No Food Detected'}
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              {isSelfie ? 'Nice selfie, but we need to see your food' : "Oops, that doesn't look like food"}
            </h2>
            <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
              {diagnosis.diagnosis || (isSelfie
                ? "Our kitchen helper can only diagnose what's cooking on the stove or counter. Please aim your back camera down at your pot, pan, or plate!"
                : "We couldn't spot any food, pan, or cooking in this picture. Please aim your camera at your pot, pan, or plate so we can help fix it!")}
            </p>
          </div>

          {/* If an image was submitted, show thumbnail with playful caption */}
          {originalImage && (
            <div className="inline-block p-2 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="w-28 h-28 rounded-xl overflow-hidden mx-auto shadow-2xs">
                <img src={originalImage} alt="Uploaded item" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] text-stone-500 mt-1.5 block">
                {diagnosis.nonFoodReason || (isSelfie ? 'Selfie photo' : 'Uploaded photo')}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenLiveCamera()}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{isSelfie ? 'Snap Your Food (Back Camera)' : 'Snap Your Real Food'}</span>
            </button>
            <button
              onClick={onStartOver}
              className="w-full sm:w-auto px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl font-semibold text-sm transition cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-24">
      
      {/* Top Banner & Dish Identification */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {getUrgencyBadge(diagnosis.urgencyLevel)}
              {diagnosis.canBeSaved ? (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> This can be saved!
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  <XCircle className="w-3 h-3 mr-1" /> Needs a workaround
                </span>
              )}
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              {diagnosis.foodIdentified}
            </h2>
            <p className="text-xs text-stone-500">
              Kitchen Helper Diagnosis
            </p>
          </div>

          {/* Thumbnail of food */}
          {originalImage && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-stone-100 shadow-sm shrink-0 self-center sm:self-start">
              <img
                src={originalImage}
                alt="Analyzed food"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Section 1: "What's happening" */}
        <div className="mt-5 pt-5 border-t border-stone-100 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm uppercase tracking-wider">
            <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 text-xs font-mono">
              1
            </span>
            <span>What's happening</span>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2.5">
            <p className="text-stone-800 text-sm sm:text-base leading-relaxed font-medium">
              {diagnosis.diagnosis}
            </p>

            {/* Clearly qualified observation in plain words */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 pt-1.5 border-t border-stone-200/60">
              <div className="flex items-start space-x-2">
                <Eye className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-700">
                    {originalImage ? 'What we see in your photo:' : 'Based on what you described:'}
                  </strong>{' '}
                  {diagnosis.visibleObservation}
                </span>
              </div>
              {!originalImage && (
                <button
                  type="button"
                  onClick={() => onOpenLiveCamera()}
                  className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline shrink-0 text-[11px] cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Add a photo of your pan</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Food Safety Warning if applicable */}
        {diagnosis.foodSafetyWarning && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-rose-800 uppercase tracking-wide text-xs">
                Food Safety Check
              </span>
              <p className="leading-relaxed">{diagnosis.foodSafetyWarning}</p>
            </div>
          </div>
        )}

        {/* Clarifying question if present */}
        {diagnosis.clarifyingQuestion && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className="font-bold block text-amber-800 uppercase tracking-wide text-xs">
                Quick question to help you better
              </span>
              <p className="leading-relaxed font-medium">{diagnosis.clarifyingQuestion}</p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  className="w-full text-xs bg-white px-3 py-1.5 rounded-lg border border-amber-300 text-stone-800 focus:outline-emerald-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val.trim()) {
                        onSendFollowUp(`Clarification: ${val}`, null);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: "Your rescue plan" */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm uppercase tracking-wider">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-mono font-bold">
              2
            </span>
            <span>Your Rescue Plan</span>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {(diagnosis.rescuePlan || []).length} actionable steps
          </span>
        </div>

        <div className="space-y-3.5">
          {(diagnosis.rescuePlan || []).map((step) => (
            <div
              key={step.stepNumber}
              className="p-4 rounded-2xl bg-[#FCFAF6] border border-[#EFE8DD] hover:border-emerald-300 transition space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {step.stepNumber}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-stone-900">
                    {step.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {step.heatSetting && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-100 text-orange-900 border border-orange-200">
                      <Flame className="w-3 h-3 mr-1 text-orange-600" />
                      Heat: {step.heatSetting}
                    </span>
                  )}
                  {!!step.timingMinutes && step.timingMinutes > 0 && (
                    <RescueTimer initialMinutes={step.timingMinutes} label={step.title} />
                  )}
                </div>
              </div>

              <p className="text-stone-800 text-sm sm:text-[15px] leading-relaxed pl-8">
                {step.instruction}
              </p>

              {step.visualCue && (
                <div className="pl-8 pt-1 text-xs text-stone-600 flex items-center space-x-1.5">
                  <span className="text-emerald-700 font-semibold">Look for:</span>
                  <span className="italic">{step.visualCue}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Salvage Option if dish cannot be fully saved */}
        {diagnosis.salvageOption && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-1">
            <span className="font-bold flex items-center text-amber-800">
              <ChefHat className="w-4 h-4 mr-1.5" /> How to save what you can
            </span>
            <p className="leading-relaxed">{diagnosis.salvageOption}</p>
          </div>
        )}
      </div>

      {/* Section 3: "How to know it's working" */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-3.5">
        <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm uppercase tracking-wider">
          <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 text-xs font-mono">
            3
          </span>
          <span>Signs that it's working</span>
        </div>

        <ul className="space-y-2.5">
          {(diagnosis.howToKnowItsWorking || []).map((sign, idx) => (
            <li
              key={idx}
              className="flex items-start space-x-3 text-stone-800 text-sm leading-relaxed"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>{sign}</span>
            </li>
          ))}
        </ul>

        {/* Prevention tip */}
        {diagnosis.preventionTip && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-start space-x-3 text-xs sm:text-sm text-stone-600 bg-stone-50/70 p-3.5 rounded-2xl">
            <ChefHat className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800 block text-xs uppercase tracking-wide">
                How to avoid this next time
              </span>
              <p className="mt-0.5 leading-relaxed">{diagnosis.preventionTip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: "Did that fix it?" */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm uppercase tracking-wider">
            <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 text-xs font-mono">
              4
            </span>
            <span>Did that fix it?</span>
          </div>
        </div>

        {/* If pending selection */}
        {fixStatus === 'pending' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <button
              onClick={() => setFixStatus('saved')}
              className="py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-md shadow-emerald-900/10 transition active:scale-[0.98]"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Yes, dinner is saved! 🎉</span>
            </button>
            <button
              onClick={() => setFixStatus('not_yet')}
              className="py-3.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm sm:text-base flex items-center justify-center space-x-2 border border-stone-300 transition active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4 text-stone-600" />
              <span>Not yet (Still having trouble)</span>
            </button>
          </div>
        )}

        {/* If user clicked "Yes, saved it!" */}
        {fixStatus === 'saved' && (
          <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-center space-y-4 animate-fade-in shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-emerald-950">
                Dinner is officially saved!
              </h3>
              <p className="text-emerald-800 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Turn down the heat, grab your plate, and enjoy your meal!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCopySummary}
                className="px-4 py-2 bg-white text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition"
              >
                {copiedSummary ? '✓ Copied to clipboard!' : 'Copy Steps'}
              </button>
              <button
                onClick={onStartOver}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                Fix Another Dish
              </button>
            </div>
          </div>
        )}

        {/* If user clicked "Not yet" -> Multi-turn follow up */}
        {fixStatus === 'not_yet' && (
          <div className="space-y-4 pt-2 border-t border-stone-100 animate-fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-stone-900 flex items-center">
                <ChefHat className="w-4 h-4 mr-2 text-emerald-700" />
                What's happening now?
              </h4>
              <p className="text-xs text-stone-600">
                Take an updated photo or tell us what it looks, smells, or tastes like now.
              </p>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {quickFollowUpTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFollowUpText((prev) => (prev ? `${prev}. ${tag}` : tag))}
                  className="px-2.5 py-1 rounded-full text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition"
                >
                  +{tag}
                </button>
              ))}
            </div>

            {/* Preview of new follow-up image if attached */}
            {followUpImage && (
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                <img src={followUpImage} alt="Follow up snapshot" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFollowUpImage(null)}
                  className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-black transition"
                  title="Remove image"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <span className="absolute bottom-1 left-1 text-[9px] bg-emerald-700 text-white px-1.5 py-0.5 rounded font-mono">
                  NEW PHOTO
                </span>
              </div>
            )}

            <form onSubmit={handleFollowUpSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  placeholder="e.g. I turned off the burner and whisked in ice water. It smoothed out a bit, but now it feels too thin..."
                  className="w-full p-3.5 pr-12 text-sm bg-stone-50 border border-stone-300 rounded-2xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition resize-none min-h-[90px]"
                />
              </div>

              {/* Photo attachment buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenLiveCamera((dataUrl) => setFollowUpImage(dataUrl))}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-stone-200 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Snap Updated Photo</span>
                  </button>

                  <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-stone-200 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-stone-600" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) setFollowUpImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isFollowUpLoading || (!followUpText.trim() && !followUpImage)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center space-x-2 transition ${
                    isFollowUpLoading || (!followUpText.trim() && !followUpImage)
                      ? 'bg-stone-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/10 active:scale-95'
                  }`}
                >
                  {isFollowUpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Update...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Revised Advice</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between px-2 pt-2">
        <button
          onClick={onStartOver}
          className="text-stone-500 hover:text-stone-800 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 py-2 px-3 rounded-xl hover:bg-stone-100 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start Over with New Dish</span>
        </button>

        <button
          onClick={handleCopySummary}
          className="text-stone-500 hover:text-stone-800 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 py-2 px-3 rounded-xl hover:bg-stone-100 transition"
        >
          <span>{copiedSummary ? 'Copied!' : 'Share / Copy Plan'}</span>
        </button>
      </div>

    </div>
  );
};
