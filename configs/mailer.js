import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // tu correo de Gmail
    pass: process.env.EMAIL_PASS, // tu App Password de 16 caracteres
  },
});

// Verifica la conexión (opcional)
transporter.verify()
  .then(() => console.log("Mailer listo para enviar correos"))
  .catch(err => console.log("Error con el mailer:", err));