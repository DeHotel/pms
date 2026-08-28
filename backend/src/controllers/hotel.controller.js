const prisma = require("../config/prisma");

exports.getCurrent = async (req, res) => {
  if (!req.user.hotelId) {
    return res.status(400).json({ message: "Tu usuario no tiene un hotel asignado" });
  }

  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.user.hotelId } });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel no encontrado" });
    }
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.updateCurrent = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Solo un administrador puede editar la configuración" });
  }

  if (!req.user.hotelId) {
    return res.status(400).json({ message: "Tu usuario no tiene un hotel asignado" });
  }

  const { name, primaryColor, currency } = req.body;

  if (primaryColor && !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    return res.status(400).json({ message: "primaryColor debe ser un color hexadecimal, ej: #2563eb" });
  }

  try {
    const hotel = await prisma.hotel.update({
      where: { id: req.user.hotelId },
      data: {
        name: name || undefined,
        primaryColor: primaryColor || undefined,
        currency: currency || undefined,
      },
    });
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// A partir de acá, endpoints solo para SUPER_ADMIN (ver hotels.routes.js):
// gestión de hoteles a nivel de todo el sistema, no de "mi hotel".

exports.listAll = async (req, res) => {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });
    res.json(hotels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.createHotel = async (req, res) => {
  const { name, primaryColor, currency } = req.body;

  if (!name) {
    return res.status(400).json({ message: "name es obligatorio" });
  }

  if (primaryColor && !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    return res.status(400).json({ message: "primaryColor debe ser un color hexadecimal, ej: #2563eb" });
  }

  try {
    const hotel = await prisma.hotel.create({
      data: {
        name,
        primaryColor: primaryColor || undefined,
        currency: currency || undefined,
      },
    });
    res.status(201).json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
