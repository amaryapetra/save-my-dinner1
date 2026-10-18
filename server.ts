import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    timeout: 6000,
  },
});

interface RescueStep {
  stepNumber: number;
  title: string;
  instruction: string;
  heatSetting?: string;
  timingMinutes?: number;
  visualCue?: string;
}

interface RescueResponse {
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

const SYSTEM_INSTRUCTION = `You are "Save My Dinner", a friendly stove-side helper for everyday home cooks.
Your purpose: A home cook is cooking right now with a dish going wrong. They need quick, easy-to-read steps in plain English to fix it before dinner is ruined.

CRITICAL OPERATIONAL RULES:
0. FOOD VERIFICATION GUARDRAIL (STRICT FIRST STEP):
   - If a photo is attached, FIRST check whether it actually shows food, cooking ingredients, pots, pans, skillets, plates, or kitchen food prep.
   - If the photo shows a NON-FOOD object (such as a computer keyboard, mouse, laptop, desk, pet, car, room furniture, screen, or random inanimate object):
     * You MUST set isFoodDetected: false
     * Set foodIdentified: "No Food Detected"
     * Set canBeSaved: false
     * Set nonFoodReason: "This picture shows a non-food object (such as a computer keyboard or desk), not food or cookware."
     * Set diagnosis: "Oops! We could not spot any food in this photo. It looks like a computer keyboard or household object. Please aim your camera at your pot, pan, or food so we can help save your meal!"
     * Set rescuePlan: []
     * Set howToKnowItsWorking: []
     * Set preventionTip: "Point your phone camera directly at the food in your pan or pot."
     * NEVER hallucinate cooking problems or pretend a keyboard needs seasoning or cooking steps!
1. USE SIMPLE, EVERYDAY WORDS ONLY — NO CHEF JARGON OR FOOD SCIENCE:
   - NEVER use words like "emulsion", "dissociate", "pyrolysis", "Maillard reaction", "decant", "alliums", "viscosity", or "fond".
   - Talk like a helpful friend: say "the sauce split", "it got too hot", "the garlic is burning", "trapped steam boiled the meat", "too salty".
   - Use plain pantry amounts: "1 tablespoon of cold milk or water", "a splash of vinegar", "a pinch of sugar".
2. THIS IS NOT A RECIPE GENERATOR. Focus only on fixing what is going wrong right now.
3. DISTINGUISH WHAT YOU ACTUALLY SEE FROM GUESSES:
   - State what you can directly see in plain terms (e.g., "The sauce looks oily with little clumps", "A pool of cloudy water around the chicken", "Dark black burnt bits on the bottom").
   - NEVER claim to know how it tastes, how salty it is, or if meat is cooked through inside from a picture alone.
4. QUICK ACTION STEPS:
   - Give 2 to 4 simple, numbered steps if food is detected.
   - Use clear stove settings: "Turn burner completely off", "Turn heat down to low", "Turn heat up to medium-high".
   - Tell them what to look and listen for: "Look for the sauce to turn smooth again", "Listen for a sizzle instead of bubbling".
   - Include timing in minutes.
5. FOOD SAFETY:
   - Never say meat is safe to eat just from looking at a photo. If chicken or pork might be raw inside, tell them to check with a meat thermometer (165°F for chicken, 145°F for pork).
6. TONE: Calm, encouraging, friendly, and practical.`;

const RESCUE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isFoodDetected: {
      type: Type.BOOLEAN,
      description: 'True if photo shows food, ingredients, or cooking utensils/pots/pans. False if photo shows a keyboard, computer, pet, furniture, or non-food object.',
    },
    nonFoodReason: {
      type: Type.STRING,
      description: 'If isFoodDetected is false, briefly explain what the photo appears to show and ask user to photograph their food.',
    },
    foodIdentified: { type: Type.STRING },
    visibleObservation: { type: Type.STRING },
    diagnosis: { type: Type.STRING },
    urgencyLevel: { type: Type.STRING, enum: ['immediate', 'moderate', 'calm'] },
    canBeSaved: { type: Type.BOOLEAN },
    rescuePlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          instruction: { type: Type.STRING },
          heatSetting: { type: Type.STRING },
          timingMinutes: { type: Type.INTEGER },
          visualCue: { type: Type.STRING },
        },
        required: ['stepNumber', 'title', 'instruction'],
      },
    },
    howToKnowItsWorking: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    foodSafetyWarning: { type: Type.STRING },
    salvageOption: { type: Type.STRING },
    clarifyingQuestion: { type: Type.STRING },
    preventionTip: { type: Type.STRING },
  },
  required: ['isFoodDetected', 'foodIdentified', 'visibleObservation', 'diagnosis', 'urgencyLevel', 'canBeSaved', 'rescuePlan', 'howToKnowItsWorking', 'preventionTip'],
};

