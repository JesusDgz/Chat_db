# Usar una imagen base de Node.js para construir el proyecto
FROM node:16 AS build

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos necesarios para instalar dependencias y compilar
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente
COPY . .

# Compilar el proyecto (genera la carpeta 'build')
RUN npm run build

# Fase final: Usar una imagen más liviana para servir el contenido estático
FROM nginx:alpine

# Copiar los archivos de la carpeta 'build' generados en la fase de construcción
COPY --from=build /app/build /usr/share/nginx/html

# Exponer el puerto en el que el servidor web estará escuchando
EXPOSE 80

# Iniciar NGINX
CMD ["nginx", "-g", "daemon off;"]
