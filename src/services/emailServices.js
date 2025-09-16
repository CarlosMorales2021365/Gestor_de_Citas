import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // tu correo Gmail
    pass: process.env.EMAIL_PASS  // tu contraseña o App Password
  }
});

// Función para enviar correo
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Portal de Empleos" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log("📨 Correo enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return false;
  }
};