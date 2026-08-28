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
import { SELECT_CLASS, COMPANY_TYPE_OPTIONS } from "@/components/ReservationFormModal"
import { getHotelName } from "@/lib/auth"

const EMPTY_FORM = { name: "", type: "EMPRESA", email: "", phone: "", notes: "" }

function typeLabel(value) {
  return COMPANY_TYPE_OPTIONS.find((opt) => opt.value === value)?.label ?? value
}

function companyToForm(company) {
  return {
    name: company.name || "",
    type: company.type || "EMPRESA",
    email: company.email || "",
    phone: company.phone || "",
    notes: company.notes || "",
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [rowError, setRowError] = useState("")

  function loadCompanies() {
    setLoading(true)
    api
      .get("/companies")
      .then(({ data }) => setCompanies(data))
      .catch(() => setError("No se pudieron cargar las compañías/agencias."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setShowForm(true)
  }

  function openEditForm(company) {
    setEditingId(company.id)
    setForm(companyToForm(company))
    setFormError("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
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

    const payload = {
      name: form.name,
      type: form.type,
      email: form.email || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
    }

    setSaving(true)
    try {
      if (editingId) {
        await api.patch(`/companies/${editingId}`, payload)
      } else {
        await api.post("/companies", payload)
      }
      closeForm()
      loadCompanies()
    } catch (err) {
      setFormError(err.response?.data?.message ?? "No se pudo guardar la compañía/agencia.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(company) {
    const warning =
      company._count?.reservations > 0
        ? `"${company.name}" tiene ${company._count.reservations} reserva(s) asociada(s); al eliminarla, esas reservas van a quedar marcadas como "Particular". ¿Continuar?`
        : `¿Eliminar "${company.name}"? Esta acción no se puede deshacer.`
    if (!window.confirm(warning)) return

    setRowError("")
    try {
      await api.delete(`/companies/${company.id}`)
      loadCompanies()
    } catch (err) {
      setRowError(err.response?.data?.message ?? "No se pudo eliminar la compañía/agencia.")
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
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Compañías y agencias</h1>
          <Button size="sm" onClick={() => (showForm ? closeForm() : openCreateForm())}>
            {showForm ? "Cancelar" : "Nueva compañía/agencia"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingId ? "Editar compañía/agencia" : "Nueva compañía/agencia"}
                </CardTitle>
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
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={handleChange("type")}
                    disabled={saving}
                    className={SELECT_CLASS}
                  >
                    {COMPANY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    disabled={saving}
                  />
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
              <CardFooter className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
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
        {rowError && <p className="mb-3 text-sm text-destructive">{rowError}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Teléfono</th>
                  <th className="px-4 py-2 font-medium">Reservas</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2">{typeLabel(c.type)}</td>
                    <td className="px-4 py-2">{c.email || "-"}</td>
                    <td className="px-4 py-2">{c.phone || "-"}</td>
                    <td className="px-4 py-2">{c._count?.reservations ?? 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditForm(c)}>
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(c)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No hay compañías ni agencias cargadas todavía.
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
