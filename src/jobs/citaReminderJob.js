import cron from "node-cron";
import Citas from "../citas/citas.model.js";
import { transporter } from "../../configs/mailer.js";

cron.schedule("*/1 * * * *", async () => { // Ejecuta cada 1 minuto mientras pruebas
  try {
    const now = new Date();
    const inFifteenMinutes = new Date(now.getTime() + 15 * 60 * 1000);

    // Convertir fecha de hoy a DD-MM-YYYY
    const hoy = `${String(now.getDate()).padStart(2, "0")}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${now.getFullYear()}`;

    console.log("🕒 Ejecutando job de recordatorios:", now.toISOString());
    console.log("➡️ Rango válido entre", now.toISOString(), "y", inFifteenMinutes.toISOString());
    console.log("📌 Fecha de hoy formateada:", hoy);

    // Buscar citas de hoy sin recordatorio enviado
    const citas = await Citas.find({
      fecha: hoy,
      recordatorioEnviado: false,
    })
      .populate("usuario", "nombre apellido email")
      .populate("candidato", "nombre apellido email");

    console.log(`📌 Citas encontradas para hoy (${hoy}):`, citas.length);

    for (const cita of citas) {
      console.log("➡️ Revisando cita:", cita);

      if (!cita.hora || !cita.minuto) {
        console.log("⚠️ Cita sin hora o minuto, se ignora.");
        continue;
      }

      // Construir fecha completa de la cita
      const citaDate = new Date(
        `${cita.fecha.split("-").reverse().join("-")}T${cita.hora.padStart(
          2,
          "0"
        )}:${cita.minuto.padStart(2, "0")}:00`
      );

      console.log("🗓️ Fecha de la cita:", citaDate.toISOString());

      // Verificar si está en el rango
      if (citaDate > now && citaDate <= inFifteenMinutes) {
        console.log("✅ Cita dentro del rango, enviando correos...");

        // Candidato
        if (cita.correoCandidato) {
          console.log("📤 Enviando correo a candidato:", cita.correoCandidato);
          await transporter.sendMail({
            from: `"Notificaciones Citas" <${process.env.EMAIL_USER}>`,
            to: cita.correoCandidato,
            subject: "⏰ Recordatorio de cita próxima",
            html: `
              <h2>Hola ${cita.candidato?.nombre || ""} ${cita.candidato?.apellido || ""},</h2>
              <p>Te recordamos que tienes una cita con <b>${cita.usuario?.nombre || ""} ${cita.usuario?.apellido || ""}</b> en menos de 15 minutos.</p>
              <p><b>Fecha:</b> ${cita.fecha}<br/>
              <b>Hora:</b> ${cita.hora}:${cita.minuto}<br/>
              <b>Lugar:</b> ${cita.lugar}</p>
            `,
          });
        }

        // Usuario
        if (cita.correoUsuario) {
          console.log("📤 Enviando correo a usuario:", cita.correoUsuario);
          await transporter.sendMail({
            from: `"Notificaciones Citas" <${process.env.EMAIL_USER}>`,
            to: cita.correoUsuario,
            subject: "⏰ Recordatorio de cita próxima",
            html: `
              <h2>Hola ${cita.usuario?.nombre || ""} ${cita.usuario?.apellido || ""},</h2>
              <p>Te recordamos que tienes una cita con <b>${cita.candidato?.nombre || ""} ${cita.candidato?.apellido || ""}</b> en menos de 15 minutos.</p>
              <p><b>Fecha:</b> ${cita.fecha}<br/>
              <b>Hora:</b> ${cita.hora}:${cita.minuto}<br/>
              <b>Lugar:</b> ${cita.lugar}</p>
            `,
          });
        }

        // Marcar como enviado
        cita.recordatorioEnviado = true;
        await cita.save();
        console.log("🟢 Cita marcada como recordatorio enviado.");
      } else {
        console.log("⏭️ Cita fuera del rango, no se envía.");
      }
    }
  } catch (error) {
    console.error("❌ Error en job de recordatorios:", error);
  }
});