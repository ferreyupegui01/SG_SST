// backend/controllers/pesvController.js

import { poolPromise, mssql } from '../config/dbConfig.js';
import { generarActaPDF } from '../utils/pdfGenerator.js';
import { obtenerConductoresGosen } from '../services/externalApiService.js'; // Servicio de integración
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
        // Trae a todos los activos con cargo de Conductor, Chofer, Montacarguista, etc.
        const conductoresExternos = await obtenerConductoresGosen();

        // B. Obtener datos locales (Todos los usuarios activos con info de licencia)
        // Usamos el SP corregido que NO filtra por cargo para encontrar coincidencias por cédula
        const pool = await poolPromise;
        const resultLocal = await pool.request().query('EXEC SP_GET_ConductoresPESV');
        const conductoresLocales = resultLocal.recordset;

        // C. Cruzar información (Merge con Prioridad Local)
        const listaUnificada = conductoresExternos.map(externo => {
            
            // Validación estricta de Cédula (Strings sin espacios)
            const cedulaExterna = String(externo.Cedula).trim();
            
            const localData = conductoresLocales.find(local => 
                String(local.CedulaUsuario).trim() === cedulaExterna
            );

            if (localData) {
                // CASO 1: EL USUARIO YA EXISTE LOCALMENTE
                // Se habilitará el botón "Gestionar" porque tenemos ID_Usuario
                return {
                    // Datos Visuales (Preferimos Gosen por estar actualizados)
                    NombreCompleto: externo.NombreCompleto,
                    CedulaUsuario: externo.Cedula,
                    Cargo: externo.CargoNombre || localData.Cargo, 
                    
                    // Datos de Gestión (Vienen EXCLUSIVAMENTE de la BD Local)
                    ID_Usuario: localData.ID_Usuario, 
                    NumeroLicencia: localData.NumeroLicencia,
                    Categoria: localData.Categoria,
                    VencimientoLicencia: localData.VencimientoLicencia,
                    
                    // --- IMPORTANTE: Ruta del archivo para ver/descargar ---
                    RutaLicencia: localData.RutaLicencia, 
                    
                    // Estado para el Frontend
                    EstadoRegistro: 'Registrado',
                    OrigenDatos: 'Local + Gosen'
                };
            } else {
                // CASO 2: SOLO EXISTE EN GOSEN
                // ID_Usuario es null -> Frontend mostrará botón "Crear Usuario"
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
    // Si se subió archivo, guardamos la ruta. Si no, enviamos null (el SP mantiene la anterior).
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
            .query('EXEC SP_CREATE_Mantenimiento @idActivo, @tipo, @fecha, @kilometraje, @descripcion, @taller, @costo');
        
        res.json({ msg: 'Mantenimiento registrado correctamente' });
    } catch (err) { console.error(err); res.status(500).send('Error registrando mantenimiento'); }
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
// 5. GENERACIÓN DE DOCUMENTOS Y PLANTILLAS
// ==========================================

const guardarConfiguracionPlantilla = async (req, res) => {
    const { idPaso, titulo, cuerpo, campos } = req.body; 
    try {
        const pool = await poolPromise;
        const jsonCampos = JSON.stringify(campos);
        await pool.request()
            .input('idPaso', mssql.Int, idPaso)
            .input('titulo', mssql.NVarChar, titulo)
            .input('cuerpo', mssql.NVarChar, cuerpo)
            .input('jsonCampos', mssql.NVarChar(mssql.MAX), jsonCampos)
            .query('EXEC SP_SAVE_PlantillaPESV @idPaso, @titulo, @cuerpo, @jsonCampos');
        res.json({ msg: 'Configuración de plantilla guardada' });
    } catch (err) { console.error(err); res.status(500).send('Error guardando plantilla'); }
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
    const { idPaso, datosFormulario } = req.body; 
    try {
        const pool = await poolPromise;
        const resultConfig = await pool.request().input('idPaso', mssql.Int, idPaso).query('EXEC SP_GET_PlantillaPaso @idPaso');
        if (resultConfig.recordsets[0].length === 0) return res.status(400).json({ msg: 'No hay plantilla configurada para este paso' });

        const configBD = resultConfig.recordsets[0][0];
        const camposBD = resultConfig.recordsets[1];
        const camposLlenos = camposBD.map(c => ({ label: c.Etiqueta, valor: datosFormulario[c.Etiqueta] || '---' }));

        const nombreArchivo = `Generado_Paso${idPaso}_${Date.now()}.pdf`;
        const rutaAbsoluta = path.join(__dirname, '../uploads', nombreArchivo);
        const rutaRelativa = `uploads/${nombreArchivo}`;

        await generarActaPDF({ titulo: configBD.TituloDocumento, cuerpo: configBD.CuerpoInicial, camposLlenos: camposLlenos }, null, rutaAbsoluta);

        // Guardar automáticamente como evidencia del paso y marcar como realizado
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
// 6. CRUD DE PASOS (SUPER ADMIN)
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
    guardarConfiguracionPlantilla, 
    getPlantillaPaso,
    generarDocumentoPaso,
    crearPaso, 
    editarPasoInfo, 
    eliminarPaso,
    descargarArchivo, 
    getDocumentosGenerados,
    reemplazarEvidencia 
};