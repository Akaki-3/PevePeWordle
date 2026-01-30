// wordBank.js
// Clean + expand + auto-fix lengths for Wordle-style games (5–10)
//
// ✅ “Real normal” words only (letters a-z, no hyphens/apostrophes, no weird/fake spellings)
// ✅ Your RAW lists can be messy (wrong-length, duplicates) — we auto-fix by real length
// ✅ Add words ONLY in EXTRA_WORDS (any length 5–10). They get cleaned, deduped, and sorted.

const RAW_WORD_LISTS = {
  // Your original 5s (kept)
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

  // Your original 6–10 (kept; auto-fixed by real length later)
  6: [
    "abacus","abbey","abdomen","abduct","abhors","abide","abject","ablaze","aboard","abodes",
    "abolish","abrupt","absent","absorb","absurd","abused","abyss","accent","accept","access",
    "accord","accrue","accuse","aching","acidic","across","acting","action","active","actual",
    "acuity","acumen","adamant","adapts","addend","addict","adding","addled","adhere","adipose",
    "adjust","admire","admits","adonis","adopts","adored","adorns","adrift","adults","advent",
    "adverb","adverse","advert","advice","advise","aerial","affair","affect","affirm","afford",
    "afloat","afraid","agency","agenda","agility","agonize","agreed","aiding","ailing","aiming",
    "albino","alcove","alerts","aliens","alight","aligns","allied","allows","allude","allure",
    "almond","almost","alpine","always","amazon","ambled","ambush","amount","anchor","anemia",
    "angels","angers","angled","angler","angles","angora","anguish","animal","ankles","annual",
    "answer","anthem","antics","antler","anyone","anyway","apache","apathy","apiary","apiece",
    "apogee","apology","appeal","appear","append","applet","apples","aprons","arabic","arbiter",
    "arcade","arcane","arched","archer","arches","arctic","ardent","arenas","argent","argued",
    "argues","arisen","arises","armada","armies","armlet","armory","armpit","aromas","around",
    "arouse","arrays","arrest","arrive","arrows","artful","artist","ascend","ascent","ashore",
    "asking","asleep","aspect","aspire","assert","assess","assets","assign","assist","assume",
    "assure","asthma","astral","astray","astute","asylum","atomic","atrium","attach","attack",
    "attain","attend","attest","attics","attire","attune","auburn","audios","audits","august",
    "auntie","aurora","author","autism","autumn","avatar","avenge","avenue","averse","averts",
    "aviary","aviator","avidly","avowed","awaits","awaken","awards","awhile","awning","axioms",
    "azalea","azures","babble","babied","babies","baboon","backed"
  ],
  7: [
    "abandon","abdomen","ability","academy","account","achieve","acquire","adapter","address","admiral",
    "advance","against","airport","alcohol","algebra","already","alright","altered","amateur","amazing",
    "anagram","analogy","analyze"
  ],
  8: [
    "aardvark","abacuses","abandons","abdicate","abdomens","abducted","abductor","absolute","abstract",
    "abundant","academic","acanthus"
  ],
  9: [
    "aardvarks","abandoned","abasement","abdominal","abduction","aberrants"
  ],
  10: [
    "aardwolves","abbreviate","abdication","aberration"
  ]
};

