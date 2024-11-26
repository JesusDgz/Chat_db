const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("./logger"); // Logger para registrar información
const mysql = require('mysql2');
const { OpenAI } = require("openai");

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: "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", // Cambia por tu clave o usa .env

});

require("dotenv").config(); // Para usar variables de entorno

const app = express();

// Middleware
app.use(cors()); // Permitir solicitudes de diferentes orígenes
app.use(bodyParser.json()); // Parsear las solicitudes con cuerpo en formato JSON

const dbURI = 'mysql://root:wrtiLMMmpSzzcoosvOCvBaFseyIPqCET@junction.proxy.rlwy.net:13179/railway'
const connection = mysql.createConnection(dbURI);

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
  } else {
    console.log('Conectado a MySQL');
  }
});

// Ruta principal
app.get("/", (req, res) => {
  logger.info("Ruta principal accedida");
  res.send("Hola desde el Backend!");
});

app.post("/api/chat", async (req, res) => {
  logger.info("llego aq1ui");

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "El mensaje debe ser un texto válido." });
  }

  try {
    // Llamada a la API de OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Eres un chatbot que gestiona una base de datos MongoDB con información de clientes.
            El usuario te dirá, por ejemplo: "Agrega un cliente con nombre Juan, email juan@example.com y teléfono 1234567890."
            Tu objetivo es identificar las palabras clave como "nombre", "email" y "teléfono" (o sinónimos) y convertirlas en un JSON válido.
si el usuario pide que edites solo un dato puedes editarlo y conservar los datos anteriores de la misma consulta por ejemplo si dice eliminar al usuario con nombre Joni 
eliminaras todo ese registro 
            Siempre responde en un formato JSON con las siguientes claves (siempre y cuando):
            - "comando": uno de "agregar", "editar", "eliminar".
            - "datos": objeto con la información relevante.

            Ejemplos de respuesta:
           CASO EDITAR (ASI TAL CUAL TE LO PIDO SIGUE ESTRICTAMENTE ESE FORMATO)

  {
    "comando": "editar",
    "datos": {
      "filter": { "nombre": "Juan" },
      "update": { "email": "nuevo@mail.com" }
    }
  }
    CASO AGREGAR Y ELIMINAR 
            { "comando": "agregar", "datos": { "nombre": "Juan", "email": "juan@example.com", "telefono": "1234567890" } }
             
            { "comando": "eliminar", "datos": { "email": "juan@example.com"}  }  todo dependera de los "datos" que el usuario te arroje 
               { "comando": "eliminar", "datos": { "nombre": "juan"}  } 
                  { "comando": "eliminar", "datos": { "numero": "1321"}  } 
                   
                   NOTA IMPORTANTE SI TE DICEN EDITAR O BORRAR, PUEDEN PASARTE CUALQUIER TIPO DE DATO, POR EJEMPLO nombre, email y telefono 
                   si el usuario así lo desea editar 3 campos los vas a poner en el JSON, si solo pone uno pos nomas pones 1 
                    Si el usuario dice: "Edita al cliente con nombre Juan y cambia su email a nuevo@mail.com."
  u respuesta debe ser:T
 
          `,
        },
        { role: "user", content: message },
      ],
      max_tokens: 1000,
    });

    console.log("Respuesta completa de OpenAI:", response);

    const botResponse = response.choices[0].message.content;
    console.log("Respuesta completa de OpenAI:", botResponse);

    // Validar y procesar la respuesta
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(botResponse);
    } catch (err) {
      console.error("Error al parsear respuesta de OpenAI:", err);
      return res.status(500).json({ error: "Respuesta inválida de OpenAI." });
    }
    if (parsedResponse.falta) {
      return res.status(400).json({
        message: "Faltan datos para completar la operación.",
        falta: parsedResponse.falta,
      });
    }

    const { comando, datos } = parsedResponse;

    if (!comando || !datos) {
      return res.status(400).json({ error: "La respuesta de OpenAI no contiene un comando válido." });
    }

    // Manejar los comandos
    if (comando === "agregar") {
      try {
        const nuevoCliente = new Cliente(datos);
        await nuevoCliente.save();
        return res.status(201).json({ message: "Cliente agregado exitosamente.", cliente: nuevoCliente });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(400).json({ error: "Ya existe un cliente con ese email.", email: datos.email });
        }
        logger.error("Error al agregar cliente:", err);
        return res.status(500).json({ error: "Error al agregar cliente." });
      }
    }else if (comando === "editar") {
    // Extraer los datos de "filter" y "update" proporcionados por OpenAI
  const { filter, update } = datos;

  // Validar si el filtro contiene al menos un campo
  if (!filter || Object.keys(filter).length === 0) {
    return res.status(400).json({ error: "No se proporcionaron datos suficientes para identificar al cliente." });
  }

  // Validar si los datos de actualización contienen al menos un campo
  if (!update || Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No se proporcionaron datos para actualizar." });
  }

  try {
    // Realizar la actualización
    const clienteActualizado = await Cliente.findOneAndUpdate(
      filter,                  // Filtro para encontrar al cliente
      { $set: update },        // Campos a actualizar
      { new: true }            // Devolver el cliente actualizado
    );

    if (!clienteActualizado) {
      return res.status(404).json({ error: "Cliente no encontrado para editar." });
    }

    return res.status(200).json({
      message: "Cliente actualizado exitosamente.",
      cliente: clienteActualizado,
    });
  } catch (err) {
    console.error("Error al editar cliente:", err);
    return res.status(500).json({ error: "Error al editar el cliente." });
  }

    }else if (comando === "eliminar") {
     const filtro = {};
  if (datos.email) filtro.email = datos.email;
  if (datos.nombre) filtro.nombre = datos.nombre;
  if (datos.telefono) filtro.telefono = datos.telefono;

    
      // Verificar si el filtro contiene al menos un campo
      if (Object.keys(filtro).length === 0) {
        return res.status(400).json({ error: "No se proporcionaron campos para identificar al cliente." });
      }
    
      // Buscar y eliminar
      const clienteEliminado = await Cliente.findOneAndDelete(filtro);
    
      if (!clienteEliminado) {
        return res.status(404).json({ error: "Cliente no encontrado para eliminar." });
      }
    
      return res.status(200).json({ message: "Cliente eliminado exitosamente.", cliente: clienteEliminado });
    } else {
      return res.status(400).json({ error: "Comando no reconocido." });
    }
  } catch (err) {
    logger.error("Error al interactuar con OpenAI o MongoDB:", err);
    res.status(500).json({ error: "Error al proctttttesar la solicitud." });
  }
});
// Ruta para agregar un cliente
app.post("/api/clientes", async (req, res) => {
  const { nombre, email, telefono } = req.body;

  if (!nombre || !email || !telefono) {
    return res.status(400).json({ error: "Todos los campos son requeridos." });
  }

  const query = `INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)`;

  connection.query(query, [nombre, email, telefono], (err, result) => {
    if (err) {
      console.error("Error al agregar cliente:", err);
      return res.status(500).json({ error: "Hubo un error al guardar el cliente." });
    }

    res.status(201).json({ message: "Cliente creado exitosamente", clienteId: result.insertId });
  });
});

// Ruta para obtener todos los clientes
app.get("/api/clientes", (req, res) => {
  const query = "SELECT * FROM clientes";

  connection.query(query, (err, clientes) => {
    if (err) {
      console.error("Error al obtener clientes:", err);
      return res.status(500).json({ error: "Hubo un error al obtener los clientes." });
    }

    if (clientes.length === 0) {
      return res.status(404).json({ message: "No se encontraron clientes." });
    }

    res.status(200).json({ clientes });
  });
});

app.post("/api/chat/consul", async (req, res) => {
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


const interpretar = async (payload) => {
  const res = await openai.chat.completions.create({
    model: "gpt-4", 
    messages: [
      {
        role: "system",
        content: `
        Mis tablas son: 
        CREATE TABLE pedido (
          id_pedido INT AUTO_INCREMENT PRIMARY KEY,      -- Identificador único del pedido
          id_cliente INT,                                -- ID del cliente relacionado (clave foránea)
          fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha del pedido
          monto DECIMAL(10, 2) NOT NULL,                 -- Monto total del pedido
          estado ENUM('pendiente', 'entregado', 'cancelado') NOT NULL, -- Estado del pedido
      );
      CREATE TABLE clientes (
        id_cliente INT AUTO_INCREMENT PRIMARY KEY,    -- Identificador único de cliente
        nombre VARCHAR(100) NOT NULL,                  -- Nombre del cliente
        email VARCHAR(100) NOT NULL UNIQUE,            -- Correo electrónico del cliente
        telefono VARCHAR(15),                          -- Número de teléfono del cliente
        direccion VARCHAR(255),                        -- Dirección de envío del cliente
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP -- Fecha en que el cliente se registró
    );

          Eres un asistente que ayuda a interpretar resultados de consultas SQL para una base de datos de clientes.
          Se te enviara un conjunto de datos de los cuales tu vas a interpretar y devolver un texto del resultado en lenguaje natural,
          acompañado de la peticion original para que tengas contexto de lo que se pidio
          
          Por ejemplo:
          - Si los datos son 
            {
              "message": "Consulta realizada exitosamente.",
              "clientes": [
                  {
                      "id_cliente": 1,
                      "total_pedidos": 2
                  }
              ]
          }
          - Contexto: "dame el cliente con mas pedidos"

          El resultado debería ser 'El cliente con más pedidos es el cliente " + cliente + " con la cantidad de pedidos: " + total_pedidos
        `,
      },
      { role: "user", content: JSON.stringify(payload) }, 
    ],
    max_tokens: 1000,
  });

  return res.choices[0].message.content; 
};

// Iniciar el servidor
const port = 5000;

app.listen(port, () => {
  logger.info(`Servidor corriendo en http://localhost:${port}`);
});
