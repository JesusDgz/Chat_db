import React from "react";
import Table from "./components/Table";
import Chat from "./components/Chat";

const App = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1 }}>
        <Table />
      </div>
      <div style={{ flex: 2 }}>
        <Chat />
      </div>
    </div>
  );
};

export default App;
