// backend/services/cronService.js

import cron from 'node-cron';
import { poolPromise, mssql } from '../config/dbConfig.js';
import { crearNotificacion } from './notificationService.js';

const ejecutarAlertasAutomaticas = async () => {
    console.log('⏰ Ejecutando verificación de alertas (Cron Job)...');
    try {
        const pool = await poolPromise;

        // 1. ALERTAS DE ACTIVIDADES (Ya existía)
        const actResult = await pool.request().query('EXEC SP_CHECK_Alertas_Actividades');
        for (const act of actResult.recordset) {
            await crearNotificacion({
                idUsuarioDestino: act.ID_UsuarioResponsable,
                titulo: '⚠️ Actividad por Vencer',
                mensaje: `La actividad "${act.NombreActividad}" vence pronto.`,
                ruta: '/planificacion'
            });
        }

        // 2. ALERTAS DE ACPM (Ya existía)
        const acpmResult = await pool.request().query('EXEC SP_CHECK_Alertas_ACPM');
        for (const acpm of acpmResult.recordset) {
            await crearNotificacion({
                idUsuarioDestino: acpm.ID_UsuarioResponsable,
                titulo: '📋 ACPM Pendiente',
                mensaje: `Acción "${acpm.Origen}" requiere gestión.`,
                ruta: '/acpm'
            });
        }

        // 3. NUEVA ALERTA: RECOMENDACIONES MÉDICAS POR VENCER
        // (Usa el SP nuevo que creamos en el script SQL)
        const medResult = await pool.request().query('EXEC SP_CHECK_Alertas_Recomendaciones');
        
        for (const med of medResult.recordset) {
            const dias = med.DiasRestantes;
            let titulo = '';
            let mensaje = '';

            if (dias < 0) {
                titulo = '🔴 Recomendaciones Vencidas';
                mensaje = `Las recomendaciones de ${med.NombreColaborador} vencieron hace ${Math.abs(dias)} días.`;
            } else if (dias === 0) {
                titulo = '⚠️ Recomendaciones Vencen HOY';
                mensaje = `Las recomendaciones de ${med.NombreColaborador} terminan hoy.`;
            } else {
                titulo = '⏳ Recomendaciones por Terminar';
                mensaje = `Las recomendaciones de ${med.NombreColaborador} finalizan el ${new Date(med.FechaFinRecomendaciones).toLocaleDateString()}.`;
            }

            // Notifica al Admin SST
            await crearNotificacion({
                rolDestino: 'Administrador SST',
                titulo: titulo,
                mensaje: mensaje,
                ruta: '/medicina'
            });
        }

        console.log('✅ Verificación de alertas completada.');

    } catch (error) {
        console.error('❌ Error en Cron Job:', error);
    }
};

export const initCronJobs = () => {
    // Ejecutar todos los días a las 08:00 AM
    cron.schedule('0 8 * * *', () => {
        ejecutarAlertasAutomaticas();
    });
    console.log('🕒 Servicio de Cron Jobs iniciado (08:00 AM diario).');
};