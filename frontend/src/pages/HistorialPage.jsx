// frontend/src/pages/HistorialPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getColaboradores, buscarUsuarioExterno } from '../services/userService'; 
import { getActivosTodos } from '../services/assetService';
import { getHistorialColaborador, getHistorialActivo } from '../services/historyService';
import '../index.css';
import { 
    BsPersonBadge, BsTruck, BsSearch, BsClockHistory, 
    BsFileEarmarkMedical, BsFileText, BsConeStriped, BsTools, BsClipboardCheck, 
    BsPersonVcard, BsLaptop
} from 'react-icons/bs';

const HistorialPage = () => {
    const [activeTab, setActiveTab] = useState('colaboradores'); // 'colaboradores' | 'activos'
    const [lista, setLista] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [seleccionado, setSeleccionado] = useState(null);
    const [historial, setHistorial] = useState([]);
    
    // Estados de carga
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Cargar listas iniciales al cambiar de pestaña
    useEffect(() => {
        setLista([]);
        setSeleccionado(null);
        setHistorial([]);
        setBusqueda('');
        
        if (activeTab === 'activos') {
            cargarActivos();
        } else {
            // Cargar colaboradores locales al inicio
            cargarColaboradoresLocales();
        }
    }, [activeTab]);

    // --- CARGA DE COLABORADORES (HÍBRIDA: LOCAL + EXTERNA) ---
    const cargarColaboradoresLocales = async () => {
        setIsLoadingList(true);
        try {
            const dataLocales = await getColaboradores();
            // Formateamos para unificar estructura
            const localesFormateados = dataLocales.map(u => ({
                Nombre: u.NombreCompleto,
                Cedula: u.CedulaUsuario,
                Cargo: u.Cargo || 'Sin cargo',
                Tipo: 'Local',
                // Guardamos ID local por si se necesita, aunque usaremos cédula
                ID_Usuario: u.ID_Usuario 
            }));
            setLista(localesFormateados);
        } catch (error) { console.error(error); } 
        finally { setIsLoadingList(false); }
    };

    const buscarColaboradoresGlobal = async (texto) => {
        if (!texto.trim()) {
            cargarColaboradoresLocales();
            return;
        }

        setIsLoadingList(true);
        try {
            // 1. Buscar Externos (API Gosen)
            const externos = await buscarUsuarioExterno(texto);
            
            // 2. Traer locales actuales (o filtrar si ya están cargados)
            const dataLocales = await getColaboradores();
            const localesFiltrados = dataLocales.filter(u => 
                (u.NombreCompleto || '').toLowerCase().includes(texto.toLowerCase()) || 
                (u.CedulaUsuario || '').includes(texto)
            ).map(u => ({
                Nombre: u.NombreCompleto,
                Cedula: u.CedulaUsuario,
                Cargo: u.Cargo || 'Usuario del Sistema',
                Tipo: 'Local',
                ID_Usuario: u.ID_Usuario
            }));

            // 3. Unificar Listas (Prioridad: Local sobre Externo si la cédula se repite)
            const mapaUnificado = new Map();

            // Primero agregamos externos
            externos.forEach(ext => {
                mapaUnificado.set(ext.Cedula, { ...ext, Tipo: 'Externo' });
            });

            // Luego sobreescribimos con locales (si existen, tienen prioridad)
            localesFiltrados.forEach(loc => {
                mapaUnificado.set(loc.Cedula, loc);
            });

            setLista(Array.from(mapaUnificado.values()));

        } catch (error) { 
            console.error(error); 
        } finally { 
            setIsLoadingList(false); 
        }
    };

    // --- CARGA DE ACTIVOS (MÁQUINAS Y VEHÍCULOS) ---
    const cargarActivos = async () => {
        setIsLoadingList(true);
        try {
            const data = await getActivosTodos();
            setLista(data);
        } catch (error) { console.error(error); } 
        finally { setIsLoadingList(false); }
    };

    // --- MANEJO DE BÚSQUEDA ---
    const handleBusquedaChange = (e) => {
        setBusqueda(e.target.value);
    };

    const handleBusquedaKeyDown = (e) => {
        if (e.key === 'Enter' && activeTab === 'colaboradores') {
            buscarColaboradoresGlobal(busqueda);
        }
    };

    // --- SELECCIÓN Y CARGA DE HISTORIAL ---
    const handleSeleccionar = async (item) => {
        setSeleccionado(item);
        setHistorial([]); 
        setIsLoadingHistory(true);
        try {
            if (activeTab === 'colaboradores') {
                // USAMOS LA CÉDULA para traer historial (Local o Externo)
                const data = await getHistorialColaborador(item.Cedula);
                setHistorial(data);
            } else {
                // USAMOS EL ID DEL ACTIVO
                const data = await getHistorialActivo(item.ID_Activo);
                setHistorial(data);
            }
        } catch (error) { 
            console.error(error); 
        } finally { 
            setIsLoadingHistory(false); 
        }
    };

    // --- FILTRADO VISUAL (CORREGIDO EL ERROR AQUÍ) ---
    const listaVisual = useMemo(() => {
        // Si estamos en colaboradores, la lista ya viene filtrada por la búsqueda API (si se usó enter)
        // o muestra los locales. Hacemos un filtrado ligero por si acaso.
        const texto = busqueda.toLowerCase();

        return lista.filter(item => {
            if (activeTab === 'colaboradores') {
                // Validación de nulos con ( || '')
                const nombre = item.Nombre || '';
                const cedula = item.Cedula || '';
                return nombre.toLowerCase().includes(texto) || cedula.includes(texto);
            } else {
                // CORRECCIÓN DEL ERROR: Validación de nulos para Activos
                const nombre = item.NombreDescriptivo || '';
                const codigo = item.CodigoIdentificador || '';
                const tipo = item.TipoActivo || '';
                
                return nombre.toLowerCase().includes(texto) || 
                       codigo.toLowerCase().includes(texto) ||
                       tipo.toLowerCase().includes(texto);
            }
        });
    }, [lista, busqueda, activeTab]);

    // Icono según tipo de evento
    const getIconoEvento = (tipo) => {
        const t = (tipo || '').toLowerCase(); // Validación de null
        if (t.includes('examen')) return <BsFileEarmarkMedical style={{color:'#e91e63'}}/>;
        if (t.includes('documento')) return <BsFileText style={{color:'#007BFF'}}/>;
        if (t.includes('inspección') || t.includes('inspeccion')) return <BsClipboardCheck style={{color:'#28a745'}}/>;
        if (t.includes('mantenimiento')) return <BsTools style={{color:'#fd7e14'}}/>;
        if (t.includes('reporte')) return <BsConeStriped style={{color:'#dc3545'}}/>;
        if (t.includes('licencia')) return <BsPersonVcard style={{color:'#6f42c1'}}/>;
        if (t.includes('registro')) return <BsClockHistory style={{color:'#6c757d'}}/>;
        return <BsClockHistory style={{color:'#6c757d'}}/>;
    };

    return (
        <div className="page-container" style={{height:'90vh', display:'flex', flexDirection:'column', overflow:'hidden'}}>
            
            <div className="page-header" style={{flexShrink:0, marginBottom:'1rem'}}>
                <h1>Historial y Trazabilidad</h1>
            </div>

            {/* TABS SUPERIORES */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1rem'}}>
                <button className={`btn ${activeTab==='colaboradores'?'btn-primary':'btn-secondary'}`} onClick={()=>setActiveTab('colaboradores')}>
                    <BsPersonBadge /> Colaboradores
                </button>
                <button className={`btn ${activeTab==='activos'?'btn-primary':'btn-secondary'}`} onClick={()=>setActiveTab('activos')}>
                    <BsTruck /> Máquinas y Vehículos
                </button>
            </div>

            {/* CONTENEDOR DIVIDIDO */}
            <div style={{display:'flex', gap:'1.5rem', flex:1, overflow:'hidden'}}>
                
                {/* --- PANEL IZQUIERDO: LISTA --- */}
                <div style={{width:'350px', display:'flex', flexDirection:'column', backgroundColor:'white', borderRadius:'10px', border:'1px solid #dee2e6', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                    
                    {/* Buscador */}
                    <div style={{padding:'1rem', borderBottom:'1px solid #eee'}}>
                        <div className="search-input-container" style={{width:'100%'}}>
                            <BsSearch style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'#999'}}/>
                            <input 
                                className="form-control" 
                                placeholder={activeTab==='colaboradores' ? "Nombre/Cédula + Enter (Externos)" : "Buscar activo..."} 
                                style={{paddingLeft:'35px', borderRadius:'20px'}}
                                value={busqueda}
                                onChange={handleBusquedaChange}
                                onKeyDown={handleBusquedaKeyDown} 
                            />
                        </div>
                        {activeTab === 'colaboradores' && <small style={{color:'#999', fontSize:'0.75rem', marginLeft:'10px'}}>Presiona Enter para buscar en base externa</small>}
                    </div>

                    {/* Lista Scrolleable */}
                    <div style={{flex:1, overflowY:'auto', padding:'0.5rem'}}>
                        {isLoadingList ? <p style={{textAlign:'center', padding:'1rem'}}>Cargando...</p> : (
                            listaVisual.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => handleSeleccionar(item)}
                                    style={{
                                        padding:'1rem', marginBottom:'5px', borderRadius:'8px', cursor:'pointer', border:'1px solid transparent',
                                        backgroundColor: (seleccionado && (
                                            (activeTab === 'colaboradores' && seleccionado.Cedula === item.Cedula) || 
                                            (activeTab === 'activos' && seleccionado.ID_Activo === item.ID_Activo)
                                        )) ? '#e7f1ff' : 'white',
                                        borderColor: (seleccionado && (
                                            (activeTab === 'colaboradores' && seleccionado.Cedula === item.Cedula) || 
                                            (activeTab === 'activos' && seleccionado.ID_Activo === item.ID_Activo)
                                        )) ? '#007BFF' : 'transparent'
                                    }}
                                    className="hover-bg-light"
                                >
                                    {activeTab === 'colaboradores' ? (
                                        <>
                                            <div style={{display:'flex', justifyContent:'space-between'}}>
                                                <div style={{fontWeight:'bold', color:'#333'}}>{item.Nombre}</div>
                                                {item.Tipo === 'Externo' && <span className="status-pill status-pendiente" style={{fontSize:'0.6rem', padding:'2px 5px'}}>Ext</span>}
                                            </div>
                                            <small style={{color:'#666'}}>CC: {item.Cedula} <br/> {item.Cargo}</small>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{fontWeight:'bold', color:'#333'}}>{item.NombreDescriptivo}</div>
                                            <small style={{color:'#666'}}>ID: {item.CodigoIdentificador} | {item.TipoActivo}</small>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                        {listaVisual.length === 0 && !isLoadingList && <p style={{textAlign:'center', color:'#999', padding:'1rem'}}>No hay resultados.</p>}
                    </div>
                </div>

                {/* --- PANEL DERECHO: TIMELINE --- */}
                <div style={{flex:1, backgroundColor:'white', borderRadius:'10px', border:'1px solid #dee2e6', padding:'2rem', overflowY:'auto', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                    
                    {!seleccionado ? (
                        <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#999', flexDirection:'column'}}>
                            <BsClockHistory style={{fontSize:'3rem', marginBottom:'1rem', opacity:0.3}}/>
                            <h3>Selecciona un elemento</h3>
                            <p>Haz clic en la lista izquierda para ver su hoja de vida.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{borderBottom:'2px solid #f0f0f0', paddingBottom:'1rem', marginBottom:'2rem', display:'flex', alignItems:'center', gap:'15px'}}>
                                <div style={{width:'60px', height:'60px', backgroundColor:'#e9ecef', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', color:'#005A5B'}}>
                                    {activeTab === 'colaboradores' ? <BsPersonBadge/> : <BsLaptop/>}
                                </div>
                                <div>
                                    <h2 style={{margin:0, color:'#005A5B'}}>
                                        {activeTab === 'colaboradores' ? seleccionado.Nombre : seleccionado.NombreDescriptivo}
                                    </h2>
                                    <p style={{margin:0, color:'#666'}}>
                                        {activeTab === 'colaboradores' 
                                            ? `Historial Laboral - Cédula: ${seleccionado.Cedula}` 
                                            : `Historial del Equipo - Código: ${seleccionado.CodigoIdentificador}`}
                                    </p>
                                    {activeTab === 'colaboradores' && (
                                        <small style={{color:'#007BFF'}}>{seleccionado.Cargo}</small>
                                    )}
                                </div>
                            </div>

                            {isLoadingHistory ? <p style={{textAlign:'center'}}>Cargando historial...</p> : (
                                <div className="timeline-container">
                                    {historial.length === 0 ? (
                                        <div style={{textAlign:'center', padding:'2rem', color:'#666', border:'2px dashed #eee', borderRadius:'10px'}}>
                                            <p>No hay eventos registrados en el historial de este ítem.</p>
                                            <small>Aquí aparecerán exámenes, documentos, reportes y mantenimientos.</small>
                                        </div>
                                    ) : (
                                        historial.map((evento, idx) => (
                                            <div key={idx} style={{display:'flex', marginBottom:'1.5rem', position:'relative'}}>
                                                {/* Línea vertical (truco visual) */}
                                                {idx !== historial.length - 1 && (
                                                    <div style={{position:'absolute', left:'24px', top:'40px', bottom:'-30px', width:'2px', backgroundColor:'#e9ecef'}}></div>
                                                )}
                                                
                                                {/* Icono */}
                                                <div style={{
                                                    width:'50px', height:'50px', borderRadius:'50%', backgroundColor:'#f8f9fa', 
                                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem',
                                                    border:'2px solid #e9ecef', zIndex:2, marginRight:'1.5rem', flexShrink:0
                                                }}>
                                                    {getIconoEvento(evento.TipoEvento)}
                                                </div>

                                                {/* Contenido */}
                                                <div style={{flex:1, backgroundColor:'#fff', border:'1px solid #f0f0f0', borderRadius:'8px', padding:'1rem', boxShadow:'0 2px 4px rgba(0,0,0,0.02)', transition:'transform 0.2s'}}>
                                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                                        <strong style={{color:'#005A5B', fontSize:'1rem'}}>{evento.TipoEvento}</strong>
                                                        <span style={{fontSize:'0.85rem', color:'#999', fontWeight:'600'}}>
                                                            {new Date(evento.Fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p style={{margin:0, color:'#555', fontSize:'0.95rem'}}>{evento.Descripcion}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default HistorialPage;