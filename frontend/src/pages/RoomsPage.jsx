import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { getHotelName } from "@/lib/auth"

const STATUS_OPTIONS = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "OCUPADA", label: "Ocupada" },
  { value: "LIMPIEZA", label: "Limpieza" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "FUERA_DE_SERVICIO", label: "Fuera de servicio" },
]

const STATUS_STYLES = {
  DISPONIBLE: "bg-green-100 text-green-800",
  OCUPADA: "bg-red-100 text-red-800",
  LIMPIEZA: "bg-yellow-100 text-yellow-800",
  MANTENIMIENTO: "bg-orange-100 text-orange-800",
  FUERA_DE_SERVICIO: "bg-gray-200 text-gray-700",
}

function currency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value))
}

const EMPTY_FORM = { number: "", floor: "", roomTypeId: "", notes: "" }

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [updatingId, setUpdatingId] = useState(null)

  function loadRooms() {
    setLoading(true)
    api
      .get("/rooms")
      .then(({ data }) => setRooms(data))
      .catch(() => setError("No se pudieron cargar las habitaciones."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRooms()
    api
      .get("/room-types")
      .then(({ data }) => setRoomTypes(data))
      .catch(() => {})
  }, [])

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError("")

    if (!form.number || !form.roomTypeId) {
      setFormError("Número y tipo de habitación son obligatorios.")
      return
    }

    setSaving(true)
    try {
      await api.post("/rooms", {
        number: form.number,
        floor: form.floor ? Number(form.floor) : undefined,
        roomTypeId: Number(form.roomTypeId),
        notes: form.notes || undefined,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      loadRooms()
    } catch (err) {
      setFormError(err.response?.data?.message ?? "No se pudo guardar la habitación.")
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(room, status) {
    setUpdatingId(room.id)
    try {
      const { data } = await api.patch(`/rooms/${room.id}/status`, { status })
      setRooms((prev) => prev.map((r) => (r.id === room.id ? data : r)))
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <span className="font-semibold">{getHotelName()}</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Volver</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Habitaciones</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/tipos-habitacion">Tipos de habitación</Link>
            </Button>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancelar" : "Nueva habitación"}
            </Button>
          </div>
        </div>
        {roomTypes.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">
            Todavía no hay tipos de habitación cargados — creá uno primero en "Tipos
            de habitación".
          </p>
        )}

        {showForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base">Nueva habitación</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={form.number}
                    onChange={handleChange("number")}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="floor">Piso</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={form.floor}
                    onChange={handleChange("floor")}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="roomTypeId">Tipo de habitación</Label>
                  <select
                    id="roomTypeId"
                    value={form.roomTypeId}
                    onChange={handleChange("roomTypeId")}
                    disabled={saving}
                    required
                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                  >
                    <option value="">Seleccioná un tipo</option>
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input
                    id="notes"
                    value={form.notes}
                    onChange={handleChange("notes")}
                    disabled={saving}
                  />
                </div>
                {formError && (
                  <p className="text-sm text-destructive sm:col-span-2">{formError}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Número</th>
                  <th className="px-4 py-2 font-medium">Piso</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Capacidad</th>
                  <th className="px-4 py-2 font-medium">Precio / noche</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{room.number}</td>
                    <td className="px-4 py-2">{room.floor ?? "-"}</td>
                    <td className="px-4 py-2">{room.roomType.name}</td>
                    <td className="px-4 py-2">{room.roomType.capacity}</td>
                    <td className="px-4 py-2">{currency(room.roomType.basePrice)}</td>
                    <td className="px-4 py-2">
                      <select
                        value={room.status}
                        onChange={(event) => handleStatusChange(room, event.target.value)}
                        disabled={updatingId === room.id}
                        className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[room.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No hay habitaciones cargadas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
