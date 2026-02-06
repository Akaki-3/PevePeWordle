// API endpoint for getting today's daily word
// This provides server-side daily word generation so users can't cheat

const WORD_LISTS = {
  5: [
    "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
    "agent", "agree", "ahead", "alarm", "album", "alert", "align", "alike", "alive", "allow",
    "alone", "along", "alter", "among", "angel", "anger", "angle", "angry", "apart", "apple",
    "apply", "arena", "argue", "arise", "array", "arrow", "aside", "asset", "audio", "audit",
    "avoid", "award", "aware", "badly", "baker", "bases", "basic", "basis", "beach", "began"
  ],
  6: [
    "abacus", "abbey", "abdomen", "abduct", "abhors", "abide", "abject", "ablaze", "aboard", "abodes",
    "abolish", "abrupt", "absent", "absorb", "absurd", "abused", "abyss", "accent", "accept", "access",
    "accord", "accrue", "accuse", "aching", "acidic", "across", "acting", "action", "active", "actual"
  ],
  7: [
    "abandon", "abdomen", "abeyance", "ability", "abolish", "abraded", "abrader", "abrades", "abreast", "abridge",
    "abscess", "abscond", "absence", "absent", "absolve", "absorbs", "abstain", "abstract", "abusers", "abusing"
  ],
  8: [
    "aardvark", "abacuses", "abandons", "abasedly", "abashing", "abatable", "abatement", "abattoir", "abbacies", "abbatial"
  ],
  9: [
    "aardvarks", "abaciscus", "abamperes", "abandoned", "abandonee", "abandoner", "abasement", "abashment", "abatement", "abattises"
  ],
  10: [
    "aardwolves", "abacterial", "abactinal", "abandonees", "abandoners", "abandoning", "abasements", "abashments", "abatements", "abbotships"
  ]
};

function getDailyWord(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash = hash & hash;
  }
  
  const lengths = [5, 6, 7, 8, 9, 10];
  const length = lengths[Math.abs(hash) % lengths.length];
  
  const words = WORD_LISTS[length];
  const index = Math.abs(hash) % words.length;
  
  return {
    word: words[index].toUpperCase(),
    length: length,
    date: dateStr
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const dailyData = getDailyWord();
  
  res.status(200).json({
    success: true,
    data: dailyData
  });
}