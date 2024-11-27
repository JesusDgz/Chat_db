import React, { useState } from "react";
import axios from "axios";

const AudioUploader = () => {
  const [audioFile, setAudioFile] = useState(null); 
  const [isUploading, setIsUploading] = useState(false); 
  const [uploadSuccess, setUploadSuccess] = useState(false); 

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file); 
      setUploadSuccess(false);
    }
  };

  
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
        "http://localhost:5000/api/chat/consul/chat/audio", 
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
