import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ReservationFormModal from "@/components/ReservationFormModal"
import { getHotelName } from "@/lib/auth"

const NUM_DAYS = 14

// Cada estado tiene un color base para el cuerpo de la barra y un "edge" más
// resaltado (mismo tono, más saturado) para marcar los extremos de llegada y
// salida — pensado para más adelante poder colgar ahí una acción directa
// (check-in / check-out).
const STATUS_STYLES = {
  PENDIENTE: { base: "bg-yellow-200 border-yellow-400 text-yellow-900", edge: "bg-yellow-500" },
  CONFIRMADA: { base: "bg-blue-200 border-blue-400 text-blue-900", edge: "bg-blue-500" },
  CHECK_IN: { base: "bg-green-200 border-green-400 text-green-900", edge: "bg-green-500" },
  CHECK_OUT: { base: "bg-gray-200 border-gray-400 text-gray-700", edge: "bg-gray-500" },
  CANCELADA: { base: "bg-red-200 border-red-400 text-red-900", edge: "bg-red-500" },
}
const DEFAULT_STATUS_STYLE = { base: "bg-gray-200 border-gray-400 text-gray-700", edge: "bg-gray-500" }

// Marca visual del tipo de reserva dentro de la barra: empresa o agencia
// (según el campo explícito "clientType"), grupo (más de un huésped
// particular) o particular individual.
function reservationKind(res) {
  if (res.company?.type === "EMPRESA") return "company"
  if (res.company?.type === "AGENCIA") return "agency"
  if (res.guestsCount > 1) return "group"
  return "individual"
}

function KindIcon({ kind, className }) {
  if (kind === "company") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    )
  }
  if (kind === "agency") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    )
  }
  if (kind === "group") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function startOfToday() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

function addDays(date, days) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

function diffInDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24))
}

