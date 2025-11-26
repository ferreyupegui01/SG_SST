// frontend/src/pages/DocumentosPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    getContenidoCarpeta, 
    descargarDocumento, 
    eliminarDocumento, 
    eliminarCarpeta 
} from '../services/documentService';
import { 
    BsFolderFill, BsFileEarmarkTextFill, BsFileEarmarkPdfFill, 
    BsFileEarmarkWordFill, BsFileEarmarkExcelFill, BsFileEarmarkZipFill, 
    BsPlusLg, BsUpload, BsDownload, BsTrash, BsSearch, BsChevronRight, BsCloudUpload, BsGrid
} from 'react-icons/bs';
import '../index.css'; 
import '../style/DocumentosPage.css'; 
import Swal from 'sweetalert2';

import ModalCrearCarpeta from '../components/ModalCrearCarpeta';
import ModalSubirArchivo from '../components/ModalSubirArchivo';
import ModalConfirmarAccion from '../components/ModalConfirmarAccion';
import ModalVerDocumento from '../components/ModalVerDocumento';

// Helper para obtener el icono de archivo con colores
const getIconoArchivo = (tipo) => {
    // Normalizamos para evitar errores si tipo es null
    const t = (tipo || '').toLowerCase();
    if (t.includes('pdf')) return <BsFileEarmarkPdfFill style={{ color: '#E53E3E' }} />;
    if (t.includes('word') || t.includes('officedocument.word')) return <BsFileEarmarkWordFill style={{ color: '#2B579A' }} />;
    if (t.includes('excel') || t.includes('spreadsheet')) return <BsFileEarmarkExcelFill style={{ color: '#1D6F42' }} />;
    if (t.includes('xml') || t.includes('text')) return <BsFileEarmarkTextFill style={{ color: '#6c757d' }} />;
    if (t.includes('zip') || t.includes('rar')) return <BsFileEarmarkZipFill style={{ color: '#F9A825' }} />;
    return <BsFileEarmarkTextFill className="icon-file" style={{ color: '#adb5bd' }} />;
};

