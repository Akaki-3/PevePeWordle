// API endpoint to fetch Georgian words from Wiktionary categories

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = new URL(req.url, `https://${req.headers.host}`);
  const length = parseInt(url.searchParams.get('length')) || 5;

  try {
    // Georgian Wiktionary uses Georgian category names
    const categories = [
      "ქართული არსებითი სახელები",
      "ქართული ზედსართავი სახელები", 
      "ქართული ზმნები",
      "Georgian nouns",
      "Georgian_nouns"
    ];
    
    let allWords = [];
    for (const cat of categories) {
      try {
        const wikiUrl = `https://ka.wiktionary.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}&cmlimit=500&cmnamespace=0&format=json&origin=*`;
        const wikiRes = await fetch(wikiUrl);
        if (!wikiRes.ok) continue;
        const wikiData = await wikiRes.json();
        const members = wikiData?.query?.categorymembers?.map(m => m.title) || [];
        if (members.length > 0) {
          allWords = [...allWords, ...members];
          console.log(`Found ${members.length} words from category: ${cat}`);
        }
      } catch (e) {
        console.log(`Category ${cat} failed:`, e.message);
      }
    }

    // Also try a search-based approach for more words
    if (allWords.length < 20) {
      try {
        const searchUrl = `https://ka.wiktionary.org/w/api.php?action=query&list=allpages&apnamespace=0&aplimit=500&apfrom=ა&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const pages = searchData?.query?.allpages?.map(p => p.title) || [];
          allWords = [...allWords, ...pages];
        }
      } catch (e) {}
    }
    
    // Remove duplicates
    allWords = [...new Set(allWords)];
    
    // Filter: correct length + Georgian characters only
    const georgianPattern = /^[\u10D0-\u10FF]+$/;
    const filtered = allWords.filter(w => {
      const clean = w.trim();
      return clean.length === length && georgianPattern.test(clean);
    });

    console.log(`Returning ${filtered.length} Georgian words of length ${length}`);

    return res.status(200).json({
      success: true,
      words: filtered,
      length,
      total: filtered.length
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
