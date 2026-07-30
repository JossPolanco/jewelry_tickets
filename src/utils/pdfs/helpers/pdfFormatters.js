/**
 * ═════════════════════════════════════════════════════════════════════════════
 * UTILIDADES DE FORMATO Y CONVERSIÓN DE TEXTO PARA DOCUMENTOS PDF
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 * PROVEE FUNCIONES PURAS Y ESTÁNDARES PARA FORMATEAR MONEDAS, FECHAS, FOLIOS,
 * ETIQUETAS Y ESTILOS EN CUALQUIER REPORTE O DOCUMENTO PDF DEL SISTEMA.
 */

import { ITEM_TYPES } from '../../orders/item_types';
import { SERVICE_TYPES } from '../../orders/service_types';

/**
 * FORMATEA UN NÚMERO A MONEDA MEXICANA (MXN)
 * EJEMPLO: 2000 -> "$2,000.00"
 */
export function formatCurrency(amount) {
    const val = Number(amount);
    if (isNaN(val)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(val);
}

/**
 * FORMATEA FECHAS ISO O CADENAS DE FECHA A DD/MM/YYYY
 * EJEMPLO: "2026-07-29T00:11:21" -> "29/07/2026"
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return dateString;
    }
}

/**
 * FORMATEA EL NÚMERO DE FOLIO RELLENANDO CON CEROS A LA IZQUIERDA
 * EJEMPLO: 7 -> "#00007"
 */
export function formatFolio(folio) {
    if (folio === undefined || folio === null) return '#00000';
    return `#${String(folio).padStart(5, '0')}`;
}

/**
 * TRADUCE O OBTIENE LA ETIQUETA EN ESPAÑOL DEL TIPO DE PIEZA DE JOYERÍA
 */
export function getItemLabel(typeKey) {
    return ITEM_TYPES[typeKey] || typeKey || 'Pieza';
}

/**
 * TRADUCE O OBTIENE LA ETIQUETA EN ESPAÑOL DEL SERVICIO SOLICITADO
 */
export function getServiceLabel(serviceKey) {
    return SERVICE_TYPES[serviceKey] || serviceKey || 'Servicio';
}

/**
 * RETORNA LOS ESTILOS DE COLOR DE @REACT-PDF/RENDERER SEGÚN EL ESTADO DE LA ORDEN
 */
export function getStatusStyle(status = '') {
    const s = String(status).toLowerCase();
    if (s.includes('pendiente')) return { backgroundColor: '#FEF3C7', color: '#92400E' };
    if (s.includes('listo')) return { backgroundColor: '#D1FAE5', color: '#065F46' };
    if (s.includes('entregado')) return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
    if (s.includes('proceso') || s.includes('reparación')) return { backgroundColor: '#E0E7FF', color: '#3730A3' };
    if (s.includes('recibido')) return { backgroundColor: '#F3E8FF', color: '#6B21A8' };
    return { backgroundColor: '#F1F5F9', color: '#334155' };
}
