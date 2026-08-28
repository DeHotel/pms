import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import api from "@/lib/api"
import { getHotel, getHotelName } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import ReservationFormModal, {
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
} from "@/components/ReservationFormModal"

const STATUS_STYLES = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADA: "bg-blue-100 text-blue-800",
  CHECK_IN: "bg-green-100 text-green-800",
  CHECK_OUT: "bg-gray-200 text-gray-700",
  CANCELADA: "bg-red-100 text-red-800",
}

function currency(value) {
  const currencyCode = getHotel()?.currency || "ARS"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("es-AR", { timeZone: "UTC" })
}

function nightsBetween(checkIn, checkOut) {
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function sourceLabel(value) {
  return SOURCE_OPTIONS.find((opt) => opt.value === value)?.label ?? value
}

function clientTypeLabel(res) {
  if (!res.company) return "Particular"
  const kind = res.company.type === "AGENCIA" ? "Agencia" : "Empresa"
  return `${kind} · ${res.company.name}`
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [rooms, setRooms] = useState([])
  const [guests, setGuests] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState(null)
  const [modalState, setModalState] = useState(null)

  function loadReservations() {
    setLoading(true)
    api
      .get("/reservations")
      .then(({ data }) => setReservations(data))
      .catch(() => setError("No se pudieron cargar las reservas."))
      .finally(() => setLoading(false))
  }

  function loadAux() {
    api.get("/rooms").then(({ data }) => setRooms(data)).catch(() => {})
    api.get("/guests").then(({ data }) => setGuests(data)).catch(() => {})
    api.get("/companies").then(({ data }) => setCompanies(data)).catch(() => {})
  }

  useEffect(() => {
    loadReservations()
    loadAux()
  }, [])

  async function handleStatusChange(reservation, status) {
    setUpdatingId(reservation.id)
    try {
      const { data } = await api.patch(`/reservations/${reservation.id}/status`, { status })
      setReservations((prev) => prev.map((r) => (r.id === reservation.id ? data : r)))
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  function handleSaved() {
    setModalState(null)
    loadReservations()
    loadAux()
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <span className="font-semibold">{getHotelName()}</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Volver</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Reservas</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/calendario">Ver calendario</Link>
            </Button>
            <Button size="sm" onClick={() => setModalState({ mode: "create" })}>
              Nueva reserva
            </Button>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Huésped</th>
                  <th className="px-4 py-2 font-medium">Habitación</th>
                  <th className="px-4 py-2 font-medium">Check-in</th>
                  <th className="px-4 py-2 font-medium">Check-out</th>
                  <th className="px-4 py-2 font-medium">Noches</th>
                  <th className="px-4 py-2 font-medium">Total est.</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Origen</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => {
                  const nights = nightsBetween(res.checkIn, res.checkOut)
                  return (
                    <tr key={res.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{res.guest.fullName}</td>
                      <td className="px-4 py-2">
                        {res.room.number} · {res.room.roomType.name}
                      </td>
                      <td className="px-4 py-2">{formatDate(res.checkIn)}</td>
                      <td className="px-4 py-2">{formatDate(res.checkOut)}</td>
                      <td className="px-4 py-2">{nights}</td>
                      <td className="px-4 py-2">
                        {currency(nights * Number(res.room.roomType.basePrice))}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {clientTypeLabel(res)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {sourceLabel(res.source)}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={res.status}
                          onChange={(event) => handleStatusChange(res, event.target.value)}
                          disabled={updatingId === res.id}
                          className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[res.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalState({ mode: "edit", reservation: res })}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">
                      No hay reservas cargadas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {modalState && (
        <ReservationFormModal
          rooms={rooms}
          guests={guests}
          companies={companies}
          reservation={modalState.mode === "edit" ? modalState.reservation : null}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
