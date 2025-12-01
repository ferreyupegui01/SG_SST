// frontend/src/componentes/InspeccionDetalleRenderer.jsx

import React from 'react';
import '../style/InspeccionesPage.css'; 
import '../index.css'; 

// DICCIONARIOS LEGADOS (Para compatibilidad histórica con inspecciones viejas)
// NO BORRAR hasta que se depure la data antigua
const DICTIONARIES = {
    'FTO-SST-02': { doc_soat: 'SOAT Vigente', doc_tecnomecanica: 'Revisión Tecnomecánica Vigente', doc_licencia: 'Licencia de Conducción Vigente', doc_tarjeta_op: 'Tarjeta de Operación', eq_gato: 'Gato con capacidad', eq_cruceta: 'Cruceta', eq_llanta_rep: 'Llanta de Repuesto', eq_herramienta: 'Herramienta Básica', eq_botiquin: 'Botiquín', eq_extintor: 'Extintor', eq_tacos: 'Tacos para bloquear', eq_senales: 'Señales de carretera', rev_luces_altas: 'Luces Altas y Bajas', rev_direccionales: 'Luces Direccionales', rev_stop: 'Luces de Stop', rev_reversa: 'Luces de Reversa', rev_frenos: 'Frenos', rev_llantas_est: 'Estado Llantas', rev_limpiabrisas: 'Limpiaparabrisas', rev_espejos: 'Espejos', rev_pito: 'Pito', epp_guantes: 'Guantes', epp_casco: 'Casco', flu_aceite: 'Nivel Aceite Motor', flu_liq_frenos: 'Nivel Líquido de Frenos', flu_agua: 'Nivel Agua/Refrigerante' },
    'FTO-SST-13': { item1_ubicacion: '1. ¿Está en la ubicación asignada?', item2_senalizacion: '2. ¿La señalización es visible y adecuada?', item3_acceso: '3. ¿El acceso al extintor está libre de obstáculos?', item4_manometro: '4. ¿El manómetro indica la presión adecuada?', item5_seguro: '5. ¿El seguro y sello de garantía están intactos?', item6_manguera: '6. ¿La manguera y boquilla están en buen estado?', item7_etiqueta_vencimiento: '7. ¿La etiqueta de vencimiento está vigente?' },
    'FTO-SST-14': { item_gasas: 'Gasas limpias', item_esparadrapo: 'Esparadrapo de tela', item_baja_lenguas: 'Baja lenguas', item_curas: 'Curitas', item_venda_ela_2: 'Venda elástica 2x5', item_venda_ela_3: 'Venda elástica 3x5', item_venda_alg: 'Venda de algodón 3x5', item_yodopovidona: 'Yodopovidona', item_sol_salina: 'Solución salina', item_guantes: 'Guantes de látex', item_tijeras: 'Tijeras', item_termometro: 'Termómetro' },
    'FTO-SST-23': { cla_necesarios: 'Se conservan solo elementos necesarios', cla_obsoletos: 'Se retiran elementos obsoletos', ord_lugar: 'Un lugar para cada cosa', ord_identificados: 'Áreas identificadas', ord_pasillos: 'Pasillos despejados', lim_pisos: 'Pisos/paredes limpios', lim_maquinas: 'Maquinaria limpia', lim_puntos: 'Puntos ecológicos limpios', est_controles: 'Controles visuales', est_rutinas: 'Rutinas de aseo', dis_habito: 'Hábito de orden', dis_epp: 'Uso de EPP' },
    'FTO-SST-45': { maq_guardas: 'Guardas de seguridad', maq_parada_e: 'Paradas de emergencia', maq_mantenimiento: 'Mantenimiento preventivo', esc_estado: 'Escaleras fijas', esc_manuales: 'Escaleras manuales', esc_andamios: 'Andamios', inst_pisos: 'Pisos', inst_iluminacion: 'Iluminación', inst_ventilacion: 'Ventilación', alm_estanterias: 'Estanterías', alm_materiales: 'Apilamiento materiales', epp_uso: 'Uso EPP', epp_estado: 'Estado EPP', em_rutas: 'Rutas evacuación', em_salidas: 'Salidas emergencia', em_extintores: 'Extintores', em_botiquin: 'Botiquín' },
    'FTO-SST-95': { alm_area: 'Área ventilada', alm_compatibilidad: 'Compatibilidad química', alm_envases: 'Envases rotulados', alm_hojas_seg: 'Hojas de seguridad', alm_diques: 'Diques contención', man_trasvase: 'Trasvase seguro', man_personal: 'Personal capacitado', epp_guantes: 'Guantes nitrilo', epp_gafas: 'Gafas seguridad', epp_respirador: 'Protección respiratoria', em_kit: 'Kit derrames', em_ducha: 'Ducha emergencia' },
    'FTO-SST-96': { tab_senalizados: 'Tableros señalizados', tab_libres: 'Acceso libre', tab_tapas: 'Tapas protección', tab_polo: 'Polo a tierra', con_estado: 'Cables buen estado', con_canalizacion: 'Canalizados', tom_estado: 'Tomas buen estado', tom_sobrecarga: 'Sin sobrecarga', ext_uso: 'Extensiones temporal', ext_estado: 'Estado extensiones', epp_dielectrico: 'EPP Dieléctrico' }
};

