export const hasRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: "Se requiere validar el token antes de verificar roles"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(401).json({
        success: false,
        message: `Este servicio requiere uno de los siguientes roles: ${roles}`
      });
    }

    next();
  };
};