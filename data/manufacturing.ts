import { ManufacturingStage, LoomSpec } from "@/types";

export const manufacturingStages: ManufacturingStage[] = [
  {
    id: 1,
    stageNumber: "01",
    title: "Raw Material Sourcing",
    tamilName: "பட்டு நூல் தேர்வு (Raw Silk Selection)",
    tagline: "Uncompromised Grade-A Mulberry Silk & Fine Zari",
    description:
      "Every PVS Silk S creation starts with authentic Grade-A pure mulberry silk yarns and certified tested metallic and pure silver-gilded zari reels. Yarns are tested for tensile strength, luster, and denier uniformity before processing.",
    technicalDetails: [
      "Grade-A Mulberry Silk filament selection",
      "Tested metallic and silver electroplated zari",
      "Denier calibration for uniform drape thickness",
      "Moisture testing and raw fiber inspection",
    ],
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Raw Mulberry Silk Hank and Yarn Testing",
    durationOrMetric: "100% Tested Pure Silk",
  },
  {
    id: 2,
    stageNumber: "02",
    title: "Yarn Preparation & Dyeing",
    tamilName: "சாயமேற்றுதல் (Hank Dyeing & Warping)",
    tagline: "Eco-Conscious Fast Color Chemistry",
    description:
      "Silk hanks undergo thorough degumming to reveal natural sheen, followed by precision temperature-controlled hank dyeing. Skilled dyers master color recipes to achieve rich, long-lasting hue depths resistant to fading.",
    technicalDetails: [
      "Hot bath degumming to remove sericin silk gum",
      "Azo-free eco-friendly reactive & acid dyestuffs",
      "Colorfastness testing under high-temperature steam",
      "Warp winding across large drum sectional warpers",
    ],
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Vibrant Silk Yarn Hanks & Dyeing Process",
    durationOrMetric: "Over 48+ Shade Formulations",
  },
  {
    id: 3,
    stageNumber: "03",
    title: "Loom Setup & Weaving",
    tamilName: "நெசவு முறை (Precision Loom Weaving)",
    tagline: "Where the Silk Saree Takes Shape",
    description:
      "Thousands of individual warp ends are meticulously drawn through heddles and reeds on high-precision looms. Experienced master weavers coordinate shuttles and tension beams with rhythmic precision.",
    technicalDetails: [
      "Over 4,800 to 7,200 individual warp yarn ends",
      "Electronic Jacquard harness card integration",
      "Controlled warp beam let-off tension",
      "Continuous shuttle weft insertion at optimal beat-up",
    ],
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Weaving Loom in Action with Silk Warp and Weft",
    durationOrMetric: "120 - 150 Hours per Masterpiece",
  },
  {
    id: 4,
    stageNumber: "04",
    title: "Design & Zari Border Crafting",
    tamilName: "ஜரிகை பார்டர் வேலைப்பாடு (Zari & Jacquard Motifs)",
    tagline: "Intricate Heritage Motifs & Sharp Definition",
    description:
      "Jacquard systems guide intricate motifs such as temple spires (Gopuram), Peacocks (Mayil), Rudraksham, and Floral Jaal across the border and pallu sections, locking the gold zari threads flawlessly into the silk structure.",
    technicalDetails: [
      "Precision CAD punch-card motif translation",
      "Korvai three-shuttle border interlocking simulation",
      "Zari float length control to prevent snagging",
      "Contrast border thread locking technology",
    ],
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Intricate Zari Border and Temple Motif Weaving",
    durationOrMetric: "Sub-millimeter Zari Precision",
  },
  {
    id: 5,
    stageNumber: "05",
    title: "Post-Weave Finishing",
    tamilName: "முடிவு முறை (Calendering & Steam Finishing)",
    tagline: "Silken Touch, Flawless Softness & Luster",
    description:
      "Freshly unwoven sarees undergo meticulous surface shearing, selvage trimming, and controlled steam pressing to achieve smooth drape flow, buttery hand feel, and uniform fabric stability.",
    technicalDetails: [
      "Micro-shearing of extra float threads on reverse side",
      "Controlled steam calendering for natural silk shine",
      "Selvage alignment and tension settling",
      "Anti-crease soft finish conditioning",
    ],
    image: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Silk Saree Steam Finishing and Smoothing",
    durationOrMetric: "100% Non-Chemical Luster Treatment",
  },
  {
    id: 6,
    stageNumber: "06",
    title: "Rigorous Quality Inspection",
    tamilName: "தர பரிசோதனை (Double-Check Quality Control)",
    tagline: "Zero Defect Standard for Every Saree",
    description:
      "Every single meter of saree fabric is manually inspected on backlit inspection tables by senior quality checkers, examining weaving uniformity, color continuity, zari consistency, and dimensions.",
    technicalDetails: [
      "Backlit table scrutiny for broken picks & reed marks",
      "Zari luster uniformity & joint check",
      "Exact length (5.5m) and width (48 inches) verification",
      "Blouse piece attachment verification",
    ],
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Quality Master Examining Saree Weave Consistency",
    durationOrMetric: "18-Point Quality Checklist",
  },
  {
    id: 7,
    stageNumber: "07",
    title: "Finished Saree & Luxury Packaging",
    tamilName: "பட்டுச் சேலை & பேக்கேஜிங் (Final Presentation)",
    tagline: "Ready for Boutiques, Brides & Global Showrooms",
    description:
      "Approved sarees are carefully folded with protective acid-free butter paper, tagged with authentic batch codes, and placed into premium moisture-resistant presentation boxes or bulk wholesale bales.",
    technicalDetails: [
      "Traditional folding with minimal crease stress",
      "Acid-free barrier paper for zari protection",
      "Serial barcoding and batch identification",
      "Export-grade moisture-shielded packaging",
    ],
    image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Folded Luxury Silk Saree Ready for Presentation",
    durationOrMetric: "Boutique & Export Ready",
  },
];

