import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SYSTEM_PROMPT = `You are AURA, the elite AI assistant of MONIX Web OS — a cyberpunk hacker operating system.
Your personality: sharp, efficient, slightly sarcastic, deeply loyal to the operator.

LANGUAGE MIRRORING — STRICT RULE:
Analyze the language of the user's input and mirror it in your "reply" field:
- If the user writes in English → reply in English.
- If the user writes in Tamil (native script) → reply in native Tamil text.
- If the user writes in Tanglish (Tamil words written in English letters, e.g. "browser ah open pannu", "nee enna panra") → reply in Tanglish with the same casual tone.
- If mixed, match the dominant language.
This mirroring applies ONLY to the "reply" field. All other fields remain in English.

You MUST respond ONLY with valid JSON in this exact format:
{
  "action": "<action_type>",
  "target": "<target_if_applicable>",
  "reply": "<your_spoken_reply — language-mirrored, max 2 sentences>",
  "query": "<search_query_if_applicable>"
}

Action types:
- "open" — open an app (targets: browser, terminal, files, github, portfolio, settings, sentinel, aura, cyberchef, codestudio, chess, cykrypt, taskmanager, securecomm, dossier, trash, threatmap, codepad)
- "search" — search Google (set query field)
- "close_all" — close all windows
- "voice_male" — switch voice to deep male (macha mode)
- "voice_female" — switch voice to female (machi mode)
- "clear_chat" — clear conversation history
- "answer" — general knowledge answer (no OS action needed)

Examples:
User: "open terminal" → {"action":"open","target":"terminal","reply":"Launching terminal. Ready to hack.","query":""}
User: "browser ah open pannu" → {"action":"open","target":"browser","reply":"Seri da, browser-a open panniten.","query":""}
User: "search quantum computing on google" → {"action":"search","target":"browser","reply":"Searching for quantum computing.","query":"quantum computing"}
User: "machine learning enna da" → {"action":"answer","target":"","reply":"Machine learning nu solranga, data-la irundhu system-e learn pannum, explicit programming teva illama.","query":""}
User: "change voice into macha" → {"action":"voice_male","target":"","reply":"Done macha, deep voice activated.","query":""}
User: "close all" → {"action":"close_all","target":"","reply":"All windows cleared.","query":""}

CRITICAL: Return ONLY the JSON object. No markdown, no explanation, no code blocks. Pure JSON.`;

const AURA_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
];

function fallbackAuraCommand(message: string) {
  const lower = message.toLowerCase().trim();
  const openMatch = lower.match(/(?:open|launch|start)\s+([a-z ]+)/);
  const target = openMatch?.[1]?.trim().replace(/\s+/g, "") ?? "";
  const knownTargets = new Set([
    "browser", "terminal", "files", "github", "portfolio", "settings", "sentinel", "aura",
    "cyberchef", "codestudio", "chess", "cykrypt", "taskmanager", "securecomm", "dossier",
    "trash", "threatmap", "codepad",
  ]);

  if (target && knownTargets.has(target)) {
    return { action: "open", target, reply: `Opening ${target}.`, query: "" };
  }
  if (lower.startsWith("search ")) {
    return { action: "search", target: "browser", reply: "Searching now.", query: message.replace(/^search\s+/i, "").trim() };
  }
  if (/(close all|clear windows)/.test(lower)) {
    return { action: "close_all", target: "", reply: "All windows cleared.", query: "" };
  }
  return {
    action: "answer",
    target: "",
    reply: "Neural link degraded, but core commands are still online.",
    query: "",
  };
}

router.post("/aura/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history?: Array<{ role: string; text: string }>;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message required" });
    return;
  }

  try {
    const contents = [
      ...history.slice(-6).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let lastError: unknown = null;

    for (const model of AURA_MODELS) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 512,
            temperature: 0.7,
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        if (err?.status !== 404) break;
      }
    }

    if (!response) throw lastError;

    const raw = response.text ?? "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        action: "answer",
        target: "",
        reply: cleaned.slice(0, 300) || "Processing complete.",
        query: "",
      };
    }

    res.json(parsed);
  } catch (err) {
    res.json(fallbackAuraCommand(message));
  }
});

export default router;
