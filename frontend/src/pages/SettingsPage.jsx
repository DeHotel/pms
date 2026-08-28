import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import api from "@/lib/api"
import { getUser, setHotel as cacheHotel, getHotelName } from "@/lib/auth"
import { applyHotelTheme } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

const CURRENCY_OPTIONS = ["ARS", "CLP", "USD", "EUR", "MXN", "COP", "PEN", "UYU"]

export default function SettingsPage() {
  const user = getUser()
  const isAdmin = user?.role === "ADMIN"

  const [form, setForm] = useState({ name: "", primaryColor: "#2563eb", currency: "ARS" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api
      .get("/hotel")
      .then(({ data }) => {
        setForm({ name: data.name, primaryColor: data.primaryColor, currency: data.currency })
        cacheHotel(data)
      })
      .catch(() => setError("No se pudo cargar la configuración."))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(field) {
    return (event) => {
      setSaved(false)
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSaved(false)

    setSaving(true)
    try {
      const { data } = await api.patch("/hotel", form)
      setForm({ name: data.name, primaryColor: data.primaryColor, currency: data.currency })
      cacheHotel(data)
      applyHotelTheme(data)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message ?? "No se pudo guardar la configuración.")
    } finally {
      setSaving(false)
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

      <main className="mx-auto max-w-2xl p-4 sm:p-6">
        <h1 className="mb-4 text-xl font-semibold">Configuración</h1>

        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {error && !loading && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base">Datos del hotel</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Estos datos son globales para todo el hotel."
                    : "Solo un administrador puede editar esta configuración."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="name">Nombre del hotel</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={handleChange("name")}
                    disabled={!isAdmin || saving}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="primaryColor">Color principal</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      value={form.primaryColor}
                      onChange={handleChange("primaryColor")}
                      disabled={!isAdmin || saving}
                      className="h-9 w-12 shrink-0 rounded-md border border-input bg-transparent p-1"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={handleChange("primaryColor")}
                      disabled={!isAdmin || saving}
                      pattern="^#[0-9a-fA-F]{6}$"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se usa en botones y elementos destacados de toda la app.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={handleChange("currency")}
                    disabled={!isAdmin || saving}
                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                  >
                    {CURRENCY_OPTIONS.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Se usa para mostrar los montos de las reservas.
                  </p>
                </div>

                {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                {saved && (
                  <p className="text-sm text-green-700 sm:col-span-2">Cambios guardados.</p>
                )}
              </CardContent>
              {isAdmin && (
                <CardFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>
        )}
      </main>
    </div>
  )
}
