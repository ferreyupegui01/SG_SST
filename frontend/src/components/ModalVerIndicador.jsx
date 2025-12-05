// frontend/src/components/ModalVerIndicador.jsx

import React from 'react';
import '../style/Modal.css';
import '../index.css'; 
import '../style/InspeccionesPage.css';
import { BsCalendarEvent, BsGraphUp, BsChatLeftText, BsCalculator, BsBraces, BsX, BsCheck2Circle, BsXCircle } from 'react-icons/bs';

const ModalVerIndicador = ({ indicador, alCerrar }) => {
    if (!indicador) return null;

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    // --- PARSER INTELIGENTE ---
    // Convierte el string técnico "[Fórmula: ... | K: ...] Valores: ..." en objetos usables
    const parsearDatosTecnicos = (textoAnalisis) => {
        const resultado = {
            formula: 'Estándar',
            constante: 100,
            variables: [],
            comentario: ''
        };

        if (!textoAnalisis) return resultado;

        // 1. Separar parte técnica del comentario
        let parteTecnica = "";
        let parteComentario = textoAnalisis;

        if (textoAnalisis.includes('///')) {
            const parts = textoAnalisis.split('///');
            parteTecnica = parts[0];
            parteComentario = parts[1];
        } else if (textoAnalisis.includes(']')) {
            const splitIndex = textoAnalisis.lastIndexOf('}');
            if (splitIndex !== -1) {
                parteTecnica = textoAnalisis.substring(0, splitIndex + 1);
                parteComentario = textoAnalisis.substring(splitIndex + 1);
            }
        }

        // Limpieza del comentario
        if(parteComentario) {
            parteComentario = parteComentario.replace(/^->/, '').trim();
            resultado.comentario = parteComentario;
        }

        // 2. Extraer datos con Regex
        try {
            const matchFormula = parteTecnica.match(/Fórmula: (.*?) \|/);
            if (matchFormula) resultado.formula = matchFormula[1];

            const matchK = parteTecnica.match(/K: (\d+)/);
            if (matchK) resultado.constante = matchK[1];

            const matchVars = parteTecnica.match(/Valores: \{(.*?)\}/);
            if (matchVars) {
                const varsString = matchVars[1]; 
                // Separar por comas pero cuidando paréntesis
                const varsArray = varsString.split(',');
                
                resultado.variables = varsArray.map(v => {
                    // v viene como: "v1(Total Horas): 150"
                    const parts = v.trim().split(':');
                    if (parts.length === 2) {
                        const izquierda = parts[0].trim(); // "v1(Total Horas)"
                        const valor = parts[1].trim();     // "150"
                        
                        // Separar código y etiqueta
                        const matchLabel = izquierda.match(/(v\d+)\((.*?)\)/);
                        if (matchLabel) {
                            return { code: matchLabel[1], label: matchLabel[2], val: valor };
                        }
                        return { code: izquierda, label: izquierda, val: valor };
                    }
                    return null;
                }).filter(Boolean);
            }
        } catch (e) { console.error("Error parseando detalle", e); }

        return resultado;
    };

    const info = parsearDatosTecnicos(indicador.Analisis);

    // Embellecer la fórmula matemática (reemplazar símbolos de prog por símbolos mate)
    const formulaBonita = info.formula
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/\+/g, ' + ')
        // eslint-disable-next-line no-useless-escape
        .replace(/\-/g, ' - ');

    // eslint-disable-next-line no-unused-vars
    const cumple = indicador.Resultado >= indicador.Meta; // Lógica simple visual (ajustar si usas operador)

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" style={{maxWidth: '850px'}} onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Ficha Técnica del Indicador</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '0 1rem' }}>
                    
                    {/* CABECERA: TÍTULO Y FECHA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom:'1rem' }}>
                        <div>
                            <small style={{color: '#999', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>KPI / Indicador</small>
                            <h3 style={{ margin: '5px 0 0 0', color: '#005A5B', fontSize: '1.6rem' }}>{indicador.NombreIndicador}</h3>
                        </div>
                        <div className="status-pill status-proceso" style={{fontSize: '1.1rem', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <BsCalendarEvent /> {meses[indicador.Mes - 1]} {indicador.Anio}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        
                        {/* COLUMNA IZQUIERDA: MATEMÁTICA */}
                        <div>
                            <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px'}}>
                                <BsCalculator /> Estructura Matemática
                            </h4>
                            
                            {/* CAJA DE FÓRMULA */}
                            <div style={{backgroundColor:'#f8f9fa', border:'1px solid #e9ecef', borderRadius:'10px', padding:'1.5rem', textAlign:'center', marginBottom:'1.5rem'}}>
                                <div style={{fontFamily:'monospace', fontSize:'1.3rem', color:'#333', marginBottom:'0.5rem'}}>
                                    {formulaBonita} 
                                    {parseInt(info.constante) !== 1 && <span style={{color:'#d63384'}}> × {parseInt(info.constante).toLocaleString()}</span>}
                                </div>
                                <small style={{color:'#999'}}>Fórmula Base aplicada al cálculo</small>
                            </div>

                            {/* LISTA DE VARIABLES */}
                            <h5 style={{marginTop:0, color:'#666', display:'flex', alignItems:'center', gap:'8px', fontSize:'0.95rem'}}>
                                <BsBraces /> Variables Registradas
                            </h5>
                            <ul style={{listStyle:'none', padding:0, margin:0}}>
                                {info.variables.length > 0 ? (
                                    info.variables.map((v, idx) => (
                                        <li key={idx} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #f0f0f0', alignItems:'center'}}>
                                            <div>
                                                <span style={{fontWeight:'bold', color:'#007BFF', marginRight:'8px'}}>{v.code}</span>
                                                <span style={{color:'#555'}}>{v.label}</span>
                                            </div>
                                            <span style={{fontWeight:'bold', fontSize:'1.1rem', color:'#333'}}>{v.val}</span>
                                        </li>
                                    ))
                                ) : (
                                    // Fallback para datos viejos
                                    <>
                                        <li style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #f0f0f0'}}>
                                            <span>Numerador (Legacy)</span>
                                            <strong>{indicador.Numerador}</strong>
                                        </li>
                                        <li style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #f0f0f0'}}>
                                            <span>Denominador (Legacy)</span>
                                            <strong>{indicador.Denominador}</strong>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* COLUMNA DERECHA: RESULTADOS Y ANÁLISIS */}
                        <div>
                            <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px'}}>
                                <BsGraphUp /> Desempeño
                            </h4>

                            <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem'}}>
                                {/* TARJETA RESULTADO */}
                                <div style={{flex:1, backgroundColor:'#e6f7ec', border:'1px solid #c3e6cb', borderRadius:'10px', padding:'1rem', textAlign:'center'}}>
                                    <div style={{color:'#155724', fontSize:'0.85rem', fontWeight:'bold', textTransform:'uppercase'}}>Resultado</div>
                                    <div style={{fontSize:'2.5rem', fontWeight:'800', color:'#155724', lineHeight:'1.2'}}>
                                        {indicador.Resultado?.toFixed(2)}
                                    </div>
                                </div>
                                {/* TARJETA META */}
                                <div style={{flex:1, backgroundColor:'#fff', border:'1px solid #dee2e6', borderRadius:'10px', padding:'1rem', textAlign:'center'}}>
                                    <div style={{color:'#666', fontSize:'0.85rem', fontWeight:'bold', textTransform:'uppercase'}}>Meta</div>
                                    <div style={{fontSize:'2.5rem', fontWeight:'800', color:'#666', lineHeight:'1.2'}}>
                                        {indicador.Meta}
                                    </div>
                                </div>
                            </div>

                            {/* ANÁLISIS CUALITATIVO */}
                            <div className="detail-section">
                                <h5 style={{marginTop:0, color:'#666', display:'flex', alignItems:'center', gap:'8px', fontSize:'0.95rem'}}>
                                    <BsChatLeftText /> Análisis Cualitativo
                                </h5>
                                <div className="detail-box" style={{backgroundColor:'#fff', border:'1px solid #eee', minHeight:'120px', fontSize:'0.95rem', lineHeight:'1.6', color:'#444'}}>
                                    {info.comentario || <span style={{fontStyle:'italic', color:'#ccc'}}>No se registró análisis cualitativo para este periodo.</span>}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerIndicador;