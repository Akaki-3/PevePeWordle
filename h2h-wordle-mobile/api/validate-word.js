// API endpoint to validate if a word exists (for game word checking)
// Debug version to find the issue

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = new URL(req.url, `https://${req.headers.host}`);
  const word = url.searchParams.get('word')?.trim();
  const lang = url.searchParams.get('lang') || 'en';
  
  console.log('=== Validate Word Debug ===');
  console.log('word:', word, 'lang:', lang);
  
  if (!word) {
    return res.status(400).json({
      valid: false,
      error: 'Word parameter is required'
    });
  }
  
  try {
if (lang === 'ka') {
      // Georgian script check - simple validation
      const georgianPattern = /^[\u10D0-\u10FF]+$/;
      const isGeorgian = georgianPattern.test(word);
      
      console.log('Validating Georgian word:', word, 'isGeorgian:', isGeorgian);
      
      if (!isGeorgian) {
        return res.status(200).json({ valid: false, word, reason: 'not georgian script' });
      }
      
      // Simple length validation - Georgian words can be 5-10 letters
      if (word.length < 5 || word.length > 10) {
        return res.status(200).json({ valid: false, word, reason: 'invalid length' });
      }

      // Wiktionary check (with error handling)
      try {
        const wikiUrl = `https://ka.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=pageprops&format=json`;
        console.log('Fetching:', wikiUrl);
        
        const wikiRes = await fetch(wikiUrl);
        
        if (!wikiRes.ok) {
          console.log('Wiki response not OK, using fallback');
          return res.status(200).json({ valid: true, word, source: 'fallback (network error)' });
        }
        
        const wikiData = await wikiRes.json();
        console.log('Wiki response keys:', Object.keys(wikiData));
        
        const pages = wikiData?.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        const isValid = pageId && pageId !== '-1';

        console.log('pageId:', pageId, 'isValid:', isValid);

        // If wiki doesn't find it, still allow it (Georgian words might not be in Wiktionary)
        return res.status(200).json({ valid: isValid || true, word, pageId, lang: 'ka', source: isValid ? 'Wiktionary' : 'Allowed' });
      } catch (err) {
        console.error('Wiki error:', err.message);
        // If any error - allow the Georgian word
        return res.status(200).json({ valid: true, word, source: 'fallback (exception)' });
      }
    }

      // Wiktionary check
      try {
        const wikiUrl = `https://ka.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=pageprops&format=json`;
        console.log('Fetching:', wikiUrl);
        
        const wikiRes = await fetch(wikiUrl);
        const wikiData = await wikiRes.json();
        console.log('Wiki response:', JSON.stringify(wikiData));
        
        const pages = wikiData?.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        const isValid = pageId && pageId !== '-1';

        console.log('pageId:', pageId, 'isValid:', isValid);

        return res.status(200).json({ valid: isValid, word, pageId, lang: 'ka' });
      } catch (err) {
        console.error('Wiki error:', err);
        // Wiktionary cannot be reached - allow Georgian script
        return res.status(200).json({ valid: true, word, source: 'fallback' });
      }
    } else {
      // English - check Dictionary API
      const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
      
      console.log('Fetching English:', dictUrl);
      
      const dictRes = await fetch(dictUrl);
      const isValid = dictRes.ok;
      
      console.log('Dict response ok:', isValid);

      // Try base form if not found
      if (!isValid) {
        const baseWord = word.toLowerCase().replace(/ing$/, '').replace(/ed$/, '').replace(/s$/, '');
        if (baseWord !== word.toLowerCase()) {
          const altUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${baseWord}`;
          const altRes = await fetch(altUrl);
          if (altRes.ok) {
            return res.status(200).json({
              valid: true,
              word: word,
              length: word.length,
              lang: 'en',
              source: 'Dictionary API (base form)'
            });
          }
        }
      }
      
      return res.status(200).json({
        valid: isValid,
        word: word,
        length: word.length,
        lang: 'en',
        source: isValid ? 'Dictionary API' : 'Not found'
      });
    }
  } catch (error) {
    console.error('Word validation error:', error);
    return res.status(200).json({
      valid: false,
      word: word,
      error: error.message
    });
  }
}