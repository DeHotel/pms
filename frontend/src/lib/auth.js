export function getToken() {
  return localStorage.getItem("token")
}

export function getUser() {
  const raw = localStorage.getItem("user")
  return raw ? JSON.parse(raw) : null
}

export function getHotel() {
  const raw = localStorage.getItem("hotel")
  return raw ? JSON.parse(raw) : null
}

export function setHotel(hotel) {
  localStorage.setItem("hotel", JSON.stringify(hotel))
}

export function getHotelName() {
  return getHotel()?.name || "PMS Hotel"
}

export function setSession(token, user) {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem("hotel")
}
