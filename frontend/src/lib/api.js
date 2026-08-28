import axios from "axios"

import { getToken, logout } from "@/lib/auth"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
