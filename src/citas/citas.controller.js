import Citas from './citas.model.js';

export const createCita = async (req, res) => {
    try {
        const { lugar, fecha, hora, minuto, citado } = req.body;
        const { usuario } = req;

        // Corrige la propiedad: debe ser 'usuario'
        const citas = new Citas({ lugar, fecha, hora, minuto, citado, usuario: usuario._id });
        await citas.save();

        // Popula los datos del usuario, incluyendo el nombre
        const citasConDatos = await Citas.findById(citas._id)
            .populate("usuario", "nombre apellido empresa telefono");

        // Puedes acceder al nombre así:
        const nombreUsuario = citasConDatos.usuario?.nombre;

        return res.status(200).json({
            success: true,
            msg: `Cita creada correctamente para ${nombreUsuario}`,
            citas: citasConDatos
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Error al crear la cita",
            error
        });
    }
}

export const listarCitas = async (req, res) => {
  try {
    const userId = req.usuario._id; 

    const citas = await Citas.find({ usuario: userId })
      .populate("usuario", "nombre apellido empresa telefono");

    return res.status(200).json({
      success: true,
      citas
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al listar citas",
      error: error.message
    });
  }
};


export const getCitasByFecha = async (req, res) => {
  try {
    const { fecha } = req.body; // fecha seleccionada en el calendario
    const userId = req.usuario._id; // viene del token gracias a validateJWT

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: "Debes proporcionar una fecha en el body",
      });
    }

    // Buscar citas del usuario en esa fecha
    const citas = await Citas.find({ fecha, usuario: userId })
      .populate("usuario", "nombre apellido empresa telefono");

    if (!citas || citas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron citas para esa fecha",
      });
    }

    return res.status(200).json({
      success: true,
      citas,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener citas por fecha",
      error: err.message,
    });
  }
};

