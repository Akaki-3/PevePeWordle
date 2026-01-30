// wordBank.js
// Clean + expand + auto-fix lengths for Wordle-style games (5–10)

// 1) Put your existing words in RAW_WORD_LISTS (even if some are wrong length)
// 2) Add new words into EXTRA_WORDS
// 3) WORD_LISTS is auto-cleaned, deduped, and re-bucketed by real length

const RAW_WORD_LISTS = {
  5: [
    "about","above","abuse","actor","acute","admit","adopt","adult","after","again",
    "agent","agree","ahead","alarm","album","alert","align","alike","alive","allow",
    "alone","along","alter","among","angel","anger","angle","angry","apart","apple",
    "apply","arena","argue","arise","array","arrow","aside","asset","audio","audit",
    "avoid","award","aware","badly","baker","bases","basic","basis","beach","began",
    "begin","begun","being","below","bench","billy","birth","black","blade","blame",
    "blank","blast","bleed","bless","blind","block","blood","bloom","blown","blues",
    "board","boost","booth","bound","bowel","boxer","brain","brand","brass","brave",
    "bread","break","breed","brief","bring","broad","broke","brown","build","built",
    "buyer","cable","calif","camel","canal","candy","canon","cargo","carry","carve",
    "catch","cause","cease","chain","chair","chaos","charm","chart","chase","cheap",
    "check","cheek","cheer","chess","chest","chief","child","china","chose","civil",
    "claim","class","clean","clear","click","cliff","climb","clock","clone","close",
    "cloth","cloud","clown","coach","coast","colon","color","couch","cough","could",
    "count","coupe","court","cover","crack","craft","crane","crash","crazy","cream",
    "creed","creek","crime","crisp","cross","crowd","crown","crude","curve","cycle",
    "daily","dairy","daisy","dance","dated","dealt","death","debut","delay","delta",
    "dense","depot","depth","derby","devil","diary","dicey","digit","dirty","disco",
    "ditch","diver","dizzy","dodge","doing","donor","donut","doubt","dough","draft",
    "drain","drank","drawl","drawn","dream","dress","dried","drier","drift","drill",
    "drink","drive","droit","drone","droop","drown","drugs","drums","drunk","dryer",
    "duly","dummy","dumps","dusty","dutch","duvet","dwarf","dwell","dying","eager",
    "eagle","early","earth","eight","eject","elbow","elder","elect","eleven","elite",
    "elope","elude","email","ember","empty","enact","endow","enemy","enjoy","enter",
    "entry","equal","equip","erase","erect","error","erupt","essay","ester","ethic",
    "evade","event","every","evict","evoke","exact","exalt","excel","exert","exile",
    "exist","expel","extra","exult","facet","faint","fairy","faith","false","fancy",
    "fatal","fatty","fault","favor","feast","fence","ferry","fetch","fever","fiber",
    "fibre","field","fiery","fifth","fifty","fight","filth","final","finch","first",
    "fishy","fixed","fixer","fjord","flack","flail","flair","flake","flaky","flame",
    "flank","flare","flash","flask","flesh","flick","flier","fling","flint","flirt",
    "float","flock","flood","floor","flora","flour","flout","flown","fluid","fluke",
    "flung","flunk","flush","flute","foamy","focal","focus","foggy","foist",

    "macro","magic","major","maker","march","match","maybe","mayor","medal","media",
    "mercy","metal","meter","micro","might","minor","model","money","month","moral",
    "motor","mount","mouse","mouth","movie","music",

    "naive","nasty","naval","nerve","never","night","noble","noise","north","novel",
    "nurse",

    "ocean","offer","often","onion","opera","order","other","ought","outer","owner",

    "panel","panic","paper","party","peace","phase","phone","photo","piece","pilot",
    "pitch","place","plain","plane","plant","plate","point","power","press","price",
    "pride","prime","print","prior","prize","proof","proud",

    "queen","quick","quiet","quite","quota",

    "radio","raise","range","rapid","ratio","reach","react","ready","refer","right",
    "rival","river","robot","rough","round","route","royal","rural",

    "scale","scene","scope","score","sense","serve","seven","shade","shake","shall",
    "shape","share","sharp","sheet","shelf","shift","shine","shirt","shock","shoot",
    "short","sight","since","skill","sleep","slice","small","smart","smile","smoke",
    "smooth","solid","solve","sorry","sound","south","space","spare","speak","speed",
    "spend","split","sport","staff","stage","stand","start","state","steam","steel",
    "stick","still","stock","stone","store","storm","story","strip","study","style",
    "sugar","super","sweet","swing","sword",

    "table","taste","teach","theme","there","thick","thing","think","third","those",
    "three","throw","tight","timer","today","topic","total","touch","tough","tower",
    "track","trade","train","treat","trend","trial","trust","truth","twice",

    "under","union","unity","upper","urban","usage","usual",

    "value","video","vital","voice","visit",

    "watch","water","wheel","where","which","while","white","whole","woman","world",
    "worry","worse","worst","worth","would","write","wrong",

    "young","youth",

    "zebra","zonal"
  ],

  // IMPORTANT: Your 6/7/8/9/10 lists contain many wrong-length items.
  // That's okay — we auto-fix by real length later.
  6: [
    "abacus","abbey","abdomen","abduct","abhors","abide","abject","ablaze","aboard","abodes",
    "abolish","abrupt","absent","absorb","absurd","abused","abyss","accent","accept","access",
    "accord","accrue","accuse","aching","acidic","across","acting","action","active","actual",
    "acuity","acumen","adamant","adapts","addend","addict","adding","addled","adhere","adipose",
    "adjust","admire","admits","adonis","adopts","adored","adorns","adrift","adults","advent",
    "adverb","adverse","advert","advice","advise","aerial","affair","affect","affirm","afford",
    "affray","afloat","afraid","afresh","agency","agenda","agiler","agility","agitate","agonize",
    "agreed","aiding","ailing","aiming","airbus","airily","airing","airman","airway","ajar",
    "albeit","albino","albums","alcove","alerts","aliens","alight","aligns","allied","allows",
    "allude","allure","almond","almost","alpine","already","alright","always","amazed","amazon",
    "ambers","ambled","ambush","amends","amount","ampere","ampler","amused","analog","anchor",
    "anemia","anemic","angels","angers","angled","angler","angles","angora","anguish","animal",
    "animus","anions","ankles","annals","annoys","annual","anodes","answer","anthem","antics",
    "antler","antrum","anvils","anyone","anyway","aortic","apache","apathy","apexes","aphids",
    "apiary","apiece","aplomb","apneas","apogee","apology","appall","appeal","appear","append",
    "applet","apples","aprons","aptest","arabic","arbiter","arcade","arcane","arched","archer",
    "arches","archly","arctic","ardent","ardors","areach","arenas","argent","argued","arguer",
    "argues","aright","arisen","arises","armada","armful","armies","arming","armlet","armory",
    "armour","armpit","aromas","around","arouse","arrays","arrest","arrive","arrows","arroyo",
    "arson","artful","artist","ascend","ascent","ashame","ashore","ashram","asides","asking",
    "asleep","aspect","aspens","aspire","assail","assays","assent","assert","assess","assets",
    "assign","assist","assize","assume","assure","asthma","astral","astray","astute","asylum",
    "ataxia","ataxic","atomic","atonal","atoned","atones","atonic","atrium","attach","attack",
    "attain","attend","attest","attics","attire","attune","auburn","audios","audits","augurs",
    "august","auntie","aurora","author","autism","autumn","avatar","avenge","avenue","averse",
    "averts","aviary","aviator","avider","avidly","avowed","awaits","awaken","awards","awhile",
    "awning","axeman","axioms","azalea","azures","babble","babied","babies","baboon","backed"
  ],

  7: [
    "abandon","general","abdomen","abeyance","ability","abolish","abraded","abrader","abrades","abreast","abridge",
    "abscess","abscond","absence","absent","absolve","absorbs","abstain","abstract","abusers","abusing",
    "abusive","abutter","academy","acceded","accedes","accents","accepts","acclaim","account","accrete",
    "accrual","accrued","accrues","accused","accuser","accuses","acerbic","acetate","achieve","achiest",
    "acidify","acidity","acknowl","acorns","acquire","acquits","acreage","acrobat","acronym","actable",
    "actings","actions","actives","actress","actuary","actuate","acutely","acutest","adapted","adapter",
    "adaptor","addable","addenda","addicts","additon","address","adduce","adduces","adducts","adenine",
    "adenoid","adeptly","adhered","adherer","adheres","adipose","adjoins","adjourn","adjudge","adjunct",
    "adjusted","adjured","adjures","admiral","admired","admirer","admires","admission","admixed","admixes",
    "adolescent","adopted","adopter","adorable","adorers","adoring","adorned","adrenal","adroits","adsorbs",
    "advance","adverse","adverts","advices","advised","adviser","advises","advisor","advocat","aerator",
    "aerials","aerobic","aethers","affairs","affects","affiant","affiche","affines","affirms","affixed",
    "affixes","afflict","affords","affrays","afghans","afreets","against","ageless","agencie","agenda",
    "agilely","agility","agitate","agonies","agonist","agonize","agrapha","aground","aileron","ailment",
    "aimless","airbags","airbase","airboat","airbors","aircrew","airfare","airflow","airfoil","airguns",
    "airlift","airline","airlock","airmail","airpark","airplay","airport","airship","airsick","airtime",
    "airwave","airwaves","aisles","aisleway","ajar","alamode","alarmed","alaskan","albumen","alchemy",
    "alcohol","alcoves","aldermen","alembic","alerted","alertly","alevels","algebra","aliases","alibied",
    "alibies","aligned","aligner","alights","aliment","alkalis","allayed","alleged","alleges","allegro",
    "allergy","alliums","allness","alloyed","alltime","alluded","alludes","allured","allurer","allures",
    "alluvia","almanac","almondy","almonds","almoner","almsful","aloetic","alpacas","already","alright",
    "altered","alterer","althaea","although","alumnae","alumnus","alveoli","amalgam","amassed","amasses",
    "amateur","amazing","ambient","amblers","ambling","ambroid","ambsace","ambular","ambushed","ambushes",
    "amended","amender","amenity","amiable","amiably","amidase","amidine","amongst","amorist","amoroso",
    "amorph","amounts","amperes","amplest","amplify","ampoule","ampulla","ampules","amusers","amusing",
    "amylase","amyloid","amylose","anagram","analogs","analogy","analyse","analyst","analyze"
  ],

  8: [
    "aardvark","abacuses","abandons","abasedly","abashing","abatable","abatement","abattoir","abbacies","abbatial",
    "abbesses","abdicate","abdomens","abducent","abducted","abductor","aberrant","abetment","abettals","abetters",
    "abetting","abettors","abeyance","abeyancy","abhorred","abhorrer","abidance","abiences","abiently","abjurers",
    "abjuring","ablating","ablation","ablative","ablators","ablegate","ableisms","ableists","abluents","ablution",
    "abnegate","abnormal","aboideau","aboiteau","abolish","abomasus","aborally","aborning","abortees","aborters",
    "aborting","abortion","abortive","aboulias","abounded","abrachia","abraders","abrading","abrasion","abrasive",
    "abreacts","abridged","abridger","abridges","abrogate","abrupter","abruptly","abscised","abscises","abscisin",
    "abscissa","absconds","absences","absented","absentee","absenter","absently","absinthe","absinths","absolute",
    "absolved","absolver","absolves","absorbed","absorber","abstains","abstract","abstrict","abstruse","absurdly",
    "abundant","abusable","abutment","abutilon","abutters","abutting","academia","academic","acalepha","acalephe",
    "acalephs","acanthus","acapnias","acaridan","acarines","acaudate","acauline","acaulose","acaulous","acceding"
  ],

  9: [
    "aardvarks","abaciscus","abamperes","abandoned","abandonee","abandoner","abasement","abashment","abatement","abattises",
    "abattoirs","abbacomes","abbotcies","abbotship","abdicable","abdicated","abdicates","abdicator","abdominal","abducente",
    "abducents","abducting","abduction","abductive","abductors","abearance","abecedary","aberrance","aberrancy","aberrants"
  ],

  10: [
    "aardwolves","abacterial","abactinal","abandonees","abandoners","abandoning","abasements","abashments","abatements","abbotships",
    "abbreviate","abdication","abdicative","abdicators","abdominals","abdominous","abducentes","abductions","aberdevine","aberrances",
    "aberrantly","aberrating","aberration","abeyancies","abhorrence","abhorrency","abiogenist","abjections","abjectness","abjunction"
  ]
};

