"use client"

import { use, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Heart,
  MessageSquare,
  Share2,
  Star,
  ThumbsUp,
  ChevronRight,
  Copy,
  Check,
  Flag,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import "highlight.js/styles/github-dark.css"

// Mock agent data with markdown content
const agentData = {
  id: "1",
  name: "Financial Statement Analyzer",
  description: "A comprehensive AI agent that automatically analyzes financial statements for anomalies, compliance issues, and provides detailed insights using advanced pattern recognition and financial modeling techniques.",
  author: {
    name: "John Doe",
    avatar: "JD",
    reputation: 4.8,
    agentsPublished: 12
  },
  platform: "OpenAI",
  category: "Financial Audit",
  rating: 4.9,
  totalRatings: 156,
  downloads: 234,
  upvotes: 89,
  version: "2.1.0",
  lastUpdated: "2025-01-15",
  created: "2024-11-20",
  license: "MIT",
  tags: ["financial", "audit", "compliance", "automation", "analysis"],

  // Full markdown documentation
  markdownContent: `# Financial Statement Analyzer

A comprehensive AI agent that automatically analyzes financial statements for anomalies, compliance issues, and provides detailed insights.

## Description

This agent leverages advanced pattern recognition and financial modeling techniques to:
- Automatically analyze financial statements
- Detect anomalies and unusual patterns
- Check compliance against GAAP/IFRS standards
- Generate detailed, actionable reports
- Provide risk assessments and recommendations

## Platforms

This agent supports:
- ✅ OpenAI (Primary - GPT-4)
- ✅ Claude (Claude 3 Opus)
- ⚠️ Google Gemini (Experimental)

## Prerequisites

Before using this agent, ensure you have:

1. **API Access**: Valid API keys for your chosen platform
2. **Financial Data**: Access to financial statement data in standard formats (PDF, CSV, or Excel)
3. **Domain Knowledge**: Basic understanding of financial accounting principles
4. **Compliance Standards**: Familiarity with GAAP or IFRS standards (depending on your jurisdiction)

## Setup Instructions

### For OpenAI (Recommended)

1. Navigate to the [OpenAI Platform](https://platform.openai.com/playground)
2. Create a new Assistant or use the Playground
3. Copy the system prompt below and paste it into your assistant configuration
4. Configure the model settings as specified
5. Test with sample data before production use

### For Claude

1. Open [Claude AI](https://claude.ai)
2. Create a new project called "Financial Statement Analyzer"
3. Paste the system prompt in the project instructions
4. Configure temperature to 0.3 for consistent analysis
5. Upload your financial documents for analysis

## Configuration

### System Prompt

\`\`\`
You are an expert financial auditor with 20+ years of experience analyzing financial statements. Your role is to:

1. Systematically review financial statements for accuracy and compliance
2. Identify red flags, anomalies, and areas requiring further investigation
3. Assess compliance with relevant accounting standards (GAAP/IFRS)
4. Provide clear, actionable recommendations
5. Quantify risk levels (Low, Medium, High, Critical)

Analysis Framework:
- Balance Sheet: Asset valuation, liability classification, equity structure
- Income Statement: Revenue recognition, expense matching, margin analysis
- Cash Flow: Operating, investing, and financing activities
- Ratios: Liquidity, profitability, leverage, efficiency
- Trends: Year-over-year comparisons and industry benchmarks

Output Format:
1. Executive Summary
2. Key Findings (prioritized by risk level)
3. Detailed Analysis by statement section
4. Compliance Assessment
5. Recommendations
6. Appendix: Supporting calculations and references

Maintain professional skepticism and adhere to auditing standards throughout your analysis.
\`\`\`

### Model Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| Model | \`gpt-4\` or \`claude-3-opus\` | Use latest available version |
| Temperature | \`0.3\` | Lower temp for consistent analysis |
| Max Tokens | \`4000\` | Sufficient for detailed reports |
| Top P | \`0.9\` | Standard setting |
| Frequency Penalty | \`0.0\` | No penalty needed |

### Additional Configuration (JSON)

\`\`\`json
{
  "response_format": { "type": "text" },
  "functions": [
    {
      "name": "calculate_financial_ratio",
      "description": "Calculates common financial ratios",
      "parameters": {
        "type": "object",
        "properties": {
          "ratio_type": {
            "type": "string",
            "enum": ["current_ratio", "quick_ratio", "debt_to_equity", "roe", "roa"]
          },
          "values": {
            "type": "object",
            "description": "Financial values needed for calculation"
          }
        }
      }
    }
  ]
}
\`\`\`

## Usage Examples

### Example 1: Quick Balance Sheet Analysis

**Input:**
\`\`\`
Analyze the following balance sheet for ABC Corp Q3 2024:

Assets:
- Current Assets: $5.2M
- Fixed Assets: $12.8M
- Intangibles: $2.1M
Total Assets: $20.1M

Liabilities:
- Current Liabilities: $6.8M
- Long-term Debt: $8.5M
Total Liabilities: $15.3M

Equity: $4.8M
\`\`\`

**Output:**
\`\`\`
EXECUTIVE SUMMARY:
ABC Corp's Q3 2024 balance sheet shows moderate liquidity concerns and high leverage.

KEY FINDINGS:
🔴 Critical: Current Ratio of 0.76 (below healthy 1.0 threshold)
🟡 Medium: Debt-to-Equity ratio of 3.19 indicates high financial leverage
🟢 Low: Asset composition is reasonable for the industry

DETAILED ANALYSIS:
1. Liquidity: Current assets ($5.2M) insufficient to cover current liabilities ($6.8M)
   - Shortfall of $1.6M may indicate cash flow challenges
   - Recommend immediate review of accounts receivable aging

2. Leverage: Total debt of $15.3M is 76% of total assets
   - High leverage increases financial risk
   - Interest coverage ratio analysis recommended

3. Equity Position: Equity of $4.8M represents only 24% of assets
   - Below industry average of 40-50%
   - May limit access to additional financing

RECOMMENDATIONS:
1. Develop plan to improve working capital (target: $2M increase in current ratio)
2. Consider debt restructuring or equity raise to improve leverage
3. Review asset utilization to ensure optimal efficiency
\`\`\`

### Example 2: Red Flag Detection

**Input:**
\`\`\`
Review this income statement for potential concerns:

Revenue: $10M (up 8% YoY)
COGS: $5.5M (up 15% YoY)
Operating Expenses: $3M (up 5% YoY)
Net Income: $1.5M (down 10% YoY)

Note: Company also reported significant related-party transactions this quarter.
\`\`\`

**Output:**
\`\`\`
RED FLAGS IDENTIFIED:

🚩 Priority 1: Margin Compression
- Revenue grew 8% but COGS grew 15%
- Gross margin declined from 48% to 45%
- Indicates pricing pressure or cost control issues

🚩 Priority 2: Declining Profitability
- Net income down 10% despite 8% revenue growth
- Operating leverage working against the company
- Requires immediate management attention

🚩 Priority 3: Related-Party Transactions
- Potential conflict of interest and valuation concerns
- Requires detailed disclosure review
- May impact audit opinion if not properly disclosed

RECOMMENDED ACTIONS:
1. Investigate COGS increase: supplier pricing, waste, or accounting classification
2. Analyze revenue mix: check for shift toward lower-margin products
3. Review related-party transactions for proper disclosure and fair value
4. Perform horizontal analysis of last 8 quarters for trend confirmation
\`\`\`

## Tips & Best Practices

### For Optimal Results:

1. **Provide Context**: Include industry, company size, and reporting standards
2. **Use Consistent Formatting**: Standardized input formats yield better analysis
3. **Include Comparatives**: Prior period data enables trend analysis
4. **Specify Concerns**: Direct the agent to areas of particular interest
5. **Review Calculations**: Always verify key ratio calculations independently

### Common Pitfalls to Avoid:

- ❌ Uploading unstructured or poorly formatted financial data
- ❌ Mixing accounting standards (GAAP vs IFRS) without clarification
- ❌ Omitting necessary context (industry benchmarks, company history)
- ❌ Over-relying on AI without professional judgment
- ❌ Skipping validation of calculations and conclusions

### Performance Tips:

- For large datasets, break analysis into sections (Balance Sheet → Income Statement → Cash Flow)
- Use specific queries rather than generic "analyze everything" prompts
- Iterate on findings by asking follow-up questions
- Maintain a template for recurring analyses to ensure consistency

## Limitations

**This agent cannot:**

- Access real-time market data or external databases
- Perform statutory audits or sign audit opinions
- Replace professional judgment of licensed auditors
- Guarantee detection of fraud or material misstatements
- Provide legal or tax advice

**Accuracy Considerations:**

- AI analysis should supplement, not replace, human expertise
- All findings should be verified by qualified professionals
- Results are only as good as the input data provided
- Edge cases and unusual situations may require manual review
- Updates to accounting standards may not be immediately reflected

**Cost Estimates:**

- Average cost per analysis: $0.50 - $2.00 (depending on complexity and model)
- Large financial statements (50+ pages): May require multiple queries
- Consider using GPT-4 for complex analyses, GPT-3.5 for routine work

## Version History

- **v2.1.0** (2025-01-15): Enhanced fraud detection patterns, added ratio calculator function
- **v2.0.0** (2024-12-01): Major update with IFRS 18 compliance, improved prompt structure
- **v1.5.0** (2024-10-15): Added support for Claude 3, improved cash flow analysis
- **v1.0.0** (2024-09-01): Initial release with OpenAI GPT-4 support

## Credits & References

**Developed by:** John Doe, CPA
**Contributors:** Financial Audit Community on OpenAuditSwarms

**References:**
- AICPA Professional Standards
- IFRS Foundation Standards
- PCAOB Auditing Standards
- "Financial Statement Analysis" by Wild, Shaw, and Chiappetta

**Acknowledgments:**
Special thanks to the beta testers who provided feedback and real-world use cases.

## License

MIT License - Free to use, modify, and distribute with attribution.

---

**Questions or Issues?** Open a discussion on [OpenAuditSwarms](https://openauditswarms.com) or contact the author directly.

**Stay Updated:** Watch this agent for updates. Version 3.0 coming soon with ML-powered anomaly detection!
`,

  reviews: [
    {
      id: "r1",
      user: "Sarah Wilson",
      rating: 5,
      date: "2025-01-10",
      comment: "Excellent agent! Saved hours of manual review time."
    },
    {
      id: "r2",
      user: "Mike Chen",
      rating: 4,
      date: "2025-01-08",
      comment: "Very useful, though requires some tweaking for specific use cases."
    }
  ]
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(agentData.markdownContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/browse" className="hover:text-primary">Browse</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{agentData.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold mb-2">{agentData.name}</h1>
              <p className="text-muted-foreground">{agentData.description}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {agentData.tags.map((tag) => (
              <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm mb-6">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{agentData.rating}</span>
              <span className="text-muted-foreground">({agentData.totalRatings} reviews)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current text-red-500" : ""}`} />
              {isFavorited ? "Saved" : "Save"}
            </Button>
            <Button variant="outline" size="lg" onClick={handleCopyMarkdown}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Markdown"}
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="lg">
              <Flag className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>

        {/* Author Card */}
        <Card className="w-full lg:w-80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                {agentData.author.avatar}
              </div>
              <div>
                <CardTitle className="text-base">{agentData.author.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{agentData.author.reputation}</span>
                    <span className="text-xs">• {agentData.author.agentsPublished} agents</span>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              View Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Markdown Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none dark:prose-invert
              prose-headings:font-bold prose-headings:text-foreground
              prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8 prose-h1:border-b prose-h1:pb-2
              prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
              prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
              prose-p:text-foreground prose-p:leading-7
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:border-border
              prose-ul:my-4 prose-li:my-1
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
              prose-table:border prose-th:border prose-th:bg-muted prose-td:border prose-td:px-4 prose-td:py-2
              prose-strong:text-foreground prose-strong:font-semibold
              prose-img:rounded-lg prose-img:border"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
              >
                {agentData.markdownContent}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Community Feedback</CardTitle>
            <CardDescription>
              Share your experience with this agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {agentData.reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="font-medium">{review.user}</span>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
                placeholder="Share your thoughts about this agent..."
              />
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="hover:scale-110 transition-transform">
                      <Star className="h-5 w-5 text-muted-foreground hover:text-yellow-400" />
                    </button>
                  ))}
                </div>
                <Button size="sm" className="ml-auto">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
