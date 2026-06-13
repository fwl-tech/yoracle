import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage, Ontology, User, Insight } from '@/types'

const MODEL = 'claude-sonnet-4-6'

let _client: Anthropic | null = null

export function getAIClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _client
}

function buildSystemPrompt(user: User, ontology: Ontology | null): string {
  const ontologyContext = ontology
    ? `Business context:\n- Customer: ${JSON.stringify(ontology.customer_definition)}\n- Revenue model: ${JSON.stringify(ontology.revenue_model)}\n- Cost structure: ${JSON.stringify(ontology.cost_structure)}\n- Departments: ${ontology.departments.join(', ')}`
    : 'No ontology configured yet.'

  return `You are Yoracle, an AI business intelligence assistant for ${user.name ?? user.email}.
The user's role is ${user.role.toUpperCase()}.

${ontologyContext}

Rules:
- Answer only from data in the business context or explicitly provided data snapshots
- Always cite the source system (e.g., "Source: Salesforce")
- Never expose raw credentials, API keys, or internal system identifiers
- Be concise — executives want signals, not reports
- If you don't have enough data to answer, say so and suggest which connector would provide it`
}

export async function* streamChat(
  user: User,
  ontology: Ontology | null,
  history: ChatMessage[],
  newMessage: string,
  dataContext?: string,
): AsyncGenerator<string> {
  const client = getAIClient()

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: dataContext ? `${newMessage}\n\n[Data context]:\n${dataContext}` : newMessage },
  ]

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(user, ontology),
    messages,
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text
    }
  }
}

export async function generateInsightsForUser(
  user: User,
  ontology: Ontology,
  dataSnapshots: Record<string, unknown>[],
): Promise<Insight[]> {
  const client = getAIClient()

  const prompt = `Generate 3-5 business insights for a ${user.role.toUpperCase()} based on the following data.

Ontology: ${JSON.stringify(ontology, null, 2)}

Data snapshots: ${JSON.stringify(dataSnapshots.slice(0, 10), null, 2)}

Return a JSON array of insights with this shape:
[{
  "title": string,
  "body": string (2-3 sentences, no jargon),
  "category": "revenue" | "customer" | "profitability" | "operations" | "general",
  "severity": "info" | "warning" | "critical",
  "metric_refs": [{"name": string, "value": number|string, "delta": number|null, "unit": string, "source": string}],
  "suggested_actions": [{"id": string, "label": string, "description": string, "target_system": string, "action_type": string, "payload": {}}]
}]

Only return the JSON array. No markdown fences.`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  return JSON.parse(text)
}
