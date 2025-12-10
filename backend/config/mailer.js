// backend/config/mailer.js
import nodemailer from 'nodemailer';
import 'dotenv/config';

// Configuración para GMAIL
export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Puerto seguro SSL
    secure: true, // true para 465, false para otros puertos
    auth: {
        user: process.env.MAIL_USER, // Tu correo gmail
        pass: process.env.MAIL_PASS, // La contraseña de aplicación de 16 dígitos
    },
});

export const verificarConexionCorreo = async () => {
    try {
        await transporter.verify();
        console.log('✅ Servidor de correos (Gmail) listo para enviar mensajes');
    } catch (error) {
        console.error('❌ Error conectando servidor de correos:', error.message);
    }
};