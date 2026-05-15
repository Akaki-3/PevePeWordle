// API endpoint for word definitions - both English and Georgian

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = new URL(req.url, `https://${req.headers.host}`);
  const word = url.searchParams.get('word')?.trim();
  const lang = url.searchParams.get('lang') || 'en';
  
  if (!word) {
    return res.status(400).json({
      success: false,
      error: 'Word parameter is required'
    });
  }
  
  try {
    if (lang === 'ka') {
      // Georgian - use Wiktionary API
      const wikiUrl = `https://ka.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=extracts&exintro=true&exsentences=2&explaintext=true&format=json`;
      
      console.log('Georgian definition fetch:', wikiUrl);
      
      const wikiRes = await fetch(wikiUrl);
      const wikiData = await wikiRes.json();
      
      console.log('Georgian wiki response:', JSON.stringify(wikiData).substring(0, 500));
      
      const pages = wikiData?.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      
      console.log('Georgian pageId:', pageId);
      
      if (pageId && pageId !== '-1') {
        const extract = pages[pageId].extract || '';
        
        // Extract first sentence as definition
        const sentences = extract.split(/[.!?]/).filter(s => s.trim());
        const definition = sentences[0]?.trim() || extract.substring(0, 200);
        
        return res.status(200).json({
          success: true,
          word: word,
          definition: definition,
          partOfSpeech: 'სახელი', // Default
          example: sentences[1]?.trim() || null,
          source: 'Wiktionary'
        });
      } else {
        // Try with common Georgian suffixes
        const variations = [word + 'ი', word + 'ს', word + 'მა', word + 'ები'];
        let foundDefinition = null;
        
        for (const variation of variations) {
          try {
            const wikiUrl2 = `https://ka.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(variation)}&prop=extracts&exintro&exsentences=2&explaintext&format=json`;
            const wikiRes2 = await fetch(wikiUrl2);
            const wikiData2 = await wikiRes2.json();
            const pages2 = wikiData2?.query?.pages || {};
            const pageId2 = Object.keys(pages2)[0];
            
            if (pageId2 && pageId2 !== '-1') {
              const extract2 = pages2[pageId2].extract || '';
              const sentences2 = extract2.split(/[.!?]/).filter(s => s.trim());
              foundDefinition = sentences2[0]?.trim() || extract2.substring(0, 200);
              word = variation; // Update word to the found one
              break;
            }
          } catch {}
        }
        
        if (foundDefinition) {
          return res.status(200).json({
            success: true,
            word: word,
            definition: foundDefinition,
            partOfSpeech: 'სახელი',
            example: null,
            source: 'Wiktionary'
          });
        }
        
        // Return fallback - always show something
        const commonGeorgianWords = {
          "სახლი": "a building where people live, home",
          "პური": "food made from grain, bread",
          "წყალი": "clear liquid essential for life, water",
          "ღამე": "the dark period between sunset and sunrise, night",
          "დილა": "early morning, before sunrise",
          "ქალაქ": "a large town or city",
          "კარი": "a movable barrier that blocks an opening, door",
          "თავი": "the upper part of the body containing the brain",
          "გული": "the organ that pumps blood, heart",
          "თვალი": "the organ of sight, eye",
          "ყური": "the organ of hearing, ear",
          "ხელი": "the part of the arm beyond the wrist, hand",
          "ფეხი": "the part of the leg below the ankle, foot",
          "დედა": "a female parent, mother",
          "მამა": "a male parent, father",
          "ბიჭი": "a male child, boy",
          "ქალი": "an adult female person, woman",
          "კაცი": "an adult male person, man",
          "გზა": "a route for travel, road",
          "ფული": "a medium of exchange for goods, money",
          "დრო": "the indefinite continued progress of existence, time",
          "დღე": "the period of light between sunrise and sunset, day",
          "ცა": "the space above the earth, sky",
          "მთა": "a high landform, mountain",
          "ზღვა": "a large body of salt water, sea",
          "ტყე": "an area covered with trees, forest",
          "მიწა": "the solid surface of the earth, ground"
        };
        
        // Try lowercase version
        const fallbackDef = commonGeorgianWords[word] || commonGeorgianWords[word.toLowerCase()] || `Georgian word with ${word.length} letters`;
        
        return res.status(200).json({
          success: true,
          word: word,
          definition: fallbackDef,
          partOfSpeech: 'სახელი',
          example: null,
          source: 'Fallback'
        });
      }
    } else {
      // English - use Dictionary API
      let dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
      
      let dictRes = await fetch(dictUrl);
      
      // If not found, try with different form (e.g., "scheduling" -> "schedule")
      if (!dictRes.ok) {
        const baseWord = word.toLowerCase().replace(/ing$/, '').replace(/ed$/, '');
        if (baseWord !== word.toLowerCase()) {
          dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${baseWord}`;
          dictRes = await fetch(dictUrl);
        }
      }
      
      if (!dictRes.ok) {
        // Return a generic message instead of 404 error
        return res.status(200).json({
          success: true,
          word: word,
          definition: `A common English word used in the game.`,
          partOfSpeech: "noun",
          example: null,
          source: 'Fallback'
        });
      }
      
      const data = await dictRes.json();
      const entry = data[0];
      
      if (!entry) {
        // Return success with fallback message
        return res.status(200).json({
          success: true,
          word: word,
          definition: `A common English word used in the game.`,
          partOfSpeech: "noun",
          example: null,
          source: 'Fallback'
        });
      }
      
      // Extract relevant info
      const firstMeaning = entry.meanings?.[0];
      const firstDef = firstMeaning?.definitions?.[0];
      
      return res.status(200).json({
        success: true,
        word: entry.word,
        definition: firstDef?.definition || 'No definition available',
        partOfSpeech: firstMeaning?.partOfSpeech || 'unknown',
        example: firstDef?.example || null,
        phonetic: entry.phonetic || null,
        source: 'Dictionary API'
      });
    }
  } catch (error) {
    console.error('Definition API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch definition',
      word: word
    });
  }
}