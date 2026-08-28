const prisma = require("../config/prisma");

exports.list = async (req, res) => {
  try {
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId: req.user.hotelId },
      orderBy: { name: "asc" },
    });
    res.json(roomTypes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.create = async (req, res) => {
  const { name, description, basePrice, capacity } = req.body;

  if (!name || basePrice == null) {
    return res.status(400).json({ message: "name y basePrice son obligatorios" });
  }

  try {
    const roomType = await prisma.roomType.create({
      data: {
        hotelId: req.user.hotelId,
        name,
        description,
        basePrice,
        capacity: capacity ?? 1,
      },
    });
    res.status(201).json(roomType);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un tipo de habitación con ese nombre" });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
