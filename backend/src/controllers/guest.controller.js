const prisma = require("../config/prisma");

exports.list = async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      where: { hotelId: req.user.hotelId },
      orderBy: { fullName: "asc" },
      include: { _count: { select: { reservations: true } } },
    });
    res.json(guests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.create = async (req, res) => {
  const { fullName, email, phone, documentId, notes, photoUrl } = req.body;

  if (!fullName) {
    return res.status(400).json({ message: "fullName es obligatorio" });
  }

  try {
    const guest = await prisma.guest.create({
      data: { hotelId: req.user.hotelId, fullName, email, phone, documentId, notes, photoUrl },
    });
    res.status(201).json(guest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, documentId, notes, photoUrl } = req.body;

  try {
    const result = await prisma.guest.updateMany({
      where: { id: Number(id), hotelId: req.user.hotelId },
      data: {
        fullName: fullName || undefined,
        email: email !== undefined ? email || null : undefined,
        phone: phone !== undefined ? phone || null : undefined,
        documentId: documentId !== undefined ? documentId || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
        photoUrl: photoUrl !== undefined ? photoUrl || null : undefined,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Huésped no encontrado" });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { reservations: true } } },
    });
    res.json(guest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.guest.deleteMany({
      where: { id: Number(id), hotelId: req.user.hotelId },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Huésped no encontrado" });
    }
    res.status(204).end();
  } catch (err) {
    if (err.code === "P2003" || err.code === "P2014") {
      return res
        .status(409)
        .json({ message: "No se puede eliminar: el huésped tiene reservas asociadas" });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
