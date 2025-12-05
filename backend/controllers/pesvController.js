// backend/controllers/pesvController.js

import { poolPromise, mssql } from '../config/dbConfig.js';
import { generarActaPDF } from '../utils/pdfGenerator.js';
import { obtenerConductoresGosen } from '../services/externalApiService.js'; 
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. GESTIÓN DE ARCHIVOS Y EVIDENCIAS
// ==========================================

const descargarArchivo = (req, res) => {
    const { filename } = req.params;
    const rutaArchivo = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(rutaArchivo)) {
        res.download(rutaArchivo); 
    } else {
        res.status(404).send('Archivo no encontrado');
    }
};

const getDocumentosGenerados = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_DocumentosInternos');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error al obtener documentos internos'); }
};

const reemplazarEvidencia = async (req, res) => {
    const { idEvidencia } = req.body;
    const nuevoArchivo = req.file;

    if (!nuevoArchivo) return res.status(400).json({ msg: 'No se subió archivo' });

    try {
        const nombreArchivo = nuevoArchivo.originalname;
        const rutaArchivo = nuevoArchivo.path.replace(/\\/g, '/'); // Normalizar ruta

        const pool = await poolPromise;
        await pool.request()
            .input('idEvidencia', mssql.Int, idEvidencia)
            .input('nombreArchivo', mssql.NVarChar, nombreArchivo)
            .input('rutaArchivo', mssql.NVarChar, rutaArchivo)
            .query('EXEC SP_UPDATE_Evidencia_Archivo @idEvidencia, @nombreArchivo, @rutaArchivo');

        res.json({ msg: 'Evidencia actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error reemplazando evidencia');
    }
};

// ==========================================
// 2. GESTIÓN DE CONDUCTORES (INTEGRACIÓN)
// ==========================================

const getConductoresPESV = async (req, res) => {
    try {
        // A. Obtener listado maestro de la API Externa (Gosen)
        const conductoresExternos = await obtenerConductoresGosen();

        // B. Obtener datos locales
        const pool = await poolPromise;
        const resultLocal = await pool.request().query('EXEC SP_GET_ConductoresPESV');
        const conductoresLocales = resultLocal.recordset;

        // C. Cruzar información
        const listaUnificada = conductoresExternos.map(externo => {
            const cedulaExterna = String(externo.Cedula).trim();
            const localData = conductoresLocales.find(local => 
                String(local.CedulaUsuario).trim() === cedulaExterna
            );

            if (localData) {
                // EXISTE LOCALMENTE
                return {
                    NombreCompleto: externo.NombreCompleto,
                    CedulaUsuario: externo.Cedula,
                    Cargo: externo.CargoNombre || localData.Cargo, 
                    ID_Usuario: localData.ID_Usuario, 
                    NumeroLicencia: localData.NumeroLicencia,
                    Categoria: localData.Categoria,
                    VencimientoLicencia: localData.VencimientoLicencia,
                    RutaLicencia: localData.RutaLicencia, 
                    EstadoRegistro: 'Registrado',
                    OrigenDatos: 'Local + Gosen'
                };
            } else {
                // SOLO EN GOSEN
                return {
                    NombreCompleto: externo.NombreCompleto,
                    CedulaUsuario: externo.Cedula,
                    Cargo: externo.CargoNombre,
                    ID_Usuario: null, 
                    NumeroLicencia: null,
                    Categoria: null,
                    VencimientoLicencia: null,
                    RutaLicencia: null,
                    EstadoRegistro: 'Pendiente',
                    OrigenDatos: 'Solo Gosen'
                };
            }
        });

        res.json(listaUnificada);

    } catch (err) { 
        console.error("Error en getConductoresPESV:", err); 
        res.status(500).send('Error obteniendo listado de conductores'); 
    }
};

const guardarInfoConductor = async (req, res) => {
    const { idUsuario, numeroLicencia, categoria, vencimiento } = req.body;
    const archivoLicencia = req.file ? req.file.path.replace(/\\/g, '/') : null;
    
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idUsuario', mssql.Int, idUsuario)
            .input('numeroLicencia', mssql.NVarChar, numeroLicencia)
            .input('categoria', mssql.NVarChar, categoria)
            .input('vencimiento', mssql.Date, vencimiento)
            .input('rutaLicencia', mssql.NVarChar, archivoLicencia)
            .query('EXEC SP_SAVE_InfoConductor @idUsuario, @numeroLicencia, @categoria, @vencimiento, @rutaLicencia');
        
        res.json({ msg: 'Información del conductor actualizada exitosamente' });
    } catch (err) { 
        console.error(err); 
        res.status(500).send('Error guardando información del conductor'); 
    }
};

