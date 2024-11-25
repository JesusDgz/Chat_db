const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: "sk-xgH1BbMNtXlXX0LdpPIkkNofsG9jYDb3dP2V5BtdbKT3BlbkFJ7iNuqwxKhNXUmPO-tqG--ediLO35-DBoP3VWpWqEEA", // Cambia por tu clave o usa .env
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Cambia a "gpt-3.5-turbo" si no tienes acceso a "gpt-4"
      messages: [
        { role: "system", content: "Eres un asistente útil." },
        { role: "user", content: "Hola, ¿cómo estás?" },
      ],
      max_tokens: 100,
    });

    console.log("Respuesta del bot:", response.choices[0].message.content);
  } catch (error) {
    console.error("Error al interactuar con OpenAI:", error.message);
  }
}

test();
