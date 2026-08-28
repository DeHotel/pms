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
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

const CURRENCY_OPTIONS = ["ARS", "CLP", "USD", "EUR", "MXN", "COP", "PEN", "UYU"]

const SELECT_CLASS =
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"

const EMPTY_FORM = { name: "", primaryColor: "#2563eb", currency: "ARS" }

export default function HotelsPage() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  function loadHotels() {
    setLoading(true)
    api
      .get("/hotels")
      .then(({ data }) => setHotels(data))
      .catch(() => setError("No se pudieron cargar los hoteles."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHotels()
  }, [])

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setFormError("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setFormError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError("")

    if (!form.name) {
      setFormError("El nombre es obligatorio.")
      return
    }

    setSaving(true)
    try {
      await api.post("/hotels", form)
      closeForm()
      loadHotels()
    } catch (err) {
      setFormError(err.response?.data?.message ?? "No se pudo crear el hotel.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <span className="font-semibold">Panel general</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Volver</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Hoteles</h1>
          <Button size="sm" onClick={() => (showForm ? closeForm() : openCreateForm())}>
            {showForm ? "Cancelar" : "Nuevo hotel"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base">Nuevo hotel</CardTitle>
                <CardDescription>
                  Después podés dar de alta usuarios para este hotel desde Usuarios.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
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
                  <Label htmlFor="primaryColor">Color principal</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      value={form.primaryColor}
                      onChange={handleChange("primaryColor")}
                      disabled={saving}
                      className="h-9 w-12 shrink-0 rounded-md border border-input bg-transparent p-1"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={handleChange("primaryColor")}
                      disabled={saving}
                      pattern="^#[0-9a-fA-F]{6}$"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={handleChange("currency")}
                    disabled={saving}
                    className={SELECT_CLASS}
                  >
                    {CURRENCY_OPTIONS.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
                {formError && (
                  <p className="text-sm text-destructive sm:col-span-2">{formError}</p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creando..." : "Crear hotel"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                  Cancelar
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
                  <th className="px-4 py-2 font-medium">Color</th>
                  <th className="px-4 py-2 font-medium">Moneda</th>
                  <th className="px-4 py-2 font-medium">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{h.name}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: h.primaryColor }}
                        />
                        {h.primaryColor}
                      </span>
                    </td>
                    <td className="px-4 py-2">{h.currency}</td>
                    <td className="px-4 py-2">{h._count?.users ?? 0}</td>
                  </tr>
                ))}
                {hotels.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No hay hoteles cargados todavía.
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
