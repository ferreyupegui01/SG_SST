// backend/services/cronService.js

import cron from 'node-cron';
import { poolPromise, mssql } from '../config/dbConfig.js';
import { crearNotificacion } from './notificationService.js';

const ejecutarAlertasAutomaticas = async () => {
    console.log('⏰ Ejecutando verificación de alertas programadas...');
    try {
        const pool = await poolPromise;

        // 1. ALERTAS DE ACTIVIDADES
        const actResult = await pool.request().query('EXEC SP_CHECK_Alertas_Actividades');
        for (const act of actResult.recordset) {
            const estadoTiempo = act.DiasRestantes < 0 ? 'VENCIDA' : 'Por Vencer';
            const icono = act.DiasRestantes < 0 ? '🔴' : '⚠️';
            
            await crearNotificacion({
                idUsuarioDestino: act.ID_UsuarioResponsable,
                titulo: `${icono} Actividad ${estadoTiempo}`,
                mensaje: `La actividad "${act.NombreActividad}" vence el ${new Date(act.FechaLimite).toLocaleDateString()}.`,
                ruta: '/planificacion'
            });
        }

        // 2. ALERTAS DE ACPM
        const acpmResult = await pool.request().query('EXEC SP_CHECK_Alertas_ACPM');
        for (const acpm of acpmResult.recordset) {
            const estadoTiempo = acpm.DiasRestantes < 0 ? 'VENCIDA' : 'Por Vencer';
            
            await crearNotificacion({
                idUsuarioDestino: acpm.ID_UsuarioResponsable,
                titulo: `📋 ACPM ${estadoTiempo}`,
                mensaje: `La acción "${acpm.Origen}" requiere gestión urgente.`,
                ruta: '/acpm'
            });
        }

        // 3. ALERTAS MÉDICAS (A Admin SST)
        const medResult = await pool.request().query('EXEC SP_CHECK_Alertas_Medicas');
        for (const med of medResult.recordset) {
             await crearNotificacion({
                rolDestino: 'Administrador SST',
                titulo: '🩺 Recomendaciones por Vencer',
                mensaje: `Las recomendaciones de ${med.NombreColaborador} vencen el ${new Date(med.FechaVencimiento).toLocaleDateString()}.`,
                ruta: '/medicina'
            });
        }

        console.log('✅ Verificación de alertas completada.');

    } catch (error) {
        console.error('❌ Error en Cron Job:', error);
    }
};

// Inicializar el Cron Job
export const initCronJobs = () => {
    // Ejecutar todos los días a las 8:00 AM
    cron.schedule('0 8 * * *', () => {
        ejecutarAlertasAutomaticas();
    });
    
    console.log('🕒 Servicio de Cron Jobs iniciado (08:00 AM diario)');
};