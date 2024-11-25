# Usar una imagen base de Node.js
FROM node:16

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar el package.json para instalar las dependencias
COPY /Backend/package.json .

# Instalar las dependencias
RUN npm install

# Copiar el código fuente del Backend
COPY /Backend/ .

# Exponer el puerto en el que tu aplicación backend escuchará
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
