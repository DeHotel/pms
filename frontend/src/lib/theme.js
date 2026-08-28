// Aplica el color de marca del hotel actual sobrescribiendo la variable CSS
// --primary que usa Tailwind (ver src/index.css). Funciona con cualquier
// color hex, más allá de que la paleta base esté definida en oklch.
export function applyHotelTheme(hotel) {
  if (!hotel?.primaryColor) return
  document.documentElement.style.setProperty("--primary", hotel.primaryColor)
}
