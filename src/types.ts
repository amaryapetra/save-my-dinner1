export interface RescueStep {
  stepNumber: number;
  title: string;
  instruction: string;
  heatSetting?: string;
  timingMinutes?: number;
  visualCue?: string;
}

export interface RescueResponse {
  isFoodDetected?: boolean;
  nonFoodReason?: string | null;
  foodIdentified: string;
  visibleObservation: string;
  diagnosis: string;
  urgencyLevel: 'immediate' | 'moderate' | 'calm';
  canBeSaved: boolean;
  rescuePlan: RescueStep[];
  howToKnowItsWorking: string[];
  foodSafetyWarning?: string | null;
  salvageOption?: string | null;
  clarifyingQuestion?: string | null;
  preventionTip: string;
}

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
  imageBase64?: string;
  mimeType?: string;
  timestamp: number;
  diagnosisData?: RescueResponse;
}

export interface SampleMishap {
  id: string;
  title: string;
  category: string;
  description: string;
  foodName: string;
  previewImage: string;
  mockHint: string;
}
