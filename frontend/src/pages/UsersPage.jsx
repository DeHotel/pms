import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import api from "@/lib/api"
import { getUser, getHotelName } from "@/lib/auth"
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
import { resizeImageFile } from "@/lib/image"

const SELECT_CLASS =
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"

const HOTEL_ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "RECEPCION", label: "Recepción" },
  { value: "HOUSEKEEPING", label: "Housekeeping" },
]

const SUPER_ADMIN_ROLE_OPTION = { value: "SUPER_ADMIN", label: "Super administrador" }

const EMPTY_FORM = {
  email: "",
  password: "",
  name: "",
  role: "RECEPCION",
  active: true,
  hotelId: "",
  photoUrl: "",
}

function userToForm(user) {
  return {
    email: user.email || "",
    password: "",
    name: user.name || "",
    role: user.role || "RECEPCION",
    active: user.active !== false,
    hotelId: user.hotel?.id ? String(user.hotel.id) : "",
    photoUrl: user.photoUrl || "",
  }
}

export default function UsersPage() {
  const currentUser = getUser()
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN"
  const roleOptions = isSuperAdmin ? [...HOTEL_ROLE_OPTIONS, SUPER_ADMIN_ROLE_OPTION] : HOTEL_ROLE_OPTIONS

  function roleLabel(value) {
    return roleOptions.find((opt) => opt.value === value)?.label ?? value
  }

  const [users, setUsers] = useState([])
  const [hotels, setHotels] = useState([])
  const [hotelFilter, setHotelFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [rowError, setRowError] = useState("")
  const [photoError, setPhotoError] = useState("")

  function loadUsers(hotelId) {
    setLoading(true)
    api
      .get("/users", { params: hotelId ? { hotelId } : undefined })
      .then(({ data }) => setUsers(data))
      .catch(() => setError("No se pudieron cargar los usuarios."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers(hotelFilter)
  }, [hotelFilter])

  useEffect(() => {
    if (!isSuperAdmin) return
    api
      .get("/hotels")
      .then(({ data }) => setHotels(data))
      .catch(() => {
        // El selector de hotel queda vacío; se puede reintentar recargando la página.
      })
  }, [isSuperAdmin])

  function handleChange(field) {
    return (event) => {
      const value = field === "active" ? event.target.checked : event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }
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

  function openEditForm(user) {
    setEditingId(user.id)
    setForm(userToForm(user))
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

    if (!form.email || !form.name) {
      setFormError("Email y nombre son obligatorios.")
      return
    }

    if (!editingId && !form.password) {
      setFormError("La contraseña es obligatoria para un usuario nuevo.")
      return
    }

    if (form.password && form.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    const needsHotel = isSuperAdmin && form.role !== "SUPER_ADMIN"
    if (needsHotel && !form.hotelId) {
      setFormError("Elegí a qué hotel pertenece este usuario.")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const payload = {
          email: form.email,
          name: form.name,
          role: form.role,
          active: form.active,
          photoUrl: form.photoUrl || undefined,
        }
        if (form.password) payload.password = form.password
        if (needsHotel) payload.hotelId = Number(form.hotelId)
        await api.patch(`/users/${editingId}`, payload)
      } else {
        const payload = {
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          photoUrl: form.photoUrl || undefined,
        }
        if (needsHotel) payload.hotelId = Number(form.hotelId)
        await api.post("/users", payload)
      }
      closeForm()
      loadUsers(hotelFilter)
    } catch (err) {
      setFormError(err.response?.data?.message ?? "No se pudo guardar el usuario.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`¿Eliminar a "${user.name}"? Esta acción no se puede deshacer.`)) return

    setRowError("")
    try {
      await api.delete(`/users/${user.id}`)
      loadUsers(hotelFilter)
    } catch (err) {
      setRowError(err.response?.data?.message ?? "No se pudo eliminar el usuario.")
    }
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <span className="font-semibold">{isSuperAdmin ? "Panel general" : getHotelName()}</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Volver</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <select
                value={hotelFilter}
                onChange={(event) => setHotelFilter(event.target.value)}
                className={SELECT_CLASS + " w-auto"}
              >
                <option value="">Todos los hoteles</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
            <Button size="sm" onClick={() => (showForm ? closeForm() : openCreateForm())}>
              {showForm ? "Cancelar" : "Nuevo usuario"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingId ? "Editar usuario" : "Nuevo usuario"}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={handleChange("role")}
                    disabled={saving}
                    className={SELECT_CLASS}
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {isSuperAdmin && form.role !== "SUPER_ADMIN" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hotelId">Hotel</Label>
                    <select
                      id="hotelId"
                      value={form.hotelId}
                      onChange={handleChange("hotelId")}
                      disabled={saving}
                      className={SELECT_CLASS}
                    >
                      <option value="">Elegir hotel...</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">
                    {editingId ? "Nueva contraseña" : "Contraseña"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    disabled={saving}
                    placeholder={editingId ? "Dejar en blanco para no cambiarla" : ""}
                  />
                </div>
                {editingId && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input
                      id="active"
                      type="checkbox"
                      checked={form.active}
                      onChange={handleChange("active")}
                      disabled={saving}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="active" className="cursor-pointer">
                      Usuario activo (puede iniciar sesión)
                    </Label>
                  </div>
                )}
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
                  <th className="px-4 py-2 font-medium">Email</th>
                  {isSuperAdmin && <th className="px-4 py-2 font-medium">Hotel</th>}
                  <th className="px-4 py-2 font-medium">Rol</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {u.photoUrl ? (
                        <img
                          src={u.photoUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted" />
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{u.email}</td>
                    {isSuperAdmin && (
                      <td className="px-4 py-2">{u.hotel?.name || "—"}</td>
                    )}
                    <td className="px-4 py-2">{roleLabel(u.role)}</td>
                    <td className="px-4 py-2">
                      {u.active ? (
                        <span className="text-green-700">Activo</span>
                      ) : (
                        <span className="text-muted-foreground">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditForm(u)}>
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === currentUser?.id}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={isSuperAdmin ? 7 : 6}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No hay usuarios cargados todavía.
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