export const loomMachineSpecs: LoomSpec[] = [
  {
    name: "High-Tension Electronic Jacquard Looms",
    type: "Advanced Textile Weaving Machinery",
    precision: "Up to 2,688 Electronic Hook Jacquard Control",
    capacity: "Continuous Multi-Color Weft Insertion",
    speciality: "Complex Temple Borders, Floral Jaal & Grand Pallu Architecture",
    description:
      "Our factory floor is equipped with high-precision electronic jacquard looms capable of executing intricate mathematical textile algorithms. Every warp thread is individually orchestrated to render crisp motifs without distortion.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Traditional Shuttle Looms for Korvai Weaves",
    type: "Heritage Interlocking Loom Setup",
    precision: "Three-Shuttle Dual Weaver Synchronization",
    capacity: "Artisanal Heavy Silk & Pure Gold Zari",
    speciality: "Authentic Korvai Contrast Borders & Heavy Bridal Drapes",
    description:
      "Dedicated to preserving the unmatched charm of traditional South Indian weaves, our specialized shuttle looms enable simultaneous multi-shuttle weaving for solid contrast borders and unstitched body junctions.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
  },
];

export const qualityPillars = [
  {
    title: "DESIGN",
    subtitle: "Thoughtful Textile & Border Design",
    description:
      "Balancing centuries-old Dravidian temple architecture, mythological motifs, and contemporary color sensibilities to create everlasting designs.",
  },
  {
    title: "WEAVING",
    subtitle: "Careful Weaving Through Production",
    description:
      "Tension-calibrated looms and veteran weavers ensure zero warp breakage, rich body density, and even selvage alignment throughout the 5.5 meters.",
  },
  {
    title: "FINISHING",
    subtitle: "Attention to Final Appearance & Feel",
    description:
      "Steam-finished without synthetic stiffeners to preserve the soft, natural biological drape of pure mulberry silk that feels gentle against the skin.",
  },
  {
    title: "QUALITY",
    subtitle: "Inspection Before Customer Delivery",
    description:
      "Rigorous 18-point inspection verifying silk purity, zari continuity, dimensional accuracy, and color uniformity prior to dispatch.",
  },
];
