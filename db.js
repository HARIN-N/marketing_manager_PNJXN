// js/db.js
//
// ============================================================================
// MOCK DATA LAYER
// ----------------------------------------------------------------------------
// This file is the ENTIRE data layer for the current build of Marketing OS.
// It is clearly a mock: it seeds realistic demo data on first run and persists
// every change to the browser's localStorage, so the app is genuinely
// interactive (create/edit/delete really works) without a server.
//
// It is NOT connected to Supabase / PostgreSQL. There is no real multi-user
// sync, no auth, no Row Level Security enforcement here.
//
// WHY IT'S STRUCTURED THIS WAY
// Every exported function below (listClients, addTask, getBrandBrain, ...)
// is written as `async` and returns plain JSON-shaped objects on purpose,
// matching what a Supabase client call (`await supabase.from(...).select()`)
// would return. When the real backend is wired up (see README "Connecting
// Supabase"), this file is the ONLY file that should need to change -
// every page's *.js file calls these functions, never localStorage directly.
// ============================================================================

const STORAGE_KEY = "marketingos_db_v1";

// ---------------------------------------------------------------------------
// SEED DATA (demo only - clearly separated from the engine below)
// ---------------------------------------------------------------------------
const SEED = buildSeed();

function buildSeed() {
  const clients = [
    {
      id: "cl_mosaic",
      name: "Mosaic Hotels",
      industry: "Hospitality",
      businessType: "Boutique hotel group",
      logoText: "MH",
      status: "Active",
      services: ["Content", "Social Media", "SEO", "Meta Ads", "Reporting"],
      platforms: ["Instagram", "Facebook", "Google Business Profile"],
      targetAudience: "Affluent slow-travellers, 30-55, seeking nature-adjacent luxury",
      goals: ["Brand awareness", "Direct bookings", "Occupancy in shoulder season"],
      website: "https://mosaichotels.example.com",
      social: { instagram: "@mosaichotels", facebook: "mosaichotels", linkedin: "", youtube: "" },
      location: "Kerala & Karnataka, India",
      timezone: "Asia/Kolkata",
      accountManager: "Ananya Rao",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "Kabir Sinha",
      adsManager: "Priya Iyer",
      contact: { name: "Sameer Kapoor", email: "sameer@mosaichotels.example.com", phone: "+91 98450 11223" },
      startDate: "2025-01-14",
      notes: "Prefers WhatsApp for urgent approvals. Marketing head travels often - build in extra approval buffer.",
      customFields: [
        { label: "Property count", value: "6" },
        { label: "Booking engine URL", value: "https://book.mosaichotels.example.com" },
      ],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Standard",
    },
    {
      id: "cl_jungle",
      name: "Jim's Jungle Retreat",
      industry: "Hospitality",
      businessType: "Eco-luxury wildlife resort",
      logoText: "JJ",
      status: "Active",
      services: ["Content", "Social Media", "SEO"],
      platforms: ["Instagram", "Google Business Profile"],
      targetAudience: "Wildlife enthusiasts and conservation-minded travellers",
      goals: ["Conservation storytelling", "Direct bookings", "Season occupancy"],
      website: "https://jimsjungleretreat.example.com",
      social: { instagram: "@jimsjungleretreat", facebook: "jimsjungleretreat", linkedin: "", youtube: "" },
      location: "Kanha, Madhya Pradesh, India",
      timezone: "Asia/Kolkata",
      accountManager: "Ananya Rao",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "Kabir Sinha",
      adsManager: "",
      contact: { name: "Meera Joshi", email: "meera@jimsjungleretreat.example.com", phone: "+91 99870 33221" },
      startDate: "2025-03-02",
      notes: "Never use stock tiger photography - only property's own archive or licensed conservation photographers.",
      customFields: [{ label: "Property count", value: "1" }],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Standard",
    },
    {
      id: "cl_expoinn",
      name: "ExpoInn",
      industry: "Hospitality",
      businessType: "Business & transit hotel",
      logoText: "EI",
      status: "Active",
      services: ["Content", "SEO", "Google Business Profile"],
      platforms: ["Google Business Profile", "Facebook"],
      targetAudience: "Corporate travellers and exhibitors near Expo Mart",
      goals: ["Local SEO visibility", "Corporate bookings"],
      website: "https://expoinn.example.com",
      social: { instagram: "@expoinn", facebook: "expoinn", linkedin: "expoinn", youtube: "" },
      location: "Greater Noida, India",
      timezone: "Asia/Kolkata",
      accountManager: "Farhan Ali",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "Kabir Sinha",
      adsManager: "",
      contact: { name: "Vikram Sethi", email: "vikram@expoinn.example.com", phone: "+91 98110 44556" },
      startDate: "2024-11-20",
      notes: "Very responsive on email, slow on calls.",
      customFields: [{ label: "Property count", value: "1" }],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Fast-track",
    },
    {
      id: "cl_plume",
      name: "Plume Hotels",
      industry: "Hospitality",
      businessType: "Elegant city hotel chain",
      logoText: "PH",
      status: "Active",
      services: ["Content", "Social Media", "Reporting"],
      platforms: ["Instagram", "Facebook"],
      targetAudience: "Design-conscious business & leisure travellers",
      goals: ["Brand refinement", "Repeat guests"],
      website: "https://plumehotels.example.com",
      social: { instagram: "@plumehotels", facebook: "plumehotels", linkedin: "", youtube: "" },
      location: "Mumbai & Pune, India",
      timezone: "Asia/Kolkata",
      accountManager: "Farhan Ali",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "",
      adsManager: "",
      contact: { name: "Naina Shah", email: "naina@plumehotels.example.com", phone: "+91 98200 77889" },
      startDate: "2025-02-10",
      notes: "",
      customFields: [{ label: "Property count", value: "3" }],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Standard",
    },
    {
      id: "cl_mor",
      name: "The Mor Stays",
      industry: "Hospitality",
      businessType: "Experiential boutique homestays",
      logoText: "MS",
      status: "Active",
      services: ["Content", "Social Media", "Influencer Marketing"],
      platforms: ["Instagram"],
      targetAudience: "Gen-Z & millennial experience-seekers",
      goals: ["Community building", "UGC volume"],
      website: "https://themorstays.example.com",
      social: { instagram: "@themorstays", facebook: "", linkedin: "", youtube: "" },
      location: "Goa, India",
      timezone: "Asia/Kolkata",
      accountManager: "Ananya Rao",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "",
      adsManager: "",
      contact: { name: "Rhea Fernandes", email: "rhea@themorstays.example.com", phone: "+91 90040 11002" },
      startDate: "2025-05-19",
      notes: "Loves fast turnarounds, comfortable approving on Instagram DMs but we log everything in-app.",
      customFields: [{ label: "Property count", value: "4" }],
      reportingFrequency: "Bi-weekly",
      approvalWorkflow: "Fast-track",
    },
    {
      id: "cl_haveli",
      name: "Haveli Dharampura",
      industry: "Hospitality",
      businessType: "Heritage boutique hotel",
      logoText: "HD",
      status: "Active",
      services: ["Content", "SEO"],
      platforms: ["Instagram", "Google Business Profile"],
      targetAudience: "Culture and heritage travellers, domestic & international",
      goals: ["Heritage storytelling", "SEO for 'Old Delhi heritage hotel'"],
      website: "https://havelidharampura.example.com",
      social: { instagram: "@havelidharampura", facebook: "havelidharampura", linkedin: "", youtube: "" },
      location: "Old Delhi, India",
      timezone: "Asia/Kolkata",
      accountManager: "Farhan Ali",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "Kabir Sinha",
      adsManager: "",
      contact: { name: "Aditya Gupta", email: "aditya@havelidharampura.example.com", phone: "+91 98180 22114" },
      startDate: "2024-09-05",
      notes: "",
      customFields: [{ label: "Property count", value: "1" }],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Standard",
    },
    {
      id: "cl_rtsoi",
      name: "RTSOI",
      industry: "Professional Services",
      businessType: "Hospitality industry association",
      logoText: "RT",
      status: "Active",
      services: ["Content", "Social Media"],
      platforms: ["LinkedIn", "Instagram"],
      targetAudience: "Restaurant & hospitality business owners",
      goals: ["Membership growth", "Event promotion"],
      website: "https://rtsoi.example.com",
      social: { instagram: "@rtsoi_official", facebook: "", linkedin: "rtsoi", youtube: "" },
      location: "Pan-India",
      timezone: "Asia/Kolkata",
      accountManager: "Farhan Ali",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "",
      adsManager: "",
      contact: { name: "Suresh Nambiar", email: "suresh@rtsoi.example.com", phone: "+91 98200 55667" },
      startDate: "2025-04-01",
      notes: "",
      customFields: [],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Standard",
    },
    {
      id: "cl_away",
      name: "Away & Co",
      industry: "Hospitality",
      businessType: "Independent travel villas",
      logoText: "AC",
      status: "Onboarding",
      services: ["Content", "Social Media", "SEO"],
      platforms: ["Instagram"],
      targetAudience: "Small-group and family travellers seeking private villas",
      goals: ["Launch brand awareness"],
      website: "https://awayandco.example.com",
      social: { instagram: "@awayandco", facebook: "", linkedin: "", youtube: "" },
      location: "Coorg, India",
      timezone: "Asia/Kolkata",
      accountManager: "Ananya Rao",
      contentManager: "",
      designer: "",
      seoManager: "",
      adsManager: "",
      contact: { name: "Ishaan Verma", email: "ishaan@awayandco.example.com", phone: "+91 90210 33445" },
      startDate: "2026-08-01",
      notes: "New client - onboarding in progress, Brand Brain not yet finalised.",
      customFields: [{ label: "Property count", value: "2" }],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Standard",
    },
    // --- Fictional future clients, proving the platform is not hospitality-only ---
    {
      id: "cl_stackflow",
      name: "Stackflow",
      industry: "SaaS / Technology",
      businessType: "B2B workflow-automation software",
      logoText: "SF",
      status: "Active",
      services: ["SEO", "LinkedIn", "Google Ads", "Reporting"],
      platforms: ["LinkedIn", "Google Ads"],
      targetAudience: "Operations leaders at mid-market companies (200-2000 employees)",
      goals: ["Pipeline generation", "Organic demo signups", "Category thought leadership"],
      website: "https://stackflow.example.com",
      social: { instagram: "", facebook: "", linkedin: "stackflow-hq", youtube: "" },
      location: "Remote / US-based",
      timezone: "America/New_York",
      accountManager: "Priya Iyer",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "Kabir Sinha",
      adsManager: "Priya Iyer",
      contact: { name: "Jordan Blake", email: "jordan@stackflow.example.com", phone: "+1 415 555 0148" },
      startDate: "2026-02-17",
      notes: "Strict brand voice guidelines - legal review required on all claims involving customer numbers.",
      customFields: [
        { label: "CRM identifier", value: "HubSpot - stackflow" },
        { label: "Lead qualification criteria", value: "Series B+, 200+ employees, ops or RevOps title" },
      ],
      reportingFrequency: "Monthly",
      approvalWorkflow: "Legal review",
    },
    {
      id: "cl_verdanta",
      name: "Verdanta",
      industry: "D2C / Consumer",
      businessType: "Direct-to-consumer skincare brand",
      logoText: "VD",
      status: "Active",
      services: ["Social Media", "Meta Ads", "Influencer Marketing", "Reporting"],
      platforms: ["Instagram", "Meta Ads"],
      targetAudience: "Women 22-38 interested in clean, minimal-ingredient skincare",
      goals: ["Ecommerce revenue", "Repeat purchase rate", "UGC library growth"],
      website: "https://verdanta.example.com",
      social: { instagram: "@verdanta.skin", facebook: "verdanta.skin", linkedin: "", youtube: "" },
      location: "D2C - ships across India",
      timezone: "Asia/Kolkata",
      accountManager: "Priya Iyer",
      contentManager: "Devika Nair",
      designer: "Rohan Mehta",
      seoManager: "",
      adsManager: "Priya Iyer",
      contact: { name: "Simran Kaur", email: "simran@verdanta.example.com", phone: "+91 98730 90011" },
      startDate: "2026-05-04",
      notes: "Fast-moving founder-led brand - expects same-day turnaround on ad creative iterations.",
      customFields: [
        { label: "Ecommerce platform", value: "Shopify" },
        { label: "Store locations", value: "D2C only, no physical retail" },
      ],
      reportingFrequency: "Bi-weekly",
      approvalWorkflow: "Fast-track",
    },
  ];

  const brandBrains = {
    cl_mosaic: {
      personality: "Luxury blended with nature",
      tone: ["Understated", "Warm", "Emotional", "Slow travel"],
      writingStyle: "Full sentences, gentle pacing, sensory detail over superlatives.",
      targetAudience: "Affluent slow-travellers, 30-55, seeking nature-adjacent luxury",
      brandStory: "Mosaic Hotels believes a stay should feel like exhaling. Each property is built into its landscape, never on top of it.",
      coreMessaging: "Luxury is the absence of hurry.",
      keyPhrases: ["exhale into the landscape", "quietly extraordinary", "built into, not on top of"],
      wordsToUse: ["unhurried", "considered", "intimate", "landscape"],
      wordsToAvoid: ["luxurious getaway", "paradise", "5-star", "must-visit"],
      contentPillars: ["Slow mornings", "Local landscape", "Guest stories", "Culinary craft"],
      visualDirection: "Natural light, muted earth tones, negative space, no oversaturation.",
      competitors: ["Evolve Back", "SUJÁN", "The Postcard Hotel"],
      brandColors: ["#556B2F", "#F4EDE1", "#2B2B26"],
      specialInstructions: "Never use the word 'paradise'. Client travels frequently - flag anything needing same-day sign-off clearly.",
    },
    cl_jungle: {
      personality: "Nature-led, poetic, conservation-focused, premium",
      tone: ["Poetic", "Nature-led", "Premium", "Conservation-focused"],
      writingStyle: "Short, evocative lines. Present tense. Let the forest do the talking.",
      targetAudience: "Wildlife enthusiasts and conservation-minded travellers",
      brandStory: "Jim's Jungle Retreat exists at the edge of Kanha, in respectful proximity to one of India's last great forests.",
      coreMessaging: "The jungle does not begin with the tiger.",
      keyPhrases: ["the jungle does not begin with the tiger", "edge of the wild", "quiet company of the forest"],
      wordsToUse: ["forest", "conservation", "stillness", "wilderness"],
      wordsToAvoid: ["generic travel language", "influencer language", "overly promotional language"],
      contentPillars: ["Conservation stories", "Naturalist notes", "Guest sightings", "Slow safari mornings"],
      visualDirection: "Documentary-style wildlife photography, natural colour grading, no filters.",
      competitors: ["Taj Baghvan", "Pench Tree Lodge"],
      brandColors: ["#3A4A2C", "#C9BE9C", "#111827"],
      specialInstructions: "Never use stock tiger imagery. All wildlife claims must be checked against naturalist notes before publishing.",
    },
    cl_expoinn: {
      personality: "Professional, hospitality-focused, business-oriented, location-driven",
      tone: ["Professional", "Direct", "Business-oriented"],
      writingStyle: "Clear, benefit-led, short paragraphs. Lead with proximity and convenience.",
      targetAudience: "Corporate travellers and exhibitors near Expo Mart",
      brandStory: "ExpoInn is built for people who are in Greater Noida to work - not to sightsee.",
      coreMessaging: "Minutes from the venue. Ready when you are.",
      keyPhrases: ["minutes from the venue", "built for business travel"],
      wordsToUse: ["convenient", "reliable", "efficient", "central"],
      wordsToAvoid: ["luxury", "opulent", "getaway"],
      contentPillars: ["Proximity to Expo Mart", "Business amenities", "Corporate packages"],
      visualDirection: "Clean, well-lit interiors, minimal styling, business-casual imagery.",
      competitors: ["Radisson Greater Noida", "Le Meridien"],
      brandColors: ["#2563A8", "#F7F8FA", "#111827"],
      specialInstructions: "Always mention distance to Expo Mart in venue-related posts.",
    },
    cl_plume: {
      personality: "Elegant hospitality, refined, warm",
      tone: ["Elegant", "Refined", "Warm"],
      writingStyle: "Polished, editorial tone with a warm undercurrent.",
      targetAudience: "Design-conscious business & leisure travellers",
      brandStory: "Plume Hotels treats every stay as a small act of design.",
      coreMessaging: "Designed to be remembered, not just booked.",
      keyPhrases: ["a small act of design", "designed to be remembered"],
      wordsToUse: ["refined", "considered", "detail"],
      wordsToAvoid: ["cheap", "basic", "budget"],
      contentPillars: ["Interior design details", "City guides", "Guest experience"],
      visualDirection: "Architectural framing, warm neutral palette.",
      competitors: ["Fabhotels Premium", "Treebo Trend"],
      brandColors: ["#8A5A2B", "#F4F1EA", "#111827"],
      specialInstructions: "",
    },
    cl_mor: {
      personality: "Experiential hospitality, emotional, modern",
      tone: ["Playful", "Emotional", "Modern", "Community-driven"],
      writingStyle: "Casual, first-person energy, short punchy captions, emoji used sparingly.",
      targetAudience: "Gen-Z & millennial experience-seekers",
      brandStory: "The Mor Stays turns a homestay into a story guests want to tell.",
      coreMessaging: "Stay like it's someone's favourite story.",
      keyPhrases: ["stay like it's a story", "made for the memory, not just the stay"],
      wordsToUse: ["vibe", "moment", "community", "story"],
      wordsToAvoid: ["formal", "corporate", "5-star"],
      contentPillars: ["Guest UGC", "Behind the stay", "Local experiences", "Community spotlights"],
      visualDirection: "Bright, candid, mobile-shot aesthetic; authenticity over polish.",
      competitors: ["StayVista", "SaffronStays"],
      brandColors: ["#B4740E", "#FFF7EC", "#2B2B26"],
      specialInstructions: "Client approves fast - keep captions tight so approval turnaround stays under 24 hours.",
    },
    cl_haveli: {
      personality: "Heritage-rich, reverent, storyteller",
      tone: ["Reverent", "Descriptive", "Historical"],
      writingStyle: "Rich but precise historical detail; avoid embellishing facts.",
      targetAudience: "Culture and heritage travellers, domestic & international",
      brandStory: "Haveli Dharampura is a restored 19th-century haveli in the heart of Old Delhi's Kucha Pati Ram.",
      coreMessaging: "A living restoration, not a museum.",
      keyPhrases: ["a living restoration", "the haveli remembers"],
      wordsToUse: ["restored", "heritage", "handcrafted", "Old Delhi"],
      wordsToAvoid: ["modern", "trendy", "fusion"],
      contentPillars: ["Restoration stories", "Old Delhi culture", "Culinary heritage", "Craftsmanship"],
      visualDirection: "Warm interior light, architectural detail shots, muted gold tones.",
      competitors: ["The Imperial", "Bloomrooms"],
      brandColors: ["#8A5A2B", "#2B2B26", "#D9C79E"],
      specialInstructions: "Fact-check all historical claims with the client's in-house historian before publishing.",
    },
    cl_rtsoi: {
      personality: "Authoritative, community-oriented, professional",
      tone: ["Authoritative", "Professional", "Community-first"],
      writingStyle: "Informative, association-voice, avoid first-person 'we' overuse.",
      targetAudience: "Restaurant & hospitality business owners",
      brandStory: "RTSOI represents and advocates for the restaurant and tourism sector.",
      coreMessaging: "The voice of the industry, for the industry.",
      keyPhrases: ["the voice of the industry"],
      wordsToUse: ["members", "advocacy", "industry", "association"],
      wordsToAvoid: ["casual slang", "overly promotional tone"],
      contentPillars: ["Policy updates", "Member spotlights", "Events", "Industry data"],
      visualDirection: "Clean corporate template, association branding.",
      competitors: ["NRAI"],
      brandColors: ["#2563A8", "#111827", "#F7F8FA"],
      specialInstructions: "",
    },
    cl_away: {
      personality: "Not finalised - onboarding in progress",
      tone: [],
      writingStyle: "",
      targetAudience: "Small-group and family travellers seeking private villas",
      brandStory: "",
      coreMessaging: "",
      keyPhrases: [],
      wordsToUse: [],
      wordsToAvoid: [],
      contentPillars: [],
      visualDirection: "",
      competitors: [],
      brandColors: [],
      specialInstructions: "Brand Brain workshop scheduled - do not generate client-facing content until this is complete.",
    },
    cl_stackflow: {
      personality: "Sharp, credible, quietly confident B2B voice",
      tone: ["Confident", "Precise", "No-fluff", "Category-aware"],
      writingStyle: "Short declarative sentences. Data-backed claims. No exclamation marks.",
      targetAudience: "Operations leaders at mid-market companies (200-2000 employees)",
      brandStory: "Stackflow exists because ops teams were duct-taping five tools together to do one job.",
      coreMessaging: "Fewer tools. Faster operations.",
      keyPhrases: ["fewer tools, faster operations", "built for ops, not IT"],
      wordsToUse: ["workflow", "operations", "throughput", "reliability"],
      wordsToAvoid: ["revolutionary", "game-changing", "synergy", "disrupt"],
      contentPillars: ["Ops playbooks", "Customer proof points", "Category education", "Product updates"],
      visualDirection: "Clean UI screenshots, high-contrast diagrams, restrained colour use.",
      competitors: ["Zapier for Teams", "Tray.io", "Workato"],
      brandColors: ["#2563A8", "#111827", "#F7F8FA"],
      specialInstructions: "Any specific customer metric must be pulled from an approved case study - never estimated.",
    },
    cl_verdanta: {
      personality: "Warm, confident, ingredient-honest",
      tone: ["Warm", "Confident", "Ingredient-honest", "Founder-voiced"],
      writingStyle: "First-person founder warmth mixed with clear ingredient education.",
      targetAudience: "Women 22-38 interested in clean, minimal-ingredient skincare",
      brandStory: "Verdanta was built on a simple frustration: skincare labels nobody could actually read.",
      coreMessaging: "Skincare you can pronounce.",
      keyPhrases: ["skincare you can pronounce", "fewer ingredients, more honesty"],
      wordsToUse: ["clean", "honest", "gentle", "minimal"],
      wordsToAvoid: ["miracle", "cure", "instant results"],
      contentPillars: ["Ingredient education", "Founder story", "Customer transformations", "Routine building"],
      visualDirection: "Soft natural light, minimal product styling, real skin textures - no heavy retouching.",
      competitors: ["Minimalist", "The Ordinary", "Foxtale"],
      brandColors: ["#556B2F", "#FFF7EC", "#111827"],
      specialInstructions: "No medical or curative claims. All 'results' language must be paired with a visible disclaimer.",
    },
  };

  const team = [
    { id: "u_ananya", name: "Ananya Rao", role: "Manager", department: "Client Services", email: "ananya@agency.example.com", status: "Active" },
    { id: "u_farhan", name: "Farhan Ali", role: "Account Manager", department: "Client Services", email: "farhan@agency.example.com", status: "Active" },
    { id: "u_devika", name: "Devika Nair", role: "Content Strategist", department: "Content", email: "devika@agency.example.com", status: "Active" },
    { id: "u_rohan", name: "Rohan Mehta", role: "Designer", department: "Creative", email: "rohan@agency.example.com", status: "Active" },
    { id: "u_kabir", name: "Kabir Sinha", role: "SEO", department: "Performance", email: "kabir@agency.example.com", status: "Active" },
    { id: "u_priya", name: "Priya Iyer", role: "Performance Marketing", department: "Performance", email: "priya@agency.example.com", status: "Active" },
    { id: "u_zara", name: "Zara Khan", role: "Intern", department: "Content", email: "zara@agency.example.com", status: "Active" },
    { id: "u_admin", name: "Nikhil Verma", role: "Admin", department: "Leadership", email: "nikhil@agency.example.com", status: "Active" },
  ];

  const today = new Date();
  const iso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  let contentSeq = 1;
  const content = [
    mkContent({ client: "cl_mosaic", title: "Onam Reel - Slow Mornings", type: "Reel", platform: "Instagram", status: "CLIENT REVIEW", publishDate: iso(2), assignedTo: "u_rohan", priority: "HIGH", topic: "Onam", campaign: "Festive Season 2026", submittedDaysAgo: 2 }),
    mkContent({ client: "cl_mosaic", title: "Onam Carousel - Sadhya Table", type: "Carousel", platform: "Instagram", status: "CLIENT REVIEW", publishDate: iso(3), assignedTo: "u_rohan", priority: "MEDIUM", topic: "Onam", campaign: "Festive Season 2026", submittedDaysAgo: 1 }),
    mkContent({ client: "cl_mosaic", title: "Monthly Report - August", type: "Blog", platform: "Website", status: "DRAFT", publishDate: iso(4), assignedTo: "u_devika", priority: "MEDIUM", topic: "Reporting" }),
    mkContent({ client: "cl_jungle", title: "World Conservation Day Post", type: "Static Post", platform: "Instagram", status: "SCHEDULED", publishDate: iso(1), assignedTo: "u_devika", priority: "HIGH", topic: "World Nature Conservation Day", campaign: "Conservation Stories" }),
    mkContent({ client: "cl_jungle", title: "Naturalist Notes - Monsoon Sightings", type: "Blog", platform: "Website", status: "INTERNAL REVIEW", publishDate: iso(6), assignedTo: "u_devika", priority: "LOW", topic: "Wildlife sightings" }),
    mkContent({ client: "cl_expoinn", title: "GBP Post - Exhibitor Package", type: "Google Business Profile", platform: "Google Business Profile", status: "SCHEDULED", publishDate: iso(0), assignedTo: "u_devika", priority: "MEDIUM", topic: "Exhibitor packages" }),
    mkContent({ client: "cl_expoinn", title: "Blog - Best Hotels Near Expo Mart", type: "Blog", platform: "Website", status: "PUBLISHED", publishDate: iso(-10), assignedTo: "u_kabir", priority: "MEDIUM", topic: "Local SEO" }),
    mkContent({ client: "cl_plume", title: "Design Detail Carousel - Pune Suite", type: "Carousel", platform: "Instagram", status: "CHANGES REQUESTED", publishDate: iso(5), assignedTo: "u_rohan", priority: "MEDIUM", topic: "Interior design", submittedDaysAgo: 3 }),
    mkContent({ client: "cl_mor", title: "Guest UGC Reel Roundup", type: "Reel", platform: "Instagram", status: "CLIENT REVIEW", publishDate: iso(0), assignedTo: "u_rohan", priority: "URGENT", topic: "UGC", submittedDaysAgo: 2 }),
    mkContent({ client: "cl_mor", title: "Goa Monsoon Story Series", type: "Story", platform: "Instagram", status: "IDEA", publishDate: iso(9), assignedTo: "u_devika", priority: "LOW", topic: "Monsoon" }),
    mkContent({ client: "cl_haveli", title: "Heritage Blog - Kucha Pati Ram History", type: "Blog", platform: "Website", status: "DESIGNING", publishDate: iso(7), assignedTo: "u_rohan", priority: "LOW", topic: "Heritage" }),
    mkContent({ client: "cl_rtsoi", title: "LinkedIn Post - Policy Update", type: "LinkedIn Post", platform: "LinkedIn", status: "SCHEDULED", publishDate: iso(1), assignedTo: "u_devika", priority: "MEDIUM", topic: "Policy" }),
    mkContent({ client: "cl_stackflow", title: "LinkedIn Carousel - Ops Playbook #4", type: "LinkedIn Post", platform: "LinkedIn", status: "CLIENT REVIEW", publishDate: iso(2), assignedTo: "u_devika", priority: "HIGH", topic: "Ops playbook", submittedDaysAgo: 1 }),
    mkContent({ client: "cl_stackflow", title: "Google Ad Copy - RevOps Keyword Set", type: "Ad", platform: "Google Ads", status: "APPROVED", publishDate: iso(1), assignedTo: "u_priya", priority: "HIGH", topic: "Search ads" }),
    mkContent({ client: "cl_verdanta", title: "Reel - Ingredient Breakdown: Niacinamide", type: "Reel", platform: "Instagram", status: "CLIENT REVIEW", publishDate: iso(0), assignedTo: "u_rohan", priority: "URGENT", topic: "Ingredient education", submittedDaysAgo: 3 }),
    mkContent({ client: "cl_verdanta", title: "Meta Ad Creative - Founder Story", type: "Ad", platform: "Meta Ads", status: "SCHEDULED", publishDate: iso(1), assignedTo: "u_priya", priority: "HIGH", topic: "Founder story" }),
    mkContent({ client: "cl_verdanta", title: "Carousel - Routine Building 101", type: "Carousel", platform: "Instagram", status: "PUBLISHED", publishDate: iso(-3), assignedTo: "u_rohan", priority: "MEDIUM", topic: "Routine education" }),
  ];

  function mkContent(o) {
    const id = `ct_${contentSeq++}`;
    const history = [{ date: iso(-1), action: "Created", note: "Content item created." }];
    if (o.submittedDaysAgo) {
      history.push({ date: iso(-o.submittedDaysAgo), action: "Submitted for approval", note: "Sent to client for review." });
    }
    return {
      id,
      clientId: o.client,
      title: o.title,
      type: o.type,
      platform: o.platform,
      topic: o.topic || "",
      campaign: o.campaign || "",
      caption: `${o.title} - draft caption pending final copy pass.`,
      creativeLink: "",
      hashtags: "#travel #hospitality",
      cta: "Book now",
      publishDate: o.publishDate,
      assignedTo: o.assignedTo,
      status: o.status,
      priority: o.priority || "MEDIUM",
      notes: "",
      createdAt: iso(-6),
      approvalHistory: history,
    };
  }

  const comments = [
    { id: "cm_1", contentId: "ct_1", user: "Sameer Kapoor", message: "Love the tone, can we swap the second frame for the pool at dawn?", date: iso(-1) },
    { id: "cm_2", contentId: "ct_1", user: "Rohan Mehta", message: "On it - will have a revised cut by tomorrow morning.", date: iso(-1) },
    { id: "cm_3", contentId: "ct_9", user: "Rhea Fernandes", message: "This is so good, approving after one tiny caption tweak.", date: iso(0) },
    { id: "cm_4", contentId: "ct_8", user: "Naina Shah", message: "Can we make the lighting warmer? Feels a bit cold for our brand.", date: iso(-2) },
  ];

  let taskSeq = 1;
  const tasks = [
    mkTask({ client: "cl_mosaic", title: "Review Onam reel creative cut v2", category: "Design", assignedTo: "u_rohan", priority: "HIGH", status: "IN PROGRESS", due: iso(0) }),
    mkTask({ client: "cl_mosaic", title: "Prep August monthly report data", category: "Reporting", assignedTo: "u_devika", priority: "MEDIUM", status: "TODO", due: iso(4) }),
    mkTask({ client: "cl_expoinn", title: "Publish GBP exhibitor package post", category: "Content", assignedTo: "u_devika", priority: "MEDIUM", status: "TODO", due: iso(0) }),
    mkTask({ client: "cl_expoinn", title: "Refresh title tags for 6 landing pages", category: "SEO", assignedTo: "u_kabir", priority: "LOW", status: "BLOCKED", due: iso(-2) }),
    mkTask({ client: "cl_mor", title: "Collect UGC usage rights from 5 guests", category: "Client Communication", assignedTo: "u_ananya", priority: "MEDIUM", status: "TODO", due: iso(-3) }),
    mkTask({ client: "cl_plume", title: "Revise Pune suite carousel lighting", category: "Design", assignedTo: "u_rohan", priority: "MEDIUM", status: "REVIEW", due: iso(1) }),
    mkTask({ client: "cl_stackflow", title: "Legal review - ops playbook carousel copy", category: "Client Communication", assignedTo: "u_priya", priority: "HIGH", status: "IN PROGRESS", due: iso(1) }),
    mkTask({ client: "cl_verdanta", title: "Cut founder story ad into 3 aspect ratios", category: "Design", assignedTo: "u_rohan", priority: "HIGH", status: "TODO", due: iso(0) }),
    mkTask({ client: "cl_verdanta", title: "Set up Meta Ads A/B test - new creative", category: "Ads", assignedTo: "u_priya", priority: "URGENT", status: "TODO", due: iso(1) }),
    mkTask({ client: "cl_haveli", title: "Fact-check heritage blog with historian", category: "Content", assignedTo: "u_devika", priority: "LOW", status: "TODO", due: iso(5) }),
    mkTask({ client: "cl_away", title: "Schedule Brand Brain workshop call", category: "Client Communication", assignedTo: "u_ananya", priority: "HIGH", status: "TODO", due: iso(1) }),
    mkTask({ client: "cl_rtsoi", title: "Design event carousel for Sept summit", category: "Design", assignedTo: "u_rohan", priority: "MEDIUM", status: "DONE", due: iso(-1) }),
    mkTask({ client: "cl_jungle", title: "Source naturalist quotes for monsoon blog", category: "Content", assignedTo: "u_devika", priority: "LOW", status: "IN PROGRESS", due: iso(3) }),
  ];
  function mkTask(o) {
    return {
      id: `tk_${taskSeq++}`,
      clientId: o.client,
      title: o.title,
      description: "",
      category: o.category,
      assignedTo: o.assignedTo,
      priority: o.priority,
      status: o.status,
      dueDate: o.due,
      createdAt: iso(-5),
      relatedContentId: null,
    };
  }

  const seoKeywords = [
    { id: "kw_1", clientId: "cl_expoinn", keyword: "hotel near expo mart greater noida", searchVolume: 1300, current: 4, previous: 7, target: 1, url: "/rooms", intent: "Transactional", location: "Greater Noida", lastChecked: iso(-1) },
    { id: "kw_2", clientId: "cl_expoinn", keyword: "business hotels greater noida", searchVolume: 880, current: 6, previous: 6, target: 3, url: "/", intent: "Commercial", location: "Greater Noida", lastChecked: iso(-1) },
    { id: "kw_3", clientId: "cl_haveli", keyword: "heritage hotel old delhi", searchVolume: 1600, current: 3, previous: 5, target: 1, url: "/", intent: "Commercial", location: "Delhi", lastChecked: iso(-2) },
    { id: "kw_4", clientId: "cl_haveli", keyword: "boutique hotel chandni chowk", searchVolume: 320, current: 9, previous: 6, target: 3, url: "/location", intent: "Commercial", location: "Delhi", lastChecked: iso(-2) },
    { id: "kw_5", clientId: "cl_jungle", keyword: "kanha national park resort", searchVolume: 2100, current: 5, previous: 8, target: 2, url: "/", intent: "Commercial", location: "Kanha", lastChecked: iso(-3) },
    { id: "kw_6", clientId: "cl_stackflow", keyword: "workflow automation for ops teams", searchVolume: 590, current: 11, previous: 14, target: 5, url: "/product", intent: "Commercial", location: "US", lastChecked: iso(-1) },
  ];

  const adCampaigns = [
    { id: "ad_1", clientId: "cl_stackflow", name: "RevOps Search - Q3", platform: "Google", objective: "Lead generation", budget: 4000, spend: 2760, impressions: 88000, reach: 61000, clicks: 1840, leads: 76, conversions: 22, startDate: iso(-20), endDate: iso(10), status: "ACTIVE" },
    { id: "ad_2", clientId: "cl_verdanta", name: "Founder Story - Prospecting", platform: "Meta", objective: "Conversions", budget: 3000, spend: 2410, impressions: 410000, reach: 265000, clicks: 9800, leads: 0, conversions: 340, startDate: iso(-15), endDate: iso(15), status: "ACTIVE" },
    { id: "ad_3", clientId: "cl_verdanta", name: "Retargeting - Cart Abandoners", platform: "Meta", objective: "Conversions", budget: 1200, spend: 1180, impressions: 92000, reach: 41000, clicks: 3100, leads: 0, conversions: 190, startDate: iso(-25), endDate: iso(5), status: "ACTIVE" },
    { id: "ad_4", clientId: "cl_mosaic", name: "Shoulder Season Awareness", platform: "Meta", objective: "Awareness", budget: 1500, spend: 890, impressions: 210000, reach: 180000, clicks: 2600, leads: 40, conversions: 12, startDate: iso(-10), endDate: iso(20), status: "ACTIVE" },
  ];

  const reports = [
    { id: "rp_1", clientId: "cl_mosaic", period: "July 2026", preparedBy: "u_devika", status: "Completed", generatedAt: iso(-15) },
    { id: "rp_2", clientId: "cl_expoinn", period: "July 2026", preparedBy: "u_kabir", status: "Completed", generatedAt: iso(-14) },
    { id: "rp_3", clientId: "cl_verdanta", period: "July 2026", preparedBy: "u_priya", status: "Completed", generatedAt: iso(-13) },
  ];

  return { clients, brandBrains, team, content, comments, tasks, seoKeywords, adCampaigns, reports };
}

