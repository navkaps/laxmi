import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UserInfoPage from "./pages/UserInfo";
import Profiler from "./pages/Profiler";
import Results from "./pages/Results";
import Assess from "./pages/Assess";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/start" element={<UserInfoPage />} />
        <Route path="/profile" element={<Profiler />} />
        <Route path="/results" element={<Results />} />
        <Route path="/assess" element={<Assess />} />
      </Routes>
    </Router>
  );
}

export default App;
