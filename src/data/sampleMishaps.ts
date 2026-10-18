import { SampleMishap } from '../types';

export const SAMPLE_MISHAPS: SampleMishap[] = [
  {
    id: 'broken-sauce',
    title: 'Split Cream Sauce',
    category: 'Too watery / Split',
    foodName: 'Garlic butter cream sauce',
    description: 'Turned up the burner and the sauce broke into yellow melted oil with little grainy clumps at the bottom.',
    mockHint: 'Butter melted into grease because the burner was too hot',
    previewImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23FFF6E5"/><stop offset="100%" stop-color="%23FEE2B3"/></linearGradient><linearGradient id="pan" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23374151"/><stop offset="100%" stop-color="%231F2937"/></linearGradient></defs><rect width="400" height="300" rx="24" fill="url(%23g1)"/><rect x="290" y="135" width="80" height="20" rx="10" fill="%234B5563"/><ellipse cx="190" cy="165" rx="125" ry="85" fill="%23111827" opacity="0.15"/><ellipse cx="190" cy="155" rx="120" ry="80" fill="url(%23pan)"/><ellipse cx="190" cy="155" rx="105" ry="68" fill="%23D97706"/><ellipse cx="185" cy="152" rx="85" ry="50" fill="%23F59E0B"/><circle cx="150" cy="140" r="16" fill="%23FEF3C7"/><circle cx="225" cy="160" r="22" fill="%23FEF3C7"/><circle cx="185" cy="130" r="12" fill="%23FFFBEB"/><circle cx="205" cy="170" r="10" fill="%23FDE68A"/><circle cx="130" cy="165" r="14" fill="%23FEF3C7"/><path d="M125 105 Q 135 80 145 95" stroke="%23F59E0B" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M245 100 Q 255 75 265 90" stroke="%23F59E0B" stroke-width="4" stroke-linecap="round" fill="none"/><text x="200" y="268" font-family="system-ui, sans-serif" font-size="15" fill="%2378350F" text-anchor="middle" font-weight="800">🧈 Oily &amp; Curdled Sauce</text></svg>',
  },
  {
    id: 'burning-garlic',
    title: 'Garlic Burning on Bottom',
    category: 'Burning',
    foodName: 'Tomato pasta sauce with garlic & onions',
    description: 'Walked away for 90 seconds. Garlic turned dark black and the bottom of the pot smells like it is catching fire.',
    mockHint: 'High flame scorching the garlic and sauce base',
    previewImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="bgFire" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23FEF2F2"/><stop offset="100%" stop-color="%23FEE2E2"/></linearGradient></defs><rect width="400" height="300" rx="24" fill="url(%23bgFire)"/><ellipse cx="200" cy="170" rx="125" ry="80" fill="%237F1D1D" opacity="0.12"/><ellipse cx="200" cy="160" rx="115" ry="72" fill="%231F2937"/><ellipse cx="200" cy="160" rx="100" ry="60" fill="%23DC2626"/><ellipse cx="200" cy="165" rx="75" ry="38" fill="%237F1D1D"/><circle cx="165" cy="150" r="14" fill="%23111827"/><circle cx="225" cy="155" r="16" fill="%23111827"/><circle cx="195" cy="170" r="12" fill="%2318181B"/><path d="M150 135 Q 160 85 170 70 Q 165 105 150 135" fill="%236B7280" opacity="0.45"/><path d="M220 140 Q 235 75 250 60 Q 240 100 220 140" fill="%236B7280" opacity="0.5"/><path d="M185 125 Q 195 70 205 55 Q 200 95 185 125" fill="%234B5563" opacity="0.4"/><text x="200" y="268" font-family="system-ui, sans-serif" font-size="15" fill="%23991B1B" text-anchor="middle" font-weight="800">🔥 Scorched Garlic &amp; Pot</text></svg>',
  },
  {
    id: 'watery-stirfry',
    title: 'Watery Soggy Stir-Fry',
    category: 'Not browning',
    foodName: 'Chicken and vegetable stir-fry',
    description: 'Dumped chicken and veggies in all at once. Instead of sizzling, a puddle of cloudy water formed and the chicken looks boiled.',
    mockHint: 'Too much food in the pan trapped steam and boiled the meat',
    previewImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="bgWater" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23F0FDFA"/><stop offset="100%" stop-color="%23CCFBF1"/></linearGradient></defs><rect width="400" height="300" rx="24" fill="url(%23bgWater)"/><ellipse cx="200" cy="165" rx="125" ry="80" fill="%23115E59" opacity="0.12"/><ellipse cx="200" cy="155" rx="115" ry="72" fill="%231E293B"/><ellipse cx="200" cy="155" rx="100" ry="60" fill="%2394A3B8"/><ellipse cx="200" cy="158" rx="80" ry="40" fill="%2338BDF8" opacity="0.4"/><rect x="140" y="135" width="38" height="24" rx="8" fill="%23E2E8F0"/><rect x="220" y="142" width="40" height="22" rx="8" fill="%23E2E8F0"/><ellipse cx="190" cy="168" rx="22" ry="12" fill="%2322C55E"/><circle cx="160" cy="165" r="13" fill="%23F97316"/><path d="M175 125 Q 180 80 185 65" stroke="%2338BDF8" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/><path d="M225 130 Q 230 85 240 70" stroke="%2338BDF8" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/><text x="200" y="268" font-family="system-ui, sans-serif" font-size="15" fill="%230F766E" text-anchor="middle" font-weight="800">🥦 Watery Boiled Stir-Fry</text></svg>',
  },
  {
    id: 'salty-soup',
    title: 'Way Too Salty Soup',
    category: 'Too salty',
    foodName: 'Beef & vegetable soup',
    description: 'Accidentally poured in too much salt. The broth smells delicious but burns the tongue with salt.',
    mockHint: 'Too much salt for the amount of broth in the pot',
    previewImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="bgSoup" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23FFFBEB"/><stop offset="100%" stop-color="%23FEF3C7"/></linearGradient></defs><rect width="400" height="300" rx="24" fill="url(%23bgSoup)"/><ellipse cx="200" cy="165" rx="120" ry="75" fill="%2378350F" opacity="0.12"/><ellipse cx="200" cy="155" rx="110" ry="68" fill="%23B45309"/><ellipse cx="200" cy="155" rx="95" ry="55" fill="%2378350F"/><circle cx="160" cy="148" r="16" fill="%2392400E"/><circle cx="230" cy="152" r="14" fill="%23EA580C"/><circle cx="190" cy="165" r="12" fill="%23CA8A04"/><g transform="translate(260, 60) rotate(25)"><rect width="32" height="50" rx="8" fill="%23CBD5E1"/><rect x="4" y="4" width="24" height="12" rx="4" fill="%2394A3B8"/><circle cx="16" cy="10" r="2" fill="%23FFFFFF"/><circle cx="11" cy="10" r="1.5" fill="%23FFFFFF"/><circle cx="21" cy="10" r="1.5" fill="%23FFFFFF"/><circle cx="16" cy="65" r="3" fill="%23FFFFFF" opacity="0.9"/><circle cx="22" cy="75" r="2.5" fill="%23FFFFFF" opacity="0.8"/><circle cx="10" cy="80" r="3" fill="%23FFFFFF" opacity="0.9"/><circle cx="18" cy="90" r="2" fill="%23FFFFFF" opacity="0.7"/></g><text x="200" y="268" font-family="system-ui, sans-serif" font-size="15" fill="%2392400E" text-anchor="middle" font-weight="800">🧂 Salt Bomb in Broth</text></svg>',
  },
];
