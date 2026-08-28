const prisma = require("../config/prisma");

const VALID_STATUSES = ["PENDIENTE", "CONFIRMADA", "CHECK_IN", "CHECK_OUT", "CANCELADA"];
const VALID_SOURCES = [
  "TELEFONO",
  "EMAIL",
  "PRESENCIAL",
  "BOOKING",
  "AIRBNB",
  "WHATSAPP",
  "OTRO",
];
const VALID_COMPANY_TYPES = ["EMPRESA", "AGENCIA"];

const includeDetails = {
  room: { include: { roomType: true } },
  guest: true,
  company: true,
};

class ValidationError extends Error {}

// Resuelve el companyId final a partir del body de la reserva, siempre dentro
// del hotel actual (hotelId):
// - companyId: 0/""/null => reserva particular, sin compañía (o se limpia, en edición)
// - companyId: <id> => usa una compañía ya existente DE ESTE HOTEL (si no es de
//   este hotel, se rechaza)
// - company: { name, type, ... } => crea una compañía nueva al vuelo (reutiliza
//   una existente con el mismo nombre EN ESTE HOTEL, para no duplicar)
async function resolveCompanyId({ companyId, company }, currentCompanyId, hotelId) {
  if (companyId !== undefined) {
    if (!companyId) return null;
    const existing = await prisma.company.findFirst({
      where: { id: Number(companyId), hotelId },
    });
    if (!existing) {
      throw new ValidationError("companyId inválido");
    }
    return existing.id;
  }
  if (company?.name) {
    if (company.type && !VALID_COMPANY_TYPES.includes(company.type)) {
      throw new ValidationError(
        `company.type debe ser uno de: ${VALID_COMPANY_TYPES.join(", ")}`
      );
    }
    const existing = await prisma.company.findUnique({
      where: { hotelId_name: { hotelId, name: company.name } },
    });
    if (existing) return existing.id;
    const created = await prisma.company.create({
      data: {
        hotelId,
        name: company.name,
        type: company.type || undefined,
        email: company.email || undefined,
        phone: company.phone || undefined,
      },
    });
    return created.id;
  }
  return currentCompanyId ?? null;
}

