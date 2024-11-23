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
  
  // Contexto sobre la base de datos
  const context = `
    -- Esquema de base de datos
    -- Tabla: clientes
    CREATE TABLE clientes (
        id_cliente INT PRIMARY KEY,
        nombre VARCHAR(100),
        email VARCHAR(100),
        telefono VARCHAR(15)
    );

    -- Tabla: pedidos
    CREATE TABLE pedidos (
        id_pedido INT PRIMARY KEY,
        id_cliente INT,
        fecha DATE,
        monto DECIMAL(10, 2),
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
    );

    -- Relación: Un cliente puede tener muchos pedidos (uno a muchos)
  `;

  // Verificar que la consulta esté presente
  if (!query) {
    return res.status(400).json({ error: 'Consulta no proporcionada' });
  }

  try {
    // Enviar la solicitud a la API de OpenAI (ChatGPT)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un asistente que ayuda a generar consultas SQL basadas en esquemas de bases de datos.' },
          { role: 'user', content: `Aquí está el esquema de mi base de datos: ${context} Y quiero que me ayudes a generar una consulta SQL para esta pregunta: ${query}` }
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

    // Obtener la respuesta de la API (solo la consulta SQL)
    const botReply = response.data.choices[0].message.content.trim();

    // Enviar la respuesta de vuelta al cliente (solo la consulta SQL)
    res.json({ queryResult: botReply });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Error al contactar con la API de OpenAI' });
  }
});

module.exports = router;