// ✅ Add more words here (ANY LENGTH 5–10). They will be auto-sorted by real length.
// NOTE: These are “normal/common-ish” words, spread across letters (not A-heavy).
const EXTRA_WORDS = [
  // -------------------------
  // 5-letter (balanced B–Z + useful A)
  // -------------------------
  "adore","adorn","aisle","altar","amaze","amber","amble","amend","amiss","amply",
  "annex","annoy","apron","arbor","ardor","aroma","ashen","atlas","attic","avail",

  "bacon","badge","basil","baton","beard","belly","berry","binge","bison","bland",
  "bleak","blend","blimp","blurt","blush","boost","bough","bride","brine","brink",
  "brisk","broom","budge","bulky","bully","bumpy","burly",

  "cabin","cacao","cache","candy","canoe","caper","cargo","carol","caste","cedar",
  "cello","chili","choir","cider","civic","comma","coral","coven","cower","cramp",
  "crave","crept","crypt","cumin",

  "dandy","defer","deity","demon","detox","diode","diner","dread","drove",

  "easel","ebony","edict","eerie","epoch","epoxy","evens",

  "fable","feral","fewer","fizzy","force","found","fraud","frost","fruit",

  "gamer","gauge","gaunt","gecko","genre","giant","glide","globe","gloom","glory",
  "glove","grace","grade","grain","grape","graph","grasp","great","grief","grind",
  "groan","group","guard","guess","guest","guide","guilty","gusto",

  "habit","hatch","haunt","heart","hedge","hefty","hinge","hobby","honey","honor",
  "hoard","horse","hotel","house","hover","human","humid","humor","hurry",

  "idler","igloo","image","imply","inbox","infer","input","irony","ivory",

  "jazzy","jelly","jolly","joker","judge","juicy","jumbo",

  "karma","kayak","kebab","kiosk","knack","kneel","knelt","known",

  "label","labor","lance","lanky","laser","laugh","layer","lemon","lever","light",
  "limit","linen","liver","lodge","loose","lucky","lunar","lunch","lyric",

  "mango","marsh","medic","mimic","mirth","mossy",

  "nanny","niche","ninth","nylon",

  "oasis","oddly","olive","ombre","omega","orbit","otter","outdo",

  "paddy","pagan","paint","pearl","pecan","perch","pesto","petal","piano","pinch",
  "piper","plaid","plaza","plume","poise","poppy","porch","pouch","prank","prone",
  "proxy","pupil",

  "quack","quart","query","quest",

  "radar","radii","ranch","relax","reply","rhyme","ridge","rigid","rinse","risky",
  "roast","rogue","rusty",

  "salsa","satin","sauna","scarf","scion","scoop","scout","screw","smirk","snack",
  "snare","snarl","sneak","snoop","snout","spade","spice","spiky","spine","spool",
  "spout","sprig","spurt","squad","stair","stark","stomp","stout","stove","sully",
  "sunny","surge","swarm","swept",

  "tacit","tango","taunt","tempo","tenet","thrum","tiger","tilde","toast","tonic",
  "torus","trace","trait","tramp","truce","truck","trunk","tulip","tweak","twirl",

  "uncle","unify",

  "vapor","vault","vegan","venom","venue","verse","vigor","villa","vivid",

  "waltz","weary","wharf","witty","woven","wrist","wrath",

  "xenon","xylem",

  "yearn","yeast","yield",

  "zesty","zippy",

  // -------------------------
  // 6-letter (balanced, common)
  // -------------------------
  "backup","banana","banner","barrel","battle","beauty","became","become","before","behalf",
  "behave","behind","belong","better","beyond","bishop","bitter","border","borrow","bottle",
  "bottom","branch","breach","breath","breeze","bright","broken","budget","bundle","burden",
  "butter","button",

  "camera","campus","cancel","cannon","carbon","career","carpet","carrot","castle","casual",
  "center","chance","change","charge","cheese","cherry","choice","choose","chorus","church",
  "circle","client","climate","closer","closet","coffee","column","combat","common","cookie",
  "copper","corner","costly","county","couple","course","create","credit","crisis","custom",

  "danger","dealer","debate","decide","defeat","defend","define","degree","demand","depend",
  "deputy","desert","design","detail","device","differ","dinner","doctor","domain","double",
  "dozens","driver","during",

  "easily","effect","effort","either","energy","engine","enough","ensure","entire","equity",
  "escape","estate","ethics","evenly","except","expand","expect","expert","export",

  "fabric","family","famous","father","fellow","female","figure","finger","finish","flight",
  "follow","forest","forget","formal","format","friend","future",

  "garden","gather","gentle","genius","global","golden","growth","guilty",

  "health","height","honest","hunger",

  "impact","import","income","indeed","injury","inside","intend","invest","island","itself",

  "junior","jungle",

  "kernel","kitten",

  "ladder","laptop","latest","launch","lawyer","leader","league","legacy","lesson","letter",
  "little","living","locate","lounge","luxury",

  "manage","manual","margin","market","master","matter","medium","member","memory","method",
  "mirror","mobile","modern","modest","moment","mother","motion","moving","muscle","museum",
  "mutual","myself",

  "native","nature","nearby","nearly","nobody","normal","notice","number",

  "object","office","online","option","orange","origin","output",

  "parent","partly","people","period","phrase","planet","player","please","plenty","pocket",
  "police","policy","prefer","pretty","prince","profit","proper","public","puzzle",

  "random","rather","really","reason","record","reduce","reform","regard","region","relate",
  "remain","remove","repair","repeat","report","rescue","resist","result","return","reveal",
  "reward","rocket",

  "safety","school","screen","search","season","second","secure","senior","series","server",
  "settle","severe","should","signal","silent","silver","simple","singer","single","slight",
  "social","source","speech","spirit","spread","spring","square","stable","statue","strain",
  "stream","street","strong","studio","submit","sudden","summer","supply","switch","system",

  "talent","target","tenant","thread","throat","ticket","timely","toward","travel","treaty",
  "trying",

  "unique","useful",

  "valley","viewer","vision","volume",

  "weapon","weekly","weight","window","winner","winter","within","wonder","worker","writer",

  "yellow","yonder","yogurt",

  "zephyr","zenith",

  // -------------------------
  // 7-letter (common)
  // -------------------------
  "balance","balloon","bandage","banking","barrier","battery","because","bedroom","believe","beneath",
  "benefit","besides","between","bicycle","billion","biology","blanket","boarding","breathe","browser",
  "builder","burning",

  "cabinet","caliber","calling","capable","capital","captain","capture","careful","carrier","cartoon",
  "catalog","caution","ceiling","central","century","certain","chamber","channel","chapter","charity",
  "cheaper","chicken","chronic","circuit","citizen","clarity","classic","closure","cluster","coastal",
  "collect","college","combine","comfort","command","comment","company","concert","connect","consent",
  "consume","contain","content","contest","context","control","convert","cooking","correct","costume",
  "council","counter","country","courage","crafted","creator","crimson","crucial","crystal","culture",
  "current","curtain",

  "decimal","decline","default","delayed","delight","deliver","density","deposit","deserve","despite",
  "details","develop","diamond","digital","disable","discuss","disease","display","district","diverse",
  "drawing","driving","dynamic",

  "edition","elegant","element","embrace","emotion","empower","endless","enhance","episode","essence",
  "ethical","evening","exactly","excited","exclude","exhibit","explore","express","extreme",

  "factory","falling","farming","fashion","feature","feeling","fiction","fighter","finding","firefly",
  "focused","forever","formula","fortune","forward","fragile","freedom","friendly","further",

  "gallery","gateway","genuine","gesture","gravity","greater","grocery","growing","guidance",

  "hacking","handler","harmony","healthy","helpful","heritage","holiday","housing",

  "illegal","illness","imagine","impress","improve","include","initial","inquiry","insight","install",
  "instant","instead","integer","intense","isolate",

  "journey","journal","justice",

  "kitchen","knowing",

  "landing","largest","lasting","laundry","leading","learner","leisure","library","license","limited",
  "listing","logical","loyalty","luggage",

  "machine","manager","mansion","married","massive","matured","meaning","measure","medical","meeting",
  "mention","message","minimal","mission","monitor","morning","musical","mystery",

  "natural","nearest","notable","nothing","nuclear","numeral",

  "obvious","offline","opening","opinion","optimal","organic","outside",

  "package","painting","parking","partial","passion","patient","pattern","payment","penalty","pension",
  "percent","perfect","perform","perhaps","physics","picture","pioneer","plastic","pleased","popular",
  "portion","poverty","premier","prepare","present","primary","printer","privacy","problem","process",
  "produce","profile","program","promise","protect","protein","protest","provide","purpose",

  "quality","quantum","quarter","quickly",

  "ranking","reached","reading","reality","receipt","recover","reflect","regular","related","release",
  "remains","request","require","resolve","respect","restore","reverse",

  "science","section","seeking","serious","service","setting","several","sharing","shelter","silence",
  "similar","sincere","skilled","smarter","society","somehow","sponsor","stadium","station","storage",
  "strange","stretch","student","success","suggest","support","surface","survive",

  "tactics","teacher","telling","texture","therapy","thought","thunder","timeless","together","tonight",
  "traffic","trainer","trouble","trusted",

  "uniform","unknown","unusual","upgrade",

  "variety","various","vehicle","venture","victory","vintage","virtual","visible",

  "walking","warning","wearing","weather","welcome","western","winning","without","working","writing",

  "zealous",

  // -------------------------
  // 8-letter (common)
  // -------------------------
  "backpack","banknote","baseball","bathroom","beautiful","beginning","benefits","bluebird","broadway","business",
  "calendar","campaign","capacity","celebrate","ceremony","champion","children","circular","cleaning","clickable",
  "computer","conclude","concrete","conflict","consider","consumer","continue","controls","creative","critical",
  "cultural","currency","customer",

  "database","daylight","deciding","decision","dedicate","delivers","describe","designer","detective","dialogue",
  "director","disabled","disagree","discover","distance","distinct","download","drawings","dynamics",

  "educated","election","electric","elements","elevator","emerging","emphasis","engaging","enhanced","equation",
  "estimate","evidence","exchange","exciting","exercise","exposure",

  "familiar","favorite","featured","feedback","festival","finished","flexible","floating","football","forecast",
  "foremost","fraction","friction","friendly","function","furniture",

  "generate","generous","greeting","guardian","guidance",

  "handsome","hardware","headline","heritage","historic","homepage","household",

  "identity","improved","included","increase","industry","infinite","instance","integral","interest","internal",
  "internet","involved",

  "keyboard","knockout",

  "language","learning","lifetime","limiting","listener","location","lunchbox",

  "magazine","majority","marriage","matching","material","measured","medicine","memories","midnight","minimize",
  "mobility","moderate","momentum","mountain","movement","multiple","musician","mysteries",

  "national","notebook","noticing","numerous",

  "observer","offering","official","operator","opponent","optional","ordinary","organize","outlined","outcomes",

  "painting","parallel","particles","password","personal","pleasant","possible","practice","presence","pressure",
  "previous","priority","probable","problems","processes","producer","progress","property","protocol","provider",

  "question","quietest",

  "reaction","recovery","register","relative","reliable","remember","repeated","required","resource","response",
  "revision",

  "schedule","security","sentence","separate","shipping","shopping","shoulder","signature","silently","slightly",
  "software","somebody","speaking","strategy","strength","struggle","stunning","subtlety","suggests","supplied",
  "survival","symbolic",

  "tactical","tensions","terrible","thinking","thousand","tracking","training","transfer","treasure","tutorial",
  "twisting",

  "ultimate","uncommon","universe","unlikely","upgraded",

  "vacation","validate","valuable","variance","vertical","victoria","viewpoint","visitors",

  "warnings","wearable","weekends","whenever","windmill","wireless","withdraw","wondered","workshop","writable",

  "yearbook","zoologic",

  // -------------------------
  // 9-letter (common)
  // -------------------------
  "blueprint","bookstore","breakdown","broadcast","budgeting","buildings","cafeteria","calculate","campaigns","candidate",
  "carefully","cathedral","celebrity","challenge","character","chemistry","childhood","community","companies","completed",
  "component","computers","conclusion","conference","connected","consumers","container","continuing","contracts","correctly",
  "counselor","creativity","criminals","currencies",

  "dangerous","databases","daydreams","dedicated","decisions","defensive","delicious","dependable","describing","designers",
  "detective","developed","developer","different","difficult","direction","discovery","discussed","displayed","documents",
  "duplicate",

  "education","effective","elections","electronic","employees","emotional","encourage","endurance","engineering","equipment",
  "essential","estimates","excellent","exception","exclusive","expansion","experience","exploring",

  "financial","following","formation","framework","functions","generally","generated","generator","geography","greatness",
  "guideline","happening","headphones","healthier","highlight","historical","household","humanity",

  "important","improving","increases","indicates","influence","innovation","institute","insurance","integrate","intensity",
  "interests","interview","introduce","invention","invisible",

  "knowledge","leadership","lifestyle","listening","locations","loneliness","materials","mechanism","medicines","membership",
  "messaging","modernize","molecules","movements","musicians","mysterious",

  "narrative","naturally","neighbor","nightmare","notebooks","notorious","numerical",

  "objective","observers","officials","operators","opponents","organisms","outstanding",

  "parameter","passenger","particles","patients","personals","phenomena","placement","platforms","political","portfolio",
  "positions","practices","precision","preference","principal","principle","priorities","processed","producer","profitable",
  "programmer","prominent","protected","providers","publishing",

  "qualities","questions","radiation","reasonable","receiving","recording","reduction","reference","reflected","regarding",
  "relations","remaining","remembered","repeating","reporting","requested","resources","responding","restricted","returning",
  "scheduling","secondary","selection","sensitive","sentences","separated","shoulders","signature","simplify","slightest",
  "solutions","somewhere","specially","specified","strategic","strengths","struggling","successful","suggestion","surprising",
  "sustained","symbolism",

  "technical","telephone","temporary","tendencies","testimony","thankful","threshold","tolerance","tradition","training",
  "transfered","transport","treasures","trustworthy","tutorials",

  "understand","universal","unlimited","upgrading",

  "variables","variation","viewpoints","volunteers",

  "wearables","welcoming","windmills","withdrawn","wonderful","workshops",

  "yardstick","zookeeper",

  // -------------------------
  // 10-letter (common)
  // -------------------------
  "background","basketball","capability","celebration","characters","checkpoint","components","conference","confidence","connection",
  "contribute","cooperation","curriculum",

  "dangerously","declaration","dedication","definitely","dependence","description","development","dictionary","difference","difficulty",
  "discipline","discussion","documented","downloading",

  "educational","electricity","electronics","employment","encouraged","engineering","enhancement","environment","equilibrium",
  "evaluation","everywhere","exceptional","excitement","experience","experiment","expression","extensions",

  "foundation","frameworks","friendship","functional","generation","government","guidelines",

  "headquarters","historical","households",

  "imagination","importance","incredible","independent","information","inspiration","institution","integration","intelligent",
  "interesting","interviewer","introduces","investigate","invitations",

  "leadership","lifestyles","limitation","literature","loneliness",

  "maintenance","marketplace","mathematics","methodology","microphone","motivation",

  "negotiator","nightmares",

  "observations","operations","opposition","organizing","outstanding",

  "partnership","passengers","performance","personality","photograph","population","possibility","preference","preparation",
  "priorities","production","professional","programming","progression","protection","publishing",

  "questioning","recognition","recommended","recreation","references","reflecting","regulation","relationship","remembering",
  "requirement","resolution","respectful","revolution",

  "sensitivity","separately","silhouette","simplified","strategies","successful","suggestions","supporting","surprising",

  "technology","television","temperature","terminology","thankfully","throughout","tournament","traditions","transported",

  "university","usefulness","validation","variations","vegetarian","volunteers",

  "waterproof","wilderness","wonderfully","workstation",

  "zoological"
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
