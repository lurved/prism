/* Type Me — shared client data. AXES and TYPES are ported VERBATIM from the
   prototype (type-me.jsx); the descriptions are our own copy. See build spec §1. */
window.TM = window.TM || {};

// ── Design tokens ────────────────────────────────────────────────
window.TM.C = {
  paper: "#F2F1ED",
  card: "#FBFAF7",
  ink: "#1C1B18",
  muted: "#918C7E",
  hair: "#DAD7CD",
  accent: "#2F6F62", // ink-teal — reserved for the split / tension only
  accentSoft: "rgba(47,111,98,0.10)",
};

window.TM.TARGET_RATERS = 3;

// ── The four axes: each is the single strongest *observable* signal ──
window.TM.AXES = [
  {
    key: "EI",
    left: { letter: "E", label: "Extrovert", desc: "Comes alive around people — energy goes up in a crowd." },
    right: { letter: "I", label: "Introvert", desc: "Recharges in smaller doses — depth over crowd." },
    splitDesc: "Reads social to some friends, private to others.",
    prompt: "In group settings, they eventually —",
    a: { letter: "E", text: "get louder and brighter" },
    b: { letter: "I", text: "visibly start to fade" },
  },
  {
    key: "SN",
    left: { letter: "S", label: "Grounded", desc: "Stays concrete — facts, specifics, what actually happened." },
    right: { letter: "N", label: "Abstract", desc: "Goes to meaning — patterns, ideas, what it connects to." },
    splitDesc: "Some see the literal, some see the big picture.",
    prompt: "Their ideas tend to be —",
    a: { letter: "S", text: "practical and doable" },
    b: { letter: "N", text: "big, abstract, full of what-ifs" },
  },
  {
    key: "TF",
    left: { letter: "T", label: "Logic", desc: "Leads with the rational call." },
    right: { letter: "F", label: "Heart", desc: "Leads with how people feel." },
    splitDesc: "Half see a head-first thinker, half a heart-first one.",
    prompt: "You bring them a problem. First thing they do —",
    a: { letter: "T", text: "tell you the logical move" },
    b: { letter: "F", text: "make sure you feel heard" },
  },
  {
    key: "JP",
    left: { letter: "J", label: "Planned", desc: "Likes things settled and decided." },
    right: { letter: "P", label: "Loose", desc: "Keeps options open, plays it by ear." },
    splitDesc: "Looks organized to some, free-flowing to others.",
    prompt: "Their plans are —",
    a: { letter: "J", text: "locked in advance" },
    b: { letter: "P", text: "figured out as they go" },
  },
];

// ── The 16 type portraits (nicknames = standard set; one-liners are ours) ──
window.TM.TYPES = {
  INTJ: { name: "The Architect", line: "Comes across as the one with a plan when no one else has one. Independent and a few steps ahead, they trust their own logic over the crowd and would rather build the system than follow it. People read them as private, exacting, and quietly certain." },
  INTP: { name: "The Logician", line: "Reads as the resident thinker — endlessly curious about how things work, happy to poke holes in any idea including their own. They live a half-step inside their own head, chasing the interesting problem over the practical one, and come across as precise, original, and a little detached." },
  ENTJ: { name: "The Commander", line: "Comes across as someone who takes the wheel. Direct, organized, and goal-first, they spot the path and start moving people down it. Others read them as confident and decisive — sometimes blunt, rarely uncertain." },
  ENTP: { name: "The Debater", line: "The one who'll argue the other side just to see where it goes. Quick, inventive, and allergic to dull consensus, they spark off ideas and turn small talk into a sparring match. People find them clever, restless, and hard to pin down." },
  INFJ: { name: "The Advocate", line: "Reads as quietly intense — warm on the surface, with a private conviction running underneath. They care about meaning and the people around them, and tend to sense what others are feeling before it's said. Others find them insightful, idealistic, and a little hard to fully know." },
  INFP: { name: "The Mediator", line: "Comes across as gentle and a touch dreamy, guided more by what feels right than by the rulebook. They hold deep values quietly and light up around meaning, creativity, and sincerity. People read them as kind, principled, and more steel-cored than they look." },
  ENFJ: { name: "The Protagonist", line: "The one who pulls a room together. Warm, expressive, and tuned to how everyone's doing, they naturally rally people around a shared idea. Others read them as charismatic, encouraging, and genuinely invested in you." },
  ENFP: { name: "The Campaigner", line: "Reads as bright and spontaneous, finding a spark of possibility in almost everything. Enthusiastic and people-loving, they chase curiosity wherever it leads and bring others along for the ride. People find them warm, expressive, and scattered in the best way." },
  ISTJ: { name: "The Logistician", line: "Comes across as the dependable one — does what they say, on time, done right. Practical and order-loving, they trust proven methods and keep things running while others improvise. Others read them as steady, precise, and quietly responsible." },
  ISFJ: { name: "The Defender", line: "Reads as warm and unshowy, the person quietly making sure everyone's okay. Loyal and attentive to detail, they remember the small things and show care through action rather than words. People find them kind, reliable, and easy to lean on." },
  ESTJ: { name: "The Executive", line: "The one who takes charge and gets it organized. Direct, practical, and decisive, they value structure and aren't shy about saying how things should run. Others read them as confident, dependable, and firmly in command." },
  ESFJ: { name: "The Consul", line: "Comes across as the social glue — warm, attentive, always looking out for the group. They thrive on connection and harmony, remembering the birthdays and smoothing things over. People read them as caring, sociable, and generous with their time." },
  ISTP: { name: "The Virtuoso", line: "Reads as calm and capable, the one who quietly figures out how to fix it. Hands-on and unflappable, they'd rather do than discuss and stay cool when things get chaotic. Others find them independent, practical, and hard to ruffle." },
  ISFP: { name: "The Adventurer", line: "Comes across as easygoing and quietly creative, living in the moment more than the plan. Gentle and a little private, they show who they are through what they make and do rather than what they say. People read them as warm, artistic, and refreshingly unpretentious." },
  ESTP: { name: "The Entrepreneur", line: "The one who's first to act and last to overthink it. Bold, energetic, and tuned to the present, they thrive on momentum and aren't fazed by a little risk. Others read them as charismatic, spontaneous, and impossible to bore." },
  ESFP: { name: "The Entertainer", line: "Reads as the spark of the room — fun, spontaneous, fully in the moment. They love people, color, and a good time, and pull others into the energy with them. People find them warm, lively, and generous with attention." },
};
