// backend/routes/inspectionRoutes.js
import express from 'express';
import { check } from 'express-validator';
import inspectionController from '../controllers/inspectionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// 1. RUTAS ESPECÍFICAS (Deben ir PRIMERO)
// ============================================================

// Obtener tipos de activos únicos (Para el modal de crear)
router.get('/activos/tipos-unicos', [ protect, admin ], inspectionController.getTiposUnicos);

// Obtener lista de formularios (Esta era la que fallaba)
router.get('/formularios', [ protect ], inspectionController.getFormularios);

// Crear nuevo formulario
router.post('/formularios', [ protect, admin ], [], inspectionController.crearNuevoFormulario);

// Obtener preguntas de un formulario específico
router.get('/formularios/:idFormulario/preguntas', [ protect ], inspectionController.getPreguntasFormulario);

// Agregar pregunta a un formulario
router.post('/formularios/:id/preguntas', [ protect, admin ], [], inspectionController.agregarPregunta);

// Cambiar visibilidad de un formulario
router.patch('/formularios/:id/visibilidad', [ protect, admin ], inspectionController.toggleVisibilidad);

// Editar formulario (PUT)
router.put('/formularios/:id', 
    [ protect, admin ], 
    [
        check('nombreFormulario', 'Nombre obligatorio').not().isEmpty(),
        check('tipoActivoAsociado', 'Tipo de activo obligatorio').not().isEmpty()
    ],
    inspectionController.editarFormulario
);

// Eliminar formulario (DELETE)
router.delete('/formularios/:id', [ protect, admin ], inspectionController.eliminarFormulario);

// ============================================================
// 2. RUTAS GENERALES DE INSPECCIÓN
// ============================================================

// Crear una inspección (Diligenciar)
router.post('/', [ protect, admin ], [], inspectionController.crearInspeccion);

// Obtener historial de inspecciones
router.get('/', [ protect, admin ], inspectionController.getInspeccionesHistorial);

// Eliminar pregunta (Ruta específica de preguntas)
router.delete('/preguntas/:id', [ protect, admin ], inspectionController.eliminarPregunta);


// ============================================================
// 3. RUTAS DINÁMICAS (Deben ir AL FINAL)
// ============================================================

// Obtener detalle de una inspección por ID
// ¡IMPORTANTE! Esta ruta atrapa todo lo que sea /api/inspecciones/ALGO
// Por eso debe ir al final, para no atrapar "formularios" o "activos".
router.get('/:id', [ protect, admin ], inspectionController.getInspeccionDetalle);

export default router;