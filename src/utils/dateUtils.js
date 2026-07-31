/**
 * ═════════════════════════════════════════════════════════════════════════════
 * UTILIDADES DE FORMATEO Y MANEJO DE FECHAS
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Evita errores de zona horaria (como fechas que retroceden un día al ser 
 * interpretadas en UTC por defecto en navegadores).
 */

/**
 * Convierte una cadena de fecha a un objeto Date local sin desfase horaria.
 * @param {string|Date} dateString - Cadena de fecha (ej. "2026-08-01" o "2026-08-01T00:00:00")
 * @returns {Date|null}
 */
export function parseLocalDate(dateString) {
    if (!dateString) return null;
    if (dateString instanceof Date) return isNaN(dateString.getTime()) ? null : dateString;

    const str = String(dateString).trim();
    if (!str) return null;

    const datePart = str.split('T')[0];
    const parts = datePart.split('-');

    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const hasExplicitTime = str.includes('T') &&
                !str.endsWith('T00:00:00') &&
                !str.endsWith('T00:00:00.000Z') &&
                !str.endsWith('T00:00:00+00:00');

            if (!hasExplicitTime) {
                return new Date(year, month, day);
            }
        }
    }

    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formatea una fecha en formato legible en español.
 * @param {string|Date} dateString - Fecha a formatear
 * @param {Object} [options] - Opciones para toLocaleDateString
 * @param {string} [locale='es-ES'] - Configuración regional
 * @returns {string}
 */
export function formatDate(
    dateString,
    options = { year: 'numeric', month: 'short', day: 'numeric' },
    locale = 'es-ES'
) {
    if (!dateString) return '—';
    try {
        const date = parseLocalDate(dateString);
        if (!date) return String(dateString);
        return date.toLocaleDateString(locale, options);
    } catch {
        return String(dateString);
    }
}
