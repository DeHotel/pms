import { Routes, Route, Navigate } from "react-router-dom"

import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import RoomsPage from "@/pages/RoomsPage"
import RoomTypesPage from "@/pages/RoomTypesPage"
import ReservationsPage from "@/pages/ReservationsPage"
import GuestsPage from "@/pages/GuestsPage"
import CompaniesPage from "@/pages/CompaniesPage"
import CalendarPage from "@/pages/CalendarPage"
import SettingsPage from "@/pages/SettingsPage"
import UsersPage from "@/pages/UsersPage"
import HotelsPage from "@/pages/HotelsPage"
import ProtectedRoute from "@/components/ProtectedRoute"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/habitaciones"
        element={
          <ProtectedRoute>
            <RoomsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tipos-habitacion"
        element={
          <ProtectedRoute>
            <RoomTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservas"
        element={
          <ProtectedRoute>
            <ReservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/huespedes"
        element={
          <ProtectedRoute>
            <GuestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute>
            <CompaniesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendario"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hoteles"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <HotelsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
