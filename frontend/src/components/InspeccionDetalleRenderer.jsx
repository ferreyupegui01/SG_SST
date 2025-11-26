// frontend/src/componentes/InspeccionDetalleRenderer.jsx

import React from 'react';
import '../style/InspeccionesPage.css'; 
import '../index.css'; 

// --- DICCIONARIOS DE TRADUCCIÓN COMPLETOS (TODOS LOS FORMULARIOS) ---
const DICTIONARIES = {
    // 1. VEHÍCULOS (FTO-SST-02)
    'FTO-SST-02': { 
        doc_soat: 'SOAT Vigente', doc_tecnomecanica: 'Revisión Tecnomecánica Vigente',
        doc_licencia: 'Licencia de Conducción Vigente', doc_tarjeta_op: 'Tarjeta de Operación (si aplica)',
        eq_gato: 'Gato con capacidad', eq_cruceta: 'Cruceta', eq_llanta_rep: 'Llanta de Repuesto',
        eq_herramienta: 'Herramienta Básica', eq_botiquin: 'Botiquín', eq_extintor: 'Extintor (Vigente y Cargado)',
        eq_tacos: 'Tacos para bloquear', eq_senales: 'Señales de carretera',
        rev_luces_altas: 'Luces Altas y Bajas', rev_direccionales: 'Luces Direccionales',
        rev_stop: 'Luces de Stop', rev_reversa: 'Luces de Reversa', rev_frenos: 'Frenos (Pedal y Emergencia)',
        rev_llantas_est: 'Estado Llantas', rev_limpiabrisas: 'Limpiaparabrisas',
        rev_espejos: 'Espejos (Laterales y Retrovisor)', rev_pito: 'Pito',
        epp_guantes: 'Guantes', epp_casco: 'Casco (si aplica)',
        flu_aceite: 'Nivel Aceite Motor', flu_liq_frenos: 'Nivel Líquido de Frenos',
        flu_agua: 'Nivel Agua/Refrigerante',
    },
    // 2. EXTINTORES (FTO-SST-13)
    'FTO-SST-13': { 
        item1_ubicacion: '1. ¿Está en la ubicación asignada?',
        item2_senalizacion: '2. ¿La señalización es visible y adecuada?',
        item3_acceso: '3. ¿El acceso al extintor está libre de obstáculos?',
        item4_manometro: '4. ¿El manómetro indica la presión adecuada (en verde)?',
        item5_seguro: '5. ¿El seguro (pasador) y sello de garantía están intactos?',
        item6_manguera: '6. ¿La manguera y boquilla están en buen estado?',
        item7_etiqueta_vencimiento: '7. ¿La etiqueta de vencimiento de carga está vigente?',
    },
    // 3. BOTIQUÍN (FTO-SST-14)
    'FTO-SST-14': { 
        item_gasas: 'Gasas limpias (paquete)', item_esparadrapo: 'Esparadrapo de tela',
        item_baja_lenguas: 'Baja lenguas (paquete)', item_curas: 'Curitas (paquete)',
        item_venda_ela_2: 'Venda elástica 2x5', item_venda_ela_3: 'Venda elástica 3x5',
        item_venda_alg: 'Venda de algodón 3x5', item_yodopovidona: 'Yodopovidona (jabón)',
        item_sol_salina: 'Solución salina (250 o 500ml)', item_guantes: 'Guantes de látex (caja)',
        item_tijeras: 'Tijeras', item_termometro: 'Termómetro',
    },
    // 4. ORDEN Y ASEO (FTO-SST-23)
    'FTO-SST-23': { 
        cla_necesarios: 'Se conservan solo elementos necesarios', cla_obsoletos: 'Se retiran elementos obsoletos',
        ord_lugar: 'Un lugar para cada cosa y cada cosa en su lugar', ord_identificados: 'Áreas y elementos identificados',
        ord_pasillos: 'Pasillos y accesos despejados', lim_pisos: 'Pisos, paredes y techos limpios',
        lim_maquinas: 'Maquinaria y equipos limpios', lim_puntos: 'Puntos ecológicos/residuos limpios y ordenados',
        est_controles: 'Existen controles visuales y recordatorios', est_rutinas: 'Se siguen rutinas de orden y aseo',
        dis_habito: 'El personal demuestra hábito de orden y aseo', dis_epp: 'Uso de EPP según área',
    },
    // 5. SEGURIDAD GENERAL (FTO-SST-45)
    'FTO-SST-45': { 
        maq_guardas: 'Guardas de seguridad instaladas y en uso', maq_parada_e: 'Paradas de emergencia visibles y funcionales',
        maq_mantenimiento: 'Mantenimiento preventivo (sin fugas, ruidos)', esc_estado: 'Escaleras fijas (barandas, antideslizante)',
        esc_manuales: 'Escaleras manuales (estado, zapatas)', esc_andamios: 'Andamios (estabilidad, plataformas)',
        inst_pisos: 'Pisos (sin huecos, antideslizantes)', inst_iluminacion: 'Iluminación adecuada',
        inst_ventilacion: 'Ventilación adecuada', alm_estanterias: 'Estanterías (sin sobrecarga, ancladas)',
        alm_materiales: 'Materiales bien apilados', epp_uso: 'Uso correcto de EPP por el personal',
        epp_estado: 'Disponibilidad y estado de EPP', em_rutas: 'Rutas de evacuación despejadas',
        em_salidas: 'Salidas de emergencia funcionales', em_extintores: 'Extintores (accesibles, cargados)',
        em_botiquin: 'Botiquín (visible, con dotación)',
    },
    // 6. SUSTANCIAS QUÍMICAS (FTO-SST-95)
    'FTO-SST-95': { 
        alm_area: 'Área de almacenamiento ventilada y señalizada', alm_compatibilidad: 'Incompatibilidades químicas separadas',
        alm_envases: 'Envases rotulados y en buen estado', alm_hojas_seg: 'Hojas de seguridad (MSDS) disponibles',
        alm_diques: 'Sistemas de contención/diques para derrames', man_trasvase: 'Trasvase seguro (embudos, bombas)',
        man_personal: 'Personal capacitado en riesgos químicos', epp_guantes: 'Guantes de nitrilo/caucho',
        epp_gafas: 'Gafas de seguridad / Monogafas', epp_respirador: 'Protección respiratoria (si aplica)',
        em_kit: 'Kit anti-derrames disponible y completo', em_ducha: 'Ducha de emergencia / Lavaojos funcional',
    },
    // 7. RIESGO ELÉCTRICO (FTO-SST-96)
    'FTO-SST-96': { 
        tab_senalizados: 'Tableros eléctricos señalizados', tab_libres: 'Acceso libre de obstáculos',
        tab_tapas: 'Con tapas de protección y directorios', tab_polo: 'Conexión a polo a tierra',
        con_estado: 'Cables/Conductores en buen estado (sin uniones)', con_canalizacion: 'Canalizados (no expuestos)',
        tom_estado: 'Tomas e interruptores en buen estado (sin roturas)', tom_sobrecarga: 'Sin sobrecarga (no usar "multitomas")',
        ext_uso: 'Uso de extensiones solo temporal', ext_estado: 'Estado de extensiones (sin daños)',
        epp_dielectrico: 'Uso de EPP dieléctrico (si aplica)',
    }
};

