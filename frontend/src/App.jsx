import React, { useState } from "react";
import { Container, Box, Tabs, Tab } from "@mui/material";
import Header from "./components/Header";
import DetectPage from "./pages/DetectPage";
import ChatLogPage from "./pages/ChatLogPage";

export default function App() {
  const [tab, setTab] = useState(0);
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Single Detection" />
          <Tab label="Chat Log Analyzer" />
        </Tabs>
        <Box>{tab === 0 ? <DetectPage /> : <ChatLogPage />}</Box>
      </Container>
    </>
  );
}
