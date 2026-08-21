import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | 'home'
  | 'spin-category'
  | 'spin-reel'
  | 'speak-prep'
  | 'speak-record'
  | 'speak-feedback'
  | 'write-format'
  | 'write-editor'
  | 'write-feedback'

type WriteFormat = 'LinkedIn Post' | 'Newsletter' | 'Short Story' | 'Opinion'
type SpinMode = 'speak' | 'write'

interface FeedbackData {
  headline: string
  score: number
  metrics: { label: string; score: number }[]
  wentWell: string
  improve: string
}

interface TopicItem {
  name: string
  teaser: string
}

interface Category {
  id: string
  label: string
  icon: string
}

interface AppSettings {
  speechMins: number
  researchMins: number
  muteSounds: boolean
}

const SETTINGS_KEY = 'unscripted-settings'
const DEFAULT_SETTINGS: AppSettings = {
  speechMins: 2,
  researchMins: 10,
  muteSounds: false,
}

function clampMins(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      speechMins: clampMins(parsed.speechMins ?? DEFAULT_SETTINGS.speechMins, 1, 10),
      researchMins: clampMins(parsed.researchMins ?? DEFAULT_SETTINGS.researchMins, 1, 60),
      muteSounds: Boolean(parsed.muteSounds),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(next: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    // private mode
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPEAK_PROMPTS = [
  'Should AI make important decisions for us?',
  "What makes a great leader in today's world?",
  'Is remote work better for society?',
  'Should social media have age restrictions?',
  'What is the most important skill for the next decade?',
]

const WRITE_PROMPTS = [
  'Write about a time you completely changed your mind about something.',
  'Describe a decision that felt wrong but turned out right.',
  'What would you tell your younger self about failure?',
  'Explain a complex idea you care about in simple terms.',
  'Write about a habit that quietly changed your life.',
]

const WRITE_FORMATS: WriteFormat[] = ['LinkedIn Post', 'Newsletter', 'Short Story', 'Opinion']

const CATEGORIES: Category[] = [
  { id: 'general', label: 'General', icon: '✨' },
  { id: 'money', label: 'Personal finance', icon: '💰' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', icon: '🚀' },
  { id: 'startups', label: 'Startups', icon: '🌱' },
  { id: 'technology', label: 'Tech / AI', icon: '🤖' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'literature', label: 'Literature', icon: '📚' },
]

const TOPIC_POOLS: Record<string, TopicItem[]> = {
  general: [
    { name: 'The Attention Economy', teaser: 'What does it mean to live in a world where your focus is the product being sold?' },
    { name: 'Parasocial Relationships', teaser: "What does it mean to feel genuine closeness to someone who does not know you exist?" },
    { name: 'Digital Minimalism', teaser: 'What would a typical day look like if your phone was a tool instead of a habit?' },
    { name: 'The Comparison Trap', teaser: "Why does other people's highlight reel make an ordinary day feel like failure?" },
    { name: 'FOMO', teaser: 'What happens to decision-making when missing out feels more painful than choosing poorly?' },
    { name: 'Confirmation Bias', teaser: 'Why do we only find what we were already looking for?' },
    { name: 'The Spotlight Effect', teaser: 'Why do we think everyone notices our mistakes far more than they do?' },
    { name: 'The Habit Loop', teaser: 'What actually has to change for a new routine to stick past the first week?' },
    { name: 'Saying No', teaser: 'Why is a simple boundary so hard to set even when we know we should?' },
    { name: 'First Impressions', teaser: 'How much of a person do we actually decide in the first few seconds?' },
    { name: 'Comfort Zones', teaser: 'When does staying comfortable quietly become the riskiest choice?' },
    { name: 'The Loneliness Epidemic', teaser: 'If we are more connected than ever, why do so many people feel unseen?' },
    { name: 'Algorithmic Polarization', teaser: 'Do recommendation systems pull us apart, or do they just show us what we already wanted?' },
    { name: 'Status Games', teaser: 'How much of daily life is actually a contest for respect that nobody admits they are playing?' },
    { name: 'The Overton Window', teaser: 'How does the range of ideas considered acceptable in public life quietly shift?' },
    { name: 'Performative Authenticity', teaser: 'When does "being real" online become another kind of performance?' },
    { name: 'Deepfakes and Trust', teaser: 'What happens to conversations when you cannot be sure a clip is real?' },
    { name: 'Cancel Culture Dynamics', teaser: 'When does holding people accountable become something else entirely?' },
    { name: 'Small Talk', teaser: 'Is casual conversation a waste of time, or the doorway to every real relationship?' },
    { name: 'The Planning Fallacy', teaser: 'Why do we consistently underestimate how long almost everything will take?' },
    { name: 'Universal Basic Income', teaser: 'If machines do more of the work, should everyone still get a floor of income?' },
    { name: 'Intergenerational Wealth', teaser: 'Is it unfair that some people start life already compounding, or is that just how families work?' },
    { name: 'The Habit of Outrage', teaser: 'Why does getting angry online feel productive even when nothing changes?' },
    { name: 'Second Screens', teaser: 'What do we lose when we never watch, eat, or wait without another feed running?' },
  ],
  money: [
    { name: 'The FIRE Movement', teaser: 'Is retiring in your forties a realistic plan, or a content genre for people who already earn a lot?' },
    { name: 'Coast FIRE', teaser: 'What happens if you save hard early, then let compounding do the rest while you work less?' },
    { name: 'Barista FIRE', teaser: 'Is a part-time job plus a portfolio actually freedom, or just a prettier kind of grind?' },
    { name: 'Index Fund Investing', teaser: 'Why do so many people still try to beat the market when a boring fund usually wins?' },
    { name: 'Housing vs Stocks', teaser: 'If starter homes feel unreachable, is a brokerage account the new down payment?' },
    { name: 'Lifestyle Inflation', teaser: 'Why do expenses always seem to rise to meet income, no matter how much you earn?' },
    { name: 'Loss Aversion', teaser: 'Why does losing money hurt roughly twice as much as gaining the same amount feels good?' },
    { name: 'The Latte Factor Myth', teaser: 'Is cutting small daily spending the key to wealth, or a distraction from the big three costs?' },
    { name: 'The 4% Rule', teaser: 'Can you really live on four percent of your nest egg forever, in a world of longer lives and shocks?' },
    { name: 'Emergency Funds', teaser: 'How many months of cash is enough when the next crisis is never the one you planned for?' },
    { name: 'Compound Interest', teaser: 'Why does starting ten years earlier matter more than picking a slightly better return?' },
    { name: 'Buy vs Rent', teaser: 'Is owning a home still the default path to security, or an expensive identity?' },
    { name: 'House Hacking', teaser: 'Does sharing your space to cut housing costs build wealth, or just delay a real life?' },
    { name: 'Geo-Arbitrage', teaser: 'If you earn in a rich city and live somewhere cheaper, is that clever or unsustainable?' },
    { name: 'Student Debt', teaser: 'When is education still the best investment, and when is it just a very expensive credential?' },
    { name: 'Loud Budgeting', teaser: 'Does saying "I am not spending on that" out loud actually change behavior, or just the vibe?' },
    { name: 'The Hedonic Treadmill', teaser: 'Why does a raise feel amazing for a month and then become the new normal?' },
    { name: 'Sunk Cost Fallacy', teaser: 'Why do we keep paying for things simply because we already have?' },
    { name: 'Sequence of Returns', teaser: 'Why can two people with the same average return retire in totally different shape?' },
    { name: 'Opportunity Cost', teaser: 'What are you quietly giving up every year you stay in a job, city, or habit that is not working?' },
    { name: 'The Broken Window Fallacy', teaser: 'Why is economic destruction never actually good for the economy?' },
    { name: 'Money Scripts', teaser: 'Which stories about money did you inherit, and which of them are still running your choices?' },
    { name: 'Paycheck to Paycheck', teaser: 'Is this mostly a math problem, a wage problem, or a status problem wearing a budget costume?' },
    { name: 'Side Hustle Math', teaser: 'When does extra income actually buy freedom, and when does it just buy a second job?' },
  ],
  entrepreneurship: [
    { name: 'Skin in the Game', teaser: 'Why does advice change so much once someone has something real to lose?' },
    { name: "The Founder's Dilemma", teaser: 'Should you keep control of a company if that means it grows more slowly?' },
    { name: 'Customer Discovery', teaser: 'How do you tell polite interest from a problem people will actually pay to solve?' },
    { name: 'The Bootstrap Tradeoff', teaser: "When is growing with your own money wiser than raising someone else's?" },
    { name: 'Pricing Power', teaser: 'What does it mean when customers barely notice if you raise the price?' },
    { name: 'Moats', teaser: 'What actually stops a competitor from copying you next year?' },
    { name: 'Cash Flow Reality', teaser: 'Why can a profitable-looking business still run out of money?' },
    { name: 'Second-Order Thinking', teaser: 'What happens after the obvious result of a decision, and then after that?' },
    { name: 'The Jockey vs the Horse', teaser: 'Is a great founder in a boring market better than a weak founder in a hot one?' },
    { name: 'Opportunity Cost', teaser: 'What are you quietly giving up every month you stay in a business that is not working?' },
    { name: 'The Solo Founder Stack', teaser: 'Can one person plus AI really replace a small team, or is that just a new kind of burnout?' },
    { name: 'Vibe Coding', teaser: 'If you can describe software and watch it appear, what is the actual skill of a builder now?' },
    { name: 'Productized Services', teaser: 'Should you sell the messy service first, and only then turn the repeatable parts into a product?' },
    { name: 'The Distribution Problem', teaser: 'Why do most good products die, not because they are bad, but because nobody finds them?' },
    { name: 'Unit Economics', teaser: 'If every extra customer costs more than they pay, how long can "growth" hide that?' },
    { name: 'The Expert Beginner', teaser: 'Why do some founders stop learning the moment they get their first win?' },
    { name: 'Founder Loneliness', teaser: 'Why is it so hard to tell the truth about how the business is actually going?' },
    { name: 'Niche Selection', teaser: 'Is a tiny painful market better than a huge vague one?' },
    { name: 'Revenue First', teaser: 'Should you refuse to build anything until someone has already paid?' },
    { name: 'Small Bets', teaser: 'Is it smarter to run ten cheap experiments than to fall in love with one big plan?' },
    { name: 'Selling Clarity', teaser: 'When is the product not software, but making a confusing high-stakes problem feel simple?' },
    { name: 'Default Alive', teaser: 'If you never raise another round, does this company survive on its own?' },
    { name: 'The Ego Tax', teaser: 'How many business decisions are really about looking successful rather than being solvent?' },
    { name: 'Hiring Too Early', teaser: 'When does adding people slow you down instead of speeding you up?' },
  ],
  startups: [
    { name: 'Product-Market Fit', teaser: 'How do you know you have it, and what does it feel like before you do?' },
    { name: 'The Premature Scale Trap', teaser: 'Why does hiring and spending before demand is real so often kill a young company?' },
    { name: 'Minimum Viable Product', teaser: 'How unfinished can a first version be before it stops teaching you anything useful?' },
    { name: 'The Pivot', teaser: 'When is changing direction courage, and when is it just avoiding the hard problem?' },
    { name: 'Runway', teaser: 'What decisions look different when you only have nine months of cash left?' },
    { name: 'Network Effects', teaser: 'When does each new user actually make the product more valuable for everyone else?' },
    { name: 'Founder-Market Fit', teaser: 'Does it matter that you personally care about this problem, or is that just a story investors like?' },
    { name: 'Blitzscaling', teaser: 'When is growing as fast as possible the right move, and when is it reckless?' },
    { name: 'Cap Table Gravity', teaser: 'How do early ownership decisions quietly shape every option you have later?' },
    { name: 'The Feature Factory', teaser: 'Why do teams keep shipping when customers still have the same unsolved problem?' },
    { name: 'Micro-SaaS', teaser: 'Can a tiny product in a narrow niche be a real company, or is it just a hobby with Stripe?' },
    { name: 'Vertical AI Agents', teaser: 'Why are startups winning in one boring industry instead of building a general AI for everyone?' },
    { name: 'Solo-Founded Startups', teaser: 'Is a one-person company a superpower in 2026, or a story that breaks at the first real customer?' },
    { name: 'Default Alive', teaser: 'If fundraising froze tomorrow, would this startup live or quietly die?' },
    { name: 'The Frozen Middle', teaser: 'Why do some startups stall after a promising launch and never quite recover?' },
    { name: 'First Mover Disadvantage', teaser: 'Is being first to market actually as valuable as everyone claims?' },
    { name: "The Innovator's Dilemma", teaser: 'Why do great companies fail precisely because they listen too carefully to customers?' },
    { name: 'Survivorship Bias', teaser: 'Why are the most famous founders the worst people to copy blindly?' },
    { name: 'Churn', teaser: 'What does it mean when new users arrive fast and leave just as fast?' },
    { name: 'CAC vs LTV', teaser: 'When does buying customers become a machine, and when does it become a hole?' },
    { name: 'Seed vs Bootstrap', teaser: 'In a year when capital clusters around giant AI, should a normal SaaS even raise?' },
    { name: 'Build in Public', teaser: 'Does sharing the journey find customers, or just find an audience that never pays?' },
    { name: 'The Demo-to-Revenue Gap', teaser: 'Why do AI prototypes look magical and still fail to become a business?' },
    { name: 'Platform Risk', teaser: 'What happens when your whole company sits on someone else\'s model, store, or API?' },
  ],
  technology: [
    { name: 'Agentic AI', teaser: 'What changes when software can plan, use tools, and act for hours without waiting for a prompt?' },
    { name: 'Prompt Injection', teaser: 'How do you attack an AI system by simply talking to it?' },
    { name: 'Context Engineering', teaser: 'Is feeding the model the right information now more important than picking a bigger model?' },
    { name: 'Enshittification', teaser: 'Why do platforms that start great always seem to end up terrible?' },
    { name: 'The Filter Bubble', teaser: 'How does personalization quietly shrink the world you see?' },
    { name: 'The Attention Economy', teaser: 'What does it mean to live in a world where your focus is the product?' },
    { name: 'AI Agent Liability', teaser: 'If an autonomous agent books, buys, or breaks something, who is actually responsible?' },
    { name: 'Hallucinations', teaser: 'Why do fluent systems invent facts, and when is that dangerous versus merely annoying?' },
    { name: 'Hyperscale Data Centers', teaser: 'Should communities pause giant AI infrastructure because of power, water, and land?' },
    { name: 'The AI Consciousness Debate', teaser: 'Are we arguing about whether models "feel," or avoiding the real question of product harm?' },
    { name: 'Technological Unemployment', teaser: 'Is this wave of automation genuinely different from every previous one?' },
    { name: 'Dark Patterns', teaser: 'How do interfaces trick you into doing things you never intended?' },
    { name: 'Algorithmic Amplification', teaser: 'Why does the internet surface the most extreme version of every idea?' },
    { name: 'Synthetic Media', teaser: 'What happens to news, art, and evidence when anyone can generate a convincing clip?' },
    { name: 'Personal AI Agents', teaser: 'Would you let a bot live in your email, calendar, and bank with a long-running goal?' },
    { name: 'The Jevons Paradox', teaser: 'Why does making technology more efficient sometimes cause us to use more of it?' },
    { name: 'AI Energy Use', teaser: 'Is the climate cost of intelligence a rounding error, or the next industrial shock?' },
    { name: 'Open vs Closed Models', teaser: 'Should powerful AI be public infrastructure, or a tightly held corporate product?' },
    { name: 'Alignment', teaser: 'Can we make systems that reliably do what we mean, not just what we typed?' },
    { name: 'The Zero-Day Problem', teaser: 'What does it mean that every system has vulnerabilities no one has found yet?' },
    { name: "Moore's Law After Moore", teaser: 'What happens to a society that got used to computers getting cheaper every year?' },
    { name: 'Tool Use and MCP', teaser: 'Once models can call APIs like a junior employee, what new failures show up?' },
    { name: 'Model Collapse', teaser: 'What happens if tomorrow\'s models are trained mostly on yesterday\'s machine-written text?' },
    { name: 'Human-in-the-Loop', teaser: 'When is a person in the process a real safeguard, and when is it just theater?' },
  ],
  fitness: [
    { name: 'GLP-1s and Muscle', teaser: 'If the new weight-loss drugs work, how do you keep the weight loss from including your strength?' },
    { name: 'Zone 2 Training', teaser: 'Why is easy cardio you can still talk through suddenly treated like a superpower?' },
    { name: 'Progressive Overload', teaser: 'Why is the principle behind every fitness improvement so simple yet so ignored?' },
    { name: 'The Protein Leverage Hypothesis', teaser: 'Do we keep eating until we hit a protein target, even after calories have gone far past enough?' },
    { name: 'Rest as Training', teaser: 'Is recovery actually where most physical improvement happens?' },
    { name: 'Resistance Training', teaser: 'Why is lifting becoming the default prescription even for people who only wanted to lose fat?' },
    { name: 'Body Recomposition', teaser: 'Can you lose fat and gain muscle at the same time, or is that mostly a beginner story?' },
    { name: 'Overtraining Syndrome', teaser: 'What happens when working harder actually makes you perform worse?' },
    { name: 'The SAID Principle', teaser: 'Why does the body only improve at exactly what you practice?' },
    { name: 'The 10,000 Steps Myth', teaser: "Where did the world's most popular fitness goal actually come from?" },
    { name: 'VO2 Max', teaser: 'Is cardiorespiratory fitness the vital sign we should have been tracking all along?' },
    { name: 'NEAT', teaser: 'How much of "metabolism" is just fidgeting, walking, and not sitting still?' },
    { name: 'Sleep as a Performance Drug', teaser: 'What if the cheapest way to get stronger is simply to sleep like it matters?' },
    { name: 'Ultraprocessed Food', teaser: 'What happens to appetite when food is engineered to be eaten quickly and never quite satisfy?' },
    { name: 'Circadian Eating', teaser: 'Does when you eat matter as much as what you eat?' },
    { name: 'Insulin Resistance', teaser: 'What changes when cells stop responding well to the hormone that handles blood sugar?' },
    { name: 'The Set Point Theory', teaser: 'Does the body defend a preferred weight range, and can that range actually move?' },
    { name: 'The Gut-Brain Axis', teaser: 'How much of mood and craving is coming from the gut rather than from willpower?' },
    { name: 'Hydration Myths', teaser: 'Is eight glasses a day science, marketing, or a useful rule of thumb?' },
    { name: 'Walking as Training', teaser: 'Can a lot of easy walking outperform a little heroic gym time for most people?' },
    { name: 'Consistency vs Intensity', teaser: 'Why do boring plans beat extreme ones after month three?' },
    { name: 'Muscle Memory', teaser: 'How do our muscles remember movements our conscious mind has forgotten?' },
    { name: 'The Plateau Effect', teaser: 'Why does progress stop even when you keep putting in the same effort?' },
    { name: 'Exercise Addiction', teaser: 'At what point does a healthy habit become a harmful compulsion?' },
  ],
  productivity: [
    { name: 'Deep Work', teaser: 'What happens to output when attention is protected instead of constantly split?' },
    { name: 'Attention Residue', teaser: 'How long does part of your mind stay stuck on the last thing you were doing?' },
    { name: 'Maker vs Manager Time', teaser: 'Why do meetings destroy some kinds of work and barely touch others?' },
    { name: 'The Conductor Block', teaser: 'Should AI prompting and review live in their own hours, so they stop interrupting real thinking?' },
    { name: "Parkinson's Law", teaser: 'Why does work expand to fill exactly the time you give it?' },
    { name: 'Context Switching', teaser: 'How much of a workday disappears just from jumping between tasks?' },
    { name: 'Time Blocking', teaser: 'Does assigning hours to work actually change whether the work gets done?' },
    { name: 'Decision Fatigue', teaser: 'Why does the quality of choices drop after a long day of making them?' },
    { name: 'Implementation Intentions', teaser: 'Why does "I will do X at Y in Z place" beat a vague intention almost every time?' },
    { name: 'The 90-Minute Floor', teaser: 'Is a focus block shorter than an hour and a half just shallow work in costume?' },
    { name: 'Notification Debt', teaser: 'What happens when every app can tap you on the shoulder at once?' },
    { name: 'Shallow Work', teaser: 'How much of a job is email, chat, and status updates pretending to be progress?' },
    { name: 'The Two-Minute Rule', teaser: 'Should tiny tasks be done immediately, or do they just interrupt deeper work?' },
    { name: 'Theme Days', teaser: 'Does grouping similar work onto the same day actually protect focus, or just reorganize chaos?' },
    { name: 'The Shutdown Ritual', teaser: 'Can a ten-minute close-out stop your brain from working the evening shift unpaid?' },
    { name: 'Calendar as Reality', teaser: 'If it is not on the calendar, does it actually exist as a plan?' },
    { name: "Goodhart's Law", teaser: 'Why does a useful measure stop being useful the moment it becomes a target?' },
    { name: 'Flow State', teaser: 'What is actually happening in the brain during peak creative performance?' },
    { name: 'Weekly Review', teaser: 'Why do people who look back once a week seem to waste fewer weeks?' },
    { name: 'Batching', teaser: 'Is checking messages three times a day discipline, or a luxury only some jobs allow?' },
    { name: 'Single-Tasking', teaser: 'If multitasking is a myth, why does it still feel like the only way to keep up?' },
    { name: 'The Planning Fallacy', teaser: 'Why do we consistently underestimate how long almost everything will take?' },
    { name: 'AI as Interruption', teaser: 'Does a helpful copilot still cost you 23 minutes of focus every time you "just check" it?' },
    { name: 'Minimum Viable Discipline', teaser: 'What is the smallest weekly habit that still counts as a real practice?' },
  ],
  history: [
    { name: 'Why Rome Fell', teaser: 'Was it climate, plague, migration, money, or all of them at once — and why do we still want one answer?' },
    { name: 'Tulip Mania', teaser: 'What can a 17th-century flower craze teach us about financial bubbles today?' },
    { name: 'The Haitian Revolution', teaser: 'Why is the only successful slave revolt in history still so rarely taught?' },
    { name: 'The Library of Alexandria', teaser: 'How much human knowledge has been permanently lost, and does it matter?' },
    { name: 'Bread and Circuses', teaser: 'When does entertainment become a substitute for political engagement?' },
    { name: 'The Space Race', teaser: 'What can two superpowers competing to leave the planet teach us about motivation?' },
    { name: 'The Wrong Turn at Sarajevo', teaser: 'How did a navigation mistake on one morning start a world war?' },
    { name: 'Operation Paperclip', teaser: 'What do you do with brilliant scientists on the wrong side of a war?' },
    { name: 'The Great Stink', teaser: "How did one summer of unbearable smell transform London's infrastructure forever?" },
    { name: 'The Madness of Crowds', teaser: 'Why do rational individuals sometimes produce irrational collective behavior?' },
    { name: 'The Black Death', teaser: 'How did a plague rewrite labor, faith, and the map of Europe?' },
    { name: 'The Printing Press', teaser: 'Was cheap text the original social network — including the panic and the propaganda?' },
    { name: 'The Columbian Exchange', teaser: 'How did one set of voyages remix food, disease, and power across the whole planet?' },
    { name: 'The Industrial Revolution', teaser: 'When machines multiplied output, what happened to time, family, and cities?' },
    { name: 'The Partition of India', teaser: 'What does a line on a map do to millions of lives in a few months?' },
    { name: 'The Meiji Restoration', teaser: 'How did Japan transform so fast, and what did it have to give up to do it?' },
    { name: 'The Fall of the Berlin Wall', teaser: 'What does it feel like when a political system everyone assumed was permanent just ends?' },
    { name: 'Who Owns History', teaser: 'Why do governments fight so hard over which version of the past is allowed to be taught?' },
    { name: 'Why Empires Fall', teaser: 'Is decline usually one catastrophe, or a pile of small failures that finally add up?' },
    { name: 'The Silk Roads', teaser: 'Was globalization invented by merchants, monks, and plague along a chain of oases?' },
    { name: 'The French Revolution', teaser: 'When does a fight for rights become a machine that eats its own?' },
    { name: 'The Mongol Empire', teaser: 'How did a steppe power connect more of the world than almost anyone before it?' },
    { name: 'Historical Hoaxes', teaser: 'What does a viral claim that a whole dynasty "never existed" say about the internet and the past?' },
    { name: 'The 250-Year Question', teaser: 'As America marks a quarter-millennium, what parts of the founding story still hold up?' },
  ],
  literature: [
    { name: 'The Unreliable Narrator', teaser: 'What happens when the person telling the story cannot be trusted — and you only realize it slowly?' },
    { name: "Chekhov's Gun", teaser: 'Why should every detail in a story earn its place by the ending?' },
    { name: "The Hero's Journey", teaser: 'Why do so many stories follow the same shape across cultures and centuries?' },
    { name: 'Dramatic Irony', teaser: 'What does the audience know that the character does not, and why does that tension work?' },
    { name: 'The Death of the Author', teaser: 'Once a text is published, who gets to decide what it means?' },
    { name: 'Show Don\'t Tell', teaser: 'When is this rule useful, and when does telling actually serve the reader better?' },
    { name: 'Catharsis', teaser: 'Why do we seek out tragedy if the point is to feel something painful?' },
    { name: 'Intertextuality', teaser: 'How much of every book is secretly in conversation with other books?' },
    { name: 'The Frame Story', teaser: 'Why tell a story inside another story instead of telling it straight?' },
    { name: 'Stream of Consciousness', teaser: 'Can writing follow thought as it actually happens, messy and unfinished?' },
    { name: 'Negative Capability', teaser: 'What did Keats mean by staying with mystery instead of forcing an answer?' },
    { name: 'BookTok', teaser: 'Has a short-video feed changed what gets read, or only what gets talked about?' },
    { name: 'Fanfiction as Literature', teaser: 'When does writing in someone else\'s world become its own art form?' },
    { name: 'The Age of Unreliable Feeds', teaser: 'Are we living inside the same device literature used to put only in novels?' },
    { name: 'Tragic Flaw', teaser: 'Do people fall because of one character defect, or because the world is structured to trip them?' },
    { name: 'Magical Realism', teaser: 'What happens when the impossible walks into an otherwise ordinary street?' },
    { name: 'Free Indirect Style', teaser: 'How can a third-person story still sound like it is thinking someone\'s private thoughts?' },
    { name: 'The Bildungsroman', teaser: 'Why do we never get tired of stories about someone growing up and getting it wrong first?' },
    { name: 'The Twist Ending', teaser: 'When is a surprise earned, and when is it just a trick played on the reader?' },
    { name: 'Translation', teaser: 'If every language carries a different music, can a translated book still be "the same" book?' },
    { name: 'The Canon Wars', teaser: 'Who decides which books are required, and what gets left off the list?' },
    { name: 'Cliffhangers', teaser: 'Is leaving a chapter unfinished a craft, or just a way to farm the next click?' },
    { name: 'World-Building', teaser: 'How much invented history does a story need before it starts drowning the characters?' },
    { name: 'Voice', teaser: 'Why can two writers tell the same plot and only one of them feel alive on the page?' },
  ],
}


// Merge all pools for "anything"
TOPIC_POOLS.anything = Object.entries(TOPIC_POOLS)
  .filter(([k]) => k !== 'anything')
  .flatMap(([, v]) => v)

const SPEAK_FEEDBACK: FeedbackData = {
  headline: 'You showed up.',
  score: 82,
  metrics: [
    { label: 'Clarity', score: 8 },
    { label: 'Fluency', score: 7 },
    { label: 'Structure', score: 8 },
    { label: 'Vocabulary', score: 8 },
  ],
  wentWell: 'Your answer had a clear opinion and your example made the argument easy to understand.',
  improve: 'Your ideas were strong, but you jumped between points. Try using a simple Point → Example → Conclusion structure.',
}

const WRITE_FEEDBACK: FeedbackData = {
  headline: 'Nice work.',
  score: 84,
  metrics: [
    { label: 'Clarity', score: 9 },
    { label: 'Structure', score: 8 },
    { label: 'Originality', score: 8 },
    { label: 'Engagement', score: 8 },
  ],
  wentWell: 'Your opening immediately creates curiosity and establishes a clear point of view.',
  improve: 'Your middle section becomes repetitive. Try adding one specific personal example.',
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fmtTime(secs: number) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  disabled?: boolean
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 cursor-pointer select-none'
  const vars = {
    primary: 'bg-navy text-cream px-7 py-3.5 text-sm tracking-wide hover:opacity-90 active:scale-[0.98]',
    outline: 'border border-navy/30 text-navy px-6 py-3 text-sm hover:border-navy hover:bg-navy/5 active:scale-[0.97]',
    ghost: 'text-muted text-sm px-3 py-2 hover:text-ink transition-colors',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${vars[variant]} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  onSettings,
  onBack,
  showBack = false,
  dark = false,
  tagline,
}: {
  onSettings?: () => void
  onBack?: () => void
  showBack?: boolean
  dark?: boolean
  tagline?: string
}) {
  const text = dark ? 'text-cream/70' : 'text-muted'
  const iconBg = dark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue/20 hover:bg-blue/40'
  const iconText = dark ? 'text-cream' : 'text-navy'
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
      {showBack ? (
        <button
          onClick={onBack}
          className={`text-sm ${text} hover:text-ink transition-colors flex items-center gap-1 cursor-pointer`}
        >
          ← Back
        </button>
      ) : (
        <div>
          <span className={`font-serif text-xl ${dark ? 'text-cream' : 'text-navy'} tracking-tight`}>
            OnTheSpot
          </span>
          {tagline && (
            <p className={`text-sm ${text} mt-0.5`}>{tagline}</p>
          )}
        </div>
      )}
      <div className="flex items-center gap-3">
        {onSettings && (
          <button
            onClick={onSettings}
            aria-label="Settings"
            className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center ${iconText} transition-colors cursor-pointer`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function HomeScreen({
  onSpeak,
  onWrite,
  onSurprise,
  onSettings,
}: {
  onSpeak: () => void
  onWrite: () => void
  onSurprise: () => void
  onSettings: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Header onSettings={onSettings} tagline="Think fast. Speak clearly." />
      <main className="flex-1 px-6 py-10 max-w-lg mx-auto w-full">

        <h1 className="font-serif text-4xl text-ink leading-tight mb-10 fade-up" style={{ animationDelay: '0.05s' }}>
          What do you want to<br />practice today?
        </h1>

        <div className="space-y-4 mb-10 fade-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={onSpeak}
            className="w-full text-left p-6 rounded-2xl border border-border bg-white hover:border-navy/40 hover:shadow-sm hover:-translate-y-px transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl">🎤</span>
                  <span className="text-xs font-semibold tracking-widest text-muted uppercase">SPEAK</span>
                </div>
                <p className="font-medium text-lg leading-snug mb-2 text-ink">Spin a topic. Think 10 minutes. Speak for 2.</p>
                <p className="text-xs text-muted">Speaking · English · Communication</p>
              </div>
              <span className="text-navy text-sm font-medium mt-1 ml-6 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">Start</span>
            </div>
          </button>

          <button
            onClick={onWrite}
            className="w-full text-left p-6 rounded-2xl border border-border bg-white hover:border-navy/40 hover:shadow-sm hover:-translate-y-px transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl">✍️</span>
                  <span className="text-xs font-semibold tracking-widest text-muted uppercase">WRITE</span>
                </div>
                <p className="font-medium text-lg leading-snug mb-2 text-ink">Spin a topic. Write under pressure.</p>
                <p className="text-xs text-muted">Writing · Storytelling · Ideas</p>
              </div>
              <span className="text-navy text-sm font-medium mt-1 ml-6 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">Start</span>
            </div>
          </button>
        </div>

        <div className="text-center fade-up" style={{ animationDelay: '0.15s' }}>
          <p className="text-muted text-sm mb-3">Feeling spontaneous?</p>
          <Btn variant="outline" onClick={onSurprise}>🎲 Surprise Me</Btn>
        </div>
      </main>
    </div>
  )
}

// ─── Spin Category ────────────────────────────────────────────────────────────

function SpinCategoryScreen({
  mode,
  onContinue,
  onBack,
  onSettings,
}: {
  mode: SpinMode
  onContinue: (cat: Category) => void
  onBack: () => void
  onSettings: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Header onSettings={onSettings} onBack={onBack} showBack />
      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full fade-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{mode === 'speak' ? '🎤' : '✍️'}</span>
          <span className="text-xs font-semibold tracking-widest text-muted uppercase">{mode === 'speak' ? 'SPEAK' : 'WRITE'}</span>
        </div>
        <h1 className="font-serif text-3xl text-ink mb-2 mt-2">What do you want to explore?</h1>
        <p className="text-muted text-sm mb-8">Choose a category, then spin for your topic.</p>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border text-center transition-all duration-150 cursor-pointer active:scale-[0.97] ${
                selected === cat.id
                  ? 'border-navy bg-navy/5 text-navy scale-[1.02] shadow-sm'
                  : 'border-border bg-white text-ink hover:border-navy/30 hover:bg-navy/[0.02]'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs font-medium leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>

        <Btn
          onClick={() => {
            const cat = CATEGORIES.find(c => c.id === selected)
            if (cat) onContinue(cat)
          }}
          disabled={!selected}
          className="w-full"
        >
          Continue
        </Btn>
      </main>
    </div>
  )
}

// ─── Discover Spin ────────────────────────────────────────────────────────────

const ITEM_H = 72
const VISIBLE_COUNT = 5
const CENTER_OFFSET = 2

type SpinState = 'idle' | 'spinning' | 'landed'

function SpinReelScreen({
  category,
  pool,
  ctaLabel,
  onAccept,
  onBack,
  onSettings,
}: {
  category: Category
  pool: TopicItem[]
  ctaLabel: string
  onAccept: (topic: TopicItem) => void
  onBack: () => void
  onSettings: () => void
}) {
  const buildIdleReel = () => {
    const s = shuffled([...pool, ...pool, ...pool])
    return Array.from({ length: 32 }, (_, i) => s[i % s.length])
  }

  const [reelItems, setReelItems] = useState<TopicItem[]>(buildIdleReel)
  const [centerIndex, setCenterIndex] = useState(CENTER_OFFSET)
  const [transitionMs, setTransitionMs] = useState(0)
  const [spinState, setSpinState] = useState<SpinState>('idle')
  const [landedTopic, setLandedTopic] = useState<TopicItem | null>(null)
  const [winnerPop, setWinnerPop] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const bgRef = useRef<{ oscs: OscillatorNode[]; gain: GainNode } | null>(null)

  const stopBg = useCallback(() => {
    const nodes = bgRef.current
    if (!nodes) return
    try {
      const ctx = nodes.gain.context
      const t = ctx.currentTime
      nodes.gain.gain.cancelScheduledValues(t)
      nodes.gain.gain.linearRampToValueAtTime(0.0001, t + 0.25)
      nodes.oscs.forEach(o => { try { o.stop(t + 0.3) } catch { /* already stopped */ } })
    } catch {
      // silent fallback
    }
    bgRef.current = null
  }, [])

  const startBg = useCallback(() => {
    stopBg()
    if (soundMuted) return
    try {
      const ctx = getAudioCtx()
      const master = ctx.createGain()
      master.gain.setValueAtTime(0, ctx.currentTime)
      master.connect(ctx.destination)
      const freqs = [110, 164.81, 196]
      const oscs = freqs.map((f, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = f
        g.gain.value = i === 0 ? 0.045 : 0.022
        osc.connect(g)
        g.connect(master)
        osc.start()
        return osc
      })
      master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.35)
      bgRef.current = { oscs, gain: master }
    } catch {
      // silent fallback
    }
  }, [stopBg])

  useEffect(() => {
    muteListeners.add(stopBg)
    return () => {
      muteListeners.delete(stopBg)
      timeoutsRef.current.forEach(clearTimeout)
      stopBg()
    }
  }, [stopBg])

  const doSpin = useCallback(() => {
    if (spinState === 'spinning') return

    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    setLandedTopic(null)
    setWinnerPop(false)
    setSpinState('spinning')
    startBg()

    const target = pickRandom(pool)
    const others = pool.filter(t => t.name !== target.name)
    const source = others.length > 0 ? others : pool
    const mix = shuffled([...source, ...source, ...source, ...source])
    const leadCount = 16 + Math.floor(Math.random() * 9)
    const trailCount = 10
    const filler = (n: number, offset: number) =>
      Array.from({ length: n }, (_, i) => mix[(offset + i) % mix.length] ?? target)

    const items: TopicItem[] = [
      ...filler(CENTER_OFFSET, 0),
      ...filler(leadCount, CENTER_OFFSET),
      target,
      ...filler(trailCount, CENTER_OFFSET + leadCount),
    ]
    const targetIndex = CENTER_OFFSET + leadCount

    setReelItems(items)
    setCenterIndex(CENTER_OFFSET)
    setTransitionMs(0)

    const tickMs = 36
    let t = 0
    let idx = CENTER_OFFSET

    for (let i = 0; i < leadCount; i++) {
      t += tickMs
      const timeout = setTimeout(() => {
        idx++
        setTransitionMs(tickMs)
        setCenterIndex(idx)
        playSpinTick()
      }, t)
      timeoutsRef.current.push(timeout)
    }

    t += tickMs
    const stopTimeout = setTimeout(() => {
      setTransitionMs(55)
      setCenterIndex(targetIndex)
      playSpinTick()
      playSpinStop()
      stopBg()
      setLandedTopic(target)
      setSpinState('landed')
      setTimeout(() => setWinnerPop(true), 80)
    }, t)
    timeoutsRef.current.push(stopTimeout)
  }, [spinState, pool, startBg, stopBg])

  const translateY = -(centerIndex - CENTER_OFFSET) * ITEM_H

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Header onSettings={onSettings} onBack={onBack} showBack />

      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full flex flex-col items-center fade-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{category.icon}</span>
          <span className="text-xs font-semibold tracking-widest text-muted uppercase">{category.label}</span>
        </div>
        <p className="text-xs text-muted mb-10">Spin to discover your topic.</p>

        {/* Reel */}
        <div
          className="w-full relative mb-10 select-none"
          style={{ height: ITEM_H * VISIBLE_COUNT, overflow: 'hidden' }}
        >
          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 z-10 pointer-events-none"
            style={{ height: '40%', background: 'linear-gradient(to bottom, #FFFDF5 15%, transparent)' }} />
          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
            style={{ height: '40%', background: 'linear-gradient(to top, #FFFDF5 15%, transparent)' }} />

          {/* Center window — tints blue when landed */}
          <div className="absolute inset-x-6 z-[5] pointer-events-none rounded-xl"
            style={{
              top: CENTER_OFFSET * ITEM_H,
              height: ITEM_H,
              border: '1px solid #D8E0F0',
              backgroundColor: spinState === 'landed' ? 'rgba(149,177,238,0.07)' : 'transparent',
              transition: 'background-color 0.5s ease',
            }} />

          {/* Scrolling strip */}
          <div
            style={{
              transform: `translateY(${translateY}px)`,
              transition: transitionMs > 0
                ? `transform ${transitionMs}ms linear`
                : 'none',
            }}
          >
            {reelItems.map((item, i) => {
              const dist = Math.abs(i - centerIndex)
              const isCenter = dist === 0
              const isWinner = spinState === 'landed' && isCenter
              const opacity = isWinner ? 1 : Math.max(0.06, 1 - dist * 0.38)
              const blurPx = dist >= 2 ? 3.5 : dist === 1 ? 1.2 : 0
              return (
                <div key={i} style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      opacity,
                      filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
                      fontSize: isCenter ? '1.35rem' : dist === 1 ? '1.0rem' : '0.82rem',
                      fontFamily: 'DM Serif Display, Georgia, serif',
                      color: isWinner ? '#364C84' : '#1C1C1E',
                      fontWeight: isCenter ? 500 : 400,
                      textAlign: 'center',
                      lineHeight: 1.25,
                      transform: isWinner && winnerPop ? 'scale(1.07)' : 'scale(1)',
                      transition: [
                        'font-size 0.08s ease',
                        'opacity 0.08s ease',
                        'color 0.35s ease',
                        isWinner ? 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' : '',
                      ].filter(Boolean).join(', '),
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* SPIN button — large, prominent */}
        {spinState !== 'landed' && (
          <button
            onClick={doSpin}
            disabled={spinState === 'spinning'}
            className={`w-full max-w-xs py-4 rounded-2xl font-semibold text-base tracking-wide transition-all duration-150 select-none ${
              spinState === 'spinning'
                ? 'bg-navy/50 text-cream/60 cursor-not-allowed'
                : 'bg-navy text-cream hover:opacity-90 active:scale-[0.97] cursor-pointer'
            }`}
          >
            {spinState === 'spinning' ? 'Spinning...' : '🎰  Spin'}
          </button>
        )}

        {/* Landed: teaser card + actions, fades in after winner pops */}
        {spinState === 'landed' && landedTopic && (
          <div
            className="w-full text-center"
            style={{
              opacity: winnerPop ? 1 : 0,
              transform: winnerPop ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Your topic</p>
            <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto mb-8 italic">
              &ldquo;{landedTopic.teaser}&rdquo;
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                onClick={() => onAccept(landedTopic)}
                className="w-full py-3.5 rounded-xl bg-navy text-cream text-sm font-medium tracking-wide hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                {ctaLabel}
              </button>
              <button
                onClick={doSpin}
                className="w-full py-2.5 text-sm text-muted hover:text-navy transition-colors cursor-pointer"
              >
                Spin Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Speak Prep ───────────────────────────────────────────────────────────────

let sharedAudioCtx: AudioContext | null = null
let soundMuted = false
const muteListeners = new Set<() => void>()

function setSoundMuted(muted: boolean) {
  soundMuted = muted
  if (muted) muteListeners.forEach(fn => fn())
}

function getAudioCtx() {
  if (!sharedAudioCtx) sharedAudioCtx = new AudioContext()
  if (sharedAudioCtx.state === 'suspended') void sharedAudioCtx.resume()
  return sharedAudioCtx
}

function playChime() {
  if (soundMuted) return
  try {
    const ctx = getAudioCtx()
    const tones = [523.25, 659.25, 783.99]
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
      osc.start(t)
      osc.stop(t + 1.4)
    })
  } catch {
    // silent fallback
  }
}

function playSpinTick() {
  if (soundMuted) return
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 760 + Math.random() * 180
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0.1, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055)
    osc.start(t)
    osc.stop(t + 0.06)
  } catch {
    // silent fallback
  }
}

function playSpinStop() {
  if (soundMuted) return
  try {
    const ctx = getAudioCtx()
    const tones = [523.25, 659.25, 783.99]
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.07
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.16, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
      osc.start(t)
      osc.stop(t + 0.7)
    })
  } catch {
    // silent fallback
  }
}

function SpeakHelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const framework = [
    { n: '01', title: 'POINT', sub: "What's your main idea?", line: '"I think ___ is interesting because…"' },
    { n: '02', title: 'REASON', sub: 'Why do you think that?', line: '"The main reason is…"' },
    { n: '03', title: 'EXAMPLE', sub: 'Make it concrete.', line: '"For example…"' },
    { n: '04', title: 'POINT', sub: 'Wrap up your thought.', line: '"So overall, I would say…"' },
  ]

  const research = [
    { n: '01', title: 'What is it?', body: 'Get a simple definition.' },
    { n: '02', title: 'Why does it matter?', body: 'Understand its importance.' },
    { n: '03', title: 'Key facts', body: 'Find 2–3 useful facts.' },
    { n: '04', title: 'One example', body: 'Choose a real-world example.' },
    { n: '05', title: 'One challenge', body: 'Find a problem, limitation, or opposing view.' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: 'rgba(28,28,30,0.5)' }}
      onClick={onClose}
    >
      <div
        className="help-scroll bg-cream w-full max-w-lg max-h-[88vh] rounded-t-2xl sm:rounded-2xl overflow-y-auto fade-up"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="speak-help-title"
      >
        <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 id="speak-help-title" className="font-serif text-2xl text-ink leading-snug">
              Structure your 1-minute answer
            </h2>
            <p className="text-muted text-sm mt-1.5 leading-relaxed">
              Understand the topic → organize your thoughts → speak clearly
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink cursor-pointer text-xl leading-none flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-center font-semibold text-navy tracking-wide text-sm mb-4">
            POINT → REASON → EXAMPLE → POINT
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {framework.map(item => (
              <div key={item.n + item.title} className="p-4 rounded-xl border border-border bg-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">
                  {item.n} — {item.title}
                </p>
                <p className="text-sm font-medium text-ink mb-1">{item.sub}</p>
                <p className="text-sm text-muted italic">{item.line}</p>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-ink mb-1">🔎 What should I research?</p>
          <p className="text-sm text-muted mb-3">{"Don't research everything. Find these 5 things:"}</p>
          <div className="space-y-2 mb-8">
            {research.map(item => (
              <div key={item.n} className="flex gap-3 p-3 rounded-xl border border-border bg-white">
                <span className="text-xs font-semibold tabular-nums text-navy flex-shrink-0 mt-0.5">{item.n}</span>
                <p className="text-sm text-ink leading-snug">
                  <span className="font-medium">{item.title}</span>{' '}
                  <span className="text-muted">{item.body}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-blue/30 bg-blue/5 mb-6">
            <p className="text-sm font-semibold text-ink mb-2">💡 Quick Example</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Topic</p>
            <p className="text-sm font-medium text-ink mb-3">Electric Vehicles</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Keywords</p>
            <p className="text-sm text-navy mb-3">Cleaner transport · Fossil fuels · India · Charging · Batteries · Future</p>
            <p className="text-sm text-muted">{"Don't write a full script. Use keywords to guide what you say."}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-white mb-6">
            <p className="text-sm font-semibold text-ink mb-1">⚡ {"Don't write a script."}</p>
            <p className="text-sm text-muted">Write keywords → organize your thoughts → speak naturally.</p>
          </div>

          <Btn onClick={onClose} className="w-full">Got it, let&apos;s prepare</Btn>
        </div>
      </div>
    </div>
  )
}

const WRITE_HELP: Record<WriteFormat, {
  title: string
  subtitle: string
  chain: string
  framework: { n: string; title: string; sub: string; line: string }[]
  researchIntro: string
  research: { n: string; title: string; body: string }[]
  exampleTopic: string
  exampleKeywords: string
  reminderTitle: string
  reminderBody: string
}> = {
  'LinkedIn Post': {
    title: 'Structure your LinkedIn post',
    subtitle: 'Stop the scroll → make one point → end with one ask',
    chain: 'HOOK → INSIGHT → PROOF → CTA',
    framework: [
      { n: '01', title: 'HOOK', sub: 'Stop the scroll in two lines.', line: '"Most people get ___ completely wrong."' },
      { n: '02', title: 'INSIGHT', sub: "What's the one idea?", line: '"The real reason is…"' },
      { n: '03', title: 'PROOF', sub: 'Make it believable.', line: '"Last month I saw this when…"' },
      { n: '04', title: 'CTA', sub: 'One next step, not five.', line: '"If this is you, try ___ today."' },
    ],
    researchIntro: "Don't research everything. Find these 5 things:",
    research: [
      { n: '01', title: 'Who is this for?', body: 'Name one reader, not "everyone."' },
      { n: '02', title: 'One claim', body: 'What do you want them to believe?' },
      { n: '03', title: 'One proof', body: 'A number, a story, or a result.' },
      { n: '04', title: 'The tension', body: 'What do people usually get wrong?' },
      { n: '05', title: 'One ask', body: 'Comment, save, or try something specific.' },
    ],
    exampleTopic: 'Remote work',
    exampleKeywords: 'Focus · Meetings · Deep work · Calendar · Boundaries · Results',
    reminderTitle: "Don't write a thread.",
    reminderBody: 'Short lines. One idea. One CTA.',
  },
  Newsletter: {
    title: 'Structure your newsletter',
    subtitle: 'Earn the open → hold attention → give a reason to reply',
    chain: 'ATTENTION → INTEREST → DESIRE → ACTION',
    framework: [
      { n: '01', title: 'ATTENTION', sub: 'Subject line + first sentence.', line: '"This week I noticed something odd about…"' },
      { n: '02', title: 'INTEREST', sub: 'Why this matters to them.', line: '"If you work on ___, this changes how you…"' },
      { n: '03', title: 'DESIRE', sub: 'Show the payoff.', line: '"Once you see this, you can…"' },
      { n: '04', title: 'ACTION', sub: 'One clear close.', line: '"Reply with ___ / try this before Friday."' },
    ],
    researchIntro: "Don't dump a week's news. Find these 5 things:",
    research: [
      { n: '01', title: 'The hook', body: 'One observation worth opening for.' },
      { n: '02', title: 'The reader', body: 'What are they trying to get done?' },
      { n: '03', title: 'The insight', body: 'What do you know that they might not?' },
      { n: '04', title: 'One story', body: 'A short example that proves the point.' },
      { n: '05', title: 'The ask', body: 'Reply, forward, or try one step.' },
    ],
    exampleTopic: 'Electric Vehicles',
    exampleKeywords: 'Range anxiety · Charging · Cost · Cities · Batteries · Next decade',
    reminderTitle: "Don't write a report.",
    reminderBody: 'One idea per issue. Make it easy to finish.',
  },
  'Short Story': {
    title: 'Structure your short story',
    subtitle: 'Start in a scene → raise the stakes → land the ending',
    chain: 'SETUP → CONFLICT → TURN → RESOLUTION',
    framework: [
      { n: '01', title: 'SETUP', sub: 'Who wants what, and where?', line: '"She had ten minutes to…"' },
      { n: '02', title: 'CONFLICT', sub: 'What gets in the way?', line: '"The problem was…"' },
      { n: '03', title: 'TURN', sub: 'What changes?', line: '"Then she realized…"' },
      { n: '04', title: 'RESOLUTION', sub: 'How does it land?', line: '"By the end, the only thing left was…"' },
    ],
    researchIntro: "Don't world-build everything. Find these 5 things:",
    research: [
      { n: '01', title: 'The want', body: 'What does the character need right now?' },
      { n: '02', title: 'The obstacle', body: 'What stops them?' },
      { n: '03', title: 'The place', body: 'One specific setting, not a tour.' },
      { n: '04', title: 'The turn', body: 'The moment the story changes.' },
      { n: '05', title: 'The feeling', body: 'How should the reader feel at the end?' },
    ],
    exampleTopic: 'A missed train',
    exampleKeywords: 'Platform · Clock · Stranger · Decision · Rain · Last carriage',
    reminderTitle: "Don't outline the whole novel.",
    reminderBody: 'One scene. One want. One turn.',
  },
  Opinion: {
    title: 'Structure your opinion',
    subtitle: 'Take a side → back it up → close the loop',
    chain: 'CLAIM → REASON → EVIDENCE → CLOSE',
    framework: [
      { n: '01', title: 'CLAIM', sub: "What's your position?", line: '"___ is a bad idea because…"' },
      { n: '02', title: 'REASON', sub: 'Why do you think that?', line: '"The main reason is…"' },
      { n: '03', title: 'EVIDENCE', sub: 'What would convince a skeptic?', line: '"Look at what happened when…"' },
      { n: '04', title: 'CLOSE', sub: 'Restate, then land.', line: '"So the better move is…"' },
    ],
    researchIntro: "Don't argue every angle. Find these 5 things:",
    research: [
      { n: '01', title: 'The claim', body: 'One sentence you could defend.' },
      { n: '02', title: 'The strongest reason', body: 'Not three weak ones.' },
      { n: '03', title: 'One fact', body: 'A number, a case, or a quote.' },
      { n: '04', title: 'The other side', body: 'The best argument against you.' },
      { n: '05', title: 'The close', body: 'What should change after this?' },
    ],
    exampleTopic: 'The Broken Window Fallacy',
    exampleKeywords: 'Destruction · Jobs · Opportunity cost · Spending · Trade-offs · Growth',
    reminderTitle: "Don't write a speech.",
    reminderBody: 'One claim. One reason. One piece of evidence.',
  },
}

function WriteHelpModal({ format, onClose }: { format: WriteFormat; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const help = WRITE_HELP[format]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: 'rgba(28,28,30,0.5)' }}
      onClick={onClose}
    >
      <div
        className="help-scroll bg-cream w-full max-w-lg max-h-[88vh] rounded-t-2xl sm:rounded-2xl overflow-y-auto fade-up"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-help-title"
      >
        <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 id="write-help-title" className="font-serif text-2xl text-ink leading-snug">
              {help.title}
            </h2>
            <p className="text-muted text-sm mt-1.5 leading-relaxed">{help.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink cursor-pointer text-xl leading-none flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-center font-semibold text-navy tracking-wide text-sm mb-4">
            {help.chain}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {help.framework.map(item => (
              <div key={item.n + item.title} className="p-4 rounded-xl border border-border bg-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">
                  {item.n} — {item.title}
                </p>
                <p className="text-sm font-medium text-ink mb-1">{item.sub}</p>
                <p className="text-sm text-muted italic">{item.line}</p>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-ink mb-1">🔎 What should I research?</p>
          <p className="text-sm text-muted mb-3">{help.researchIntro}</p>
          <div className="space-y-2 mb-8">
            {help.research.map(item => (
              <div key={item.n} className="flex gap-3 p-3 rounded-xl border border-border bg-white">
                <span className="text-xs font-semibold tabular-nums text-navy flex-shrink-0 mt-0.5">{item.n}</span>
                <p className="text-sm text-ink leading-snug">
                  <span className="font-medium">{item.title}</span>{' '}
                  <span className="text-muted">{item.body}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-blue/30 bg-blue/5 mb-6">
            <p className="text-sm font-semibold text-ink mb-2">💡 Quick Example</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Topic</p>
            <p className="text-sm font-medium text-ink mb-3">{help.exampleTopic}</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Keywords</p>
            <p className="text-sm text-navy mb-3">{help.exampleKeywords}</p>
            <p className="text-sm text-muted">{"Don't write a full draft first. Use keywords to guide the piece."}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-white mb-6">
            <p className="text-sm font-semibold text-ink mb-1">⚡ {help.reminderTitle}</p>
            <p className="text-sm text-muted">{help.reminderBody}</p>
          </div>

          <Btn onClick={onClose} className="w-full">Got it, let&apos;s write</Btn>
        </div>
      </div>
    </div>
  )
}

function SpeakPrepScreen({
  prompt,
  hint,
  researchMins,
  speechMins,
  onReady,
  onBack,
  onSettings,
}: {
  prompt: string
  hint?: string
  researchMins: number
  speechMins: number
  onReady: () => void
  onBack: () => void
  onSettings: () => void
}) {
  const prepSecs = researchMins * 60
  const [secsLeft, setSecsLeft] = useState(prepSecs)
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [notes, setNotes] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const closeHelp = useCallback(() => setShowHelp(false), [])

  useEffect(() => {
    if (!started || done) return
    const id = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { setDone(true); playChime(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [started, done])

  useEffect(() => {
    if (!started) setSecsLeft(prepSecs)
  }, [prepSecs, started])

  const cancelTimer = () => { setStarted(false); setSecsLeft(prepSecs); setDone(false) }

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Header onSettings={onSettings} onBack={onBack} showBack />

      {started && (
        <div className="fixed top-[77px] right-4 z-40 fade-up">
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-base font-semibold tabular-nums text-ink leading-none">{fmtTime(secsLeft)}</span>
            <div className="w-px h-4 bg-slate-200" />
            <button onClick={cancelTimer} className="text-muted hover:text-ink transition-colors cursor-pointer text-sm leading-none" aria-label="Cancel timer">✕</button>
          </div>
        </div>
      )}

      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full flex flex-col fade-up">
        <span className="text-xs font-semibold tracking-widest text-muted uppercase mb-1">SPEAK</span>
        <p className="text-xs text-muted mb-8">{researchMins} min preparation · {speechMins} min speaking</p>

        <blockquote className="font-serif text-2xl text-ink leading-snug border-l-2 border-blue pl-5 mb-3">
          {prompt}
        </blockquote>
        <div className="pl-5 mb-10">
          {hint && (
            <button
              onClick={() => setShowHint(h => !h)}
              className="text-xs text-blue font-medium hover:text-navy transition-colors cursor-pointer mb-2 flex items-center gap-1"
            >
              {showHint ? '▾' : '▸'} What is this?
            </button>
          )}
          {hint && showHint && (
            <p className="text-sm text-muted leading-relaxed bg-blue/5 border border-blue/15 rounded-lg px-4 py-3 mb-3 fade-up">
              {hint}
            </p>
          )}
          <p className="text-muted text-sm">Think about your answer. Don&apos;t use AI. Just think.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-10">
          {!started && <Btn onClick={() => setStarted(true)}>Start thinking</Btn>}
          <Btn variant="outline" onClick={() => setShowHelp(true)}>💡 Need Help?</Btn>
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Jot down a few thoughts..."
          className="flex-1 min-h-[220px] w-full bg-white border border-border rounded-xl p-4 text-sm text-ink placeholder-border resize-none focus:border-blue transition-colors mb-4 leading-relaxed"
        />

        {done && (
          <div className="flex justify-center mb-4 fade-up">
            <span className="text-xs text-lime bg-navy px-4 py-1.5 rounded-full">
              Time&apos;s up — ready when you are
            </span>
          </div>
        )}

        <Btn onClick={onReady} disabled={!started} className="w-full">I&apos;m Ready</Btn>
      </main>
      {showHelp && <SpeakHelpModal onClose={closeHelp} />}
    </div>
  )
}

// ─── Speak Record ─────────────────────────────────────────────────────────────

function SpeakRecordScreen({ prompt, speechMins, onFinish }: { prompt: string; speechMins: number; onFinish: () => void }) {
  const [secsLeft, setSecsLeft] = useState(speechMins * 60)
  const [recording, setRecording] = useState(false)
  const [started, setStarted] = useState(false)
  const [waveHeights, setWaveHeights] = useState<number[]>(
    Array.from({ length: 28 }, () => 0.15 + Math.random() * 0.2)
  )

  useEffect(() => {
    if (!started || secsLeft <= 0) return
    const id = setInterval(() => {
      setSecsLeft(s => { if (s <= 1) { onFinish(); return 0 } return s - 1 })
    }, 1000)
    return () => clearInterval(id)
  }, [started, secsLeft, onFinish])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => {
      setWaveHeights(Array.from({ length: 28 }, () => 0.1 + Math.random() * 0.9))
    }, 110)
    return () => clearInterval(id)
  }, [recording])

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#1C1C2E' }}>
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-xs font-semibold tracking-widest text-blue/60 uppercase">SPEAKING</span>
        <div className="flex items-center gap-2">
          {recording && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />}
          <span className={`text-xs font-medium ${recording ? 'text-red-400' : 'text-muted'}`}>
            {recording ? 'Recording' : started ? 'Paused' : 'Tap to start'}
          </span>
        </div>
      </header>

      <main className="flex-1 px-6 flex flex-col items-center pb-10 max-w-lg mx-auto w-full fade-up">
        <p className="text-blue/50 text-sm text-center mt-4 mb-10 leading-relaxed max-w-xs">{prompt}</p>
        <div className="font-serif text-8xl text-cream tabular-nums mb-10">{fmtTime(secsLeft)}</div>

        <div className="flex items-end gap-[3px] h-14 mb-10">
          {waveHeights.map((h, i) => (
            <div key={i} className="w-1 rounded-full transition-all duration-100"
              style={{ height: `${Math.round(h * 56)}px`, backgroundColor: '#95B1EE', opacity: recording ? 0.5 + h * 0.5 : 0.18 }}
            />
          ))}
        </div>

        <div className="relative mb-12">
          {recording && (
            <div className="absolute inset-0 rounded-full pulse-ring" style={{ backgroundColor: '#95B1EE', opacity: 0.25 }} />
          )}
          <button
            onClick={() => { if (!started) setStarted(true); setRecording(r => !r) }}
            className="relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: recording ? 'rgba(239,68,68,0.15)' : '#364C84',
              border: `2px solid ${recording ? '#ef4444' : '#95B1EE40'}`,
              boxShadow: recording ? '0 0 28px rgba(239,68,68,0.2)' : 'none',
            }}
          >🎤</button>
        </div>

        <button onClick={onFinish} className="text-sm text-muted hover:text-cream transition-colors cursor-pointer">Finish</button>
      </main>
    </div>
  )
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

function FeedbackScreen({
  data, onTryAgain, onDone, onSettings,
}: {
  data: FeedbackData; onTryAgain: () => void; onDone: () => void; onSettings: () => void
}) {
  const [bars, setBars] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBars(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Header onSettings={onSettings} />
      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full fade-up">
        <h1 className="font-serif text-5xl text-ink mb-10 leading-tight">{data.headline}</h1>

        <div className="bg-navy rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-6">
            <div>
              <p className="text-blue/60 text-xs uppercase tracking-widest mb-1">Score</p>
              <div className="font-serif text-6xl text-cream leading-none">{data.score}</div>
              <div className="text-blue/40 text-xs mt-1">/ 100</div>
            </div>
            <div className="flex-1 pt-1 space-y-3">
              {data.metrics.map(m => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-blue/60 text-xs w-20 flex-shrink-0">{m.label}</span>
                  <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-0.5 rounded-full bg-lime transition-all duration-700" style={{ width: bars ? `${m.score * 10}%` : '0%' }} />
                  </div>
                  <span className="text-cream text-xs tabular-nums flex-shrink-0">{m.score}/10</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-white mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">What went well</p>
          <p className="text-ink text-sm leading-relaxed">{data.wentWell}</p>
        </div>
        <div className="p-5 rounded-xl border border-blue/30 bg-blue/5 mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">One thing to improve</p>
          <p className="text-ink text-sm leading-relaxed">{data.improve}</p>
        </div>

        <div className="flex items-center gap-4">
          <Btn variant="outline" onClick={onTryAgain}>Try Again</Btn>
          <Btn onClick={onDone} className="flex-1">Done</Btn>
        </div>
      </main>
    </div>
  )
}

// ─── Write Format ─────────────────────────────────────────────────────────────

function WriteFormatScreen({
  selected, onSelect, onContinue, onBack, onSettings,
}: {
  selected: WriteFormat | null; onSelect: (f: WriteFormat) => void
  onContinue: () => void; onBack: () => void; onSettings: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Header onSettings={onSettings} onBack={onBack} showBack />
      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full fade-up">
        <h1 className="font-serif text-4xl text-ink mb-10">What do you want to write?</h1>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {WRITE_FORMATS.map(f => (
            <button key={f} onClick={() => onSelect(f)}
              className={`p-4 rounded-xl border text-sm font-medium text-left transition-all duration-150 cursor-pointer ${
                selected === f ? 'border-navy bg-navy text-cream' : 'border-border bg-white text-ink hover:border-navy/40'
              }`}
            >{f}</button>
          ))}
        </div>
        <button
          onClick={() => onSelect(pickRandom(WRITE_FORMATS))}
          className="w-full p-4 rounded-xl border border-dashed border-border text-sm text-muted hover:border-navy/30 hover:text-navy transition-all cursor-pointer mb-10"
        >🎲 Random</button>
        <Btn onClick={onContinue} disabled={!selected} className="w-full">Continue</Btn>
      </main>
    </div>
  )
}

// ─── Write Editor ─────────────────────────────────────────────────────────────

function WriteEditorScreen({
  prompt, format, hint, onSubmit, onBack,
}: {
  prompt: string; format: WriteFormat; hint?: string
  onSubmit: (text: string) => void; onBack: () => void
}) {
  const [text, setText] = useState('')
  const writeSecs = 50 * 60
  const [secsLeft, setSecsLeft] = useState(writeSecs)
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const closeHelp = useCallback(() => setShowHelp(false), [])
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  useEffect(() => {
    if (!started || done) return
    const id = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { setDone(true); playChime(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [started, done])

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button onClick={onBack} className="text-sm text-muted hover:text-ink transition-colors cursor-pointer">← Back</button>
        <span className="text-xs font-semibold tracking-widest text-muted uppercase">WRITE</span>
        <span className="font-serif text-xl text-navy tabular-nums">{fmtTime(secsLeft)}</span>
      </header>
      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full flex flex-col fade-up">
        <blockquote className="font-serif text-2xl text-ink leading-snug border-l-2 border-blue pl-5 mb-2">{prompt}</blockquote>
        <div className="pl-5 mb-6">
          {hint && (
            <button
              onClick={() => setShowHint(h => !h)}
              className="text-xs text-blue font-medium hover:text-navy transition-colors cursor-pointer mb-2 flex items-center gap-1"
            >
              {showHint ? '▾' : '▸'} What is this?
            </button>
          )}
          {hint && showHint && (
            <p className="text-sm text-muted leading-relaxed bg-blue/5 border border-blue/15 rounded-lg px-4 py-3 mb-2 fade-up">
              {hint}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-muted">Format: {format}</p>
            <Btn variant="outline" onClick={() => setShowHelp(true)}>💡 Need Help?</Btn>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          {!started && <Btn onClick={() => setStarted(true)}>Start writing</Btn>}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start writing..."
          className="flex-1 min-h-[280px] w-full bg-white border border-border rounded-xl p-5 text-base text-ink placeholder-border resize-none focus:border-blue transition-colors mb-4 leading-relaxed"
        />
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs text-muted tabular-nums">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          {done && (
            <span className="text-xs text-lime bg-navy px-4 py-1.5 rounded-full">
              Time&apos;s up — submit when you&apos;re ready
            </span>
          )}
        </div>
        <Btn onClick={() => onSubmit(text)} disabled={!started} className="w-full">Submit</Btn>
      </main>
      {showHelp && <WriteHelpModal format={format} onClose={closeHelp} />}
    </div>
  )
}

function SettingsModal({
  settings,
  onChange,
  onClose,
}: {
  settings: AppSettings
  onChange: (next: AppSettings) => void
  onClose: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const update = (patch: Partial<AppSettings>) => {
    onChange({ ...settings, ...patch })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: 'rgba(28,28,30,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-cream w-full max-w-md rounded-t-2xl sm:rounded-2xl fade-up px-6 pt-6 pb-6"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title" className="font-serif text-3xl text-ink">Settings</h2>
        <p className="text-muted text-sm mt-1 mb-8">Timer lengths in whole minutes.</p>

        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-widest text-navy uppercase">Speech</span>
            <span className="text-sm font-semibold text-ink tabular-nums">{settings.speechMins} min</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={settings.speechMins}
            onChange={e => update({ speechMins: Number(e.target.value) })}
            className="settings-range"
            aria-label="Speech duration in minutes"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">1 min</span>
            <span className="text-xs text-muted">10 min</span>
          </div>
        </div>

        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-widest text-navy uppercase">Research</span>
            <span className="text-sm font-semibold text-ink tabular-nums">{settings.researchMins} min</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={settings.researchMins}
            onChange={e => update({ researchMins: Number(e.target.value) })}
            className="settings-range"
            aria-label="Research duration in minutes"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">1 min</span>
            <span className="text-xs text-muted">60 min</span>
          </div>
          <p className="text-xs text-muted mt-2">Deep research only</p>
        </div>

        <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.muteSounds}
            onChange={e => update({ muteSounds: e.target.checked })}
            className="w-4 h-4 rounded border-border accent-navy cursor-pointer"
          />
          <span className="text-sm text-ink">Mute sound effects</span>
        </label>

        <div className="border-t border-border pt-4 mb-5">
          <p className="text-xs text-muted">Saved for next time.</p>
        </div>

        <Btn onClick={onClose} className="w-full rounded-full">Done</Btn>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = loadSettings()
    setSoundMuted(loaded.muteSounds)
    return loaded
  })

  const openSettings = () => setShowSettings(true)
  const updateSettings = (next: AppSettings) => {
    const sanitized = {
      speechMins: clampMins(next.speechMins, 1, 10),
      researchMins: clampMins(next.researchMins, 1, 60),
      muteSounds: Boolean(next.muteSounds),
    }
    setSettings(sanitized)
    saveSettings(sanitized)
    setSoundMuted(sanitized.muteSounds)
  }

  const [spinMode, setSpinMode] = useState<SpinMode>('speak')
  const [fromSurprise, setFromSurprise] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0])
  const [landedTopic, setLandedTopic] = useState<TopicItem | null>(null)

  const [speakPrompt, setSpeakPrompt] = useState('')
  const [writeFormat, setWriteFormat] = useState<WriteFormat | null>(null)
  const [writePrompt, setWritePrompt] = useState('')

  const goHome = () => setScreen('home')

  const startSpinFlow = (mode: SpinMode) => {
    setFromSurprise(false)
    setSpinMode(mode)
    if (mode === 'write') {
      setWriteFormat(null)
      setScreen('write-format')
    } else {
      setScreen('spin-category')
    }
  }

  const handleTopicAccepted = (topic: TopicItem) => {
    setLandedTopic(topic)
    if (spinMode === 'speak') {
      setSpeakPrompt(topic.name)
      setScreen('speak-prep')
    } else {
      setWritePrompt(topic.name)
      setScreen('write-editor')
    }
  }

  const handleSurprise = () => {
    const mode: SpinMode = Math.random() < 0.5 ? 'speak' : 'write'
    const cat = pickRandom(CATEGORIES.filter(c => c.id !== 'anything'))
    const topic = pickRandom(TOPIC_POOLS[cat.id] ?? TOPIC_POOLS.anything)
    setFromSurprise(true)
    setSpinMode(mode)
    setSelectedCategory(cat)
    setLandedTopic(topic)
    if (mode === 'speak') {
      setSpeakPrompt(topic.name)
      setScreen('speak-prep')
    } else {
      setWritePrompt(topic.name)
      setWriteFormat(pickRandom(WRITE_FORMATS))
      setScreen('write-editor')
    }
  }

  const pool = TOPIC_POOLS[selectedCategory.id] ?? TOPIC_POOLS.anything

  return (
    <div className="font-sans">
      {screen === 'home' && (
        <HomeScreen
          onSpeak={() => startSpinFlow('speak')}
          onWrite={() => startSpinFlow('write')}
          onSurprise={handleSurprise}
          onSettings={openSettings} />
      )}
      {screen === 'spin-category' && (
        <SpinCategoryScreen mode={spinMode}
          onContinue={cat => { setSelectedCategory(cat); setScreen('spin-reel') }}
          onBack={() => spinMode === 'write' ? setScreen('write-format') : goHome()} onSettings={openSettings} />
      )}
      {screen === 'spin-reel' && (
        <SpinReelScreen category={selectedCategory} pool={pool}
          ctaLabel={spinMode === 'speak' ? 'Start Speaking' : 'Start Writing'}
          onAccept={handleTopicAccepted}
          onBack={() => setScreen('spin-category')} onSettings={openSettings} />
      )}
      {screen === 'speak-prep' && (
        <SpeakPrepScreen prompt={speakPrompt} hint={landedTopic?.teaser}
          researchMins={settings.researchMins} speechMins={settings.speechMins}
          onReady={() => setScreen('speak-record')}
          onBack={() => fromSurprise ? goHome() : setScreen('spin-reel')}
          onSettings={openSettings} />
      )}
      {screen === 'speak-record' && (
        <SpeakRecordScreen prompt={speakPrompt} speechMins={settings.speechMins} onFinish={() => setScreen('speak-feedback')} />
      )}
      {screen === 'speak-feedback' && (
        <FeedbackScreen data={SPEAK_FEEDBACK}
          onTryAgain={() => setScreen('speak-prep')}
          onDone={goHome}
          onSettings={openSettings} />
      )}
      {screen === 'write-format' && (
        <WriteFormatScreen selected={writeFormat} onSelect={f => setWriteFormat(f)}
          onContinue={() => setScreen('spin-category')}
          onBack={goHome} onSettings={openSettings} />
      )}
      {screen === 'write-editor' && (
        <WriteEditorScreen prompt={writePrompt} format={writeFormat ?? 'Opinion'} hint={landedTopic?.teaser}
          onSubmit={() => setScreen('write-feedback')}
          onBack={() => fromSurprise ? goHome() : setScreen('spin-reel')} />
      )}
      {screen === 'write-feedback' && (
        <FeedbackScreen data={WRITE_FEEDBACK}
          onTryAgain={() => setScreen('write-editor')}
          onDone={goHome}
          onSettings={openSettings} />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
