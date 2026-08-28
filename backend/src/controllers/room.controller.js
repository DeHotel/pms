const prisma = require("../config/prisma");

const VALID_STATUSES = [
  "DISPONIBLE",
  "OCUPADA",
  "LIMPIEZA",
  "MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
];

exports.list = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { hotelId: req.user.hotelId },
      include: { roomType: true },
      orderBy: { number: "asc" },
    });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.create = async (req, res) => {
  const { number, floor, roomTypeId, notes } = req.body;

  if (!number || !roomTypeId) {
    return res.status(400).json({ message: "number y roomTypeId son obligatorios" });
  }

  try {
    const roomType = await prisma.roomType.findFirst({
      where: { id: Number(roomTypeId), hotelId: req.user.hotelId },
    });
    if (!roomType) {
      return res.status(400).json({ message: "roomTypeId inválido" });
    }

    const room = await prisma.room.create({
      data: {
        hotelId: req.user.hotelId,
        number,
        floor,
        roomTypeId: Number(roomTypeId),
        notes,
      },
      include: { roomType: true },
    });
    res.status(201).json(room);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe una habitación con ese número" });
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
    const result = await prisma.room.updateMany({
      where: { id: Number(id), hotelId: req.user.hotelId },
      data: { status },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Habitación no encontrada" });
    }

    const room = await prisma.room.findUnique({
      where: { id: Number(id) },
      include: { roomType: true },
    });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
