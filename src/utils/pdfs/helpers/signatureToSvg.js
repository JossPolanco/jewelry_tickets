/**
 * ═════════════════════════════════════════════════════════════════════════════
 * UTILIDAD DE CONVERSIÓN DE FIRMAS DIGITALES PARA DOCUMENTOS PDF
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 * CONVIERTE EL ARRAY DE TRAZOS Y COORDENADAS PROVENIENTES DE REACT-SIGNATURE-CANVAS
 * O CUALQUIER OTRA LIBRERÍA DE FIRMA DIGITAL A UNA IMAGEN SVG EN FORMATO BASE64.
 * 
 * USO EN OTROS COMPONENTES PDF:
 * IMPORTA ESTA FUNCIÓN Y PÁSALE EL OBJETO O STRING 'signature_data' RECIBIDO DE LA BASE DE DATOS:
 * const signatureUrl = convertSignatureToSvgDataUrl(order.signature_data);
 * <Image src={signatureUrl} style={styles.signatureImage} />
 */

export function convertSignatureToSvgDataUrl(signatureData) {
    if (!signatureData) return null;

    let strokes = signatureData;
    if (typeof strokes === 'string') {
        if (strokes.startsWith('data:image/') || strokes.startsWith('http://') || strokes.startsWith('https://')) {
            return strokes;
        }
        try {
            strokes = JSON.parse(strokes);
        } catch {
            return null;
        }
    }

    if (!Array.isArray(strokes) || strokes.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasPoints = false;

    strokes.forEach(stroke => {
        if (Array.isArray(stroke)) {
            stroke.forEach(pt => {
                if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
                    hasPoints = true;
                    if (pt.x < minX) minX = pt.x;
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y < minY) minY = pt.y;
                    if (pt.y > maxY) maxY = pt.y;
                }
            });
        }
    });

    if (!hasPoints || minX === Infinity) return null;

    const padding = 12;
    const width = Math.max(maxX - minX + padding * 2, 120);
    const height = Math.max(maxY - minY + padding * 2, 60);

    const paths = strokes.map(stroke => {
        if (!Array.isArray(stroke) || stroke.length === 0) return '';
        const points = stroke.filter(pt => pt && typeof pt.x === 'number' && typeof pt.y === 'number');
        if (points.length === 0) return '';
        if (points.length === 1) {
            const x = (points[0].x - minX + padding).toFixed(2);
            const y = (points[0].y - minY + padding).toFixed(2);
            return `<circle cx="${x}" cy="${y}" r="2" fill="#0f172a" />`;
        }
        const d = points.map((pt, idx) => {
            const x = (pt.x - minX + padding).toFixed(2);
            const y = (pt.y - minY + padding).toFixed(2);
            return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        }).join(' ');
        return `<path d="${d}" stroke="#0f172a" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
    }).filter(Boolean).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths}</svg>`;

    try {
        const base64 = typeof window !== 'undefined'
            ? window.btoa(unescape(encodeURIComponent(svg)))
            : (typeof Buffer !== 'undefined' ? Buffer.from(svg).toString('base64') : '');
        return `data:image/svg+xml;base64,${base64}`;
    } catch {
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
}