// Componente pequeño para mostrar la 'píldora' de B/R/M/C/NC
const RenderValor = ({ valor }) => {
    let clase = '';
    if (valor === 'B' || valor === 'C') clase = 'status-activo'; 
    else if (valor === 'R' || valor === 'M' || valor === 'NC') clase = 'status-pendiente'; 
    else if (valor === 'NA') clase = 'status-inactivo'; 
    else clase = 'status-inactivo'; 

    return <span className={`status-pill ${clase}`} style={{ width: '45px', textAlign: 'center', flexShrink: 0 }}>{valor}</span>;
};

/**
 * @component InspeccionDetalleRenderer
 * @desc Renderiza el JSON (o Array) de 'DatosDiligenciados' de forma legible
 */
const InspeccionDetalleRenderer = ({ formId, jsonString }) => {
    // Si viene vacío
    if (!jsonString) return <p>No hay datos registrados.</p>;

    let data;
    try {
        data = JSON.parse(jsonString);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
        return <p className="modal-error">Error al leer los datos (JSON inválido).</p>;
    }

    // 1. Identificar el Diccionario
    const dictionary = DICTIONARIES[formId] || {};
    
    // 2. Normalizar los datos (Soportar formato Nuevo Array y Viejo Objeto)
    let items = [];
    let observacionesGenerales = '';
    let infoAdicional = '';
    let otroActivo = '';

    if (Array.isArray(data)) {
        // --- FORMATO NUEVO (SQL 'FOR JSON') ---
        // La BD devuelve un array de objetos [{key, respuesta, observacion}, ...]
        items = data;
    } else {
        // --- FORMATO VIEJO (Objeto JS guardado como string) ---
        // { checklist: {...}, observacionesFormulario: "...", infoAdicionalActivo: "..." }
        observacionesGenerales = data.observacionesFormulario || '';
        infoAdicional = data.infoAdicionalActivo || '';
        otroActivo = data.otroActivoMencionado || '';
        
        if (data.checklist) {
            items = Object.entries(data.checklist).map(([key, val]) => {
                // Algunos viejos pueden ser solo string "B", otros objetos {respuesta: "B"}
                const respuesta = (typeof val === 'object' && val !== null) ? val.respuesta : val;
                const observacion = (typeof val === 'object' && val !== null) ? val.observacion : '';
                return { key, respuesta, observacion };
            });
        }
    }

    // 3. Renderizar
    return (
        <div className="form-checklist-container">

            {/* Secciones de Info Adicional (Solo si vienen en el JSON antiguo o separado) */}
            {infoAdicional && (
                <div className="detail-section" style={{ paddingBottom: '1rem', borderBottom: '1px solid #f0f2f5' }}>
                    <strong>Información Adicional del Activo:</strong>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{infoAdicional}</p>
                </div>
            )}
            {otroActivo && (
                <div className="detail-section" style={{ paddingBottom: '1rem', borderBottom: '1px solid #f0f2f5' }}>
                    <strong>Activo/Área Relacionada:</strong>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{otroActivo}</p>
                </div>
            )}
            
            {/* Renderizado del Checklist */}
            {items.map((item, index) => {
                if (!item.respuesta) return null;
                
                // Busca el texto legible en el diccionario. Si no existe, usa la 'key' original.
                const label = dictionary[item.key] || item.key; 
                
                return (
                    <div key={index} className="checklist-item-wrapper">
                        <div className="checklist-item">
                            <label className="item-label">{label}</label>
                            <RenderValor valor={item.respuesta} />
                        </div>
                        {/* Muestra observación individual si existe */}
                        {item.observacion && (
                            <div className="checklist-item-observacion" style={{ paddingLeft: '0.5rem', marginTop: '0.25rem' }}>
                                <em style={{ color: '#6c757d', fontSize: '0.9rem' }}>Obs: {item.observacion}</em>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {/* Observaciones Generales (Formato Viejo) */}
            {observacionesGenerales && (
                <div className="detail-section" style={{marginTop: '1rem', borderTop: '1px solid #f0f2f5', paddingTop: '1rem'}}>
                    <strong>Observaciones Generales del Formulario:</strong>
                    <p className="detail-box">{observacionesGenerales}</p>
                </div>
            )}
        </div>
    );
};

export default InspeccionDetalleRenderer;