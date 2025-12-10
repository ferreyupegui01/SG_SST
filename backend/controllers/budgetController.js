// backend/controllers/budgetController.js
import { poolPromise, mssql } from '../config/dbConfig.js';
import path from 'path';

// --- Crear Presupuesto (Super Admin) ---
const crearPresupuesto = async (req, res) => {
    const { nombreRubro, descripcion, montoAsignado, anio } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('NombreRubro', mssql.NVarChar, nombreRubro)
            .input('Descripcion', mssql.NVarChar, descripcion)
            .input('MontoAsignado', mssql.Decimal(18, 2), montoAsignado)
            .input('Anio', mssql.Int, anio)
            .query('EXEC SP_CREATE_Presupuesto @NombreRubro, @Descripcion, @MontoAsignado, @Anio');
        
        res.json({ msg: 'Presupuesto asignado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear presupuesto');
    }
};

// --- Registrar Gasto (Admin SST) ---
const registrarGasto = async (req, res) => {
    const { idPresupuesto, descripcionGasto, montoGastado, fechaGasto } = req.body;
    const archivo = req.file; // Evidencia
    const idUsuario = req.usuario.id;

    try {
        const rutaEvidencia = archivo ? archivo.path.replace(/\\/g, '/') : null;

        const pool = await poolPromise;
        await pool.request()
            .input('ID_Presupuesto', mssql.Int, idPresupuesto)
            .input('DescripcionGasto', mssql.NVarChar, descripcionGasto)
            .input('MontoGastado', mssql.Decimal(18, 2), montoGastado)
            .input('FechaGasto', mssql.Date, fechaGasto)
            .input('RutaEvidencia', mssql.NVarChar, rutaEvidencia)
            .input('ID_UsuarioRegistra', mssql.Int, idUsuario)
            .query('EXEC SP_CREATE_Gasto @ID_Presupuesto, @DescripcionGasto, @MontoGastado, @FechaGasto, @RutaEvidencia, @ID_UsuarioRegistra');

        res.json({ msg: 'Gasto registrado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar gasto');
    }
};

// --- Obtener Resumen (Dashboard) ---
const getPresupuestos = async (req, res) => {
    const { anio } = req.query; // ?anio=2025
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Anio', mssql.Int, anio || new Date().getFullYear())
            .query('EXEC SP_GET_PresupuestosResumen @Anio');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error obteniendo presupuestos');
    }
};

// --- Obtener Detalle de Gastos ---
const getDetalleGastos = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Presupuesto', mssql.Int, id)
            .query('EXEC SP_GET_DetalleGastos @ID_Presupuesto');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error obteniendo detalle');
    }
};

// --- NUEVO: Editar Presupuesto ---
const editarPresupuesto = async (req, res) => {
    const { id } = req.params;
    const { nombreRubro, descripcion, montoAsignado, anio, estado } = req.body;
    
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Presupuesto', mssql.Int, id)
            .input('NombreRubro', mssql.NVarChar, nombreRubro)
            .input('Descripcion', mssql.NVarChar, descripcion)
            .input('MontoAsignado', mssql.Decimal(18, 2), montoAsignado)
            .input('Anio', mssql.Int, anio)
            .input('Estado', mssql.NVarChar, estado)
            .query('EXEC SP_UPDATE_Presupuesto @ID_Presupuesto, @NombreRubro, @Descripcion, @MontoAsignado, @Anio, @Estado');

        res.json({ msg: 'Presupuesto actualizado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar presupuesto');
    }
};

// --- NUEVO: Eliminar Presupuesto ---
const eliminarPresupuesto = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Presupuesto', mssql.Int, id)
            .query('EXEC SP_DELETE_Presupuesto @ID_Presupuesto');

        res.json({ msg: 'Rubro eliminado exitosamente' });
    } catch (err) {
        // Capturamos el error del SP (si tiene gastos)
        if (err.message.includes('ya tiene gastos registrados')) {
            return res.status(400).json({ msg: err.message });
        }
        console.error(err);
        res.status(500).send('Error al eliminar presupuesto');
    }
};

export default { 
    crearPresupuesto, 
    registrarGasto, 
    getPresupuestos, 
    getDetalleGastos,
    editarPresupuesto, // <--- Nuevo
    eliminarPresupuesto // <--- Nuevo
};