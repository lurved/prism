/**
 * PRISCILLA'S PROFILE — edit this file to keep the agent up to date.
 *
 * Add new roles, projects, skills, achievements, or anything else here.
 * The agent will use this as its primary source of truth.
 */

const profile = {
  name: "Priscilla Liu",
  title: "Director of Product and Experience Design",
  location: "Singapore",
  email: "prisms@outlook.com",
  linkedin: "https://www.linkedin.com/in/prisc/",

  summary: `
Priscilla Liu is a Director-level Experience Design and Product Strategy leader with 15+ years
driving digital transformation, AI products, and enterprise UX across energy, proptech, and
financial services. She builds and leads cross-functional teams that deliver measurable outcomes —
for users, businesses, and the people who run them. Her work spans enterprise platforms, consumer
apps, AI agents, and design culture change.
  `,

  keyStrengths: [
    "Human-Centered Design (HCD)",
    "Product Strategy & Roadmapping",
    "AI & Digital Transformation",
    "Design Systems",
    "Enterprise UX",
    "Stakeholder Engagement & C-Suite Advisory",
    "Agile / Lean Delivery",
    "Cross-Functional Team Leadership",
    "Data-Led Decision Making",
    "Organizational Change Management",
  ],

  highlights: [
    {
      title: "AI Agents at Scale",
      detail:
        "Launched multiple business-unit AI agents (Customer Service, HR, Fieldwork, L&D, Sustainability) within 3–6 months each — achieving 95%+ accuracy and 80% user satisfaction.",
    },
    {
      title: "48.65% YOY Revenue Growth",
      detail:
        'Launched "Agent Boost" at PropertyGuru, generating ~SGD 88.44M in revenue with 48.65% year-over-year growth from 2017–2018.',
    },
    {
      title: "Digital Transformation Lab",
      detail:
        "Built SP Group's transformation lab — 75% reduction in time-to-market, 40% productivity gain, SGD 600K annualised savings, 17 MVPs in year one.",
    },
    {
      title: "App Rating 2.4 → 4.6",
      detail:
        "Grew SP Digital's monthly active users from 80K to 800K out of 1.4M households while transforming the app experience.",
    },
    {
      title: "Market Expansion — Commonwealth Bank",
      detail:
        "Developed mobile-first product suite for business savings and loans across emerging Asian markets — iOS top-ranked finance app.",
    },
    {
      title: "Enterprise Systems & CX",
      detail:
        "Rebuilt SAP-adjacent field ops, customer, and billing platforms. Coached C-level leaders on CX and data-led delivery models across 3,000+ staff.",
    },
  ],

  experience: [
    {
      company: "SP Group",
      period: "2022–Present",
      role: "Director, Product and Experience",
      highlights: [
        "Led enterprise transformation across customer service, IT, and field operations for 3,000+ frontline and back-office staff.",
        "Guided business units in launching AI agents — 95%+ accuracy, 80% user satisfaction, within 3–6 months each.",
        "Established design culture: embedded UX across 7 business units, coaching 150+ staff.",
        "Led SP Digital consumer app from 80K to 800K MAU; app rating improved from 2.4 to 4.6.",
        "Built the Digital Transformation Lab — 75% faster time-to-market, SGD 600K annualised savings.",
        "Sat on the Emerging Technology Committee shaping AI governance and ethical frameworks.",
      ],
    },
    {
      company: "PropertyGuru",
      period: "2015–2022",
      role: "Head of Product & UX (multiple senior roles)",
      highlights: [
        'Launched "Agent Boost" generating ~SGD 88.44M revenue, 48.65% YOY growth.',
        "Led product and design for South-East Asia's leading property marketplace.",
        "Managed end-to-end product lifecycle from research through delivery.",
        "Built and scaled cross-functional product squads.",
      ],
    },
    {
      company: "Commonwealth Bank of Australia",
      period: "2012–2015",
      role: "Senior Product Designer / UX Lead",
      highlights: [
        "Developed mobile-first product suite for business savings and loans across emerging Asian markets.",
        "Achieved iOS top-ranked finance app status in target markets.",
      ],
    },
    {
      company: "First Advantage",
      period: "2009–2012",
      role: "Product & UX Lead",
      highlights: [
        "Led UX for background screening and compliance products.",
        "Drove enterprise UX improvements across global client base.",
      ],
    },
  ],

  speakingAndThoughtLeadership: [
    "Keynote speaker on AI transformation and design leadership across Singapore and Southeast Asia.",
    "Panelist on enterprise AI adoption, ethical AI, and human-centred innovation.",
    "Regular contributor to conversations on design maturity in large organisations.",
  ],

  /**
   * LinkedIn posts — Priscilla's own writing (not reposts).
   * Add new posts here as you publish them.
   */
  linkedInPosts: [
    {
      date: "2024-09",
      url: "https://www.linkedin.com/in/prisc/",
      summary: "Shared reflections on HCI vs UX in the age of AI — arguing that as AI 'eats the tech world', UX stays front-line relevant (AI needs a face, interaction spreads beyond screens) while HCI quietly becomes the hidden power source behind the scenes for trust, bias, ethics, and adaptive interfaces.",
      fullText: `Blueprint for reference. Consistent focus on engagement, leading me to think how UX or design will evolve. I thought Human-Computer Interaction (HCI) might be more encompassing and put more focus on the "Computer" side of the equation.

Here is what AI have to say:

"If AI keeps eating the tech world (and it will), UX becomes more directly relevant for most industry roles, while HCI quietly becomes the hidden power source behind the scenes.

Why UX stays front-line relevant: AI needs a face — The more 'black box' the tech, the more critical it is to design clear, trustworthy, and human-friendly interactions. With AI, interaction spreads beyond screens to voice, gestures, and mixed reality. UX will be about orchestrating all those touchpoints.

Why HCI quietly gains influence: New interaction paradigms — AI changes how we give instructions (natural language, multimodal prompts, emotional cues). HCI research helps us understand those new patterns. Trust, bias, and ethics — HCI's deep methods for studying human perception, cognitive load, and decision-making become critical in AI safety and explainability. Adaptive interfaces — AI will personalise experiences on the fly."

Interesting time.`,
    },
    {
      date: "2024-08",
      url: "https://www.linkedin.com/in/prisc/",
      summary: "Shared SP Group's internal AI safety tool (for 8,000+ contractors and staff), calling out just how lean the squad was — one domain expert, a product owner, a designer and a developer, all juggling multiple other jobs — and still achieved product CSAT above 80%.",
      fullText: `One of the internal tools we shipped — what is not mentioned is just how lean this squad is.

A domain expert, a product owner, a designer and a developer. All of them juggling multiple other jobs. Product CSAT above 80%.`,
    },
    {
      date: "2024-07",
      url: "https://medium.com/building-enterprise-systems-vision-needs-structure",
      title: "Building Enterprise Systems: Vision Needs Structure, Structure Needs Vision",
      summary: "Published on Medium — explores the tension between visionaries and incrementalists in enterprise design. Covers how to navigate this in Grid Operations at SP Group: balancing futuristic ideas with legacy constraints, building MVPs where some experiments are bound to fail, in a risk-averse environment designing for systems that actually power lives.",
      fullText: `Visionaries vs Incrementalists.

In this piece, I share how we navigate this tension in Grid Operations — turning moonshot ideas into measurable MVPs.

From balancing futuristic ideas with legacy constraints, to building MVPs where some experiments are bound to fail... in a risk-adverse environment — this is the reality of designing for systems that actually power lives.`,
    },
  ],

  /**
   * LinkedIn recommendations — paste any received recommendations here.
   * Format: { author, title, relationship, date, text }
   */
  recommendations: [
    // Example (replace with real ones when available):
    // {
    //   author: "Jane Smith",
    //   title: "VP Product at Acme Corp",
    //   relationship: "Managed Priscilla directly",
    //   date: "2024",
    //   text: "Priscilla is an exceptional design leader..."
    // },
  ],

  // Add anything else here — certifications, awards, education, publications, etc.
  additionalContext: `
Priscilla is open to a wide range of conversations — whether that's a collaboration, advisory role,
speaking opportunity, consulting engagement, or simply an interesting project where design and
product thinking can make a difference. She's not narrowly focused on one type of opportunity;
she's interested in connecting with people working on meaningful problems across energy,
sustainability, proptech, fintech, and enterprise technology. Based in Singapore, open to
regional Southeast Asia and global remote collaborations.
  `,
};

module.exports = profile;
