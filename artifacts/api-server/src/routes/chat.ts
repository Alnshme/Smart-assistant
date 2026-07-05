import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { SendMessageBody, SendMessageResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid chat request body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { apiKey, messages } = parsed.data;

  const client = new OpenAI({
    baseURL: "https://router.bynara.id/v1",
    apiKey,
  });

  try {
    const completion = await client.chat.completions.create({
      model: "mistral-large",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 700,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    const response = SendMessageResponse.parse({ reply, tokensUsed });
    res.json(response);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    req.log.error({ status: error?.status, code: (error as { code?: string })?.code, message: error?.message }, "NaraRouter chat error");

    if (error?.status === 401) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }
    res.status(500).json({ error: error?.message ?? "AI provider error" });
  }
});

export default router;
