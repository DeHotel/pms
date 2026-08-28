const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, hotelId: user.hotelId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId,
        photoUrl: user.photoUrl,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
