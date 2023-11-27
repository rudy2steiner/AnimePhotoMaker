import type { NextRequest } from "next/server";
import { OpenAIStream, OpenAIStreamPayload } from "../../utils/OpenAIStream";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const config = {
  runtime: "edge",
};

const MAX_REQUESTS_PER_DAY = 10;

const handler = async (req: NextRequest): Promise<Response> => {
  let requestCount = parseInt(req.cookies.get('requestCount') || '0');

  if (requestCount >= MAX_REQUESTS_PER_DAY) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const { prompt } = (await req.json()) as { prompt?: string };

  if (!prompt) {
    return new Response("No prompt in the request", { status: 400 });
  }

  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo-1106",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 300,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);

  // Update request count in cookie
  requestCount += 1;
  const response = new Response(stream);
  response.cookies.set('requestCount', requestCount.toString(), { maxAge: 86400 }); // Set cookie for 1 day

  return response;
};

export default handler;
