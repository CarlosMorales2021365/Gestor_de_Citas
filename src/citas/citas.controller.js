import Citas from './citas.model.js';
import User from '../user/user.model.js';

export const createCita = async (req, res) => {
    try {
        const { lugar, fecha, hora, minuto, candidato } = req.body;
        const { usuario } = req; // Reclutador viene del token

        // 🔎 Buscar al candidato por nombre
        const candidatoUser = await User.findOne({ nombre: candidato });
        if (!candidatoUser) {
            return res.status(404).json({
                success: false,
                msg: `No se encontró candidato con el nombre ${candidato}`
            });
        }

        // Guardar la cita con el _id real del candidato
        const citas = new Citas({
            lugar,
            fecha,
            hora,
            minuto,
            candidato: candidatoUser._id,
            usuario: usuario._id
        });
        await citas.save();

        // Populamos usuario (reclutador) y candidato
        const citasConDatos = await Citas.findById(citas._id)
            .populate("usuario", "nombre apellido empresa telefono email")
            .populate("candidato", "nombre apellido email telefono");

        const nombreUsuario = citasConDatos.usuario?.nombre;
        const nombreCandidato = citasConDatos.candidato?.nombre;

        return res.status(200).json({
            success: true,
            msg: `Cita creada correctamente entre ${nombreUsuario} y ${nombreCandidato}`,
            citas: citasConDatos
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Error al crear la cita",
            error
        });
    }
};

export const listarCitas = async (req, res) => {
  try {
    const userId = req.usuario._id; 

    const citas = await Citas.find({ usuario: userId })
      .populate("usuario", "nombre apellido empresa telefono")
      .populate("candidato", "nombre apellido email telefono");

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

