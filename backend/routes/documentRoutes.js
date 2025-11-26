// backend/routes/documentRoutes.js

import express from 'express';
import { check } from 'express-validator';
import documentController from '../controllers/documentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import dmsUpload from '../middleware/dmsFileUpload.js'; 

const router = express.Router();

// --- Rutas de Carpetas (CU-25) ---
router.get(
    '/carpeta/:id', 
    [ protect, admin ], 
    documentController.getContenidoCarpeta
);

router.post(
    '/carpeta', 
    [ protect, admin ],
    [
        check('nombreCarpeta', 'El nombre de la carpeta es obligatorio').not().isEmpty(),
        check('idCarpetaPadre', 'El ID de la carpeta padre es obligatorio').isInt()
    ],
    documentController.crearCarpeta
);

router.delete(
    '/carpeta/:id', 
    [ protect, admin ], 
    documentController.eliminarCarpeta
);


// --- Rutas de Archivos (CU-26, 27, 28) ---
router.post(
    '/upload', 
    [ protect, admin ], 
    dmsUpload.array('archivos'), 
    documentController.subirArchivos
);

router.get(
    '/descargar/:id', 
    [ protect, admin ], 
    documentController.descargarDocumento
);

router.delete(
    '/documento/:id',
    [ protect, admin ],
    documentController.eliminarDocumento
);

/**
 * @route   GET /api/documentos/stream/:id
 * @desc    Obtiene un archivo para visualizarlo (inline) (Tanda 3.D)
 * @access  Privado (Admin)
 */
router.get(
    '/stream/:id',
    [ protect, admin ],
    documentController.streamDocumento 
);

export default router;