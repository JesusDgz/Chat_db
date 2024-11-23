const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./logger'); // Asumimos que el logger está configurado en otro archivo
const routes = require('./routes'); // Importar las rutas

require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Permite solicitudes de diferentes orígenes
app.use(bodyParser.json()); // Parsear las solicitudes con cuerpo en formato JSON

const mongoose = require('mongoose');

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/mi_base_de_datos', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('Conectado a MongoDB'))
.catch(err => logger.error('Error al conectar a MongoDB', err));

// Usar las rutas definidas en routes.js
app.use('/api', routes);

// Ruta simple para probar que el servidor está funcionando
app.get('/', (req, res) => {
  logger.info('Ruta principal accedida');
  res.send('Hola desde el Backend!');
});

////////////////////////////////////////
// Definir el esquema del cliente
const clienteSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  telefono: String
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// Ruta para agregar un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  const { nombre, email, telefono } = req.body;

  // Verificar que los datos estén presentes
  if (!nombre || !email || !telefono) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  try {
    // Crear un nuevo cliente
    const nuevoCliente = new Cliente({ nombre, email, telefono });

    // Guardar el cliente en la base de datos
    await nuevoCliente.save();

    // Responder con el cliente creado
    res.status(201).json({ message: 'Cliente creado exitosamente', cliente: nuevoCliente });
  } catch (err) {
    logger.error('Error al guardar el cliente', err);
    res.status(500).json({ error: 'Hubo un error al guardar el cliente.' });
  }
});

// Ruta GET para obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    // Obtener todos los clientes de la base de datos
    const clientes = await Cliente.find();

    // Verificar si no hay clientes
    if (clientes.length === 0) {
      return res.status(404).json({ message: 'No se encontraron clientes.' });
    }

    // Enviar la lista de clientes como respuesta
    res.status(200).json({ clientes });
  } catch (err) {
    logger.error('Error al obtener clientes', err);
    res.status(500).json({ error: 'Hubo un error al obtener los clientes.' });
  }
});


// Iniciar el servidor
const port = 5000;
app.listen(port, () => {
  logger.info(`Servidor corriendo en http://localhost:${port}`);
});
