import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import App from "./App.jsx"
import { getHotel } from "@/lib/auth"
import { applyHotelTheme } from "@/lib/theme"

// Aplica el color de marca del hotel (cacheado en localStorage tras el login)
// antes del primer render, para evitar el flash del color por defecto.
applyHotelTheme(getHotel())

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
