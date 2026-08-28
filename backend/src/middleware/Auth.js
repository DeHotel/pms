const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No autorizado",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token inválido",
    });
  }
};

// Middleware factory: requireRole("ADMIN", "SUPER_ADMIN") deja pasar si el rol
// del usuario logueado es alguno de los indicados, y devuelve 403 si no.
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: "No tenés permisos para acceder a este recurso" });
  }
  next();
};

exports.requireAdmin = exports.requireRole("ADMIN");
exports.requireSuperAdmin = exports.requireRole("SUPER_ADMIN");
