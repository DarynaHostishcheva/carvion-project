const OpenAI = require("openai");

const hasOpenAIKey =
  Boolean(process.env.OPENAI_API_KEY);

const openai =
  hasOpenAIKey
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    : null;

function createFallbackResponse(message, context) {
  const savedCareers =
    context.savedCareers || [];

  const recommendations =
    context.recommendations || [];

  if (savedCareers.length > 0) {
    return `This is a demo response. Based on your saved careers, you may want to explore ${savedCareers[0].name}. Later, Carvion AI will generate a more personalized answer.`;
  }

  if (recommendations.length > 0) {
    return `This is a demo response. Based on your quiz results, ${recommendations[0].name} may be a relevant career direction. Later, Carvion AI will generate a more detailed answer.`;
  }

  return `This is a demo response. Later, Carvion AI will generate a personalized answer about: "${message}".`;
}

async function generateAIResponse(message, context) {
  if (!hasOpenAIKey) {
    return createFallbackResponse(message, context);
  }

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content:
          "You are Carvion AI, an ethical career guidance assistant. Use the provided database context to help the user explore careers, skills, quiz results, and saved professions. Do not make final decisions for the user. Explain recommendations clearly. Keep answers concise, structured, and easy to read. Do not use Markdown symbols such as **, ###, or bullet syntax. Use short paragraphs with plain text only."
      },
      {
        role: "user",
        content: `
User message:
${message}

Database context:
${JSON.stringify(context, null, 2)}
        `
      }
    ]
  });

  return response.output_text;
}

module.exports = {
  generateAIResponse
};