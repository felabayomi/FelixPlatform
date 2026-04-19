import OpenAI from "openai";

if (!process.env.TRAVEL_TV_OPEN_AI_KEY) {
  throw new Error(
    "TRAVEL_TV_OPEN_AI_KEY must be set.",
  );
}

export const openai = new OpenAI({
  apiKey: process.env.TRAVEL_TV_OPEN_AI_KEY,
});
