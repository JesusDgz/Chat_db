const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Crear una instancia de Express
const app = express();

// Puerto donde el servidor estará corriendo
const port = 5000; 

// Middleware
app.use(cors()); // Permite solicitudes de diferentes orígenes
app.use(bodyParser.json()); // Parsear las solicitudes con cuerpo en formato JSON

// Conectar a la base de datos MongoDB (cambia la URL si usas MongoDB Atlas)
mongoose.connect('mongodb://localhost:27017/chatdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.log('Error al conectar a MongoDB:', err));

// Ruta simple para probar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Hola desde el Backend!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