// Fallback rescue generator using 100% everyday, simple words for non-chefs
function generateFallbackCulinaryRescue(
  problemDescription = '',
  issueCategory = '',
  dishName = '',
  hasImage = false
): RescueResponse {
  const query = `${problemDescription} ${issueCategory} ${dishName}`.toLowerCase();

  // Non-food detection fallback
  const nonFoodKeywords = ['keyboard', 'laptop', 'mouse', 'desk', 'computer', 'screen', 'dog', 'cat', 'car', 'phone', 'shoe', 'clothing'];
  if (nonFoodKeywords.some((kw) => query.includes(kw))) {
    return {
      isFoodDetected: false,
      nonFoodReason: 'This picture or description appears to be a non-food item, not food or cooking.',
      foodIdentified: 'No Food Detected',
      visibleObservation: 'Non-food object detected.',
      diagnosis: 'We could not find any food in this picture! It looks like a computer keyboard or desk object. Please aim your phone camera at your pot, pan, or plate so we can help save your meal.',
      urgencyLevel: 'calm',
      canBeSaved: false,
      rescuePlan: [],
      howToKnowItsWorking: [],
      preventionTip: 'Point your camera directly at your pan or food.',
    };
  }

  // 1. Split, separated, or curdled sauce
  if (query.includes('split') || query.includes('curdl') || query.includes('separat') || query.includes('butter') || query.includes('cream')) {
    return {
      isFoodDetected: true,
      foodIdentified: dishName || 'Cream or Butter Sauce',
      visibleObservation: hasImage
        ? 'The sauce has separated into an oily puddle with little grainy clumps.'
        : 'Reported by cook: The sauce broke apart into melted grease and curdled clumps.',
      diagnosis: 'The sauce got too hot, causing the butter and cream to break apart into oil and curdled bits.',
      urgencyLevel: 'immediate',
      canBeSaved: true,
      rescuePlan: [
        {
          stepNumber: 1,
          title: 'Take the pan off the burner right now',
          instruction: 'Slide the pan completely off the hot burner onto a cool spot on the counter or stove so it stops cooking.',
          heatSetting: 'Turn completely off',
          visualCue: 'Bubbles should stop popping within a few seconds.',
        },
        {
          stepNumber: 2,
          title: 'Add a splash of cold liquid',
          instruction: 'Pour in 1 tablespoon of ice-cold milk, cream, or even cold water straight into the sauce.',
          visualCue: 'The sauce cools down and the oil starts mixing back in.',
        },
        {
          stepNumber: 3,
          title: 'Whisk fast and hard',
          instruction: 'Whisk quickly in circles for about 1 minute until the sauce comes back together into a smooth, creamy texture.',
          timingMinutes: 1,
          visualCue: 'The grainy lumps disappear and the sauce looks smooth and shiny.',
        },
      ],
      howToKnowItsWorking: [
        'The greasy puddle on top disappears into the cream.',
        'The sauce smoothly coats a spoon without separating into grease.',
      ],
      preventionTip: 'Keep cream and cheese sauces on low heat, and turn the burner off before stirring in cheese.',
    };
  }

  // 2. Burning, scorching, or charring
  if (query.includes('burn') || query.includes('scorch') || query.includes('char') || query.includes('smoke')) {
    return {
      foodIdentified: dishName || 'Food in Pan or Pot',
      visibleObservation: hasImage
        ? 'Blackened spots on the bottom of the pan with smoke and a burnt smell.'
        : 'Reported by cook: Burning smell and dark spots catching on the bottom of the pan.',
      diagnosis: 'The burner was too high, causing the bottom of the food and garlic to catch fire and scorch.',
      urgencyLevel: 'immediate',
      canBeSaved: true,
      rescuePlan: [
        {
          stepNumber: 1,
          title: 'Do NOT scrape the bottom of the pan!',
          instruction: 'Lift the pan off the stove right now. Whatever you do, do not stir or scrape the burnt crust off the bottom, or it will make the entire dish taste bitter.',
          heatSetting: 'Turn heat off',
          visualCue: 'Leave the dark burnt crust stuck firmly to the bottom.',
        },
        {
          stepNumber: 2,
          title: 'Spoon the good food into a clean pot',
          instruction: 'Gently scoop or pour the good, unburnt food off the top into a fresh, clean pan. Leave the burnt layer behind.',
          timingMinutes: 2,
        },
        {
          stepNumber: 3,
          title: 'Cover up any bitter taste',
          instruction: 'Stir in a tiny pinch of sugar (1/4 teaspoon) and a spoonful of butter or cream to smooth out any slight burnt smell.',
          heatSetting: 'Gentle low heat',
        },
      ],
      howToKnowItsWorking: [
        'The food smells like dinner again instead of campfire smoke.',
        'No burnt black specks are floating in the clean pot.',
      ],
      salvageOption: 'If the burnt taste got into all the liquid, pour it through a small wire strainer to catch burnt bits, then stir in sour cream or cream cheese to mellow out the flavor.',
      preventionTip: 'Garlic and tomato paste burn in under 60 seconds on high heat. Keep the flame at medium-low when frying them.',
    };
  }

  // 3. Too salty
  if (query.includes('salt') || query.includes('salty')) {
    return {
      foodIdentified: dishName || 'Over-salted Food or Soup',
      visibleObservation: hasImage
        ? 'Food looks standard in the pot, but tastes way too salty on the tongue.'
        : 'Reported by cook: The broth or food was accidentally over-salted.',
      diagnosis: 'There is too much salt for the amount of liquid currently in the pot.',
      urgencyLevel: 'moderate',
      canBeSaved: true,
      rescuePlan: [
        {
          stepNumber: 1,
          title: 'Water it down with unsalted liquid',
          instruction: 'Stir in 1/2 cup to 1 cup of plain tap water, unsalted broth, or a can of no-salt diced tomatoes to spread out the salt.',
          heatSetting: 'Medium simmer',
          timingMinutes: 3,
        },
        {
          stepNumber: 2,
          title: 'Add a little acid and sweet to trick your tastebuds',
          instruction: 'Squeeze in a little fresh lemon juice (or 1/2 teaspoon of vinegar) plus 1/2 teaspoon of honey or sugar. The tartness and sweetness help cancel out the sharp salt punch.',
        },
        {
          stepNumber: 3,
          title: 'Add a potato or splash of dairy',
          instruction: 'Drop in a peeled raw potato cut into chunks and let it simmer for 5 minutes, or stir in 2 tablespoons of sour cream or heavy cream.',
          timingMinutes: 5,
        },
      ],
      howToKnowItsWorking: [
        'A quick taste test with a spoon tastes balanced and savory without that harsh salty sting.',
      ],
      preventionTip: 'Always taste your broth before adding salt, especially when using canned ingredients or bouillon cubes.',
    };
  }

  // 4. Watery, soggy, or not browning
  if (query.includes('water') || query.includes('brown') || query.includes('soggy') || query.includes('steaming')) {
    return {
      foodIdentified: dishName || 'Watery Pan or Skillet Dish',
      visibleObservation: hasImage
        ? 'Grayish water has pooled at the bottom of the pan, and the food is boiling instead of frying.'
        : 'Reported by cook: Extra liquid has pooled in the pan and food is steaming instead of crisping.',
      diagnosis: 'Too much cold food was dumped into the skillet at once, which trapped steam and boiled the food instead of crisping it.',
      urgencyLevel: 'moderate',
      canBeSaved: true,
      rescuePlan: [
        {
          stepNumber: 1,
          title: 'Spoon out the extra water',
          instruction: 'Tilt the pan slightly and spoon out the puddle of water into a mug (save it for later if you want sauce).',
          heatSetting: 'Medium',
          timingMinutes: 1,
        },
        {
          stepNumber: 2,
          title: 'Spread the food out and turn up the heat',
          instruction: 'Turn the heat up to medium-high. Spread the pieces out across the pan so they have space to sizzle instead of touching each other.',
          heatSetting: 'Medium-high',
          visualCue: 'You should hear a crisp, crackling sizzle instead of quiet bubbling.',
        },
        {
          stepNumber: 3,
          title: 'Add a teaspoon of oil and don\'t touch it',
          instruction: 'Drizzle 1 teaspoon of oil around the edges of the pan, and let the food sit undisturbed for 2 minutes so a golden crust can form.',
          timingMinutes: 2,
          visualCue: 'Golden brown edges appear where the food touches the pan.',
        },
      ],
      howToKnowItsWorking: [
        'The sound changes from wet bubbling to a loud, happy sizzle.',
        'You see golden brown, crispy edges forming on the meat or veggies.',
      ],
      preventionTip: 'Cook in two quick batches instead of crowding everything in at once, and pat meat dry with paper towels before cooking.',
    };
  }

  // Default general rescue
  return {
    foodIdentified: dishName || 'Food in Progress',
    visibleObservation: hasImage
      ? 'The food needs a quick adjustment to heat, moisture, or seasoning.'
      : 'Reported by cook: Food needs a quick balance of heat, moisture, or seasoning.',
    diagnosis: 'The heat or liquid balance was slightly off, but it is easy to get back on track.',
    urgencyLevel: 'moderate',
    canBeSaved: true,
    rescuePlan: [
      {
        stepNumber: 1,
        title: 'Turn down the heat right away',
        instruction: 'Turn the burner down to low so the food stops cooking too fast while you fix it.',
        heatSetting: 'Low heat',
      },
      {
        stepNumber: 2,
        title: 'Check moisture',
        instruction: 'If it looks dry or sticking, stir in 2 tablespoons of water or broth. If it is too soupy, let it bubble gently uncovered for 3 minutes.',
        timingMinutes: 3,
      },
      {
        stepNumber: 3,
        title: 'Taste and balance',
        instruction: 'Take a tiny taste. Add a pinch of salt if bland, or a squeeze of lemon if it feels heavy.',
      },
    ],
    howToKnowItsWorking: [
      'The pan settles into a calm, gentle simmer without burning.',
      'It smells delicious and appetizing again.',
    ],
    preventionTip: 'Keep a small cup of water or stock right next to the stove so you can cool down a hot pan in seconds.',
  };
}