// ==========================================
// 3. GESTIÓN DE MANTENIMIENTOS
// ==========================================

const crearMantenimiento = async (req, res) => {
    const { idActivo, tipo, fecha, kilometraje, descripcion, taller, costo } = req.body;
    const archivoEvidencia = req.file ? req.file.path.replace(/\\/g, '/') : null;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idActivo', mssql.Int, idActivo)
            .input('tipo', mssql.NVarChar, tipo)
            .input('fecha', mssql.Date, fecha)
            .input('kilometraje', mssql.Int, kilometraje)
            .input('descripcion', mssql.NVarChar, descripcion)
            .input('taller', mssql.NVarChar, taller)
            .input('costo', mssql.Decimal(18, 2), costo)
            .input('rutaEvidencia', mssql.NVarChar, archivoEvidencia)
            .query('EXEC SP_CREATE_Mantenimiento @idActivo, @tipo, @fecha, @kilometraje, @descripcion, @taller, @costo, @rutaEvidencia');
        
        res.json({ msg: 'Mantenimiento registrado correctamente' });
    } catch (err) { 
        console.error(err); 
        res.status(500).send('Error registrando mantenimiento'); 
    }
};

const getMantenimientos = async (req, res) => {
    const { idActivo } = req.query; 
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idActivo', mssql.Int, idActivo || null)
            .query('EXEC SP_GET_Mantenimientos @idActivo');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error obteniendo mantenimientos'); }
};

// ==========================================
// 4. GESTIÓN DE PASOS PHVA
// ==========================================

const getPasosPESV = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_PasosPESV');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error obteniendo pasos'); }
};

const getEvidenciasPorPaso = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idPaso', mssql.Int, id)
            .query('EXEC SP_GET_Evidencias_Por_Paso @idPaso');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error obteniendo evidencias'); }
};

const actualizarPasoPESV = async (req, res) => {
    const { idPaso, estado } = req.body;
    const archivoEvidencia = req.file; 
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input('idPaso', mssql.Int, idPaso)
            .input('estado', mssql.NVarChar, estado);
        
        if (archivoEvidencia) {
            request.input('nombreArchivo', mssql.NVarChar, archivoEvidencia.originalname);
            request.input('rutaArchivo', mssql.NVarChar, archivoEvidencia.path.replace(/\\/g, '/'));
        } else {
            request.input('nombreArchivo', mssql.NVarChar, null);
            request.input('rutaArchivo', mssql.NVarChar, null);
        }
        
        await request.query('EXEC SP_UPDATE_PasoPESV @idPaso, @estado, @nombreArchivo, @rutaArchivo');
        res.json({ msg: 'Paso actualizado correctamente' });
    } catch (err) { console.error(err); res.status(500).send('Error actualizando paso'); }
};

// ==========================================
// 5. GENERACIÓN DE DOCUMENTOS (ACTUALIZADO)
// ==========================================

