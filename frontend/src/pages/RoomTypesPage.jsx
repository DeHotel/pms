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

function currency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value))
}

const EMPTY_FORM = { name: "", description: "", basePrice: "", capacity: "1" }

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  function loadRoomTypes() {
    setLoading(true)
    api
      .get("/room-types")
      .then(({ data }) => setRoomTypes(data))
      .catch(() => setError("No se pudieron cargar los tipos de habitación."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRoomTypes()
  }, [])

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError("")

    if (!form.name || !form.basePrice) {
      setFormError("Nombre y precio son obligatorios.")
      return
    }

    setSaving(true)
    try {
      await api.post("/room-types", {
        name: form.name,
        description: form.description || undefined,
        basePrice: Number(form.basePrice),
        capacity: Number(form.capacity) || 1,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      loadRoomTypes()
    } catch (err) {
      setFormError(
        err.response?.data?.message ?? "No se pudo guardar el tipo de habitación."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <span className="font-semibold">{getHotelName()}</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/habitaciones">Volver</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Tipos de habitación</h1>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "Nuevo tipo"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base">Nuevo tipo de habitación</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={handleChange("name")}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="basePrice">Precio por noche</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basePrice}
                    onChange={handleChange("basePrice")}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="capacity">Capacidad (huéspedes)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={handleChange("capacity")}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={handleChange("description")}
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
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Descripción</th>
                  <th className="px-4 py-2 font-medium">Capacidad</th>
                  <th className="px-4 py-2 font-medium">Precio / noche</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.map((rt) => (
                  <tr key={rt.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{rt.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {rt.description || "-"}
                    </td>
                    <td className="px-4 py-2">{rt.capacity}</td>
                    <td className="px-4 py-2">{currency(rt.basePrice)}</td>
                  </tr>
                ))}
                {roomTypes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No hay tipos de habitación cargados todavía.
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