const RenderValor = ({ valor }) => {
    let clase = '';
    // Mapeo de valores viejos (B, M, R) a nuevos (C, NC, NA) para color
    if (['B', 'C', 'OK'].includes(valor)) clase = 'status-activo'; 
    else if (['R', 'M', 'NC', 'No Cumple'].includes(valor)) clase = 'status-pendiente'; 
    else if (['NA', 'N/A'].includes(valor)) clase = 'status-inactivo'; 
    else clase = 'status-inactivo'; 

    return <span className={`status-pill ${clase}`} style={{ width: '45px', textAlign: 'center', flexShrink: 0 }}>{valor}</span>;
};

const InspeccionDetalleRenderer = ({ formId, jsonString }) => {
    if (!jsonString) return <p>No hay datos registrados.</p>;

    let data;
    try {
        data = JSON.parse(jsonString);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
        return <p className="modal-error">Error al leer los datos (JSON inválido).</p>;
    }

    // 1. Intentar obtener diccionario legacy
    const dictionary = DICTIONARIES[formId] || {};
    
    // 2. Normalizar los datos
    let items = [];
    let observacionesGenerales = '';
    let infoAdicional = '';
    let otroActivo = '';

    if (Array.isArray(data)) {
        // Formato SQL (Poco común ahora)
        items = data;
    } else {
        // Formato Objeto JS (Estándar del proyecto)
        observacionesGenerales = data.observacionesFormulario || '';
        infoAdicional = data.infoAdicionalActivo || '';
        otroActivo = data.otroActivoMencionado || '';
        
        if (data.checklist) {
            items = Object.entries(data.checklist).map(([key, val]) => {
                const respuesta = (typeof val === 'object' && val !== null) ? val.respuesta : val;
                const observacion = (typeof val === 'object' && val !== null) ? val.observacion : '';
                // --- RECUPERAR TEXTO GUARDADO (NUEVO) ---
                const textoPregunta = (typeof val === 'object' && val !== null) ? val.textoPregunta : null;

                return { key, respuesta, observacion, textoPregunta };
            });
        }
    }

    return (
        <div className="form-checklist-container">

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
            
            {items.map((item, index) => {
                if (!item.respuesta) return null;
                
                // LÓGICA DE VISUALIZACIÓN:
                // 1. Usar texto guardado en JSON (Nuevas inspecciones)
                // 2. Usar diccionario hardcodeado (Inspecciones viejas)
                // 3. Usar el código clave (Fallback)
                const label = item.textoPregunta || dictionary[item.key] || item.key;
                
                return (
                    <div key={index} className="checklist-item-wrapper">
                        <div className="checklist-item">
                            <label className="item-label">{label}</label>
                            <RenderValor valor={item.respuesta} />
                        </div>
                        {item.observacion && (
                            <div className="checklist-item-observacion" style={{ paddingLeft: '0.5rem', marginTop: '0.25rem' }}>
                                <em style={{ color: '#6c757d', fontSize: '0.9rem' }}>Obs: {item.observacion}</em>
                            </div>
                        )}
                    </div>
                );
            })}
            
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