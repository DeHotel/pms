import { Link, useNavigate } from "react-router-dom"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUser, logout, getHotelName } from "@/lib/auth"

const BASE_MODULES = [
  {
    title: "Habitaciones",
    description: "Gestión de habitaciones y tipos de habitación",
    path: "/habitaciones",
  },
  {
    title: "Reservas",
    description: "Calendario de disponibilidad y reservas",
    path: "/reservas",
  },
  {
    title: "Huéspedes",
    description: "Ficha de clientes e historial",
    path: "/huespedes",
  },
  {
    title: "Empresas y agencias",
    description: "Compañías y agencias para asociar a las reservas",
    path: "/empresas",
  },
  {
    title: "Calendario",
    description: "Vista de disponibilidad, crear y editar reservas",
    path: "/calendario",
  },
  { title: "Check-in / Check-out", description: "Movimientos de huéspedes" },
  { title: "Tarifas", description: "Precios y temporadas" },
  { title: "Reportes", description: "Ocupación e ingresos" },
]

const ADMIN_MODULES = [
  {
    title: "Usuarios",
    description: "Altas, roles y permisos del equipo del hotel",
    path: "/usuarios",
  },
  {
    title: "Configuración",
    description: "Nombre del hotel, color de marca y moneda",
    path: "/configuracion",
  },
]

// El SUPER_ADMIN no pertenece a ningún hotel: no tiene sentido mostrarle
// Habitaciones/Reservas/etc. (son datos de un hotel puntual). Ve solo la
// gestión de hoteles y usuarios a nivel de todo el sistema.
const SUPER_ADMIN_MODULES = [
  {
    title: "Hoteles",
    description: "Alta de hoteles nuevos en el sistema",
    path: "/hoteles",
  },
  {
    title: "Usuarios",
    description: "Usuarios de todos los hoteles, y súper administradores",
    path: "/usuarios",
  },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = getUser()
  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const modules = isSuperAdmin
    ? SUPER_ADMIN_MODULES
    : user?.role === "ADMIN"
      ? [...BASE_MODULES, ...ADMIN_MODULES]
      : BASE_MODULES

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <span className="font-semibold">{isSuperAdmin ? "Panel general" : getHotelName()}</span>
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
              {user.name} · {user.role}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <h1 className="mb-1 text-xl font-semibold">
          Bienvenido{user ? `, ${user.name}` : ""}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {isSuperAdmin
            ? "No pertenecés a ningún hotel: administrás el sistema completo."
            : "Estos van a ser los módulos del sistema."}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) =>
            mod.path ? (
              <Link key={mod.title} to={mod.path}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                    <CardDescription>{mod.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <Card key={mod.title} className="opacity-60">
                <CardHeader>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                  <CardDescription>{mod.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          )}
        </div>
      </main>
    </div>
  )
}
