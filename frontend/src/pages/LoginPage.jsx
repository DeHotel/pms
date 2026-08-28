import { useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { setSession, setHotel } from "@/lib/auth"
import { applyHotelTheme } from "@/lib/theme"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Completá usuario y contraseña.")
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      setSession(data.token, data.user)

      try {
        const { data: hotel } = await api.get("/hotel")
        setHotel(hotel)
        applyHotelTheme(hotel)
      } catch {
        // La app sigue funcionando con el color por defecto si esto falla.
      }

      navigate("/")
    } catch (err) {
      setError(
        err.response?.data?.message ?? "No se pudo iniciar sesión. Probá de nuevo."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">PMS Hotel</CardTitle>
          <CardDescription>Ingresá con tu usuario para continuar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Usuario / Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="recepcion@tuhotel.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="mt-2 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
