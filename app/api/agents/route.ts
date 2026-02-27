import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Clients ────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL ?? 'https://yinli.one',
});

// OpenAI-compatible proxy for Gemini / GPT / DeepSeek
// Falls back to the same proxy base URL if a separate one isn't configured
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? process.env.ANTHROPIC_BASE_URL ?? 'https://yinli.one';
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY  ?? process.env.ANTHROPIC_API_KEY ?? '';

// ─── Model routing ───────────────────────────────────────────────────────────

function isAnthropicModel(model: string) {
  return model.toLowerCase().startsWith('claude');
}

// Map display names → actual model IDs sent to the API
const MODEL_ID_MAP: Record<string, string> = {
  'claude-sonnet-4-5':         'claude-sonnet-4-5',
  'claude-sonnet-4-6':         'claude-sonnet-4-6',
  'gemini-2.5-pro-preview':    'gemini-2.5-pro-preview',
  'gpt-4.5-preview':           'gpt-4.5-preview',
  'deepseek-v3':               'deepseek-v3',
};

function resolveModelId(model: string): string {
  return MODEL_ID_MAP[model] ?? model;
}

// ─── Tool definitions ────────────────────────────────────────────────────────

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_wallet_info',
    description: 'Get the user wallet address and network information.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_balance',
    description: 'Get the current INJ, USDT and USDC balances of the user wallet.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_swap_quote',
    description:
      'Get a price quote BEFORE executing a swap. Always call this first. Supports INJ↔USDT, INJ↔USDC, USDT↔USDC.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fromToken: { type: 'string', enum: ['INJ', 'USDT', 'USDC'], description: 'Token to sell' },
        toToken:   { type: 'string', enum: ['INJ', 'USDT', 'USDC'], description: 'Token to buy' },
        amount:    { type: 'string', description: 'Amount to swap e.g. "0.5"' },
        slippage:  { type: 'number', description: 'Slippage % (default 0.5)' },
      },
      required: ['fromToken', 'toToken', 'amount'],
    },
  },
  {
    name: 'execute_swap',
    description:
      'Execute a token swap on Injective EVM. ALWAYS call get_swap_quote first. Requires user confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fromToken:      { type: 'string', enum: ['INJ', 'USDT', 'USDC'] },
        toToken:        { type: 'string', enum: ['INJ', 'USDT', 'USDC'] },
        amount:         { type: 'string' },
        slippage:       { type: 'number', description: 'Default 0.5' },
        expectedOutput: { type: 'string', description: 'From get_swap_quote, shown in confirmation dialog' },
      },
      required: ['fromToken', 'toToken', 'amount'],
    },
  },
  {
    name: 'send_token',
    description: 'Send INJ to another address. Requires user confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        toAddress: { type: 'string', description: 'Recipient 0x address' },
        amount:    { type: 'string', description: 'Amount of INJ' },
      },
      required: ['toAddress', 'amount'],
    },
  },
  {
    name: 'get_tx_history',
    description: 'Get recent transaction history.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Number of txs (default 10)' },
      },
      required: [],
    },
  },
];

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI agent integrated into INJ Pass, a non-custodial Web3 wallet for Injective mainnet.
The user is already authenticated and their wallet is unlocked.

CAPABILITIES:
- get_wallet_info: get the user's wallet address
- get_balance: get INJ, USDT, USDC balances
- get_swap_quote: get a price quote before swapping
- execute_swap: swap tokens (INJ↔USDT, INJ↔USDC, USDT↔USDC)
- send_token: send INJ to another address
- get_tx_history: view recent transactions

RULES:
1. When the user asks to "swap all" or uses vague amounts, call get_balance FIRST to get the exact amount, then get_swap_quote, then execute_swap.
2. ALWAYS call get_swap_quote before execute_swap so the user sees the expected output.
3. After execute_swap succeeds, always report the transaction hash and the Blockscout explorer link.
4. When the user asks for their address/wallet, call get_wallet_info.
5. Never ask for private keys — they are managed securely by the wallet.
6. After a safe tool returns results, continue the task autonomously without asking for confirmation again unless it is a destructive action (swap or send).

