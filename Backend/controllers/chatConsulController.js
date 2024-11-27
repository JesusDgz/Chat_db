const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const { OpenAI } = require("openai");
const logger = require("../logger"); // Asegúrate de ajustar el path según tu estructura

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: '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'
});

// Conexión a la base de datos
const connection = mysql.createConnection("mysql://root:wrtiLMMmpSzzcoosvOCvBaFseyIPqCET@junction.proxy.rlwy.net:13179/railway");

// Función para procesar las consultas de OpenAI
const interpretar = async (payload) => {
  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
        Mis tablas son: 
        CREATE TABLE pedido (
          id_pedido INT AUTO_INCREMENT PRIMARY KEY,
          id_cliente INT,
          fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
          monto DECIMAL(10, 2) NOT NULL,
          estado ENUM('pendiente', 'entregado', 'cancelado') NOT NULL
        );
        CREATE TABLE clientes (
          id_cliente INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          telefono VARCHAR(15),
          direccion VARCHAR(255),
          fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        Eres un asistente que ayuda a interpretar resultados de consultas SQL para una base de datos de clientes.
        Se te enviará un conjunto de datos, y debes interpretar y devolver un texto en lenguaje natural.
        `,
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
    max_tokens: 1000,
  });

  return res.choices[0].message.content;
};

// Ruta principal
router.post("/", async (req, res) => {
  logger.info("llego aqui");

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "El mensaje debe ser un texto válido." });
  }

  try {
    // Enviar el mensaje a la API de OpenAI para analizarlo
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Asegúrate de que el modelo esté disponible
      messages: [
        {
          role: "system",
          content: `
          Mis tablas son: 
          CREATE TABLE pedido (
            id INT AUTO_INCREMENT PRIMARY KEY,      -- Identificador único del pedido
            id_cliente INT,                                -- ID del cliente relacionado (clave foránea)
            fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha del pedido
            monto DECIMAL(10, 2) NOT NULL,                 -- Monto total del pedido
            estado ENUM('pendiente', 'entregado', 'cancelado') NOT NULL, -- Estado del pedido
        );
        CREATE TABLE clientes (
          id INT AUTO_INCREMENT PRIMARY KEY,    -- Identificador único de cliente
          nombre VARCHAR(100) NOT NULL,                  -- Nombre del cliente
          email VARCHAR(100) NOT NULL UNIQUE,            -- Correo electrónico del cliente
          telefono VARCHAR(15),                          -- Número de teléfono del cliente
          direccion VARCHAR(255),                        -- Dirección de envío del cliente
          fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP -- Fecha en que el cliente se registró
      );
toma en cuenta esto code":"ER_NOT_SUPPORTED_YET","errno":1235,"level":"error","message":"Error al realizar consulta: This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery
            Eres un asistente que ayuda a generar consultas SQL para una base de datos de clientes.
            El usuario te enviará un mensaje con una descripción, y tú deberás devolver la consulta SQL necesaria para encontrar los registros que coincidan con los criterios.
            Los datos en la base de datos incluyen: id_cliente, nombre, email, telefono.
            Responde con un formato JSON con la consulta necesario para llevar a cabo lo que se te pide, basandote en las tablas anteriores,
            ademas cuando se te pida quien es el cliente con mas pedidos por ejemplo necesito el nombre de ese cliente o del pedido igual, siempre tienes
            que mostrar el nombre del cliente en vez del id

            Formato de respuesta: 
            query
            params
          
            Por ejemplo:
            - Si el mensaje es "Dame el usuario con el teléfono 6251480821", la respuesta debería ser:
              { Select from cliente where telefono = "6251480821"}
          `,
        },
        { role: "user", content: message },
      ],
      max_tokens: 1000,
    });

    const botResponse = response.choices[0].message.content;

    // Intentar parsear la respuesta como JSON
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

    // Realizar la consulta a MySQL
    connection.query(query, params, async (err, clientes) => {
      if (err) {
        logger.error("Error al realizar consulta:", err);
        return res.status(500).json({ error: "Error al realizar la consulta." });
      }

      if (clientes.length === 0) {
        return res.status(404).json({ message: "No se encontraron clientes que coincidan con la consulta." });
      }

      const payload = {
        message: "Consulta realizada exitosamente.",
        clientes,
        context: message
      };

      const respuesta = await interpretar(payload); // Esperar la respuesta del procesamiento de OpenAI
      logger.info('Respuesta interpretada:', respuesta);

      // Respuesta exitosa con los resultados de la consulta
      return res.status(200).json({
        message: "Consulta realizada exitosamente.",
        respuesta,
      });
    });
  } catch (err) {
    logger.error("Error al interactuar con OpenAI:", err);
    return res.status(500).json({ error: "Error al procesar la solicitud." });
  }
});

module.exports = router;
