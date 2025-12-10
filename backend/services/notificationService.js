// backend/services/notificationService.js

import { poolPromise, mssql } from '../config/dbConfig.js';
import { transporter } from '../config/mailer.js';

// --- CONFIGURACIÓN DEL LOGO ---
// Usamos el enlace directo que acabamos de obtener
const LOGO_URL = "https://i.ibb.co/27GMjSQM/logo.png";

/**
 * @desc Crea una notificación en la BD y envía un correo espejo.
 */
export const crearNotificacion = async ({ idUsuarioDestino, rolDestino, titulo, mensaje, ruta }) => {
    try {
        const pool = await poolPromise;

        // 1. Guardar en Base de Datos (Para la campana del header)
        await pool.request()
            .input('idUsuarioDestino', mssql.Int, idUsuarioDestino || null)
            .input('rolDestino', mssql.NVarChar, rolDestino || null)
            .input('titulo', mssql.NVarChar, titulo)
            .input('mensaje', mssql.NVarChar, mensaje)
            .input('rutaAccion', mssql.NVarChar, ruta || null)
            .query('EXEC SP_CREATE_Notificacion @idUsuarioDestino, @rolDestino, @titulo, @mensaje, @rutaAccion');

        // 2. Enviar Correo Electrónico (Proceso en segundo plano)
        enviarCorreoEspejo({ idUsuarioDestino, rolDestino, titulo, mensaje });

    } catch (err) {
        console.error('Error creando notificación/correo:', err.message);
    }
};

/**
 * @desc Envía el correo usando la URL del logo en la nube
 */
const enviarCorreoEspejo = async ({ idUsuarioDestino, rolDestino, titulo, mensaje }) => {
    try {
        const pool = await poolPromise;
        let destinatarios = [];

        // A. Obtener emails de la BD
        if (idUsuarioDestino) {
            // Caso: Usuario específico
            const res = await pool.request()
                .input('idUsuario', mssql.Int, idUsuarioDestino)
                .query('SELECT Email FROM Usuarios WHERE ID_Usuario = @idUsuario');
            
            if (res.recordset.length > 0 && res.recordset[0].Email) {
                destinatarios.push(res.recordset[0].Email);
            }
        } else if (rolDestino) {
            // Caso: Rol completo (ej. Admin SST)
            const res = await pool.request()
                .input('nombreRol', mssql.NVarChar, rolDestino)
                .query(`
                    SELECT U.Email 
                    FROM Usuarios U
                    JOIN Roles R ON U.ID_Rol = R.ID_Rol
                    WHERE R.NombreRol = @nombreRol 
                      AND U.EstadoCuenta = 'Activo'
                      AND U.Email IS NOT NULL
                `);
            
            destinatarios = res.recordset.map(row => row.Email);
        }

        if (destinatarios.length === 0) return;

        // B. Configurar correo
        const mailOptions = {
            from: `"Sistema SG-SST" <${process.env.MAIL_USER}>`,
            to: destinatarios,
            subject: `🔔 Novedad SG-SST: ${titulo}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; overflow: hidden;">
                    
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #005A5B;">
                        <img src="${LOGO_URL}" alt="Empaquetados El Trece" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
                    </div>
                    
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #005A5B; margin-top: 0; font-size: 20px;">${titulo}</h2>
                        
                        <div style="background-color: #eef7ff; border-left: 4px solid #007BFF; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0;">
                                ${mensaje}
                            </p>
                        </div>

                        <p style="color: #555; font-size: 14px;">
                            Se ha registrado una novedad en el sistema que requiere tu atención.
                        </p>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="http://localhost:5173" style="background-color: #005A5B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">Ir a la Plataforma</a>
                        </div>
                    </div>

                    <div style="background-color: #333; color: #aaa; padding: 15px; text-align: center; font-size: 11px;">
                        <p style="margin: 0;">Empaquetados El Trece S.A.S - Sistema de Gestión SST</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Correo enviado a: ${destinatarios.length} destinatarios.`);

    } catch (error) {
        console.error("⚠️ Error enviando correo espejo:", error.message);
    }
};