const prisma = require("../config/prisma");

const VALID_TYPES = ["EMPRESA", "AGENCIA"];

exports.list = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { hotelId: req.user.hotelId },
      orderBy: { name: "asc" },
      include: { _count: { select: { reservations: true } } },
    });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.create = async (req, res) => {
  const { name, type, email, phone, notes } = req.body;

  if (!name) {
    return res.status(400).json({ message: "name es obligatorio" });
  }

  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `type debe ser uno de: ${VALID_TYPES.join(", ")}` });
  }

  try {
    const company = await prisma.company.create({
      data: { hotelId: req.user.hotelId, name, type: type || undefined, email, phone, notes },
    });
    res.status(201).json(company);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe una compañía/agencia con ese nombre" });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, type, email, phone, notes } = req.body;

  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `type debe ser uno de: ${VALID_TYPES.join(", ")}` });
  }

  try {
    const result = await prisma.company.updateMany({
      where: { id: Number(id), hotelId: req.user.hotelId },
      data: {
        name: name || undefined,
        type: type || undefined,
        email: email !== undefined ? email || null : undefined,
        phone: phone !== undefined ? phone || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Compañía/agencia no encontrada" });
    }

    const company = await prisma.company.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { reservations: true } } },
    });
    res.json(company);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe una compañía/agencia con ese nombre" });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.company.deleteMany({
      where: { id: Number(id), hotelId: req.user.hotelId },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Compañía/agencia no encontrada" });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