const guardarConfiguracionPlantilla = async (req, res) => {
    // Recibimos la configuración base desde el panel del Super Admin
    const { 
        idPaso, titulo, cuerpo, campos,
        codigo, version, fechaEmision, fechaRevision 
    } = req.body; 

    try {
        const pool = await poolPromise;
        const jsonCampos = JSON.stringify(campos);
        
        // Validación de fechas
        const fEmision = fechaEmision ? new Date(fechaEmision) : null;
        const fRevision = fechaRevision ? new Date(fechaRevision) : null;

        const check = await pool.request().input('idPaso', mssql.Int, idPaso).query('SELECT ID_Plantilla FROM PlantillasDocPESV WHERE ID_Paso = @idPaso');
        
        let idPlantilla;

        if (check.recordset.length > 0) {
            // UPDATE
            idPlantilla = check.recordset[0].ID_Plantilla;
            await pool.request()
                .input('idPaso', mssql.Int, idPaso)
                .input('titulo', mssql.NVarChar, titulo)
                .input('cuerpo', mssql.NVarChar, cuerpo)
                .input('codigo', mssql.NVarChar, codigo)
                .input('version', mssql.NVarChar, version)
                .input('fEmision', mssql.Date, fEmision)
                .input('fRevision', mssql.Date, fRevision)
                .query(`
                    UPDATE PlantillasDocPESV 
                    SET TituloDocumento = @titulo, CuerpoInicial = @cuerpo,
                        CodigoDocumento = @codigo, Version = @version,
                        FechaEmision = @fEmision, FechaRevision = @fRevision
                    WHERE ID_Paso = @idPaso
                `);
            
            // Borrar campos viejos
            await pool.request().input('idPlantilla', mssql.Int, idPlantilla).query('DELETE FROM CamposPlantillaPESV WHERE ID_Plantilla = @idPlantilla');
        } else {
            // INSERT
            const result = await pool.request()
                .input('idPaso', mssql.Int, idPaso)
                .input('titulo', mssql.NVarChar, titulo)
                .input('cuerpo', mssql.NVarChar, cuerpo)
                .input('codigo', mssql.NVarChar, codigo)
                .input('version', mssql.NVarChar, version)
                .input('fEmision', mssql.Date, fEmision)
                .input('fRevision', mssql.Date, fRevision)
                .query(`
                    INSERT INTO PlantillasDocPESV (ID_Paso, TituloDocumento, CuerpoInicial, CodigoDocumento, Version, FechaEmision, FechaRevision)
                    VALUES (@idPaso, @titulo, @cuerpo, @codigo, @version, @fEmision, @fRevision);
                    SELECT SCOPE_IDENTITY() AS id;
                `);
            idPlantilla = result.recordset[0].id;
        }

        // Insertar Campos
        if (campos && campos.length > 0) {
            const table = new mssql.Table('CamposPlantillaPESV');
            table.create = false;
            table.columns.add('ID_Plantilla', mssql.Int, { nullable: false });
            table.columns.add('Etiqueta', mssql.NVarChar(100), { nullable: false });
            table.columns.add('TipoInput', mssql.NVarChar(20), { nullable: false });
            table.columns.add('Orden', mssql.Int, { nullable: false });

            campos.forEach(c => {
                table.rows.add(idPlantilla, c.label, c.tipo, c.orden);
            });

            const request = new mssql.Request(pool);
            await request.bulk(table);
        }

        res.json({ msg: 'Configuración guardada exitosamente' });

    } catch (err) { 
        console.error(err); 
        res.status(500).send('Error guardando plantilla'); 
    }
};

const getPlantillaPaso = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('idPaso', mssql.Int, id).query('EXEC SP_GET_PlantillaPaso @idPaso');
        if (result.recordsets[0].length === 0) return res.json({ existe: false });
        res.json({ existe: true, config: result.recordsets[0][0], campos: result.recordsets[1] });
    } catch (err) { console.error(err); res.status(500).send('Error obteniendo plantilla'); }
};