function formatDayLabel(date) {
  const label = date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Parsea un "YYYY-MM-DD" (valor de <input type="date">) como medianoche UTC,
// igual que como Prisma/JS interpretan las fechas de check-in/check-out.
function parseISODateUTC(value) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(startOfToday)
  const [rooms, setRooms] = useState([])
  const [guests, setGuests] = useState([])
  const [companies, setCompanies] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalState, setModalState] = useState(null)

  const days = useMemo(
    () => Array.from({ length: NUM_DAYS }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )
  const windowEnd = addDays(weekStart, NUM_DAYS)

  function loadAll() {
    setLoading(true)
    Promise.all([
      api.get("/rooms"),
      api.get("/reservations"),
      api.get("/guests"),
      api.get("/companies"),
    ])
      .then(([roomsRes, reservationsRes, guestsRes, companiesRes]) => {
        setRooms(roomsRes.data)
        setReservations(reservationsRes.data)
        setGuests(guestsRes.data)
        setCompanies(companiesRes.data)
      })
      .catch(() => setError("No se pudo cargar el calendario."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSaved() {
    setModalState(null)
    loadAll()
  }

  function handleDatePick(e) {
    const value = e.target.value
    if (!value) return
    setWeekStart(parseISODateUTC(value))
  }

  function reservationsForRoom(roomId) {
    return reservations.filter((r) => {
      if (r.roomId !== roomId) return false
      if (r.status === "CANCELADA") return false
      return new Date(r.checkIn) < windowEnd && new Date(r.checkOut) > weekStart
    })
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <span className="font-semibold">{getHotelName()}</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/reservas">Ver lista</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Calendario de reservas</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart((d) => addDays(d, -7))}>
              ← Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfToday())}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart((d) => addDays(d, 7))}>
              Siguiente →
            </Button>
            <Input
              type="date"
              value={toISODate(weekStart)}
              onChange={handleDatePick}
              className="w-auto"
              aria-label="Ir a una fecha específica"
            />
          </div>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Click en una celda vacía para crear una reserva, o en una reserva existente para
          editarla.
        </p>

        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <div style={{ minWidth: `${140 + NUM_DAYS * 90}px` }}>
              <div
                className="grid border-b bg-muted/50 text-xs font-medium"
                style={{ gridTemplateColumns: `140px repeat(${NUM_DAYS}, 1fr)` }}
              >
                <div className="px-2 py-2">Habitación</div>
                {days.map((day) => (
                  <div key={day.toISOString()} className="border-l px-1 py-2 text-center">
                    {formatDayLabel(day)}
                  </div>
                ))}
              </div>

              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="grid border-b last:border-0"
                  style={{ gridTemplateColumns: `140px repeat(${NUM_DAYS}, 1fr)` }}
                >
                  <div className="flex flex-col justify-center border-r px-2 py-2 text-sm">
                    <span className="font-medium">{room.number}</span>
                    <span className="text-xs text-muted-foreground">{room.roomType.name}</span>
                  </div>

                  <div
                    className="relative grid"
                    style={{
                      gridColumn: `2 / span ${NUM_DAYS}`,
                      gridTemplateColumns: `repeat(${NUM_DAYS * 2}, 1fr)`,
                    }}
                  >
                    {days.map((day, i) => (
                      <button
                        key={day.toISOString()}
                        type="button"
                        className="h-10 border-l hover:bg-accent"
                        style={{ gridColumn: `${i * 2 + 1} / ${i * 2 + 3}`, gridRow: 1 }}
                        onClick={() =>
                          setModalState({
                            mode: "create",
                            defaults: {
                              roomId: room.id,
                              checkIn: toISODate(day),
                              checkOut: toISODate(addDays(day, 1)),
                            },
                          })
                        }
                      />
                    ))}

                    {reservationsForRoom(room.id).map((res) => {
                      const checkInDate = new Date(res.checkIn)
                      const checkOutDate = new Date(res.checkOut)
                      const clippedStart = checkInDate < weekStart
                      const clippedEnd = checkOutDate > windowEnd
                      const visibleStart = clippedStart ? weekStart : checkInDate
                      const visibleEnd = clippedEnd ? windowEnd : checkOutDate
                      const startIdx = diffInDays(weekStart, visibleStart)
                      const endIdx = diffInDays(weekStart, visibleEnd)
                      // La barra arranca a mitad del día de llegada y termina a mitad
                      // del día de salida (así se ve que la habitación queda libre esa
                      // tarde/mañana), salvo que la reserva quede recortada por la
                      // ventana visible, en cuyo caso llega hasta el borde.
                      const startLine = clippedStart ? startIdx * 2 + 1 : startIdx * 2 + 2
                      const endLine = clippedEnd ? endIdx * 2 + 1 : endIdx * 2 + 2
                      const style = STATUS_STYLES[res.status] ?? DEFAULT_STATUS_STYLE
                      const kind = reservationKind(res)

                      return (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => setModalState({ mode: "edit", reservation: res })}
                          className={`z-10 m-0.5 flex items-stretch overflow-hidden rounded border text-xs font-medium ${style.base}`}
                          style={{ gridColumn: `${startLine} / ${endLine}`, gridRow: 1 }}
                          title={`${res.guest.fullName} · ${res.status}`}
                        >
                          {!clippedStart && (
                            <span className={`w-1.5 shrink-0 ${style.edge}`} aria-hidden="true" />
                          )}
                          <span className="flex min-w-0 flex-1 items-center gap-1 truncate px-1">
                            <KindIcon kind={kind} className="h-3 w-3 shrink-0 opacity-70" />
                            {res.guest.photoUrl && (
                              <img
                                src={res.guest.photoUrl}
                                alt=""
                                className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
                              />
                            )}
                            <span className="truncate">{res.guest.fullName}</span>
                          </span>
                          {!clippedEnd && (
                            <span className={`w-1.5 shrink-0 ${style.edge}`} aria-hidden="true" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {rooms.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  No hay habitaciones cargadas todavía.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {modalState && (
        <ReservationFormModal
          rooms={rooms}
          guests={guests}
          companies={companies}
          reservation={modalState.mode === "edit" ? modalState.reservation : null}
          defaults={modalState.mode === "create" ? modalState.defaults : undefined}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
