import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import GetStartedPage from "./components/GetStartedPage";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found");

createRoot(root).render(
  <React.StrictMode>
    <GetStartedPage />
  </React.StrictMode>
);
