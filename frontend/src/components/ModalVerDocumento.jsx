// frontend/src/components/ModalVerDocumento.jsx

import React, { useState, useEffect } from 'react';
import { getDocumentoBlob } from '../services/documentService';
import '../style/Modal.css';
import '../index.css';
import { BsFileEarmarkWordFill, BsFileEarmarkExcelFill, BsDownload, BsEyeSlash } from 'react-icons/bs';

/**
 * @component ModalVerDocumento
 * @desc Modal inteligente que visualiza PDFs/Imágenes o muestra opción de descarga para Office.
 */
const ModalVerDocumento = ({ archivo, alCerrar }) => {
    
    const [documentUrl, setDocumentUrl] = useState(null);
    const [fileType, setFileType] = useState(null); // Para saber qué renderizar
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDocumento = async () => {
            if (!archivo) return;
            try {
                const blob = await getDocumentoBlob(archivo.ID);
                const url = URL.createObjectURL(blob);
                
                setDocumentUrl(url);
                setFileType(blob.type);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        cargarDocumento();

        return () => {
            if (documentUrl) {
                URL.revokeObjectURL(documentUrl);
            }
        };
    }, [archivo]);

    // Función para forzar la descarga desde el modal
    const handleDescargaManual = () => {
        const a = document.createElement('a');
        a.href = documentUrl;
        a.download = archivo.Nombre;
        a.click();
    };

    // Helper para saber si se puede mostrar en iframe (PDF, Imágenes, Texto plano)
    const esVisualizable = (type) => {
        if (!type) return false;
        return type.includes('pdf') || type.includes('image') || type.includes('text/plain');
    };

    // Renderizado condicional del contenido
    const renderContenido = () => {
        if (isLoading) return <div style={{padding: '3rem', textAlign: 'center'}}>Cargando documento...</div>;
        if (error) return <div className="modal-error" style={{padding: '3rem'}}>{error}</div>;

        // CASO 1: Archivo Visualizable (PDF, Imagen)
        if (esVisualizable(fileType)) {
            return (
                <iframe
                    src={documentUrl}
                    title={archivo.Nombre}
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#f4f4f4' }}
                />
            );
        }

        // CASO 2: Archivo NO Visualizable (Word, Excel, Zip, etc.)
        return (
            <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: '#f8f9fa'
            }}>
                {/* Icono Grande según tipo */}
                <div style={{fontSize: '5rem', marginBottom: '1rem', opacity: 0.8}}>
                    {fileType.includes('word') || fileType.includes('officedocument.word') ? <BsFileEarmarkWordFill color="#2B579A" /> :
                     fileType.includes('excel') || fileType.includes('spreadsheet') ? <BsFileEarmarkExcelFill color="#1D6F42" /> :
                     <BsEyeSlash color="#6c757d" />}
                </div>

                <h3 style={{color: '#333', marginBottom: '0.5rem'}}>Vista previa no disponible</h3>
                <p style={{color: '#666', maxWidth: '400px', marginBottom: '2rem'}}>
                    El navegador no puede mostrar archivos de tipo <strong>{archivo.TipoArchivo}</strong> directamente.
                    <br/>Por favor, descárgalo para verlo en tu equipo.
                </p>

                <button className="btn btn-primary" onClick={handleDescargaManual} style={{padding: '0.8rem 2rem', fontSize: '1.1rem'}}>
                    <BsDownload /> Descargar Archivo
                </button>
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" 
                 style={{ maxWidth: '90vw', width: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} 
                 onClick={(e) => e.stopPropagation()}
            >
                
                <div className="modal-header" style={{margin: 0, padding: '1rem 1.5rem', backgroundColor: '#fff'}}>
                    <h2 style={{fontSize: '1.2rem', margin: 0}}>Visor: {archivo?.Nombre}</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {renderContenido()}
                </div>

                <div className="modal-footer" style={{margin: 0, padding: '1rem', backgroundColor: '#fff'}}>
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={alCerrar}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerDocumento;