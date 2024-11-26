import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import { DataGrid } from "@mui/x-data-grid";

const socket = io("http://localhost:5000"); // URL del backend

const Table = () => {
  const [clientes, setClientes] = useState([]);

  // Obtener datos iniciales
  useEffect(() => {
    axios.get("http://localhost:5000/api/clientes").then((response) => {
      setClientes(response.data.clientes);
    });

    // Escuchar actualizaciones en tiempo real
    socket.on("updateClientes", (updatedClientes) => {
      setClientes(updatedClientes);
    });

    return () => socket.disconnect(); // Limpiar socket al desmontar
  }, []);

  const columns = [
    { field: "nombre", headerName: "Nombre", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "telefono", headerName: "Teléfono", flex: 1 },
  ];

  return (
    <div style={{ height: 300, backgroundColor: "#121212", color: "#fff" }}>
      <DataGrid
        rows={clientes.map((cliente, index) => ({ id: index, ...cliente }))}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        sx={{
          "& .MuiDataGrid-cell": { color: "#fff" },
          "& .MuiDataGrid-columnHeader": { backgroundColor: "#1E88E5" },
        }}
      />
    </div>
  );
};

export default Table;
