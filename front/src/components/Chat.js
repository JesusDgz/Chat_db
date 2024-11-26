import React, { useState } from "react";
import axios from "axios";
import { Box, TextField, Button, CircularProgress } from "@mui/material";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [missingData, setMissingData] = useState(null); // Para guardar los datos faltantes

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/chat", {
        message: input,
      });

      const botMessage = {
        role: "bot",
        content: response.data.response || "Solicitud procesada.",
      };

      setMessages((prev) => [...prev, botMessage]);
      setMissingData(null); // Restablecer si no faltan datos
    } catch (error) {
      if (error.response && error.response.data.falta) {
        const faltantes = error.response.data.falta;
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: `Faltan los siguientes datos: ${faltantes.join(", ")}` },
        ]);
        setMissingData(faltantes); // Guardar los datos que faltan
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "Ocurrió un error procesando la solicitud." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMissingData = (data) => {
    const newInput = `${input} ${data.key}: ${data.value}`;
    setInput(newInput);
    setMissingData((prev) => prev.filter((item) => item !== data.key));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#121212",
        color: "#fff",
        padding: "16px",
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: "auto", marginBottom: "16px" }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              textAlign: msg.role === "user" ? "right" : "left",
              margin: "8px 0",
              color: msg.role === "user" ? "#1E88E5" : "#fff",
            }}
          >
            {msg.content}
          </Box>
        ))}
      </Box>
      {loading && (
        <Box sx={{ textAlign: "center", marginBottom: "8px" }}>
          <CircularProgress color="info" size={20} />
        </Box>
      )}
      {missingData && (
        <Box>
          {missingData.map((key, index) => (
            <TextField
              key={index}
              label={`Ingresa ${key}`}
              onBlur={(e) => handleMissingData({ key, value: e.target.value })}
              fullWidth
              sx={{
                marginBottom: "8px",
                backgroundColor: "#1E88E5",
                borderRadius: "4px",
                input: { color: "#fff" },
              }}
            />
          ))}
        </Box>
      )}
      <Box sx={{ display: "flex" }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          variant="outlined"
          fullWidth
          placeholder="Escribe tu mensaje..."
          sx={{
            backgroundColor: "#1E88E5",
            borderRadius: "4px",
            input: { color: "#fff" },
          }}
        />
        <Button
          onClick={sendMessage}
          variant="contained"
          sx={{
            marginLeft: "8px",
            backgroundColor: "#0D47A1",
            "&:hover": { backgroundColor: "#1976D2" },
          }}
        >
          Enviar
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;
