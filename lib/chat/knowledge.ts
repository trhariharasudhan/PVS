/**
 * PVS Saree Helper — the knowledge the on-site chat answers from.
 *
 * Rule-based on purpose: every answer here is written and checked by PVS, so the helper
 * never invents prices, dates or promises. Anything it can't answer is handed to a human
 * on WhatsApp. To add an answer: add an entry with keywords in English, Tamil and the
 * Thanglish customers actually type (e.g. "vilai", "evlo").
 *
 * Business facts used here (confirmed by PVS):
 *  - every order is woven to order; no ready stock
 *  - the design is confirmed twice before weaving starts
 *  - 50% advance after confirmation, balance when the saree is ready
 *  - price is fixed by PVS on the quotation; bulk orders can be negotiated
 *  - 20+ years in silk weaving
 */

export type Lang = "en" | "ta";

export interface KbEntry {
  id: string;
  /** Lower-case keywords / phrases (English, Tamil, Thanglish). */
  keys: string[];
  q: Record<Lang, string>;
  a: Record<Lang, string>;
  /** Optional page to read more. */
  link?: { href: string; label: Record<Lang, string> };
}

export const KB: KbEntry[] = [
  {
    id: "how-order",
    keys: ["order", "how to order", "buy", "purchase", "book", "ஆர்டர்", "வாங்க", "eppadi order", "order panna", "order pannanum", "venum"],
    q: { en: "How do I order a saree?", ta: "புடவை எப்படி ஆர்டர் செய்வது?" },
    a: {
      en: "Three ways: 1) design it online on the Custom Order page (border, motifs, colours, silk, zari, photo upload), 2) call or WhatsApp us, or 3) visit the workshop in Panjakalipatti. We send a quotation, confirm the design twice with you, and weave after you approve.",
      ta: "மூன்று வழிகள்: 1) விருப்ப ஆர்டர் பக்கத்தில் ஆன்லைனில் டிசைன் செய்யுங்கள் (கரை, வடிவங்கள், நிறங்கள், பட்டு, ஜரிகை, படம்), 2) அழையுங்கள் அல்லது வாட்ஸ்அப் செய்யுங்கள், 3) பஞ்சகாளிப்பட்டி நெசவுக் கூடத்திற்கு நேரில் வாருங்கள். விலைப்பட்டியல் அனுப்பி, டிசைனை இரண்டு முறை உறுதி செய்து, நீங்கள் ஒப்புதல் தந்த பிறகே நெய்கிறோம்.",
    },
    link: { href: "/custom-order", label: { en: "Start a custom order", ta: "ஆர்டர் தொடங்குங்கள்" } },
  },
  {
    id: "price",
    keys: ["price", "cost", "rate", "how much", "budget", "quotation", "quote", "விலை", "எவ்வளவு", "vilai", "evlo", "evvalavu", "rate enna", "kammi"],
    q: { en: "What will my saree cost?", ta: "என் புடவைக்கு என்ன விலை?" },
    a: {
      en: "PVS fixes the price after seeing your design, silk type, silk % and zari grade — you don't have to guess a budget. You get a written quotation before anything is woven. For bulk and wholesale orders the price can be negotiated.",
      ta: "உங்கள் டிசைன், பட்டு வகை, பட்டு %, ஜரிகை தரம் பார்த்த பிறகு விலையை PVS நிர்ணயிக்கும் — நீங்கள் பட்ஜெட்டை ஊகிக்க வேண்டியதில்லை. நெய்வதற்கு முன் எழுத்துப்பூர்வ விலைப்பட்டியல் கிடைக்கும். மொத்த / அதிக எண்ணிக்கை ஆர்டர்களுக்கு விலையைப் பேசி முடிவு செய்யலாம்.",
    },
  },
  {
    id: "payment",
    keys: ["payment", "pay", "advance", "balance", "upi", "bank", "பணம்", "அட்வான்ஸ்", "முன்பணம்", "panam", "advance evlo", "half"],
    q: { en: "How does payment work?", ta: "பணம் எப்படிச் செலுத்துவது?" },
    a: {
      en: "We confirm your design twice first. Then 50% advance to start weaving, and the balance 50% when the saree is ready, before pickup or dispatch. For bulk orders the full balance is paid at the final delivery. Only pay to the account details on PVS's official invoice.",
      ta: "முதலில் டிசைனை இரண்டு முறை உறுதி செய்கிறோம். பிறகு நெசவு தொடங்க 50% அட்வான்ஸ்; புடவை தயாரானதும் — பெற்றுக்கொள்ள / அனுப்புவதற்கு முன் — மீதி 50%. மொத்த ஆர்டர்களுக்கு இறுதி டெலிவரியின் போது மீதித் தொகை. PVS அதிகாரப்பூர்வ இன்வாய்ஸில் உள்ள கணக்குக்கு மட்டுமே பணம் செலுத்துங்கள்.",
    },
  },
  {
    id: "confirm",
    keys: ["confirm", "approve", "change", "mistake", "wrong", "same as photo", "உறுதி", "ஒப்புதல்", "maathi", "change panna"],
    q: { en: "Will it come out the way I want?", ta: "நான் கேட்டது போலவே வருமா?" },
    a: {
      en: "That's why we double-confirm: first on the quotation (design, silk, zari, colours), then again on the final colour sample / design photo just before the warp goes on the loom. Changes are easy before that second confirmation; after weaving starts they usually aren't possible.",
      ta: "அதற்காகத்தான் இரண்டு முறை உறுதி செய்கிறோம்: முதலில் விலைப்பட்டியலில் (டிசைன், பட்டு, ஜரிகை, நிறம்), பிறகு பாவு தறியில் ஏறுவதற்கு முன் இறுதி நிற மாதிரி / டிசைன் படத்தில். இரண்டாவது உறுதிக்கு முன் மாற்றங்கள் எளிது; நெசவு தொடங்கிய பின் பொதுவாக முடியாது.",
    },
  },
  {
    id: "time",
    keys: ["how long", "time", "days", "weeks", "when", "delivery date", "urgent", "நாள்", "எவ்வளவு நாள்", "eppo", "evlo naal", "urgent ah"],
    q: { en: "How long does it take?", ta: "எவ்வளவு நாள் ஆகும்?" },
    a: {
      en: "It depends on the design and the season (wedding months are busy). We confirm the delivery date in writing with your quotation — tell us the date you need it by when you order, and we'll say honestly if it's possible.",
      ta: "டிசைன் மற்றும் சீசனைப் பொறுத்தது (திருமண மாதங்களில் அதிக வேலை). விலைப்பட்டியலுடன் டெலிவரி தேதியை எழுத்துப்பூர்வமாக உறுதி செய்கிறோம் — ஆர்டர் செய்யும்போது தேவைப்படும் தேதியைச் சொல்லுங்கள்; முடியுமா என்று நேர்மையாகச் சொல்வோம்.",
    },
  },
  {
    id: "minimum",
    keys: ["minimum", "one saree", "single", "moq", "quantity", "ஒரு புடவை", "குறைந்தபட்சம்", "oru saree", "1 saree"],
    q: { en: "Can I order just one saree?", ta: "ஒரே ஒரு புடவை ஆர்டர் செய்யலாமா?" },
    a: {
      en: "Families can ask for a single saree — tell us the quantity and we confirm it on the quotation. Shops and wholesale buyers: use the Wholesale page and we'll discuss quantities and pricing.",
      ta: "குடும்பங்கள் ஒரு புடவை கூடக் கேட்கலாம் — எண்ணிக்கையைச் சொல்லுங்கள், விலைப்பட்டியலில் உறுதி செய்வோம். கடைகள் / மொத்த வியாபாரிகள்: மொத்த விற்பனைப் பக்கத்தில் விசாரியுங்கள்; எண்ணிக்கையும் விலையும் பேசலாம்.",
    },
    link: { href: "/wholesale", label: { en: "Wholesale enquiry", ta: "மொத்த விற்பனை விசாரணை" } },
  },
  {
    id: "pure-silk",
    keys: ["pure silk", "original", "fake", "real silk", "silk mark", "burn test", "test", "தூய பட்டு", "ஒரிஜினல்", "போலி", "original ah", "pure ah"],
    q: { en: "How do I know it's pure silk?", ta: "தூய பட்டு என்று எப்படித் தெரியும்?" },
    a: {
      en: "From us: the silk type, silk % and zari grade are written on your order — what we write is what we weave. In general: pure silk feels warm and smooth, and a pulled thread burns slowly with a burnt-hair smell and leaves crushable ash; artificial fibres melt into hard beads. When buying pure silk anywhere, look for the Silk Mark label.",
      ta: "எங்களிடம்: பட்டு வகை, பட்டு %, ஜரிகை தரம் உங்கள் ஆர்டரில் எழுதப்படும் — எழுதியதையே நெய்கிறோம். பொதுவாக: தூய பட்டு தொட்டால் இதமாகவும் மென்மையாகவும் இருக்கும்; ஒரு நூலை எரித்தால் முடி எரியும் வாசனையுடன் மெதுவாக எரிந்து, நொறுங்கும் சாம்பல் தரும்; செயற்கை இழைகள் உருகிக் கடினமான உருண்டையாகும். எங்கு தூய பட்டு வாங்கினாலும் சில்க் மார்க் லேபிளைப் பாருங்கள்.",
    },
    link: { href: "/our-craft#guide", label: { en: "Silk & zari guide", ta: "பட்டு & ஜரிகை வழிகாட்டி" } },
  },
  {
    id: "silk-types",
    keys: ["silk type", "soft silk", "silk cotton", "art silk", "mulberry", "which silk", "சாஃப்ட் சில்க்", "சில்க் காட்டன்", "பட்டு வகை", "soft silk ah", "which one"],
    q: { en: "Which silk should I choose?", ta: "எந்தப் பட்டு தேர்ந்தெடுப்பது?" },
    a: {
      en: "Pure mulberry silk: richest lustre and drape — weddings and heirlooms. Soft silk: lighter and easy for long functions. Silk cotton: breathable, choose the silk % for comfort and price. Art silk / blends: affordable look-alike, not pure silk. Not sure? Pick 'Not sure' in the designer and we'll suggest one.",
      ta: "தூய மல்பெரி பட்டு: அதிக மெருகு, அழகான மடிப்பு — திருமணம், தலைமுறைப் புடவைகள். சாஃப்ட் சில்க்: இலகுவானது, நீண்ட விழாக்களுக்கு எளிது. சில்க் காட்டன்: காற்றோட்டம்; வசதிக்கும் விலைக்கும் ஏற்ற பட்டு %. ஆர்ட் சில்க் / கலவை: குறைந்த விலை, தூய பட்டு அல்ல. தெரியவில்லையா? டிசைனரில் 'தெரியவில்லை' என்று தேர்ந்தெடுங்கள்; பரிந்துரைக்கிறோம்.",
    },
  },
  {
    id: "zari",
    keys: ["zari", "jari", "gold", "silver", "tested zari", "pure zari", "half fine", "ஜரிகை", "ஜரி", "jarigai", "thanga"],
    q: { en: "What's the difference between zari types?", ta: "ஜரிகை வகைகளில் என்ன வித்தியாசம்?" },
    a: {
      en: "Pure zari: silver thread electroplated with gold — highest value, keeps resale value. Tested / half-fine zari: silver and gold-plated copper — durable and bright for less. Metallic / imitation zari: lowest cost, may dull over time. We explain each with your quotation.",
      ta: "தூய ஜரிகை: தங்க முலாம் பூசிய வெள்ளி இழை — அதிக மதிப்பு, மறுவிற்பனை மதிப்பு உண்டு. டெஸ்டட் / ஹாஃப்-ஃபைன்: வெள்ளி & தங்க முலாம் பூசிய செம்பு — நீடித்தது, குறைந்த விலையில் பளபளப்பு. மெட்டாலிக் / போலி ஜரிகை: மிகக் குறைந்த விலை, காலப்போக்கில் மங்கலாம். விலைப்பட்டியலுடன் ஒவ்வொன்றையும் விளக்குகிறோம்.",
    },
  },
  {
    id: "care",
    keys: ["wash", "care", "clean", "store", "dry clean", "iron", "maintain", "பராமரிப்பு", "துவைக்க", "இஸ்திரி", "wash panna", "eppadi vaikanum"],
    q: { en: "How do I wash and store a silk saree?", ta: "பட்டுப் புடவையை எப்படித் துவைத்து வைப்பது?" },
    a: {
      en: "Dry clean for the first few washes; avoid machines and hard water. Wrap it in cotton or muslin, not plastic. Refold along new lines every 2–3 months so zari doesn't crack. Keep perfume off the zari, air it in shade, and iron on low heat on the reverse with a cloth in between.",
      ta: "முதல் சில முறை ட்ரை க்ளீன் செய்யுங்கள்; வாஷிங் மெஷின், உப்புத் தண்ணீர் வேண்டாம். பருத்தி / மஸ்லின் துணியில் சுற்றி வையுங்கள் — பிளாஸ்டிக் வேண்டாம். ஜரிகை உடையாமல் இருக்க 2–3 மாதத்திற்கு ஒருமுறை மடிப்பை மாற்றுங்கள். வாசனைத் திரவியம் ஜரிகையில் படக் கூடாது; நிழலில் காற்றாட வையுங்கள்; குறைந்த சூட்டில் உள்பக்கமாக, இடையில் துணி வைத்து இஸ்திரி செய்யுங்கள்.",
    },
    link: { href: "/our-craft#care", label: { en: "Full care guide", ta: "பராமரிப்பு வழிகாட்டி" } },
  },
  {
    id: "motifs",
    keys: ["motif", "design", "peacock", "elephant", "annam", "lotus", "mango", "butta", "meaning", "மயில்", "யானை", "அன்னம்", "தாமரை", "மாங்காய்", "புட்டா", "design enna"],
    q: { en: "What do the motifs mean?", ta: "வடிவங்களின் அர்த்தம் என்ன?" },
    a: {
      en: "Peacock (mayil): beauty and grace. Elephant (yaanai): strength and prosperity — a favourite on bridal pallus. Annam (swan): wisdom and purity. Lotus (thamarai): auspiciousness. Mango (maangai / paisley): fertility and abundance. Rudraksha and chakram rows often sit in temple-style borders. You can pick any of them in the designer.",
      ta: "மயில்: அழகு, நளினம். யானை: வலிமை, செழிப்பு — மணப்பெண் முந்தானைகளில் பிரபலம். அன்னம்: ஞானம், தூய்மை. தாமரை: மங்களம். மாங்காய்: வளம், செழுமை. ருத்ராட்சம், சக்கர வரிசைகள் பெரும்பாலும் கோயில் கரைகளில் வரும். டிசைனரில் எதையும் தேர்ந்தெடுக்கலாம்.",
    },
    link: { href: "/what-we-weave#motifs", label: { en: "See the motifs", ta: "வடிவங்களைப் பாருங்கள்" } },
  },
  {
    id: "borders",
    keys: ["border", "korvai", "temple border", "rettai pettu", "ganga jamuna", "kattam", "கரை", "கோர்வை", "ரெட்டைப் பேட்டு", "கங்கா ஜமுனா", "karai"],
    q: { en: "What border styles can I choose?", ta: "என்ன கரை வகைகள் உள்ளன?" },
    a: {
      en: "Temple (gopuram) border, rettai pettu (double border), Ganga Jamuna (each side a different colour), vairaoosi (fine diamond dots), kattam (small checks) and slim modern borders. Korvai is the technique of weaving a contrast border and interlocking it with the body — ask us if you want it.",
      ta: "கோயில் (கோபுர) கரை, ரெட்டைப் பேட்டு (இரட்டைக் கரை), கங்கா ஜமுனா (இரு பக்கமும் வெவ்வேறு நிறம்), வைர ஊசி, கட்டம், மெல்லிய நவீன கரைகள். கோர்வை என்பது மாறுபட்ட நிறக் கரையைத் தனியாக நெய்து உடலுடன் பின்னும் முறை — வேண்டுமென்றால் கேளுங்கள்.",
    },
  },
  {
    id: "colour",
    keys: ["colour", "color", "shade", "match", "blouse", "நிறம்", "கலர்", "colour match", "color correct"],
    q: { en: "Will the colour match what I see on screen?", ta: "திரையில் பார்க்கும் நிறம் சரியாக வருமா?" },
    a: {
      en: "Screens show colours differently, so the final colour is confirmed on a real colour sample or photo before weaving (that's our second confirmation). You can also bring a blouse or cloth sample to match.",
      ta: "திரைகள் நிறங்களை வேறுபட்டுக் காட்டும்; எனவே நெசவுக்கு முன் உண்மையான நிற மாதிரி / படத்தில் இறுதி நிறத்தை உறுதி செய்கிறோம் (இதுதான் இரண்டாவது உறுதி). பொருத்திப் பார்க்க ரவிக்கை அல்லது துணி மாதிரியையும் கொண்டு வரலாம்.",
    },
  },
  {
    id: "length",
    keys: ["length", "size", "meter", "metre", "yards", "blouse piece", "நீளம்", "மீட்டர்", "ரவிக்கை", "evlo neelam"],
    q: { en: "How long is the saree? Is there a blouse piece?", ta: "புடவை நீளம் எவ்வளவு? ரவிக்கைத் துணி உண்டா?" },
    a: {
      en: "A standard silk saree is about 5.5 m plus a blouse piece of about 0.8 m. Because we weave to order, tell us if you need a different length or a contrast blouse — we confirm it on the quotation.",
      ta: "வழக்கமான பட்டுப் புடவை சுமார் 5.5 மீட்டர், அதோடு சுமார் 0.8 மீட்டர் ரவிக்கைத் துணி. ஆர்டருக்கு நெய்வதால், வேறு நீளம் அல்லது மாறுபட்ட நிற ரவிக்கை வேண்டுமென்றால் சொல்லுங்கள் — விலைப்பட்டியலில் உறுதி செய்வோம்.",
    },
  },
  {
    id: "delivery",
    keys: ["delivery", "courier", "ship", "send", "outside", "abroad", "டெலிவரி", "அனுப்ப", "courier panna", "veetuku"],
    q: { en: "Do you deliver?", ta: "டெலிவரி செய்வீர்களா?" },
    a: {
      en: "Yes — collect it from the workshop, or we arrange delivery to your home or store. The saree is folded into a PVS box and packed in a bag. Delivery terms are confirmed with the quotation.",
      ta: "ஆம் — நெசவுக் கூடத்தில் பெற்றுக்கொள்ளலாம், அல்லது வீடு / கடைக்கு அனுப்ப ஏற்பாடு செய்வோம். புடவை மடித்து PVS பெட்டியில் வைத்து பையில் பேக் செய்யப்படும். டெலிவரி விதிமுறைகள் விலைப்பட்டியலுடன் உறுதி செய்யப்படும்.",
    },
  },
  {
    id: "track",
    keys: ["track", "status", "where is my", "reference", "ref", "நிலை", "எங்கே", "status enna"],
    q: { en: "Where is my order?", ta: "என் ஆர்டர் எங்கே இருக்கிறது?" },
    a: {
      en: "Use your reference code (like PVS-7KQ2MX) and phone number on the Order Status page, or ask us on WhatsApp for a progress photo from the loom.",
      ta: "உங்கள் குறிப்பு எண் (PVS-7KQ2MX போல) மற்றும் தொலைபேசி எண்ணை ஆர்டர் நிலை பக்கத்தில் உள்ளிடுங்கள், அல்லது வாட்ஸ்அப்பில் தறியிலிருந்து முன்னேற்றப் படம் கேளுங்கள்.",
    },
    link: { href: "/order-status", label: { en: "Order status", ta: "ஆர்டர் நிலை" } },
  },
  {
    id: "visit",
    keys: ["visit", "address", "location", "where", "come", "direction", "map", "timing", "hours", "open", "முகவரி", "எங்கே", "வருகை", "neril", "address enna", "location enna"],
    q: { en: "Where are you? Can I visit?", ta: "நீங்கள் எங்கே? நேரில் வரலாமா?" },
    a: {
      en: "Yes! Raaja Veedhi, Panjakalipatti, Kalipatti, Salem district, Tamil Nadu 636455. Monday–Saturday, 9 AM – 8 PM. Please call or WhatsApp before coming, and bring photos of designs you like.",
      ta: "ஆம்! ராஜா வீதி, பஞ்சகாளிப்பட்டி, காளிப்பட்டி, சேலம் மாவட்டம், தமிழ்நாடு 636455. திங்கள்–சனி, காலை 9 – இரவு 8. வருவதற்கு முன் அழையுங்கள் அல்லது வாட்ஸ்அப் செய்யுங்கள்; பிடித்த டிசைன் படங்களைக் கொண்டு வாருங்கள்.",
    },
    link: { href: "/contact", label: { en: "Directions", ta: "வழி காட்டு" } },
  },
  {
    id: "about",
    keys: ["who", "about", "experience", "years", "since", "owner", "sathish", "எத்தனை வருடம்", "அனுபவம்", "yaaru", "evlo years"],
    q: { en: "Who is PVS?", ta: "PVS யார்?" },
    a: {
      en: "PVS is a silk saree weaving unit in Panjakalipatti, Salem district, led by Sathish Kumar, with 20+ years in silk weaving. We've grown step by step — supplying saree shops and wholesale buyers, and now weaving directly for families.",
      ta: "PVS — சேலம் மாவட்டம், பஞ்சகாளிப்பட்டியில் சதீஷ் குமார் நடத்தும் பட்டுப் புடவை நெசவுக் கூடம்; பட்டு நெசவில் 20+ ஆண்டுகள் அனுபவம். படிப்படியாக வளர்ந்து, புடவைக் கடைகளுக்கும் மொத்த வியாபாரிகளுக்கும் சப்ளை செய்து, இப்போது குடும்பங்களுக்கும் நேரடியாக நெய்கிறோம்.",
    },
    link: { href: "/about", label: { en: "Our story", ta: "எங்கள் கதை" } },
  },
  {
    id: "regions",
    keys: ["kanchipuram", "kanjivaram", "arani", "salem silk", "thirubuvanam", "kovai", "sungudi", "district", "காஞ்சிபுரம்", "ஆரணி", "திருபுவனம்", "சுங்குடி", "கோவை"],
    q: { en: "Do you make Kanchipuram / Arani style sarees?", ta: "காஞ்சிபுரம் / ஆரணி ஸ்டைல் புடவைகள் செய்வீர்களா?" },
    a: {
      en: "We weave sarees inspired by Tamil Nadu's regional styles — temple borders and grand pallus, light everyday silks, Salem's cream-and-gold silk and more. Names like Kanchipuram Silk and Arani Silk are GI-protected for those regions, so we describe ours as 'inspired by' and write the real materials on your order.",
      ta: "தமிழ்நாட்டின் பகுதி வாரியான ஸ்டைல்களால் ஈர்க்கப்பட்ட புடவைகளை நெய்கிறோம் — கோயில் கரை, கிராண்ட் முந்தானை, இலகுவான தினசரி பட்டு, சேலம் வெண்பட்டு போன்றவை. காஞ்சிபுரம் பட்டு, ஆரணி பட்டு போன்ற பெயர்கள் அந்தப் பகுதிகளுக்குப் புவிசார் குறியீடு (GI) பெற்றவை; எனவே எங்களுடையதை 'ஈர்க்கப்பட்ட' என்று சொல்லி, உண்மையான பொருட்களை ஆர்டரில் எழுதுகிறோம்.",
    },
    link: { href: "/what-we-weave#regions", label: { en: "Regional styles", ta: "பகுதி வாரியான ஸ்டைல்கள்" } },
  },
  {
    id: "occasion",
    keys: ["wedding", "bride", "muhurtham", "engagement", "function", "festival", "gift", "திருமணம்", "மணப்பெண்", "முகூர்த்தம்", "kalyanam", "marriage"],
    q: { en: "What's good for a wedding?", ta: "திருமணத்திற்கு எது நல்லது?" },
    a: {
      en: "For the bride, a pure mulberry silk with a temple or rettai pettu border and a grand pallu (elephant, peacock or annam) is the classic choice — arakku red, maroon, mustard or green-and-red Ganga Jamuna are popular. For family members, soft silk or silk cotton in matching colours works well. Try the 'Temple bride' starting design.",
      ta: "மணப்பெண்ணுக்கு, கோயில் அல்லது ரெட்டைப் பேட்டு கரையுடன், கிராண்ட் முந்தானையுடன் (யானை, மயில், அன்னம்) தூய மல்பெரி பட்டு பாரம்பரியத் தேர்வு — அரக்கு சிவப்பு, மெரூன், கடுகு நிறம், பச்சை-சிவப்பு கங்கா ஜமுனா பிரபலம். குடும்பத்தினருக்கு அதே நிறங்களில் சாஃப்ட் சில்க் அல்லது சில்க் காட்டன் நன்றாக இருக்கும். 'கோயில் மணப்பெண்' டிசைனில் தொடங்கிப் பாருங்கள்.",
    },
    link: { href: "/custom-order?preset=templeBride", label: { en: "Open 'Temple bride'", ta: "'கோயில் மணப்பெண்' திறக்க" } },
  },
  {
    id: "wholesale",
    keys: ["wholesale", "bulk", "shop", "retailer", "boutique", "reseller", "மொத்த", "கடை", "bulk order", "kadaiku"],
    q: { en: "Do you supply shops in bulk?", ta: "கடைகளுக்கு மொத்தமாக சப்ளை செய்வீர்களா?" },
    a: {
      en: "Yes — wholesale is our main business. Share your shop, city, quantities and designs on the Wholesale page. Bulk prices can be negotiated, and the full balance is paid at final delivery.",
      ta: "ஆம் — மொத்த விற்பனையே எங்கள் முக்கியத் தொழில். கடை, ஊர், எண்ணிக்கை, டிசைன்களை மொத்த விற்பனைப் பக்கத்தில் பகிருங்கள். மொத்த விலையைப் பேசி முடிவு செய்யலாம்; இறுதி டெலிவரியின் போது மீதித் தொகை.",
    },
    link: { href: "/wholesale", label: { en: "Wholesale enquiry", ta: "மொத்த விற்பனை விசாரணை" } },
  },
];

/** Suggested first questions shown as chips. */
export const STARTERS = ["how-order", "price", "payment", "pure-silk", "care", "occasion"];

function normalise(s: string) {
  return s.toLowerCase().replace(/[?!.,;:()"'’]/g, " ").replace(/\s+/g, " ").trim();
}

/** Best matching entry for a free-text question, or null. Longer keyword hits weigh more. */
export function findAnswer(question: string): KbEntry | null {
  const q = ` ${normalise(question)} `;
  let best: { e: KbEntry; score: number } | null = null;
  for (const e of KB) {
    let score = 0;
    for (const k of e.keys) {
      const key = normalise(k);
      if (!key) continue;
      if (q.includes(` ${key} `)) score += 2 + key.length / 6;
      else if (key.length >= 4 && q.includes(key)) score += 1 + key.length / 10; // Tamil suffixes, plurals
    }
    if (score > 0 && (!best || score > best.score)) best = { e, score };
  }
  return best && best.score >= 1.4 ? best.e : null;
}