// ---------------------------------------------------------------------------
// Storage engine
// ---------------------------------------------------------------------------
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("marketing-os: failed to parse stored data, reseeding.", e);
  }
  const fresh = structuredClone(SEED);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

let STATE = load();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
}

function delay() {
  // Simulates network latency so loading states are visible/testable.
  return new Promise((res) => setTimeout(res, 120));
}

export async function resetDemoData() {
  STATE = structuredClone(SEED);
  save();
  await delay();
  return true;
}

export function isDemoData() {
  return true; // this build only ever runs on seeded/derived demo data
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
export async function listClients() {
  await delay();
  return structuredClone(STATE.clients);
}

export async function getClient(id) {
  await delay();
  const c = STATE.clients.find((c) => c.id === id);
  return c ? structuredClone(c) : null;
}

export async function addClient(data) {
  await delay();
  const client = {
    id: `cl_${Date.now().toString(36)}`,
    status: "Onboarding",
    services: [],
    platforms: [],
    goals: [],
    social: { instagram: "", facebook: "", linkedin: "", youtube: "" },
    contact: { name: "", email: "", phone: "" },
    customFields: [],
    startDate: new Date().toISOString().slice(0, 10),
    notes: "",
    ...data,
  };
  STATE.clients.unshift(client);
  STATE.brandBrains[client.id] = {
    personality: "", tone: [], writingStyle: "", targetAudience: data.targetAudience || "", brandStory: "",
    coreMessaging: "", keyPhrases: [], wordsToUse: [], wordsToAvoid: [], contentPillars: [],
    visualDirection: "", competitors: [], brandColors: [], specialInstructions: "",
  };
  save();
  return structuredClone(client);
}

export async function updateClient(id, patch) {
  await delay();
  const idx = STATE.clients.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Client not found");
  STATE.clients[idx] = { ...STATE.clients[idx], ...patch };
  save();
  return structuredClone(STATE.clients[idx]);
}

export async function deleteClient(id) {
  await delay();
  STATE.clients = STATE.clients.filter((c) => c.id !== id);
  STATE.content = STATE.content.filter((c) => c.clientId !== id);
  STATE.tasks = STATE.tasks.filter((t) => t.clientId !== id);
  delete STATE.brandBrains[id];
  save();
  return true;
}

// ---------------------------------------------------------------------------
// Brand Brain
// ---------------------------------------------------------------------------
export async function getBrandBrain(clientId) {
  await delay();
  return structuredClone(STATE.brandBrains[clientId] || null);
}

export async function upsertBrandBrain(clientId, data) {
  await delay();
  STATE.brandBrains[clientId] = { ...(STATE.brandBrains[clientId] || {}), ...data };
  save();
  return structuredClone(STATE.brandBrains[clientId]);
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export async function listContent(filter = {}) {
  await delay();
  let items = STATE.content;
  if (filter.clientId) items = items.filter((c) => c.clientId === filter.clientId);
  if (filter.status) items = items.filter((c) => c.status === filter.status);
  if (filter.platform) items = items.filter((c) => c.platform === filter.platform);
  if (filter.type) items = items.filter((c) => c.type === filter.type);
  return structuredClone(items).sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
}

export async function getContentById(id) {
  await delay();
  const c = STATE.content.find((c) => c.id === id);
  return c ? structuredClone(c) : null;
}

export async function addContent(data) {
  await delay();
  const item = {
    id: `ct_${Date.now().toString(36)}`,
    status: "IDEA",
    priority: "MEDIUM",
    notes: "",
    caption: "",
    hashtags: "",
    cta: "",
    creativeLink: "",
    createdAt: new Date().toISOString().slice(0, 10),
    approvalHistory: [{ date: new Date().toISOString().slice(0, 10), action: "Created", note: "Content item created." }],
    ...data,
  };
  STATE.content.unshift(item);
  save();
  return structuredClone(item);
}

export async function updateContent(id, patch, historyNote) {
  await delay();
  const idx = STATE.content.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Content not found");
  STATE.content[idx] = { ...STATE.content[idx], ...patch };
  if (historyNote) {
    STATE.content[idx].approvalHistory.push({
      date: new Date().toISOString().slice(0, 10),
      action: historyNote.action,
      note: historyNote.note || "",
    });
  }
  save();
  return structuredClone(STATE.content[idx]);
}

export async function deleteContent(id) {
  await delay();
  STATE.content = STATE.content.filter((c) => c.id !== id);
  STATE.comments = STATE.comments.filter((c) => c.contentId !== id);
  save();
  return true;
}

export async function listComments(contentId) {
  await delay();
  return structuredClone(STATE.comments.filter((c) => c.contentId === contentId));
}

export async function addComment(contentId, { user, message }) {
  await delay();
  const comment = { id: `cm_${Date.now().toString(36)}`, contentId, user, message, date: new Date().toISOString().slice(0, 10) };
  STATE.comments.push(comment);
  save();
  return structuredClone(comment);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export async function listTasks(filter = {}) {
  await delay();
  let items = STATE.tasks;
  if (filter.clientId) items = items.filter((t) => t.clientId === filter.clientId);
  if (filter.status) items = items.filter((t) => t.status === filter.status);
  if (filter.assignedTo) items = items.filter((t) => t.assignedTo === filter.assignedTo);
  return structuredClone(items).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

export async function getTask(id) {
  await delay();
  const t = STATE.tasks.find((t) => t.id === id);
  return t ? structuredClone(t) : null;
}

export async function addTask(data) {
  await delay();
  const task = {
    id: `tk_${Date.now().toString(36)}`,
    status: "TODO",
    priority: "MEDIUM",
    description: "",
    createdAt: new Date().toISOString().slice(0, 10),
    relatedContentId: null,
    ...data,
  };
  STATE.tasks.unshift(task);
  save();
  return structuredClone(task);
}

export async function updateTask(id, patch) {
  await delay();
  const idx = STATE.tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Task not found");
  STATE.tasks[idx] = { ...STATE.tasks[idx], ...patch };
  save();
  return structuredClone(STATE.tasks[idx]);
}

export async function deleteTask(id) {
  await delay();
  STATE.tasks = STATE.tasks.filter((t) => t.id !== id);
  save();
  return true;
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
export async function listTeam() {
  await delay();
  return structuredClone(STATE.team);
}
export async function getTeamMember(id) {
  await delay();
  return structuredClone(STATE.team.find((t) => t.id === id) || null);
}

// ---------------------------------------------------------------------------
// SEO / Ads / Reports (lighter modules)
// ---------------------------------------------------------------------------
export async function listSeoKeywords(clientId) {
  await delay();
  let items = STATE.seoKeywords;
  if (clientId) items = items.filter((k) => k.clientId === clientId);
  return structuredClone(items);
}

export async function listAdCampaigns(clientId) {
  await delay();
  let items = STATE.adCampaigns;
  if (clientId) items = items.filter((a) => a.clientId === clientId);
  return structuredClone(items);
}

export async function listReports(clientId) {
  await delay();
  let items = STATE.reports;
  if (clientId) items = items.filter((r) => r.clientId === clientId);
  return structuredClone(items);
}

// ---------------------------------------------------------------------------
// Derived / computed views - the "brains" of the dashboard.
// Nothing here is hardcoded per client; every score/alert is calculated
// from the records above, so it works identically for any client.
// ---------------------------------------------------------------------------

function daysAgo(iso) {
  return Math.round((new Date(new Date().toDateString()) - new Date(iso)) / 86400000);
}

export async function computeClientHealth(clientId) {
  const [content, tasks] = await Promise.all([listContent({ clientId }), listTasks({ clientId })]);

  // Content: share of content not stuck in changes-requested / overdue publish dates
  const stuckContent = content.filter((c) => c.status === "CHANGES REQUESTED").length;
  const overdueContent = content.filter((c) => new Date(c.publishDate) < new Date() && !["PUBLISHED", "SCHEDULED"].includes(c.status)).length;
  const contentScore = content.length === 0 ? 70 : Math.max(0, 100 - stuckContent * 15 - overdueContent * 10);

  // Tasks: overdue / blocked ratio
  const overdueTasks = tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== "DONE").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
  const taskScore = tasks.length === 0 ? 70 : Math.max(0, 100 - overdueTasks * 12 - blockedTasks * 10);

  // Approvals: how long things have waited in client review
  const inReview = content.filter((c) => c.status === "CLIENT REVIEW");
  const avgWait = inReview.length
    ? inReview.reduce((sum, c) => sum + daysAgo(c.approvalHistory[c.approvalHistory.length - 1]?.date || c.createdAt), 0) / inReview.length
    : 0;
  const approvalScore = Math.max(0, 100 - avgWait * 12);

  // SEO: % of tracked keywords that improved
  const kws = STATE.seoKeywords.filter((k) => k.clientId === clientId);
  const improved = kws.filter((k) => k.current < k.previous).length;
  const seoScore = kws.length === 0 ? 70 : Math.round((improved / kws.length) * 100);

  // Reporting: was the last report recent (within 40 days)?
  const clientReports = STATE.reports.filter((r) => r.clientId === clientId);
  const reportScore = clientReports.length === 0 ? 60 : Math.max(0, 100 - Math.max(0, daysAgo(clientReports[clientReports.length - 1].generatedAt) - 30) * 3);

  const breakdown = {
    Content: Math.round(contentScore),
    Tasks: Math.round(taskScore),
    Approvals: Math.round(approvalScore),
    SEO: Math.round(seoScore),
    Reporting: Math.round(reportScore),
  };
  const values = Object.values(breakdown);
  const overall = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return { overall, breakdown };
}

export async function getAttentionItems() {
  const clients = await listClients();
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const items = [];

  // Content stuck in client review > 24h
  for (const c of STATE.content) {
    if (c.status === "CLIENT REVIEW") {
      const submitted = [...c.approvalHistory].reverse().find((h) => h.action === "Submitted for approval");
      const waitDays = submitted ? daysAgo(submitted.date) : daysAgo(c.createdAt);
      if (waitDays >= 1) {
        items.push({
          id: `att_appr_${c.id}`,
          severity: waitDays >= 3 ? "high" : waitDays >= 2 ? "medium" : "low",
          client: clientMap[c.clientId]?.name || "Unknown client",
          clientId: c.clientId,
          description: `"${c.title}" is waiting for client approval.`,
          date: waitDays > 0 ? `${waitDays} day${waitDays === 1 ? "" : "s"} waiting` : "Submitted today",
          responsible: c.assignedTo,
          action: "Review",
          link: `content.html?open=${c.id}`,
        });
      }
    }
    if (c.status === "CHANGES REQUESTED") {
      items.push({
        id: `att_chg_${c.id}`,
        severity: "medium",
        client: clientMap[c.clientId]?.name || "Unknown client",
        clientId: c.clientId,
        description: `"${c.title}" has client-requested changes to action.`,
        date: "Needs revision",
        responsible: c.assignedTo,
        action: "Open",
        link: `content.html?open=${c.id}`,
      });
    }
  }

  // Overdue tasks
  for (const t of STATE.tasks) {
    if (t.status !== "DONE" && new Date(t.dueDate) < new Date(new Date().toDateString())) {
      const d = daysAgo(t.dueDate);
      items.push({
        id: `att_task_${t.id}`,
        severity: d >= 3 ? "high" : "medium",
        client: clientMap[t.clientId]?.name || "Unknown client",
        clientId: t.clientId,
        description: `Task "${t.title}" is overdue by ${d} day${d === 1 ? "" : "s"}.`,
        date: `${d} day${d === 1 ? "" : "s"} overdue`,
        responsible: t.assignedTo,
        action: "Open task",
        link: `tasks.html?open=${t.id}`,
      });
    }
  }

  // Clients with no content scheduled in the next 7 days
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  for (const client of clients) {
    if (client.status !== "Active") continue;
    const upcoming = STATE.content.filter(
      (c) => c.clientId === client.id && new Date(c.publishDate) >= new Date() && new Date(c.publishDate) <= in7 && c.status !== "IDEA"
    );
    if (upcoming.length === 0 && (client.services.includes("Content") || client.services.includes("Social Media"))) {
      items.push({
        id: `att_nocontent_${client.id}`,
        severity: "medium",
        client: client.name,
        clientId: client.id,
        description: `No content is scheduled for the next 7 days.`,
        date: "Calendar gap",
        responsible: client.contentManager || "Unassigned",
        action: "Plan content",
        link: `content.html?client=${client.id}`,
      });
    }
  }

  // SEO drops
  for (const k of STATE.seoKeywords) {
    if (k.current > k.previous) {
      items.push({
        id: `att_seo_${k.id}`,
        severity: "low",
        client: clientMap[k.clientId]?.name || "Unknown client",
        clientId: k.clientId,
        description: `Keyword "${k.keyword}" dropped from #${k.previous} to #${k.current}.`,
        date: "SEO ranking change",
        responsible: clientMap[k.clientId]?.seoManager || "Unassigned",
        action: "View SEO",
        link: `seo.html?client=${k.clientId}`,
      });
    }
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

export async function getTodaysWork() {
  const clients = await listClients();
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const items = [];
  const todayContent = STATE.content.filter((c) => new Date(c.publishDate).toDateString() === new Date().toDateString());
  const todayTasks = STATE.tasks.filter((t) => new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== "DONE");

  // Assign readable synthetic times deterministically so the timeline looks real
  const slots = ["9:00 AM", "10:00 AM", "11:30 AM", "1:00 PM", "2:00 PM", "3:30 PM", "4:00 PM", "5:00 PM"];
  let i = 0;
  for (const c of todayContent) {
    items.push({ time: slots[i % slots.length], client: clientMap[c.clientId]?.name, title: `${c.title}`, sub: c.type, link: `content.html?open=${c.id}` });
    i++;
  }
  for (const t of todayTasks) {
    items.push({ time: slots[i % slots.length], client: clientMap[t.clientId]?.name || "Internal", title: t.title, sub: t.category, link: `tasks.html?open=${t.id}` });
    i++;
  }
  return items.sort((a, b) => to24(a.time) - to24(b.time));
}

function to24(t) {
  const [time, mer] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

export async function getDashboardKpis() {
  const clients = await listClients();
  const tasks = STATE.tasks;
  const content = STATE.content;
  const today = new Date().toDateString();
  return {
    activeClients: clients.filter((c) => c.status === "Active").length,
    tasksDueToday: tasks.filter((t) => new Date(t.dueDate).toDateString() === today && t.status !== "DONE").length,
    pendingApprovals: content.filter((c) => c.status === "CLIENT REVIEW").length,
    overdueTasks: tasks.filter((t) => t.status !== "DONE" && new Date(t.dueDate) < new Date(today)).length,
    contentScheduled: content.filter((c) => c.status === "SCHEDULED").length,
    activeCampaigns: STATE.adCampaigns.filter((a) => a.status === "ACTIVE").length,
  };
}

export async function globalSearch(query) {
  await delay();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const clients = STATE.clients;
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const results = [];

  clients.filter((c) => c.name.toLowerCase().includes(q)).forEach((c) => results.push({ type: "Client", label: c.name, link: `client-detail.html?id=${c.id}` }));
  STATE.content.filter((c) => c.title.toLowerCase().includes(q)).forEach((c) => results.push({ type: "Content", label: `${clientMap[c.clientId]} — ${c.title}`, link: `content.html?open=${c.id}` }));
  STATE.tasks.filter((t) => t.title.toLowerCase().includes(q)).forEach((t) => results.push({ type: "Task", label: `${clientMap[t.clientId] || "Internal"} — ${t.title}`, link: `tasks.html?open=${t.id}` }));
  STATE.seoKeywords.filter((k) => k.keyword.toLowerCase().includes(q)).forEach((k) => results.push({ type: "Keyword", label: `${clientMap[k.clientId]} — ${k.keyword}`, link: `seo.html?client=${k.clientId}` }));

  return results.slice(0, 12);
}

export const CONSTANTS = {
  SERVICES: ["Content", "Social Media", "SEO", "Meta Ads", "Google Ads", "Google Business Profile", "Influencer Marketing", "Reporting", "Website"],
  PLATFORMS: ["Instagram", "Facebook", "LinkedIn", "YouTube", "Google Business Profile", "Website", "Meta Ads", "Google Ads"],
  CONTENT_TYPES: ["Static Post", "Carousel", "Reel", "Story", "Blog", "LinkedIn Post", "Google Business Profile", "Ad"],
  CONTENT_STATUSES: ["IDEA", "DRAFT", "DESIGNING", "INTERNAL REVIEW", "CLIENT REVIEW", "CHANGES REQUESTED", "APPROVED", "SCHEDULED", "PUBLISHED"],
  TASK_CATEGORIES: ["Content", "Design", "SEO", "Ads", "Reporting", "Website", "Client Communication", "Other"],
  TASK_STATUSES: ["TODO", "IN PROGRESS", "REVIEW", "BLOCKED", "DONE"],
  PRIORITIES: ["LOW", "MEDIUM", "HIGH", "URGENT"],
  INDUSTRIES: ["Hospitality", "SaaS / Technology", "D2C / Consumer", "Healthcare", "Real Estate", "Education", "Professional Services", "E-commerce", "Other"],
};