Respond in the same language the user writes in. Be concise and direct.`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string | ApiBlock[];
}

interface ApiBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

// Normalized response returned to the client (always Anthropic-like shape)
interface NormalizedContent {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

// ─── OpenAI-compatible helpers ────────────────────────────────────────────────

interface OAIMessage {
  role: string;
  content: string | null;
  tool_calls?: OAIToolCall[];
  tool_call_id?: string;
}

interface OAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

/** Convert our Anthropic-format messages to OpenAI message array */
function toOAIMessages(msgs: AgentMessage[]): OAIMessage[] {
  const out: OAIMessage[] = [];

  for (const msg of msgs) {
    if (typeof msg.content === 'string') {
      out.push({ role: msg.role, content: msg.content });
      continue;
    }

    const blocks = msg.content as ApiBlock[];

    if (msg.role === 'user') {
      // Could contain tool_result blocks
      for (const b of blocks) {
        if (b.type === 'tool_result') {
          out.push({ role: 'tool', content: b.content ?? '', tool_call_id: b.tool_use_id });
        } else if (b.type === 'text') {
          out.push({ role: 'user', content: b.text ?? '' });
        }
      }
    } else {
      // assistant — could have text + tool_use
      const textBlocks  = blocks.filter((b) => b.type === 'text');
      const toolBlocks  = blocks.filter((b) => b.type === 'tool_use');
      const textContent = textBlocks.map((b) => b.text ?? '').join('\n') || null;
      const toolCalls: OAIToolCall[] = toolBlocks.map((b) => ({
        id: b.id!,
        type: 'function' as const,
        function: { name: b.name!, arguments: JSON.stringify(b.input ?? {}) },
      }));

      out.push({
        role: 'assistant',
        content: textContent,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      });
    }
  }

  return out;
}

/** Convert Anthropic tools to OpenAI function-calling format */
function toOAITools(tools: Anthropic.Tool[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

/** Call the OpenAI-compatible proxy and return normalised content blocks */
async function callOpenAICompat(
  model: string,
  messages: AgentMessage[],
): Promise<NormalizedContent[]> {
  const body = {
    model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...toOAIMessages(messages)],
    tools: toOAITools(AGENT_TOOLS),
    tool_choice: 'auto',
  };

  const res = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI proxy error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error('Empty response from OpenAI proxy');

  const out: NormalizedContent[] = [];

  if (msg.content) out.push({ type: 'text', text: msg.content });

  for (const tc of msg.tool_calls ?? []) {
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(tc.function.arguments); } catch { /* ignore */ }
    out.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: parsed });
  }

  return out;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model = 'claude-sonnet-4-6', toolResults } = body as {
      messages: AgentMessage[];
      model?: string;
      toolResults?: { tool_use_id: string; content: string }[];
    };

    const modelId = resolveModelId(model);

    // Append tool results as a user message if present
    let apiMessages: AgentMessage[] = messages;
    if (toolResults && toolResults.length > 0) {
      apiMessages = [
        ...messages,
        {
          role: 'user',
          content: toolResults.map((r) => ({
            type: 'tool_result' as const,
            tool_use_id: r.tool_use_id,
            content: r.content,
          })),
        },
      ];
    }

    let contentBlocks: NormalizedContent[];

    if (isAnthropicModel(modelId)) {
      // ── Anthropic SDK path ──
      const anthropicMessages: Anthropic.MessageParam[] = apiMessages.map((m) => ({
        role: m.role,
        content: m.content as string | Anthropic.ContentBlockParam[],
      }));

      const response = await anthropic.messages.create({
        model: modelId,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages: anthropicMessages,
      });

      contentBlocks = (response.content as ApiBlock[]).map((b) => {
        if (b.type === 'text') return { type: 'text' as const, text: b.text };
        return { type: 'tool_use' as const, id: b.id, name: b.name, input: b.input };
      });
    } else {
      // ── OpenAI-compatible path (Gemini / GPT / DeepSeek) ──
      contentBlocks = await callOpenAICompat(modelId, apiMessages);
    }

    // Return in Anthropic-like shape so the client doesn't need to change
    return NextResponse.json({ content: contentBlocks });
  } catch (err) {
    console.error('[agents/route] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
