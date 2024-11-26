import React, { useState } from "react";
import axios from "axios";

const AudioUploader = () => {
  const [audioFile, setAudioFile] = useState(null); // Estado para el archivo de audio
  const [isUploading, setIsUploading] = useState(false); // Estado para indicar si está subiendo
  const [uploadSuccess, setUploadSuccess] = useState(false); // Estado para indicar si fue exitoso

  // Manejar el cambio en el input
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file); // Guardar el archivo seleccionado
      setUploadSuccess(false); // Resetear éxito en nuevas cargas
    }
  };

  // Enviar el archivo a la API
  const handleUpload = async () => {
    if (!audioFile) {
      alert("Por favor selecciona un archivo de audio.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile); // "audio" será la clave en la API

    try {
      setIsUploading(true);
      const response = await axios.post(
        "http://localhost:5000/api/chat/consul", // Cambia esta URL según tu backend
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Respuesta del servidor:", response.data);
      setUploadSuccess(true); // Indicar éxito
    } catch (error) {
      console.error("Error al subir el audio:", error);
    } finally {
      setIsUploading(false); // Finalizar la carga
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#121212", color: "#fff" }}>
      <h1>Subir Audio</h1>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ marginBottom: "10px", color: "#fff" }}
      />
      <br />
      <button
        onClick={handleUpload}
        disabled={isUploading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#1E88E5",
          color: "#fff",
          border: "none",
          cursor: isUploading ? "not-allowed" : "pointer",
        }}
      >
        {isUploading ? "Subiendo..." : "Subir"}
      </button>
      {uploadSuccess && (
        <p style={{ color: "green", marginTop: "10px" }}>
          ¡Audio subido con éxito!
        </p>
      )}
    </div>
  );
};

export default AudioUploader;
