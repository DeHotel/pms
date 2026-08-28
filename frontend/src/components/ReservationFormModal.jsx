import { useState } from "react"

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

export const SELECT_CLASS =
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"

export const SOURCE_OPTIONS = [
  { value: "TELEFONO", label: "Teléfono" },
  { value: "EMAIL", label: "Email" },
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "BOOKING", label: "Booking.com" },
  { value: "AIRBNB", label: "Airbnb" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OTRO", label: "Otro" },
]

export const COMPANY_TYPE_OPTIONS = [
  { value: "EMPRESA", label: "Empresa" },
  { value: "AGENCIA", label: "Agencia" },
]

export const STATUS_OPTIONS = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "CHECK_IN", label: "Check-in" },
  { value: "CHECK_OUT", label: "Check-out" },
  { value: "CANCELADA", label: "Cancelada" },
]

// Valor especial del <select> de compañía para "estoy cargando una nueva".
const NEW_COMPANY_VALUE = "__new__"

function toInputDate(value) {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

function buildInitialForm(reservation, defaults) {
  if (reservation) {
    return {
      roomId: String(reservation.roomId),
      guestId: String(reservation.guestId),
      newGuestName: "",
      newGuestEmail: "",
      newGuestPhone: "",
      checkIn: toInputDate(reservation.checkIn),
      checkOut: toInputDate(reservation.checkOut),
      guestsCount: String(reservation.guestsCount ?? 1),
      companyId: reservation.companyId ? String(reservation.companyId) : "",
      newCompanyName: "",
      newCompanyType: "EMPRESA",
      newCompanyEmail: "",
      newCompanyPhone: "",
      companion: reservation.companion || "",
      source: reservation.source || "OTRO",
      status: reservation.status || "PENDIENTE",
      notes: reservation.notes || "",
    }
  }

  const d = defaults || {}
  return {
    roomId: d.roomId ? String(d.roomId) : "",
    guestId: "",
    newGuestName: "",
    newGuestEmail: "",
    newGuestPhone: "",
    checkIn: d.checkIn ? toInputDate(d.checkIn) : "",
    checkOut: d.checkOut ? toInputDate(d.checkOut) : "",
    guestsCount: "1",
    companyId: "",
    newCompanyName: "",
    newCompanyType: "EMPRESA",
    newCompanyEmail: "",
    newCompanyPhone: "",
    companion: "",
    source: "OTRO",
    status: "PENDIENTE",
    notes: "",
  }
}

export default function ReservationFormModal({
  rooms,
  guests,
  companies = [],
  reservation, // null = crear, objeto = editar
  defaults, // { roomId, checkIn, checkOut } para prefill al crear desde el calendario
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(reservation)
  const [form, setForm] = useState(() => buildInitialForm(reservation, defaults))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const usingNewCompany = form.companyId === NEW_COMPANY_VALUE

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    const usingNewGuest = !form.guestId
    if (
      !form.roomId ||
      !form.checkIn ||
      !form.checkOut ||
      (!isEdit && usingNewGuest && !form.newGuestName) ||
      (usingNewCompany && !form.newCompanyName)
    ) {
      setError("Habitación, fechas, huésped (y el nombre de la compañía/agencia, si corresponde) son obligatorios.")
      return
    }

    const payload = {
      roomId: Number(form.roomId),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guestsCount: Number(form.guestsCount) || 1,
      companion: form.companion || undefined,
      source: form.source,
      notes: form.notes || undefined,
    }

    if (usingNewCompany) {
      payload.company = {
        name: form.newCompanyName,
        type: form.newCompanyType,
        email: form.newCompanyEmail || undefined,
        phone: form.newCompanyPhone || undefined,
      }
    } else {
      payload.companyId = form.companyId
    }

    if (form.guestId) {
      payload.guestId = Number(form.guestId)
    } else if (!isEdit && form.newGuestName) {
      payload.guest = {
        fullName: form.newGuestName,
        email: form.newGuestEmail || undefined,
        phone: form.newGuestPhone || undefined,
      }
    }

    if (isEdit) {
      payload.status = form.status
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/reservations/${reservation.id}`, payload)
      } else {
        await api.post("/reservations", payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message ?? "No se pudo guardar la reserva.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base">
              {isEdit ? "Editar reserva" : "Nueva reserva"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="roomId">Habitación</Label>
              <select
                id="roomId"
                value={form.roomId}
                onChange={handleChange("roomId")}
                disabled={saving}
                required
                className={SELECT_CLASS}
              >
                <option value="">Seleccioná una habitación</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.number} · {room.roomType.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="guestsCount">Cantidad de huéspedes</Label>
              <Input
                id="guestsCount"
                type="number"
                min="1"
                value={form.guestsCount}
                onChange={handleChange("guestsCount")}
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                value={form.checkIn}
                onChange={handleChange("checkIn")}
                disabled={saving}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                type="date"
                value={form.checkOut}
                onChange={handleChange("checkOut")}
                disabled={saving}
                required
              />
            </div>

            {isEdit ? (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Huésped</Label>
                <p className="text-sm text-muted-foreground">
                  {reservation.guest.fullName} — para cambiar el huésped, cancelá esta
                  reserva y creá una nueva.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="guestId">Huésped</Label>
                <select
                  id="guestId"
                  value={form.guestId}
                  onChange={handleChange("guestId")}
                  disabled={saving}
                  className={SELECT_CLASS}
                >
                  <option value="">— Nuevo huésped —</option>
                  {guests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isEdit && !form.guestId && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newGuestName">Nombre del huésped</Label>
                  <Input
                    id="newGuestName"
                    value={form.newGuestName}
                    onChange={handleChange("newGuestName")}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newGuestEmail">Email (opcional)</Label>
                  <Input
                    id="newGuestEmail"
                    type="email"
                    value={form.newGuestEmail}
                    onChange={handleChange("newGuestEmail")}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newGuestPhone">Teléfono (opcional)</Label>
                  <Input
                    id="newGuestPhone"
                    value={form.newGuestPhone}
                    onChange={handleChange("newGuestPhone")}
                    disabled={saving}
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="companyId">Compañía / agencia</Label>
              <select
                id="companyId"
                value={form.companyId}
                onChange={handleChange("companyId")}
                disabled={saving}
                className={SELECT_CLASS}
              >
                <option value="">— Particular (sin compañía) —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === "AGENCIA" ? "Agencia" : "Empresa"})
                  </option>
                ))}
                <option value={NEW_COMPANY_VALUE}>— Nueva compañía/agencia —</option>
              </select>
            </div>

            {usingNewCompany && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newCompanyName">Nombre</Label>
                  <Input
                    id="newCompanyName"
                    value={form.newCompanyName}
                    onChange={handleChange("newCompanyName")}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newCompanyType">Tipo</Label>
                  <select
                    id="newCompanyType"
                    value={form.newCompanyType}
                    onChange={handleChange("newCompanyType")}
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
                  <Label htmlFor="newCompanyEmail">Email (opcional)</Label>
                  <Input
                    id="newCompanyEmail"
                    type="email"
                    value={form.newCompanyEmail}
                    onChange={handleChange("newCompanyEmail")}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newCompanyPhone">Teléfono (opcional)</Label>
                  <Input
                    id="newCompanyPhone"
                    value={form.newCompanyPhone}
                    onChange={handleChange("newCompanyPhone")}
                    disabled={saving}
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="companion">Acompañante</Label>
              <Input
                id="companion"
                value={form.companion}
                onChange={handleChange("companion")}
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="source">Origen de la reserva</Label>
              <select
                id="source"
                value={form.source}
                onChange={handleChange("source")}
                disabled={saving}
                className={SELECT_CLASS}
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={handleChange("status")}
                  disabled={saving}
                  className={SELECT_CLASS}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={handleChange("notes")}
                disabled={saving}
              />
            </div>

            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
