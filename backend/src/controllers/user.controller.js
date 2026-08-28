const bcrypt = require("bcryptjs");

const prisma = require("../config/prisma");

const HOTEL_ROLES = ["ADMIN", "RECEPCION", "HOUSEKEEPING"];
const ALL_ROLES = [...HOTEL_ROLES, "SUPER_ADMIN"];

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  photoUrl: true,
  createdAt: true,
  hotel: { select: { id: true, name: true } },
};

function isSuperAdmin(user) {
  return user.role === "SUPER_ADMIN";
}

async function countOtherActiveAdmins(hotelId, excludeId) {
  return prisma.user.count({
    where: { hotelId, role: "ADMIN", active: true, NOT: { id: excludeId } },
  });
}

async function countOtherActiveSuperAdmins(excludeId) {
  return prisma.user.count({
    where: { role: "SUPER_ADMIN", active: true, NOT: { id: excludeId } },
  });
}

exports.list = async (req, res) => {
  try {
    const where = isSuperAdmin(req.user) ? {} : { hotelId: req.user.hotelId };

    if (isSuperAdmin(req.user) && req.query.hotelId) {
      where.hotelId = Number(req.query.hotelId);
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ hotelId: "asc" }, { name: "asc" }],
      select: SAFE_SELECT,
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.create = async (req, res) => {
  const { email, password, name, photoUrl } = req.body;
  const role = req.body.role || "RECEPCION";
  const actorIsSuperAdmin = isSuperAdmin(req.user);

  if (!email || !password || !name) {
    return res.status(400).json({ message: "email, password y name son obligatorios" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  if (!ALL_ROLES.includes(role)) {
    return res.status(400).json({ message: `role debe ser uno de: ${ALL_ROLES.join(", ")}` });
  }

  if (role === "SUPER_ADMIN" && !actorIsSuperAdmin) {
    return res
      .status(403)
      .json({ message: "Solo un super administrador puede crear otro super administrador" });
  }

  let hotelId = null;

  if (role !== "SUPER_ADMIN") {
    hotelId = actorIsSuperAdmin ? Number(req.body.hotelId) || null : req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({ message: "hotelId es obligatorio para un usuario de hotel" });
    }
  }

  try {
    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
      if (!hotel) {
        return res.status(400).json({ message: "El hotel indicado no existe" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { hotelId, email, passwordHash, name, role, photoUrl: photoUrl || null },
      select: SAFE_SELECT,
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un usuario con ese email" });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);
  const { email, password, name, role, active, photoUrl } = req.body;
  const actorIsSuperAdmin = isSuperAdmin(req.user);

  if (role && !ALL_ROLES.includes(role)) {
    return res.status(400).json({ message: `role debe ser uno de: ${ALL_ROLES.join(", ")}` });
  }

  if (role === "SUPER_ADMIN" && !actorIsSuperAdmin) {
    return res
      .status(403)
      .json({ message: "Solo un super administrador puede otorgar ese rol" });
  }

  if (password && password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const scopeWhere = actorIsSuperAdmin
      ? { id: userId }
      : { id: userId, hotelId: req.user.hotelId };
    const current = await prisma.user.findFirst({ where: scopeWhere });

    if (!current) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const willLoseHotelAdmin =
      current.role === "ADMIN" &&
      current.active &&
      ((role && role !== "ADMIN") || active === false);

    if (willLoseHotelAdmin) {
      const others = await countOtherActiveAdmins(current.hotelId, userId);
      if (others === 0) {
        return res
          .status(400)
          .json({ message: "No se puede quitar el último administrador activo del hotel" });
      }
    }

    const willLoseSuperAdmin =
      current.role === "SUPER_ADMIN" &&
      current.active &&
      ((role && role !== "SUPER_ADMIN") || active === false);

    if (willLoseSuperAdmin) {
      const others = await countOtherActiveSuperAdmins(userId);
      if (others === 0) {
        return res
          .status(400)
          .json({ message: "No se puede quitar el último super administrador activo" });
      }
    }

    // hotelId: solo un SUPER_ADMIN puede fijarlo/cambiarlo explícitamente (por ejemplo,
    // al convertir a un usuario que era SUPER_ADMIN en ADMIN/RECEPCION/HOUSEKEEPING de un
    // hotel puntual, o al mover a alguien de un hotel a otro). Si el rol resultante es
    // SUPER_ADMIN, el hotel siempre queda en null. Si no se manda hotelId y el usuario ya
    // tenía uno, se deja como estaba.
    const nextRole = role || current.role;
    let hotelId;

    if (nextRole === "SUPER_ADMIN") {
      hotelId = null;
    } else if (actorIsSuperAdmin && req.body.hotelId !== undefined) {
      const candidateHotelId = Number(req.body.hotelId);
      if (!candidateHotelId) {
        return res.status(400).json({ message: "hotelId es obligatorio para un usuario de hotel" });
      }
      const hotel = await prisma.hotel.findUnique({ where: { id: candidateHotelId } });
      if (!hotel) {
        return res.status(400).json({ message: "El hotel indicado no existe" });
      }
      hotelId = candidateHotelId;
    } else if (!current.hotelId) {
      return res.status(400).json({ message: "Elegí a qué hotel pertenece este usuario" });
    }
    // si ninguna de las anteriores aplicó, hotelId queda undefined y no se toca

    const data = {
      email: email || undefined,
      name: name || undefined,
      role: role || undefined,
      active: typeof active === "boolean" ? active : undefined,
      photoUrl: photoUrl !== undefined ? photoUrl || null : undefined,
      hotelId,
    };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({ where: { id: userId }, data });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_SELECT });
    res.json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un usuario con ese email" });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);
  const actorIsSuperAdmin = isSuperAdmin(req.user);

  if (userId === req.user.sub) {
    return res.status(400).json({ message: "No podés eliminar tu propio usuario" });
  }

  try {
    const scopeWhere = actorIsSuperAdmin
      ? { id: userId }
      : { id: userId, hotelId: req.user.hotelId };
    const current = await prisma.user.findFirst({ where: scopeWhere });

    if (!current) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (current.role === "ADMIN" && current.active) {
      const others = await countOtherActiveAdmins(current.hotelId, userId);
      if (others === 0) {
        return res
          .status(400)
          .json({ message: "No se puede eliminar el último administrador activo del hotel" });
      }
    }

    if (current.role === "SUPER_ADMIN" && current.active) {
      const others = await countOtherActiveSuperAdmins(userId);
      if (others === 0) {
        return res
          .status(400)
          .json({ message: "No se puede eliminar el único super administrador activo" });
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