// ✅ Add more words here (ANY LENGTH 5–10). They will be auto-sorted by real length.
const EXTRA_WORDS = [
  // --- 5-letter expansion ---
  "adore","adorn","aisle","altar","amaze","amber","amble","amend","amiss","amply",
  "annex","annoy","apron","arbor","ardor","aroma","ashen","atlas","attic","avail",
  "awoke","badge","banjo","barge","basil","baton","beard","belly","berry","binge",
  "bison","bland","bleak","blend","blimp","blurt","blush","bongo","briar","brine",
  "brink","brisk","broom","budge","bulky","bully","bumpy","burly","cabin","caper",
  "carol","caste","cedar","cello","chili","choir","cider","civic","comma","coral",
  "coven","cower","cramp","crave","crept","crypt","cumin","dandy","defer","deity",
  "demon","detox","diode","easel","ebony","edict","eerie","epoch","epoxy","feral",
  "fewer","fizzy","frost","fungi","gamer","gauge","gaunt","gecko","gnome","gloom",
  "glory","grape","graph","grasp","grind","groan","guest","gusto","haste","hatch",
  "heart","hedge","hefty","hinge","hoard","honey","hover","humid","idler","igloo",
  "inbox","ionic","irony","ivory","jaunt","jelly","jolly","jumbo","karma","kiosk",
  "knack","knelt","label","lanky","lemon","lever","linen","liver","lodge","logic",
  "lunar","lyric","mango","marsh","medic","mimic","mirth","mossy","myrrh","nanny",
  "niche","ninth","nudge","nylon","oasis","odder","olive","ombre","omega","opine",
  "orbit","otter","outdo","paddy","pagan","pansy","pearl","pecan","perch","pesto",
  "petal","piano","pinch","piper","plaid","plaza","plume","poise","poppy","pouch",
  "prank","prone","proxy","pupil","quack","quart","quest","radii","radar","rebel",
  "rebus","reign","reply","rhyme","ridge","rigid","rinse","risky","roast","rogue",
  "rusty","salsa","satin","sauna","scarf","scion","scoop","scout","shard","shiny",
  "shook","shove","siege","skate","skull","slant","slate","sleek","sleet","sling",
  "slump","smirk","snare","snarl","sneak","snoop","snout","spade","spice","spiky",
  "spine","spool","spout","sprig","spurt","squad","squib","stair","stark","stomp",
  "stout","stove","sully","sunny","surge","swarm","swept","tacit","tango","taunt",
  "tempo","tenet","thrum","tiger","tilde","toast","tonic","torus","trace","trait",
  "tramp","truce","trunk","tulip","tweak","twirl","uncle","unify","vapor","vault",
  "vegan","venom","vigor","vista","waltz","wharf","witty","woven","wrath","xenon",
  "yearn","yeast","yield","zesty",

  // --- 6-letter expansion (common) ---
  "backup","banana","banner","barrel","battle","beauty","became","become","before","behalf",
  "behave","behind","belong","better","beyond","border","bottle","branch","breath","bridge",
  "bright","broken","budget","burden","button","camera","campus","carbon","career","castle",
  "casual","center","chance","change","charge","choice","choose","church","circle","client",
  "closed","closer","coffee","column","combat","coming","common","cookie","copper","corner",
  "costly","county","couple","course","create","credit","custom","danger","dealer","debate",
  "decide","defeat","defend","define","degree","demand","depend","deputy","desert","design",
  "detail","device","differ","dinner","doctor","domain","double","dozens","during","easily",
  "effect","effort","either","energy","engine","enough","ensure","entire","equity","escape",
  "estate","ethics","evenly","except","expand","expect","expert","export","family","famous",
  "father","fellow","female","figure","finger","finish","follow","forest","forget","formal",
  "format","friend","future","garden","gather","genius","gentle","global","golden","growth",
  "guilty","hardly","health","height","honest","impact","import","income","indeed","injury",
  "inside","intend","invest","island","itself","junior","kernel","ladder","laptop","latest",
  "launch","lawyer","leader","league","legacy","lesson","letter","little","living","locate",
  "luxury","manage","manual","margin","market","master","matter","medium","member","memory",
  "method","mirror","mobile","modern","modest","moment","mother","motion","moving","muscle",
  "myself","native","nature","nearby","nearly","nobody","normal","notice","number","object",
  "office","online","option","orange","origin","output","parent","partly","people","period",
  "phrase","planet","player","please","pocket","police","policy","prefer","pretty","prince",
  "profit","proper","public","puzzle","random","rather","really","reason","record","reduce",
  "reform","regard","region","relate","remain","remove","repair","repeat","report","rescue",
  "resist","result","return","reveal","reward","rocket","safety","school","screen","search",
  "season","second","secure","senior","series","server","settle","severe","should","signal",
  "silent","silver","simple","singer","single","slight","social","source","speech","spirit",
  "spread","spring","square","stable","statue","strain","stream","street","strong","studio",
  "submit","sudden","summer","supply","switch","system","talent","target","tenant","thread",
  "throat","ticket","timely","toward","travel","treaty","trying","unique","useful","valley",
  "viewer","vision","volume","weapon","weekly","weight","window","winner","winter","within",
  "wonder","worker","writer","yellow"
];

