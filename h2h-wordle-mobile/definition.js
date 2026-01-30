// API endpoint to fetch word definitions
// This proxies the Free Dictionary API to avoid CORS issues

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { word } = req.query;
  
  if (!word) {
    return res.status(400).json({
      success: false,
      error: 'Word parameter is required'
    });
  }
  
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );
    
    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'Definition not found'
      });
    }
    
    const data = await response.json();
    const entry = data[0];
    
    // Extract and format the most relevant information
    const formatted = {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text || null,
      meanings: entry.meanings?.map(m => ({
        partOfSpeech: m.partOfSpeech,
        definition: m.definitions?.[0]?.definition,
        example: m.definitions?.[0]?.example || null,
        synonyms: m.synonyms?.slice(0, 5) || []
      })) || []
    };
    
    res.status(200).json({
      success: true,
      data: formatted
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch definition'
    });
  }
}