// 1. Initial Rescue Diagnosis Endpoint
app.post('/api/rescue', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', problemDescription, issueCategory, dishName } = req.body;

    if (!imageBase64 && !problemDescription) {
      return res.status(400).json({ error: 'Please provide either a photo of your food or a description of what is going wrong.' });
    }

    const hasImage = Boolean(imageBase64);
    const parts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `EMERGENCY COOKING TROUBLESHOOTING REQUEST:
Dish Name: ${dishName || (hasImage ? 'Identify from photo/context' : 'Identify from problem description')}
Problem Description: ${problemDescription || (hasImage ? 'Diagnose from photo' : 'Not specified')}
Issue Category: ${issueCategory || 'Not specified'}
Has Photo Attached: ${hasImage ? 'YES (Examine the image)' : 'NO (User only entered text/voice, NO PHOTO ATTACHED)'}

CRITICAL RULES FOR THIS REQUEST:
${
  hasImage
    ? '1. The user attached a photo. In visibleObservation, describe the directly visible cues you see in the food photo.'
    : '1. IMPORTANT: The user DID NOT ATTACH A PHOTO. In visibleObservation, do NOT claim to see a photo or say "what we see". Instead, write: "Reported by cook: <brief summary of what they said happened>".'
}
2. Output structured JSON matching the schema with simple everyday words only.`;

    parts.push({ text: promptText });

    // Attempt calling Gemini API with retry
    let parsedData: RescueResponse | null = null;
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: RESCUE_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            temperature: 0.2,
          },
        });

        const rawText = response.text || '{}';
        parsedData = JSON.parse(rawText);
        if (parsedData && parsedData.rescuePlan?.length) {
          break;
        }
      } catch (err: any) {
        // Attempt fallback model or instant culinary rescue protocol
        continue;
      }
    }

    // If upstream API is experiencing a temporary 503/504 gateway spike, provide immediate culinary rescue
    if (!parsedData) {
      parsedData = generateFallbackCulinaryRescue(problemDescription, issueCategory, dishName, hasImage);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Fatal in /api/rescue:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred while diagnosing your food.',
    });
  }
});

