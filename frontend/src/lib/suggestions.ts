export type QuestionPrompt = {
  ticker: 'AAPL' | 'MSFT' | 'NVDA' | 'AMZN' | 'GOOGL' | 'ALL'
  category: 'Revenue Mix' | 'Segment Margins' | 'AI & Cloud' | 'Risk Factors' | 'CapEx'
  title: string
  prompt: string
}

export const RESEARCH_PROMPTS: QuestionPrompt[] = [
  {
    ticker: 'AAPL',
    category: 'Revenue Mix',
    title: "Apple's 5-Year Revenue Mix Shift",
    prompt: "Across Apple's 2021–2025 10-Ks, how did the revenue mix between iPhone, Services, Mac, iPad, and Wearables change, and which category contributed most to the shift?",
  },
  {
    ticker: 'AMZN',
    category: 'Segment Margins',
    title: 'AWS vs Retail Operating Income',
    prompt: 'For Amazon, compare AWS operating income and margin against North America and International from 2021–2025. In which years did AWS fund losses elsewhere?',
  },
  {
    ticker: 'NVDA',
    category: 'AI & Cloud',
    title: 'NVIDIA Data Center Demand & Supply',
    prompt: 'How did NVIDIA describe demand drivers, customer concentration, and supply constraints for its Data Center business from fiscal 2021 through fiscal 2025?',
  },
  {
    ticker: 'MSFT',
    category: 'AI & Cloud',
    title: 'Microsoft Azure & AI Infrastructure',
    prompt: 'Across Microsoft filings from 2021 to 2025, what changed in how the company describes Azure, AI infrastructure, and cloud capacity constraints?',
  },
  {
    ticker: 'GOOGL',
    category: 'Revenue Mix',
    title: 'Alphabet Segment Growth Trends',
    prompt: 'For Alphabet, how did Google Search, YouTube ads, Google Network, and Google Cloud revenue trends differ across available 10-Ks?',
  },
  {
    ticker: 'ALL',
    category: 'CapEx',
    title: 'Hyperscaler CapEx & Infrastructure',
    prompt: 'Compare capital expenditures and purchase commitments for Microsoft, Alphabet, Amazon, and NVIDIA. What do filings imply about the scale of AI infrastructure buildout?',
  },
  {
    ticker: 'ALL',
    category: 'Risk Factors',
    title: 'Export Controls & Supply Chain Risks',
    prompt: 'Which companies materially modified risk-factor language regarding export controls, supply chain concentration, or AI regulation between 2021 and 2025?',
  },
  {
    ticker: 'AAPL',
    category: 'Risk Factors',
    title: 'Apple & NVIDIA Supplier Concentration',
    prompt: 'For Apple and NVIDIA, what do the filings say about supplier concentration or dependence on third-party manufacturing, and did the urgency change over time?',
  },
]

export const EXAMPLE_QUESTIONS = RESEARCH_PROMPTS.map((p) => p.prompt)
