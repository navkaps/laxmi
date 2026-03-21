import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import UserInfoPage from "./pages/UserInfo";
import Profiler from "./pages/Profiler";
import Results from "./pages/Results";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/start" element={<UserInfoPage />} />
        <Route path="/profile" element={<Profiler />} />
        <Route path="/results" element={<><Navbar /><Results /></>} />
      </Routes>
    </Router>
  );
}

export default App;