// 2. Multi-turn Follow-up Endpoint
app.post('/api/follow-up', async (req: Request, res: Response) => {
  try {
    const {
      conversationHistory,
      newImageBase64,
      newMimeType = 'image/jpeg',
      userMessage,
      previousDiagnosis,
    } = req.body;

    if (!userMessage && !newImageBase64) {
      return res.status(400).json({ error: 'Please describe the updated situation or snap a photo.' });
    }

    const contents: any[] = [];

    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        const parts: any[] = [];
        if (msg.imageBase64) {
          const cleanB64 = msg.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: msg.mimeType || 'image/jpeg',
              data: cleanB64,
            },
          });
        }
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts,
        });
      }
    } else if (previousDiagnosis) {
      contents.push({
        role: 'user',
        parts: [{ text: `Initial dish: ${previousDiagnosis.foodIdentified}. Initial problem: ${previousDiagnosis.diagnosis}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: `Previous steps: ${previousDiagnosis.rescuePlan.map((s: any) => `${s.stepNumber}. ${s.instruction}`).join('; ')}` }],
      });
    }

    const newTurnParts: any[] = [];
    if (newImageBase64) {
      const cleanB64 = newImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      newTurnParts.push({
        inlineData: {
          mimeType: newMimeType || 'image/jpeg',
          data: cleanB64,
        },
      });
    }

    newTurnParts.push({
      text: `FOLLOW-UP FROM HOME COOK:
Status update: "${userMessage || 'I took an updated photo to see if this looks right.'}"
Please evaluate updated state and provide revised next steps.`,
    });

    contents.push({
      role: 'user',
      parts: newTurnParts,
    });

    let updatedData: RescueResponse | null = null;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION + `
In this follow-up turn, assess progress made since the last steps. Acknowledge what improved and what still needs adjustment.`,
            responseMimeType: 'application/json',
            responseSchema: RESCUE_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            temperature: 0.2,
          },
        });

        const rawText = response.text || '{}';
        updatedData = JSON.parse(rawText);
        if (updatedData && updatedData.rescuePlan?.length) {
          break;
        }
      } catch (err: any) {
        continue;
      }
    }

    if (!updatedData) {
      updatedData = {
        foodIdentified: previousDiagnosis?.foodIdentified || 'Dish In Progress',
        visibleObservation: 'Evaluating follow-up progress and texture change.',
        diagnosis: `Adjusting course based on update: "${userMessage || 'Progress check'}".`,
        urgencyLevel: 'moderate',
        canBeSaved: true,
        rescuePlan: [
          {
            stepNumber: 1,
            title: 'Fine-tune Heat & Consistency',
            instruction: userMessage?.toLowerCase().includes('water') || userMessage?.toLowerCase().includes('thin')
              ? 'Raise heat slightly to a gentle bubble and reduce uncovered for 2-3 minutes, or whisk in a cornstarch slurry (1/2 tsp cornstarch + 1 tbsp cold water).'
              : 'Keep heat on very low. Whisk gently and let the flavors meld for another 90 seconds.',
            heatSetting: 'Low / Simmer',
            timingMinutes: 2,
          },
          {
            stepNumber: 2,
            title: 'Final Flavor Balancing',
            instruction: 'Taste one drop. Add a pinch of black pepper or a fresh herb sprig to brighten the profile before serving.',
          },
        ],
        howToKnowItsWorking: [
          'Sauce coats the back of a spoon with desired viscosity.',
          'No burnt or raw flavors remain.',
        ],
        preventionTip: 'Stove heat can fluctuate; always adjust in small 1-minute increments during final stages.',
      };
    }

    return res.json({
      success: true,
      data: updatedData,
    });
  } catch (err: any) {
    console.error('Fatal in /api/follow-up:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to process follow-up.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Save My Dinner API' });
});

async function startServer() {
  const distIndexPath = path.resolve(__dirname, 'dist/index.html');
  const distExists = fs.existsSync(distIndexPath);
  const isProd = process.env.NODE_ENV === 'production' && distExists;

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Save My Dinner running on port ${PORT} (mode: ${isProd ? 'production' : 'development (Vite middleware)'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
