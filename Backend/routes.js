// routes.js
const express = require('express');
const axios = require('axios');
const logger = require('./logger'); // Asumimos que el logger está configurado en otro archivo

const router = express.Router();
require('dotenv').config();

const openaiApiKey = process.env.OPENAI_API_KEY;

// Ruta para enviar un mensaje a ChatGPT y obtener la respuesta
router.post('/consultar-db', async (req, res) => {
  const { query } = req.body;  // La consulta que el usuario desea hacer
  
  // Contexto sobre la base de datos MongoDB
  const context = `
    -- Esquema de base de datos MongoDB
    -- Colección: clientes
    {
      "_id": ObjectId("..."), 
      "nombre": "Carlos Gómez", 
      "email": "carlos@example.com", 
      "telefono": "987654321"
    }

    -- Colección: pedidos
    {
      "_id": ObjectId("..."), 
      "id_cliente": ObjectId("..."), 
      "fecha": "2024-11-01", 
      "monto": 100.50
    }

    -- Relación: Un cliente puede tener muchos pedidos (uno a muchos) a través de id_cliente
  `;

  // Verificar que la consulta esté presente
  if (!query) {
    return res.status(400).json({ error: 'Consulta no proporcionada' });
  }

  try {
    // Enviar la solicitud a la API de OpenAI (ChatGPT)
    const response = await axios.post(
   
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un asistente que ayuda a generar consultas para bases de datos MongoDB.' },
          { role: 'user', content: `Aquí está el esquema de mi base de datos MongoDB: ${context} Y quiero que me ayudes a generar una consulta para esta pregunta: ${query} devuelve unicamente la consulta sin nada mas, ningun texto solo la consulta ` }
        ],
        max_tokens: 200,
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Obtener la respuesta de la API (solo la consulta)
    const botReply = response.data.choices[0].message.content.trim();

    // Enviar la respuesta de vuelta al cliente
    res.json({ queryResult: botReply });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Error al contactar con la API de OpenAI' });
  }
});

module.exports = router;