exports.list = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { hotelId: req.user.hotelId },
      include: includeDetails,
      orderBy: { checkIn: "asc" },
    });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.create = async (req, res) => {
  const {
    roomId,
    guestId,
    guest,
    checkIn,
    checkOut,
    guestsCount,
    companyId,
    company,
    companion,
    source,
    notes,
  } = req.body;

  const hotelId = req.user.hotelId;

  if (!roomId || !checkIn || !checkOut || (!guestId && !guest?.fullName)) {
    return res.status(400).json({
      message: "roomId, checkIn, checkOut y un huésped (existente o nuevo) son obligatorios",
    });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return res.status(400).json({ message: "Fechas inválidas" });
  }

  if (checkInDate >= checkOutDate) {
    return res
      .status(400)
      .json({ message: "La fecha de check-out debe ser posterior a la de check-in" });
  }

  if (source && !VALID_SOURCES.includes(source)) {
    return res.status(400).json({ message: `source debe ser uno de: ${VALID_SOURCES.join(", ")}` });
  }

  try {
    const room = await prisma.room.findFirst({ where: { id: Number(roomId), hotelId } });
    if (!room) {
      return res.status(400).json({ message: "roomId inválido" });
    }

    let finalGuestId = null;
    if (guestId) {
      const existingGuest = await prisma.guest.findFirst({
        where: { id: Number(guestId), hotelId },
      });
      if (!existingGuest) {
        return res.status(400).json({ message: "guestId inválido" });
      }
      finalGuestId = existingGuest.id;
    } else {
      const newGuest = await prisma.guest.create({
        data: {
          hotelId,
          fullName: guest.fullName,
          email: guest.email || undefined,
          phone: guest.phone || undefined,
          documentId: guest.documentId || undefined,
        },
      });
      finalGuestId = newGuest.id;
    }

    const finalCompanyId = await resolveCompanyId({ companyId, company }, null, hotelId);

    const overlapping = await prisma.reservation.findFirst({
      where: {
        hotelId,
        roomId: Number(roomId),
        status: { not: "CANCELADA" },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    if (overlapping) {
      return res
        .status(409)
        .json({ message: "La habitación ya está reservada en esas fechas" });
    }

    const reservation = await prisma.reservation.create({
      data: {
        hotelId,
        roomId: Number(roomId),
        guestId: finalGuestId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guestsCount: guestsCount ? Number(guestsCount) : 1,
        companyId: finalCompanyId,
        companion: companion || undefined,
        source: source || undefined,
        notes: notes || undefined,
      },
      include: includeDetails,
    });

    res.status(201).json(reservation);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    roomId,
    guestId,
    guest,
    checkIn,
    checkOut,
    guestsCount,
    companyId,
    company,
    companion,
    source,
    status,
    notes,
  } = req.body;

  const hotelId = req.user.hotelId;

  try {
    const existing = await prisma.reservation.findFirst({
      where: { id: Number(id), hotelId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    let nextRoomId = existing.roomId;
    if (roomId) {
      const room = await prisma.room.findFirst({ where: { id: Number(roomId), hotelId } });
      if (!room) {
        return res.status(400).json({ message: "roomId inválido" });
      }
      nextRoomId = room.id;
    }

    const nextCheckIn = checkIn ? new Date(checkIn) : existing.checkIn;
    const nextCheckOut = checkOut ? new Date(checkOut) : existing.checkOut;

    if (nextCheckIn >= nextCheckOut) {
      return res
        .status(400)
        .json({ message: "La fecha de check-out debe ser posterior a la de check-in" });
    }

    if (source && !VALID_SOURCES.includes(source)) {
      return res
        .status(400)
        .json({ message: `source debe ser uno de: ${VALID_SOURCES.join(", ")}` });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ message: `status debe ser uno de: ${VALID_STATUSES.join(", ")}` });
    }

    let finalGuestId = existing.guestId;
    if (guestId) {
      const existingGuest = await prisma.guest.findFirst({
        where: { id: Number(guestId), hotelId },
      });
      if (!existingGuest) {
        return res.status(400).json({ message: "guestId inválido" });
      }
      finalGuestId = existingGuest.id;
    } else if (guest?.fullName) {
      const newGuest = await prisma.guest.create({
        data: {
          hotelId,
          fullName: guest.fullName,
          email: guest.email || undefined,
          phone: guest.phone || undefined,
          documentId: guest.documentId || undefined,
        },
      });
      finalGuestId = newGuest.id;
    }

    const finalCompanyId = await resolveCompanyId(
      { companyId, company },
      existing.companyId,
      hotelId
    );

    const overlapping = await prisma.reservation.findFirst({
      where: {
        id: { not: Number(id) },
        hotelId,
        roomId: nextRoomId,
        status: { not: "CANCELADA" },
        checkIn: { lt: nextCheckOut },
        checkOut: { gt: nextCheckIn },
      },
    });

    if (overlapping) {
      return res
        .status(409)
        .json({ message: "La habitación ya está reservada en esas fechas" });
    }

    const reservation = await prisma.reservation.update({
      where: { id: Number(id) },
      data: {
        roomId: nextRoomId,
        guestId: finalGuestId,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        guestsCount: guestsCount != null ? Number(guestsCount) : undefined,
        companyId: finalCompanyId,
        companion: companion !== undefined ? companion || null : undefined,
        source: source || undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes || null : undefined,
      },
      include: includeDetails,
    });

    res.json(reservation);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ message: `status debe ser uno de: ${VALID_STATUSES.join(", ")}` });
  }

  try {
    const result = await prisma.reservation.updateMany({
      where: { id: Number(id), hotelId: req.user.hotelId },
      data: { status },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(id) },
      include: includeDetails,
    });
    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
