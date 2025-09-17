import Citas from './citas.model.js';
import User from '../user/user.model.js';
import { transporter } from "../../configs/mailer.js";

export const createCita = async (req, res) => {
  try {
    const { lugar, fecha, hora, minuto, candidatoNombre, candidatoApellido, usuarioNombre, usuarioApellido, correoUsuario, correoCandidato } = req.body;

    // 🔎 Buscar al candidato por nombre y apellido
    const candidatoUser = await User.findOne({ nombre: candidatoNombre, apellido: candidatoApellido });
    if (!candidatoUser) {
      return res.status(404).json({
        success: false,
        msg: `No se encontró candidato con el nombre ${candidatoNombre} ${candidatoApellido}`
      });
    }

    // 🔎 Buscar al usuario por nombre y apellido
    const usuarioDB = await User.findOne({ nombre: usuarioNombre, apellido: usuarioApellido });
    if (!usuarioDB) {
      return res.status(404).json({
        success: false,
        msg: `No se encontró usuario con el nombre ${usuarioNombre} ${usuarioApellido}`
      });
    }

    // Crear la cita en MongoDB
    const cita = new Citas({
      lugar,
      fecha,
      hora,
      minuto,
      candidato: candidatoUser._id,
      usuario: usuarioDB._id,
      correoUsuario,
      correoCandidato
    });
    await cita.save();

    // 🔎 Populate para traer datos completos
    const citaConDatos = await Citas.findById(cita._id)
      .populate("usuario", "nombre apellido empresa telefono email")
      .populate("candidato", "nombre apellido telefono email");

    const nombreUsuario = `${citaConDatos.usuario?.nombre} ${citaConDatos.usuario?.apellido}`;
    const nombreCandidato = `${citaConDatos.candidato?.nombre} ${citaConDatos.candidato?.apellido}`;

    // 📧 Enviar correo al candidato
    await transporter.sendMail({
      from: `"Notificaciones Citas" <${process.env.EMAIL_USER}>`,
      to: correoCandidato,
      subject: "Nueva cita agendada",
      html: `
        <h2>Hola ${nombreCandidato},</h2>
        <p>Has recibido una nueva cita con <b>${nombreUsuario}</b>.</p>
        <p><b>Fecha:</b> ${fecha}<br/>
        <b>Hora:</b> ${hora}:${minuto}<br/>
        <b>Lugar:</b> ${lugar}</p>
        <p>Por favor, confirma tu asistencia.</p>
      `
    });

    // 📧 Enviar correo al usuario (reclutador)
    await transporter.sendMail({
      from: `"Notificaciones Citas" <${process.env.EMAIL_USER}>`,
      to: correoUsuario,
      subject: "Nueva cita registrada",
      html: `
        <h2>Hola ${nombreUsuario},</h2>
        <p>Has agendado una cita con <b>${nombreCandidato}</b>.</p>
        <p><b>Fecha:</b> ${fecha}<br/>
        <b>Hora:</b> ${hora}:${minuto}<br/>
        <b>Lugar:</b> ${lugar}</p>
      `
    });

    return res.status(200).json({
      success: true,
      msg: `Cita creada correctamente entre ${nombreUsuario} y ${nombreCandidato}. Correos enviados.`,
      cita: citaConDatos
    });

  } catch (error) {
    console.log("Error con el mailer:", error);
    return res.status(500).json({
      msg: "Error al crear la cita",
      error
    });
  }
};


export const listarCitas = async (req, res) => {
  try {
    const userId = req.usuario._id; // viene del token
    const role = req.usuario.role;  // también del token

    // Definir filtro según rol
    let filtro = {};
    if (role === "CANDIDATO_ROLE") {
      filtro = { candidato: userId };  // candidatos solo ven sus citas
    } else if (role === "RECLUTADOR_ROLE") {
      filtro = { usuario: userId };   // reclutadores ven solo las que crearon
    }

    const citas = await Citas.find(filtro)
      .populate("usuario", "nombre apellido empresa telefono email")
      .populate("candidato", "nombre apellido email telefono");

    return res.status(200).json({
      success: true,
      citas
    });
  } catch (error) {
    console.error("❌ Error en listarCitas:", error);
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

