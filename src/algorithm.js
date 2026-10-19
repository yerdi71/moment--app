export const EMOTION_KEYWORDS = {
  joy: {
    strong: ['radość', 'radoś', 'szczęś', 'eufor', 'zachwyt', 'super', 'świetn', 'cudown'],
    medium: ['śmiech', 'śmiej', 'uśmiech', 'wesoł', 'dobr', 'przyjemn', 'ciesz'],
    weak: ['mił', 'fajn', 'ok', 'spoko'],
  },
  calm: {
    strong: ['spokój', 'spokoj', 'cisz', 'relaks', 'harmoni', 'wycisz', 'medytac'],
    medium: ['odpocz', 'cicho', 'oddech', 'woln', 'leniw'],
    weak: ['senn', 'lat', 'prost'],
  },
  power: {
    strong: ['sukces', 'udało', 'cel', 'osiągn', 'zwycięst', 'moc', 'sił'],
    medium: ['projekt', 'prac', 'wyzwani', 'motywac', 'działan'],
    weak: ['zaczy', 'próbu', 'idę', 'zrobi'],
  },
  thanks: {
    strong: ['dzięk', 'wdzięcz', 'docen', 'błogosław'],
    medium: ['lekcj', 'cenn', 'ważn', 'wartoś', 'naucz'],
    weak: ['może', 'chyba', 'warto'],
  },
  love: {
    strong: ['koch', 'miłoś', 'ukocha', 'serc', 'bliskoś'],
    medium: ['rodzin', 'przyjaci', 'córk', 'syn', 'mam', 'tat', 'bliscy'],
    weak: ['lubi', 'sympati', 'razem'],
  }
};

const NEGATIONS = ['nie', 'brak', 'bez', 'nigdy', 'wcale', 'żad'];
const CONTRAST_WORDS = ['ale', 'jednak', 'chociaż', 'mimo', 'przecież'];

export function analyzeEmotion(text) {
  if (!text || text.trim().length === 0) return { emotion: 'calm', intensity: 1 };
  
  const lowerText = text.toLowerCase().replace(/[^a-ząćęłńóśźż\s!]/g, '');
  const words = lowerText.split(/\s+/);
  
  let scores = { joy: 0, calm: 0, power: 0, thanks: 0, love: 0 };
  let firstSeen = { joy: 99, calm: 99, power: 99, thanks: 99, love: 99 };
  let contrastTriggered = false;
  let intensityMultiplier = 1;

  if (text.includes('!')) intensityMultiplier += (text.split('!').length - 1) * 0.5;
  if (text.match(/[A-ZĄĆĘŁŃÓŚŹŻ]{3,}/)) intensityMultiplier += 1;

  words.forEach((word, index) => {
    if (CONTRAST_WORDS.includes(word)) {
      contrastTriggered = true;
      return;
    }
    
    const isNegated = 
      (index > 0 && NEGATIONS.includes(words[index - 1])) ||
      (index > 1 && NEGATIONS.includes(words[index - 2]));

    let multiplier = isNegated ? -1 : 1;
    if (contrastTriggered && multiplier > 0) multiplier *= 2;

    Object.keys(EMOTION_KEYWORDS).forEach((emotion) => {
      const kws = EMOTION_KEYWORDS[emotion];
      const isStrong = kws.strong.some(kw => word.startsWith(kw));
      const isMedium = kws.medium.some(kw => word.startsWith(kw));
      const isWeak = kws.weak.some(kw => word.startsWith(kw));

      if (isStrong) { scores[emotion] += 3 * multiplier; if (firstSeen[emotion] === 99) firstSeen[emotion] = index; }
      else if (isMedium) { scores[emotion] += 2 * multiplier; if (firstSeen[emotion] === 99) firstSeen[emotion] = index; }
      else if (isWeak) { scores[emotion] += 1 * multiplier; if (firstSeen[emotion] === 99) firstSeen[emotion] = index; }
    });
  });

  let maxScore = -999;
  let detectedEmotion = 'calm';

  Object.keys(scores).forEach((emotion) => {
    if (scores[emotion] > maxScore) {
      maxScore = scores[emotion];
      detectedEmotion = emotion;
    } else if (scores[emotion] === maxScore && maxScore > 0) {
      if (firstSeen[emotion] < firstSeen[detectedEmotion]) detectedEmotion = emotion;
    }
  });

  let finalIntensity = 1;
  if (maxScore > 5) finalIntensity = 5;
  else if (maxScore > 3) finalIntensity = 4;
  else if (maxScore > 1) finalIntensity = 3;
  else if (maxScore > 0) finalIntensity = 2;
  finalIntensity = Math.min(5, Math.round(finalIntensity * intensityMultiplier));

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12 && detectedEmotion === 'calm') detectedEmotion = 'power';
  if (hour >= 22 && detectedEmotion === 'power') detectedEmotion = 'calm';

  return { emotion: detectedEmotion, intensity: finalIntensity };
}