const DocumentosPage = () => {
    // --- Estados ---
    const [carpetas, setCarpetas] = useState([]);
    const [archivos, setArchivos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ruta, setRuta] = useState([{ id: 1, nombre: 'Documentos Raíz' }]);
    const carpetaActualId = ruta[ruta.length - 1].id;
    
    // Estado para búsqueda local
    const [busquedaLocal, setBusquedaLocal] = useState('');

    // --- Estados de Modales ---
    const [modalCarpetaAbierto, setModalCarpetaAbierto] = useState(false);
    const [modalSubirAbierto, setModalSubirAbierto] = useState(false);
    const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    
    // --- Estados de Contexto ---
    const [isDownloading, setIsDownloading] = useState(null);
    const [itemParaEliminar, setItemParaEliminar] = useState(null); 
    const [archivoParaVer, setArchivoParaVer] = useState(null);

    // --- Función de Carga de Contenido ---
    const cargarContenido = useCallback(async (id) => {
        try {
            setIsLoading(true);
            const data = await getContenidoCarpeta(id);
            setCarpetas(data.carpetas);
            setArchivos(data.archivos);
            setError(null);
        } catch (err) { 
            setError(err.message); 
        } finally { 
            setIsLoading(false); 
        }
    }, []); 

    useEffect(() => {
        cargarContenido(carpetaActualId);
        setBusquedaLocal(''); // Limpiar búsqueda al cambiar de carpeta
    }, [carpetaActualId, cargarContenido]);

    // --- Filtrado Local ---
    const contenidoFiltrado = useMemo(() => {
        const texto = busquedaLocal.toLowerCase();
        const folders = carpetas.filter(c => c.Nombre.toLowerCase().includes(texto));
        const files = archivos.filter(f => f.Nombre.toLowerCase().includes(texto));
        return { folders, files };
    }, [carpetas, archivos, busquedaLocal]);

    // --- Manejadores de Navegación ---
    const navegarA = (carpeta) => setRuta([...ruta, carpeta]);
    const navegarAIndex = (index) => setRuta(ruta.slice(0, index + 1));

    // --- Manejadores de Modales ---
    const handleRecargar = () => {
        setModalCarpetaAbierto(false);
        setModalSubirAbierto(false);
        setModalConfirmarAbierto(false);
        setItemParaEliminar(null);
        cargarContenido(carpetaActualId); 
    };
    
    const handleDescargar = async (id, nombreOriginal) => {
        setIsDownloading(id); 
        try { 
            await descargarDocumento(id, nombreOriginal); 
        } catch (err) { 
            console.error(err);
            Swal.fire('Error', err.message, 'error');
        } 
        finally { setIsDownloading(null); }
    };

    const abrirModalEliminar = (item, tipo) => { setItemParaEliminar({ ...item, tipo }); setModalConfirmarAbierto(true); };
    
    const handleConfirmarEliminar = async () => {
        if (!itemParaEliminar) return;
        // eslint-disable-next-line no-useless-catch
        try {
            if (itemParaEliminar.tipo === 'Carpeta') { await eliminarCarpeta(itemParaEliminar.ID); } 
            else if (itemParaEliminar.tipo === 'Documento') { await eliminarDocumento(itemParaEliminar.ID); }
            handleRecargar(); 
        } catch (err) { throw err; }
    };
    
    const abrirModalVer = (archivo) => {
        setArchivoParaVer(archivo);
        setModalVerAbierto(true);
    };
    const cerrarModalVer = () => {
        setModalVerAbierto(false);
        setArchivoParaVer(null);
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 KB';
        if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} MB`;
        return `${Math.round(bytes)} KB`;
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '--';
        return new Date(fecha).toLocaleDateString('es-CO');
    };

    return (
        <div className="page-container">
            {/* --- Encabezado --- */}
            <div className="page-header">
                <h1>Gestión Documental</h1>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setModalCarpetaAbierto(true)}>
                        <BsPlusLg /> Nueva Carpeta
                    </button>
                    <button className="btn btn-primary" onClick={() => setModalSubirAbierto(true)}>
                        <BsUpload /> Subir Archivos
                    </button>
                </div>
            </div>

            {/* --- Barra de Herramientas (NUEVA) --- */}
            <div className="docs-toolbar">
                
                {/* Breadcrumbs Estilo Cápsula */}
                <div className="document-breadcrumb">
                    {ruta.map((p, index) => (
                        <React.Fragment key={p.id}>
                            <div 
                                className={`breadcrumb-item ${index === ruta.length - 1 ? 'active' : ''}`}
                                onClick={() => index < ruta.length - 1 && navegarAIndex(index)}
                            >
                                {index === 0 ? <BsGrid /> : <BsFolderFill />} 
                                {p.nombre}
                            </div>
                            {index < ruta.length - 1 && <BsChevronRight className="breadcrumb-separator"/>}
                        </React.Fragment>
                    ))}
                </div>

                {/* Buscador Local */}
                <div className="docs-search">
                    <BsSearch />
                    <input 
                        type="text" 
                        placeholder="Filtrar en esta carpeta..." 
                        value={busquedaLocal}
                        onChange={(e) => setBusquedaLocal(e.target.value)}
                    />
                </div>
            </div>

            {/* --- Listado de Contenido --- */}
            <div className="page-content-card" style={{padding: '1.5rem'}}>
                {isLoading && <p>Cargando contenido...</p>}
                {error && <p className="error-message">Error: {error}</p>}
                
                {!isLoading && !error && (
                    <>
                        {/* Encabezados de Columna (Desktop) */}
                        {(contenidoFiltrado.folders.length > 0 || contenidoFiltrado.files.length > 0) && (
                            <div className="document-list-header">
                                <span>Tipo</span>
                                <span>Nombre</span>
                                <span>Fecha</span>
                                <span>Tamaño</span>
                                <span style={{textAlign: 'right'}}>Acciones</span>
                            </div>
                        )}

                        <div className="document-list-container">
                            
                            {/* Carpetas */}
                            {contenidoFiltrado.folders.map(carpeta => (
                                <div key={`c-${carpeta.ID}`} className="document-row">
                                    <div className="doc-icon-wrapper">
                                        <BsFolderFill style={{ color: '#FFC107' }} />
                                    </div>
                                    <div className="doc-info-main">
                                        <span className="doc-name" onClick={() => navegarA({ id: carpeta.ID, nombre: carpeta.Nombre })}>
                                            {carpeta.Nombre}
                                        </span>
                                        <span className="doc-meta-mobile">{formatearFecha(carpeta.FechaCreacion)}</span>
                                    </div>
                                    <div className="doc-date">{formatearFecha(carpeta.FechaCreacion)}</div>
                                    <div className="doc-size">--</div>
                                    <div className="doc-actions">
                                        <button className="btn btn-icon btn-danger" onClick={() => abrirModalEliminar(carpeta, 'Carpeta')} title="Eliminar Carpeta">
                                            <BsTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Archivos */}
                            {contenidoFiltrado.files.map(archivo => (
                                <div key={`f-${archivo.ID}`} className="document-row">
                                    <div className="doc-icon-wrapper">
                                        {getIconoArchivo(archivo.TipoArchivo)}
                                    </div>
                                    <div className="doc-info-main">
                                        <span className="doc-name" onClick={() => abrirModalVer(archivo)}>
                                            {archivo.Nombre}
                                        </span>
                                        <span className="doc-meta-mobile">
                                            {formatBytes(archivo.TamanoArchivoKB)} • {formatearFecha(archivo.FechaCreacion)}
                                        </span>
                                    </div>
                                    <div className="doc-date">{formatearFecha(archivo.FechaCreacion)}</div>
                                    <div className="doc-size">{formatBytes(archivo.TamanoArchivoKB)}</div>
                                    <div className="doc-actions">
                                        <button 
                                            className="btn btn-icon btn-secondary" 
                                            onClick={() => handleDescargar(archivo.ID, archivo.Nombre)} 
                                            disabled={isDownloading === archivo.ID}
                                            title="Descargar"
                                        >
                                            <BsDownload />
                                        </button>
                                        <button 
                                            className="btn btn-icon btn-danger" 
                                            onClick={() => abrirModalEliminar(archivo, 'Documento')}
                                            title="Eliminar Archivo"
                                        >
                                            <BsTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Estado Vacío */}
                            {contenidoFiltrado.folders.length === 0 && contenidoFiltrado.files.length === 0 && (
                                <div className="empty-state-docs">
                                    <BsCloudUpload className="empty-icon" />
                                    <h3>Carpeta Vacía</h3>
                                    <p>Usa los botones superiores para crear carpetas o subir archivos.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* --- Renderizado de Modales --- */}
            {modalCarpetaAbierto && ( <ModalCrearCarpeta idCarpetaPadre={carpetaActualId} alCerrar={() => setModalCarpetaAbierto(false)} alExito={handleRecargar} /> )}
            {modalSubirAbierto && ( <ModalSubirArchivo idCarpetaDestino={carpetaActualId} alCerrar={() => setModalSubirAbierto(false)} alExito={handleRecargar} /> )}
            {modalConfirmarAbierto && ( 
                <ModalConfirmarAccion 
                    titulo={`Eliminar ${itemParaEliminar?.tipo}`} 
                    mensaje={`¿Estás seguro de que deseas eliminar "${itemParaEliminar?.Nombre}"?`} 
                    enConfirmar={handleConfirmarEliminar} 
                    alCerrar={() => { setModalConfirmarAbierto(false); setItemParaEliminar(null); }} 
                    textoBotonConfirmar="Eliminar" 
                    claseBoton="btn-danger" 
                /> 
            )}
            
            {modalVerAbierto && (
                <ModalVerDocumento
                    archivo={archivoParaVer}
                    alCerrar={cerrarModalVer}
                />
            )}
        </div>
    );
};

export default DocumentosPage;