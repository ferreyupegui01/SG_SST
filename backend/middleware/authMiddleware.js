// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import 'dotenv/config.js';

/**
 * @middleware protect
 * @desc       Middleware para identificar el token y el usuario.
 */
const protect = (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')){
        try {
            token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.usuario = decoded.usuario; // { id, nombre, rol }
            next();
        } catch (error) {
            console.error('Error de autenticacion:', error.message);
            res.status(401).json({msg: 'Token no valido, autorizacion denegada'});
        }
    }

    if(!token){
        res.status(401).json({msg: 'No hay token autorizacion denegada'});
    }
};

/**
 * @middleware admin
 * @desc       Middleware para verificar roles administrativos (SST o Super Admin)
 */
const admin = (req, res, next) => {
    // Verifica si existe el usuario y si tiene uno de los roles permitidos
    if (req.usuario && (req.usuario.rol === 'Administrador SST' || req.usuario.rol === 'Super Admin')){
        next();
    } else {
        res.status(403).json({msg:'Acceso denegado. Se requiere rol de administrador'});
    }
};

export { protect, admin };