const generarDocumentoPaso = async (req, res) => {
    // --- AQUÍ RECIBIMOS 'headerData' (Datos editados por el usuario al generar) ---
    const { idPaso, datosFormulario, headerData } = req.body; 
    
    try {
        const pool = await poolPromise;
        const resultConfig = await pool.request().input('idPaso', mssql.Int, idPaso).query('EXEC SP_GET_PlantillaPaso @idPaso');
        
        if (resultConfig.recordsets[0].length === 0) {
            return res.status(400).json({ msg: 'No hay plantilla configurada para este paso' });
        }

        const configBD = resultConfig.recordsets[0][0];
        const camposBD = resultConfig.recordsets[1];
        
        const camposLlenos = camposBD.map(c => ({ 
            label: c.Etiqueta, 
            valor: datosFormulario[c.Etiqueta] || '---' 
        }));

        const nombreArchivo = `Generado_Paso${idPaso}_${Date.now()}.pdf`;
        const rutaAbsoluta = path.join(__dirname, '../uploads', nombreArchivo);
        const rutaRelativa = `uploads/${nombreArchivo}`;

        // PRIORIDAD: Si el usuario envió headerData (desde el modal de generar), usamos eso.
        // Si no, usamos los valores por defecto de la BD.
        const datosHeader = {
            titulo: configBD.TituloDocumento,
            cuerpo: configBD.CuerpoInicial,
            camposLlenos: camposLlenos,
            
            // Datos dinámicos vs BD
            codigo: headerData?.codigo || configBD.CodigoDocumento,
            version: headerData?.version || configBD.Version,
            fechaEmision: headerData?.fechaEmision || (configBD.FechaEmision ? new Date(configBD.FechaEmision).toISOString().split('T')[0] : ''),
            fechaRevision: headerData?.fechaRevision || (configBD.FechaRevision ? new Date(configBD.FechaRevision).toISOString().split('T')[0] : '')
        };

        // Generamos el PDF con el encabezado correcto
        await generarActaPDF(datosHeader, null, rutaAbsoluta);

        // Guardar automáticamente como evidencia
        await pool.request()
            .input('idPaso', mssql.Int, idPaso)
            .input('estado', mssql.NVarChar, 'Realizado')
            .input('nombreArchivo', mssql.NVarChar, nombreArchivo)
            .input('rutaArchivo', mssql.NVarChar, rutaRelativa)
            .query('EXEC SP_UPDATE_PasoPESV @idPaso, @estado, @nombreArchivo, @rutaArchivo');

        res.json({ msg: 'Documento generado y guardado', filename: nombreArchivo, ruta: rutaRelativa });
    } catch (err) { console.error(err); res.status(500).send('Error generando documento'); }
};

// ==========================================
// 6. CRUD DE PASOS (SUPER ADMIN / ADMIN SST)
// ==========================================

const crearPaso = async (req, res) => {
    const { numeroPaso, nombrePaso, descripcionNorma } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('numeroPaso', mssql.Int, numeroPaso)
            .input('nombrePaso', mssql.NVarChar, nombrePaso)
            .input('descripcionNorma', mssql.NVarChar, descripcionNorma)
            .query('EXEC SP_CREATE_PasoPESV @numeroPaso, @nombrePaso, @descripcionNorma');
        res.json({ msg: 'Paso creado exitosamente' });
    } catch (err) { console.error(err); res.status(500).send('Error creando paso'); }
};

const editarPasoInfo = async (req, res) => {
    const { idPaso, numeroPaso, nombrePaso, descripcionNorma } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idPaso', mssql.Int, idPaso)
            .input('numeroPaso', mssql.Int, numeroPaso)
            .input('nombrePaso', mssql.NVarChar, nombrePaso)
            .input('descripcionNorma', mssql.NVarChar, descripcionNorma)
            .query('EXEC SP_UPDATE_PasoPESV_Info @idPaso, @numeroPaso, @nombrePaso, @descripcionNorma');
        res.json({ msg: 'Paso actualizado exitosamente' });
    } catch (err) { console.error(err); res.status(500).send('Error editando paso'); }
};

const eliminarPaso = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('idPaso', mssql.Int, id).query('EXEC SP_DELETE_PasoPESV @idPaso');
        res.json({ msg: 'Paso eliminado exitosamente' });
    } catch (err) { console.error(err); res.status(500).send('Error eliminando paso'); }
};

// Exportar todas las funciones
export default {
    getConductoresPESV,
    guardarInfoConductor,
    crearMantenimiento, 
    getMantenimientos,
    getPasosPESV, 
    getEvidenciasPorPaso, 
    actualizarPasoPESV,
    guardarConfiguracionPlantilla, // Para guardar defaults (Super Admin)
    getPlantillaPaso, 
    generarDocumentoPaso, // Para generar PDF con datos editados en modal
    crearPaso, 
    editarPasoInfo, 
    eliminarPaso,
    descargarArchivo, 
    getDocumentosGenerados,
    reemplazarEvidencia 
};