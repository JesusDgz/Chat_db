const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require('fs');
const { OpenAI } = require("openai");
const logger = require("../logger"); // Ajusta el path según tu estructura
const mysql = require("mysql2");

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: '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'
});

// Configuración de la base de datos
const connection = mysql.createConnection("mysql://root:wrtiLMMmpSzzcoosvOCvBaFseyIPqCET@junction.proxy.rlwy.net:13179/railway");

// Configuración de `multer` para manejar archivos de audio
const storage = multer.memoryStorage(); // Almacena el archivo en memoria
const upload = multer({ storage });

// Ruta para procesar el audio
router.post("/", upload.single("file"), async (req, res) => {
  logger.info('audio------------------------------------')
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Se requiere un archivo de audio." });
    }


    // Enviar el archivo a OpenAI (ejemplo de uso con OpenAI Whisper para transcripción)
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream("files/p_33897159_368.mp3"),
      model: "whisper-1",
    });

    logger.info('response1', response)
    

    const transcribedText = String(response);

    logger.info("Texto transcrito:", transcribedText);

    // Enviar el texto transcrito como mensaje al asistente
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
          Mis tablas son:
          CREATE TABLE pedido (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_cliente INT,
            fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
            monto DECIMAL(10, 2) NOT NULL,
            estado ENUM('pendiente', 'entregado', 'cancelado') NOT NULL
          );
          CREATE TABLE clientes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            telefono VARCHAR(15),
            direccion VARCHAR(255),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          Eres un asistente que genera consultas SQL basadas en descripciones. Devuelve la consulta y parámetros necesarios.
          `,
        },
        { role: "user", content: transcribedText },
      ],
      max_tokens: 1000,
    });

    const botResponse = chatResponse.choices[0].message.content;

    // Intentar parsear la respuesta de OpenAI
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(botResponse);
      logger.info("Respuesta de OpenAI:", parsedResponse);
    } catch (err) {
      logger.error("Error al parsear la respuesta de OpenAI:", err);
      return res.status(500).json({ error: "Respuesta inválida de OpenAI." });
    }

    const query = parsedResponse.query;
    const params = parsedResponse.params || [];

    // Realizar la consulta a la base de datos
    connection.query(query, params, async (err, clientes) => {
      if (err) {
        logger.error("Error al realizar consulta:", err);
        return res.status(500).json({ error: "Error al realizar la consulta." });
      }

      if (clientes.length === 0) {
        return res.status(404).json({ message: "No se encontraron resultados." });
      }

      const payload = {
        message: "Consulta realizada exitosamente.",
        clientes,
        context: transcribedText,
      };

      const respuesta = await interpretar(payload); // Llamar al método interpretar para procesar resultados
      logger.info("Respuesta interpretada:", respuesta);

      return res.status(200).json({
        message: "Consulta realizada exitosamente.",
        respuesta,
      });
    });
  } catch (err) {
    logger.error("Error al procesar el audio:", err);
    return res.status(500).json({ error: "Error al procesar la solicitud." });
  }
});

module.exports = router;
