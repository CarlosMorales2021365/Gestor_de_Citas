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

export const moverCita = async (req, res) => {
  try {
    const { candidatoNombre, candidatoApellido, fecha, hora, minuto, nuevoUsuarioNombre, nuevoUsuarioApellido } = req.body;

    // Buscar la cita existente
    const cita = await Citas.findOne({
      fecha,
      hora,
      minuto
    }).populate("usuario", "nombre apellido email empresa")
      .populate("candidato", "nombre apellido email");

    if (!cita) {
      return res.status(404).json({
        success: false,
        msg: "No se encontró la cita con esos datos"
      });
    }

    // Buscar al nuevo reclutador
    const nuevoUsuario = await User.findOne({
      nombre: nuevoUsuarioNombre,
      apellido: nuevoUsuarioApellido
    });

    if (!nuevoUsuario) {
      return res.status(404).json({
        success: false,
        msg: "No se encontró el nuevo reclutador"
      });
    }

    // 🔎 Validar que sean de la misma empresa
    if (String(cita.usuario.empresa).toLowerCase() !== String(nuevoUsuario.empresa).toLowerCase()) {
      return res.status(400).json({
        success: false,
        msg: "El nuevo reclutador debe pertenecer a la misma empresa"
      });
    }

    // Guardar viejo usuario (para enviar correo)
    const usuarioAnterior = cita.usuario;

    // Actualizar cita al nuevo usuario
    cita.usuario = nuevoUsuario._id;
    cita.correoUsuario = nuevoUsuario.email;
    await cita.save();

    // Obtener datos actualizados
    const citaActualizada = await Citas.findById(cita._id)
      .populate("usuario", "nombre apellido email empresa")
      .populate("candidato", "nombre apellido email");

    const nombreUsuarioAnterior = `${usuarioAnterior.nombre} ${usuarioAnterior.apellido}`;
    const nombreUsuarioNuevo = `${nuevoUsuario.nombre} ${nuevoUsuario.apellido}`;
    const nombreCandidato = `${citaActualizada.candidato.nombre} ${citaActualizada.candidato.apellido}`;

    // 📧 Correo al reclutador anterior
    await transporter.sendMail({
      from: `"Notificaciones Citas" <${process.env.EMAIL_USER}>`,
      to: usuarioAnterior.email,
      subject: "Cita transferida",
      html: `
        <h2>Hola ${nombreUsuarioAnterior},</h2>
        <p>La cita con <b>${nombreCandidato}</b> del día <b>${fecha}</b> a las <b>${hora}:${minuto}</b> fue transferida a tu compañero <b>${nombreUsuarioNuevo}</b>.</p>
      `
    });

    // 📧 Correo al nuevo reclutador
    await transporter.sendMail({
      from: `"Notificaciones Citas" <${process.env.EMAIL_USER}>`,
      to: nuevoUsuario.email,
      subject: "Nueva cita asignada",
      html: `
        <h2>Hola ${nombreUsuarioNuevo},</h2>
        <p>Se te ha asignado una nueva cita con <b>${nombreCandidato}</b>.</p>
        <p><b>Fecha:</b> ${fecha}<br/>
        <b>Hora:</b> ${hora}:${minuto}</p>
      `
    });

    // 📧 Correo al candidato
    await transporter.sendMail({
      from: `"Notificaciones Citas" <${process.env.EMAIL_USER}>`,
      to: citaActualizada.candidato.email,
      subject: "Actualización de tu cita",
      html: `
        <h2>Hola ${nombreCandidato},</h2>
        <p>Tu cita ahora será atendida por <b>${nombreUsuarioNuevo}</b> en lugar de <b>${nombreUsuarioAnterior}</b>.</p>
        <p><b>Fecha:</b> ${fecha}<br/>
        <b>Hora:</b> ${hora}:${minuto}</p>
      `
    });

    return res.status(200).json({
      success: true,
      msg: `Cita movida correctamente de ${nombreUsuarioAnterior} a ${nombreUsuarioNuevo}`,
      cita: citaActualizada
    });

  } catch (error) {
    console.error("❌ Error en moverCita:", error);
    return res.status(500).json({
      success: false,
      msg: "Error al mover la cita",
      error: error.message
    });
  }
};

export const getReclutadoresEmpresa = async (req, res) => {
  try {
    const usuarioActual = req.usuario; // viene del token
    if (!usuarioActual.empresa) {
      return res.status(400).json({
        success: false,
        msg: "El usuario no tiene empresa asignada",
      });
    }

    // Buscar todos los usuarios que sean reclutadores de la misma empresa
    const reclutadores = await User.find({
      empresa: usuarioActual.empresa,
      role: "RECLUTADOR_ROLE",
      _id: { $ne: usuarioActual._id } // opcional: excluir al usuario actual
    }).select("nombre apellido email");

    return res.status(200).json({
      success: true,
      reclutadores,
    });
  } catch (err) {
    console.error("Error en getReclutadoresEmpresa:", err);
    return res.status(500).json({
      success: false,
      msg: "Error al obtener los reclutadores",
      error: err.message,
    });
  }
};