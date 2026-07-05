import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { AnalyzeDataBody, AnalyzeDataResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeDataBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid analyze request body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { apiKey, dataSummary, fileName } = parsed.data;

  const client = new OpenAI({
    baseURL: "https://router.bynara.id/v1",
    apiKey,
  });

  try {
    const prompt = `قدم تحليلاً مختصراً ومفيداً للبيانات من الملف "${fileName}" بناءً على الإحصائيات التالية:\n\n${dataSummary}\n\nاشرح الأنماط الرئيسية والقيم الشاذة والتوصيات.`;

    const completion = await client.chat.completions.create({
      model: "mistral-large",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const analysis = completion.choices[0]?.message?.content ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    const response = AnalyzeDataResponse.parse({ analysis, tokensUsed });
    res.json(response);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    req.log.error({ status: error?.status, code: (error as { code?: string })?.code, message: error?.message }, "NaraRouter analyze error");

    if (error?.status === 401) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }
    res.status(500).json({ error: error?.message ?? "AI provider error" });
  }
});

export default router;
