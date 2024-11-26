import React from "react";
import Table from "./components/Table";
import Chat from "./components/Chat";
import AudioConsulta from "./components/AudioConsulta";

const App = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1 }}>
        <Table />
      </div>
      <div style={{ flex: 2 }}>
        <Chat />
      </div>
      <div style={{ flex: 3 }}>
        <AudioConsulta />
      </div>
    </div>
  );
};

export default App;
