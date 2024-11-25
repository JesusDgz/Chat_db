const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("./logger"); // Logger para registrar información
const mongoose = require("mongoose"); // Usamos mongoose exclusivamente
const { OpenAI } = require("openai");

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: "sk-xgH1BbMNtXlXX0LdpPIkkNofsG9jYDb3dP2V5BtdbKT3BlbkFJ7iNuqwxKhNXUmPO-tqG--ediLO35-DBoP3VWpWqEEA", // Cambia por tu clave o usa .env

});

require("dotenv").config(); // Para usar variables de entorno

const app = express();

// Middleware
app.use(cors()); // Permitir solicitudes de diferentes orígenes
app.use(bodyParser.json()); // Parsear las solicitudes con cuerpo en formato JSON

// URI de conexión a MongoDB Atlas (usa tu propia URI aquí)
const uri = "mongodb+srv://cuyo0987654321:perrito12@cluster0.zom8p.mongodb.net/Cluster0?retryWrites=true&w=majority";

// Conexión a MongoDB con mongoose
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Conexión exitosa a MongoDB");
    console.log("Conexión exitosa a MongoDB Atlas");
  })
  .catch((err) => {
    logger.error("Error al conectar a MongoDB", err);
    console.error("Error al conectar a MongoDB:", err);
  });

// Esquema y modelo de cliente
const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String, required: true },
});

const Cliente = mongoose.model("Cliente", clienteSchema);

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

  try {
    const nuevoCliente = new Cliente({ nombre, email, telefono });
    await nuevoCliente.save();
    res.status(201).json({ message: "Cliente creado exitosamente", cliente: nuevoCliente });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: "El email ya está registrado." });
    } else {
      res.status(500).json({ error: "Hubo un error al guardar el cliente." });
    }
  }
});

// Ruta para obtener todos los clientes
app.get("/api/clientes", async (req, res) => {
  try {
    const clientes = await Cliente.find();
    if (clientes.length === 0) {
      return res.status(404).json({ message: "No se encontraron clientes." });
    }
    res.status(200).json({ clientes });
  } catch (err) {
    logger.error("Error al obtener clientes", err);
    res.status(500).json({ error: "Hubo un error al obtener los clientes." });
  }
});

// Iniciar el servidor
const port = 5000;
app.listen(port, () => {
  logger.info(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