// -------------------------
// Helpers
// -------------------------
function cleanWord(w) {
  if (!w) return null;
  const s = String(w).trim().toLowerCase();
  if (!/^[a-z]+$/.test(s)) return null;   // letters only
  if (s.length < 5 || s.length > 10) return null;
  return s;
}

function buildFixedLists(rawLists, extraWords) {
  const fixed = { 5: new Set(), 6: new Set(), 7: new Set(), 8: new Set(), 9: new Set(), 10: new Set() };

  // Re-bucket ALL words by actual length
  for (const arr of Object.values(rawLists)) {
    for (const w of arr) {
      const cw = cleanWord(w);
      if (cw) fixed[cw.length].add(cw);
    }
  }

  // Add extra words
  for (const w of extraWords) {
    const cw = cleanWord(w);
    if (cw) fixed[cw.length].add(cw);
  }

  // Convert to arrays (sorted for stable diffs)
  const out = {};
  for (const len of [5, 6, 7, 8, 9, 10]) {
    out[len] = Array.from(fixed[len]);
    out[len].sort();
  }
  return out;
}

export const WORD_LISTS = buildFixedLists(RAW_WORD_LISTS, EXTRA_WORDS);

// -------------------------
// API (same as yours)
// -------------------------
export function getRandomWord(length = 5) {
  const words = WORD_LISTS[length] || WORD_LISTS[5];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

export function getDailyWord(date = new Date()) {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0; // 32-bit
  }

  const lengths = [5, 6, 7, 8, 9, 10];
  const length = lengths[Math.abs(hash) % lengths.length];

  const words = WORD_LISTS[length];
  const index = Math.abs(hash) % words.length;

  return { word: words[index].toUpperCase(), length, date: dateStr };
}

export function isValidWord(word, length) {
  const words = WORD_LISTS[length];
  if (!words) return false;
  return words.includes(String(word).toLowerCase());
}

export function getWordStats() {
  return {
    5: WORD_LISTS[5].length,
    6: WORD_LISTS[6].length,
    7: WORD_LISTS[7].length,
    8: WORD_LISTS[8].length,
    9: WORD_LISTS[9].length,
    10: WORD_LISTS[10].length,
    total: Object.values(WORD_LISTS).reduce((sum, arr) => sum + arr.length, 0)
  };
}
