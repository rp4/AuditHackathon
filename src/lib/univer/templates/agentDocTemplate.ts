// @ts-nocheck
/**
 * Agent Documentation Template
 *
 * Pre-formatted template to guide users in creating comprehensive agent documentation
 */

import type { IDocumentData } from '@univerjs/core'

export const agentDocumentationTemplate: IDocumentData = {
  id: 'agent-doc-template',
  body: {
    dataStream: {
      t: 'Agent Documentation\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '📋 Overview\r\n\r\n' +
         'Provide a comprehensive overview of your AI agent. What problem does it solve? Who is it for?\r\n\r\n' +
         '• Key capability 1\r\n' +
         '• Key capability 2\r\n' +
         '• Key capability 3\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '🚀 Quick Start\r\n\r\n' +
         'Step 1: Describe the first setup step\r\n' +
         'Step 2: Describe the second setup step\r\n' +
         'Step 3: Describe how to verify it\'s working\r\n\r\n' +
         '💡 Tip: You can paste images directly into this document! Try Ctrl+V or Cmd+V with an image copied.\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '⚙️ Configuration\r\n\r\n' +
         'Explain the key configuration options:\r\n\r\n' +
         '• Setting 1: Description\r\n' +
         '• Setting 2: Description\r\n' +
         '• Setting 3: Description\r\n\r\n' +
         '[Paste a screenshot of your configuration here]\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '📝 Usage Examples\r\n\r\n' +
         'Example 1: Basic Usage\r\n' +
         'Input: "Your example input"\r\n' +
         'Output: "Expected output"\r\n\r\n' +
         'Example 2: Advanced Usage\r\n' +
         'Input: "Your example input"\r\n' +
         'Output: "Expected output"\r\n\r\n' +
         '[Add screenshots showing your agent in action]\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '⚠️ Prerequisites\r\n\r\n' +
         'Before using this agent, ensure you have:\r\n\r\n' +
         '• Prerequisite 1\r\n' +
         '• Prerequisite 2\r\n' +
         '• Prerequisite 3\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '🔧 Troubleshooting\r\n\r\n' +
         'Common issues and solutions:\r\n\r\n' +
         'Issue 1: Problem description\r\n' +
         'Solution: How to fix it\r\n\r\n' +
         'Issue 2: Problem description\r\n' +
         'Solution: How to fix it\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '💰 Cost & Performance\r\n\r\n' +
         'Estimated cost per use: $X.XX\r\n' +
         'Average response time: X seconds\r\n' +
         'Token usage: ~X tokens per request\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '📚 Additional Resources\r\n\r\n' +
         '• Link to related documentation\r\n' +
         '• Link to video tutorials\r\n' +
         '• Link to community discussions\r\n\r\n' +
         '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n' +
         '✍️ Author Notes\r\n\r\n' +
         'Add any additional notes, tips, or insights about using this agent effectively.\r\n',
      dataStream: '',
      customBlocks: [],
      customRanges: [],
      paragraphs: [
        {
          startIndex: 0,
          paragraphStyle: {
            horizontalAlign: 0,
          },
        },
      ],
      sectionBreaks: [],
      textRuns: [
        {
          st: 0,
          ed: 21,
          ts: {
            fs: 24,
            bl: 1,
          },
        },
      ],
    },
  },
  documentStyle: {
    pageSize: {
      width: 595,
      height: 842,
    },
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 50,
    marginRight: 50,
  },
}

/**
 * Get a clean template for a new agent
 */
export function getAgentTemplate(): IDocumentData {
  return JSON.parse(JSON.stringify(agentDocumentationTemplate))
}
