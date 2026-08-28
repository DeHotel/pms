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
import { resizeImageFile } from "@/lib/image"

const EMPTY_FORM = { fullName: "", documentId: "", email: "", phone: "", notes: "", photoUrl: "" }

function guestToForm(guest) {
  return {
    fullName: guest.fullName || "",
    documentId: guest.documentId || "",
    email: guest.email || "",
    phone: guest.phone || "",
    notes: guest.notes || "",
    photoUrl: guest.photoUrl || "",
  }
}

export default function GuestsPage() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [rowError, setRowError] = useState("")
  const [photoError, setPhotoError] = useState("")

  function loadGuests() {
    setLoading(true)
    api
      .get("/guests")
      .then(({ data }) => setGuests(data))
      .catch(() => setError("No se pudieron cargar los huéspedes."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadGuests()
  }, [])

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setPhotoError("")
    try {
      const dataUrl = await resizeImageFile(file)
      setForm((prev) => ({ ...prev, photoUrl: dataUrl }))
    } catch (err) {
      setPhotoError(err.message || "No se pudo procesar la imagen.")
    }
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setPhotoError("")
    setShowForm(true)
  }

  function openEditForm(guest) {
    setEditingId(guest.id)
    setForm(guestToForm(guest))
    setFormError("")
    setPhotoError("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setPhotoError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError("")

    if (!form.fullName) {
      setFormError("El nombre es obligatorio.")
      return
    }

    const payload = {
      fullName: form.fullName,
      documentId: form.documentId || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
      photoUrl: form.photoUrl || undefined,
    }

    setSaving(true)
    try {
      if (editingId) {
        await api.patch(`/guests/${editingId}`, payload)
      } else {
        await api.post("/guests", payload)
      }
      closeForm()
      loadGuests()
    } catch (err) {
      setFormError(err.response?.data?.message ?? "No se pudo guardar el huésped.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(guest) {
    if (!window.confirm(`¿Eliminar a "${guest.fullName}"? Esta acción no se puede deshacer.`)) {
      return
    }
    setRowError("")
    try {
      await api.delete(`/guests/${guest.id}`)
      loadGuests()
    } catch (err) {
      setRowError(err.response?.data?.message ?? "No se pudo eliminar el huésped.")
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
          <h1 className="text-xl font-semibold">Huéspedes</h1>
          <Button size="sm" onClick={() => (showForm ? closeForm() : openCreateForm())}>
            {showForm ? "Cancelar" : "Nuevo huésped"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingId ? "Editar huésped" : "Nuevo huésped"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="photo">Fotografía</Label>
                  <div className="flex items-center gap-3">
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt="Vista previa"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        Sin foto
                      </div>
                    )}
                    <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} disabled={saving} />
                    {form.photoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
                        disabled={saving}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                  {photoError && <p className="text-sm text-destructive">{photoError}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="documentId">Documento</Label>
                  <Input
                    id="documentId"
                    value={form.documentId}
                    onChange={handleChange("documentId")}
                    disabled={saving}
                  />
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
                  <th className="px-4 py-2 font-medium"></th>
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Documento</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Teléfono</th>
                  <th className="px-4 py-2 font-medium">Reservas</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {guest.photoUrl ? (
                        <img
                          src={guest.photoUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted" />
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium">{guest.fullName}</td>
                    <td className="px-4 py-2">{guest.documentId || "-"}</td>
                    <td className="px-4 py-2">{guest.email || "-"}</td>
                    <td className="px-4 py-2">{guest.phone || "-"}</td>
                    <td className="px-4 py-2">{guest._count?.reservations ?? 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditForm(guest)}>
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(guest)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      No hay huéspedes cargados todavía.
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
