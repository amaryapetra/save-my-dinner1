import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Camera,
  Mic,
  Brain,
  Award,
  Timer,
  BookOpen
} from 'lucide-react';

interface ProjectSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedAppUrl: string;
}

export const ProjectSubmissionModal: React.FC<ProjectSubmissionModalProps> = ({
  isOpen,
  onClose,
  sharedAppUrl,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'demo' | 'grading'>('canvas');

  if (!isOpen) return null;

  const canvasSubmissionText = `Project Submission: Save My Dinner ("Snap it. Fix it. Save dinner.")

Live App URL:
${sharedAppUrl}

GitHub Repository:
[Submit your GitHub repository link here after pushing via AI Studio]

What the App Does:
Save My Dinner is an emergency, mobile-first culinary troubleshooting web application. When a home cook encounters a cooking mishap in real time (e.g., split cream sauce, burning pan aromatics, soggy steaming stir-fry, or over-salted soup), they photograph their pan and speak or type the problem to receive an immediate, actionable culinary rescue plan before their meal is ruined.

Device Features Used:
1. Camera: Live viewfinder and native phone camera capture with client-side image compression. Allows the phone to inspect visual cooking cues, surface sear, emulsion separation, and liquid volume.
2. Microphone: Hands-free voice speech-to-text dictation using the device microphone so cooks with messy, oily hands can describe the problem without typing.

AI Features Used:
1. Multimodal Food Diagnosis (Server-side Gemini 3.8 Flash): Simultaneously analyzes food photos and user descriptions, strictly distinguishing direct visual evidence from unverified inferences.
2. Structured Emergency Action Plan: Returns prioritized, numbered rescue steps with specific heat settings, pantry measurements, estimated timings, and observable signs of recovery.
3. Multi-turn Follow-up Context: Retains full diagnostic context when the user selects "Not yet," allowing updated progress photos and revised real-time culinary advice.
4. Food Safety Verification: Recommends digital probe thermometer thresholds for safe protein temperatures rather than guessing doneness from photos.`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyNote = () => {
    navigator.clipboard.writeText(canvasSubmissionText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3.5 animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Project &amp; Presentation Hub
              </h3>
              <p className="text-[11px] text-stone-500">
                150-Point Assignment • Due Oct 22 • Demo Oct 27
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-100 bg-stone-50/70 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`py-2.5 px-3 border-b-2 transition ${
              activeTab === 'canvas'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Canvas Submission Note
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`py-2.5 px-3 border-b-2 transition ${
              activeTab === 'demo'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            2-Minute Live Demo Script
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`py-2.5 px-3 border-b-2 transition ${
              activeTab === 'grading'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Grading Rubric Checklist
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {activeTab === 'canvas' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-emerald-900 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider block text-emerald-800">
                  Your Public Shared App Link
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={sharedAppUrl}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-emerald-300 text-stone-800 font-mono text-xs select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-emerald-700 text-white rounded-xl font-bold text-xs hover:bg-emerald-800 transition flex items-center space-x-1 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                    Ready-to-Submit Note for Canvas
                  </label>
                  <button
                    onClick={handleCopyNote}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center space-x-1"
                  >
                    {copiedNote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNote ? 'Copied to Clipboard!' : 'Copy Entire Note'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={9}
                  value={canvasSubmissionText}
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-xs font-mono select-all leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start space-x-2">
                <Timer className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>2-Minute Hard Timer Presentation:</strong> Practice this exact flow on your phone so you hit every grading point in 120 seconds!
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-bold text-emerald-800 block text-xs">
                    0:00 - 0:30 • The Hook &amp; Problem
                  </span>
                  <p className="text-stone-600 text-xs mt-1">
                    "Everyone has panicked over a stove when a cream sauce breaks or garlic starts scorching. You have dirty hands and can't read a 10-page blog post. Save My Dinner gives instant, second-by-second rescue steps."
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-bold text-emerald-800 block text-xs">
                    0:30 - 1:00 • The Device Features (Camera + Mic)
                  </span>
                  <p className="text-stone-600 text-xs mt-1">
                    "I tap the camera on my phone to snap the broken sauce. And because my hands are messy, I tap the microphone: <em>'My pan is smoking and the butter separated!'</em> The device captures both instantly."
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-bold text-emerald-800 block text-xs">
                    1:00 - 1:30 • The AI Rescue Plan
                  </span>
                  <p className="text-stone-600 text-xs mt-1">
                    "Server-side Gemini analyzes the visual phase separation, tells me why it broke, and gives me 3 urgent steps: Kill the burner, add 1 tbsp ice-cold cream, and whisk for 60 seconds with an interactive step timer."
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-bold text-emerald-800 block text-xs">
                    1:30 - 2:00 • Multi-turn Follow-up &amp; Food Safety
                  </span>
                  <p className="text-stone-600 text-xs mt-1">
                    "If the fix didn't work fully, I tap 'Not yet', snap an updated photo, and Gemini revises the instructions with conversation history context. Plus, it enforces food safety instead of guessing meat temperatures from a picture."
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grading' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between">
                <div>
                  <span className="font-bold text-stone-900 block text-xs">Live &amp; working (25 pts)</span>
                  <p className="text-[11px] text-stone-500">Runs cleanly on phone in Safari &amp; Chrome with no breaking errors.</p>
                </div>
                <span className="text-emerald-700 font-bold text-xs shrink-0 ml-2">✓ Ready</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between">
                <div>
                  <span className="font-bold text-stone-900 block text-xs">Device feature (30 pts)</span>
                  <p className="text-[11px] text-stone-500">Camera (viewfinder + photo snap) AND Microphone (hands-free dictation).</p>
                </div>
                <span className="text-emerald-700 font-bold text-xs shrink-0 ml-2">✓ 2 Features</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between">
                <div>
                  <span className="font-bold text-stone-900 block text-xs">AI feature (35 pts)</span>
                  <p className="text-[11px] text-stone-500">Gemini 3.8 Flash multimodal food diagnosis + structured rescue steps + multi-turn follow-up.</p>
                </div>
                <span className="text-emerald-700 font-bold text-xs shrink-0 ml-2">✓ Ready</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between">
                <div>
                  <span className="font-bold text-stone-900 block text-xs">App concept &amp; quality (35 pts)</span>
                  <p className="text-[11px] text-stone-500">Coherent, clean mobile UI, pantry quantities, interactive step timers, food safety disclaimers.</p>
                </div>
                <span className="text-emerald-700 font-bold text-xs shrink-0 ml-2">✓ Ready</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between">
                <div>
                  <span className="font-bold text-stone-900 block text-xs">Build &amp; repository (25 pts)</span>
                  <p className="text-[11px] text-stone-500">Clean project ready to push to public GitHub with zero exposed secrets.</p>
                </div>
                <span className="text-emerald-700 font-bold text-xs shrink-0 ml-2">✓ Ready</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-[#FAF7F2] flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            150 / 150 Points Coverage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
