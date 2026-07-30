import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { ITEM_TYPES } from '../orders/item_types';
import { SERVICE_TYPES } from '../orders/service_types';
import { getImageById } from '@/services/images/imageMetadata';
import { getSignedUrl } from '@/services/images/imageUrl';
import { BUCKETS } from '@/services/images/imageUploader';
import { supabaseClient } from '@/utils/supabase';

// ═════════════════════════════════════════════════════════════════════════════
// ESTILOS DEL DOCUMENTO PDF EN @REACT-PDF/RENDERER
// CONFIGURACION DE PALETA DE COLORES, TIPOGRAFIA Y MAQUETADO DE LA ORDEN DE SERVICIO
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    page: {
        paddingTop: 28,
        paddingBottom: 35,
        paddingHorizontal: 32,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 8.5,
        color: '#1E293B',
    },
    // ENCABEZADO Y BADGE DE ESTADO
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 2,
        borderBottomColor: '#D97706',
        paddingBottom: 10,
        marginBottom: 12,
    },
    brandTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
        letterSpacing: 0.3,
    },
    brandSubtitle: {
        fontSize: 8.5,
        color: '#D97706',
        marginTop: 2,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    folioText: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
    },
    statusBadge: {
        marginTop: 4,
        paddingVertical: 2.5,
        paddingHorizontal: 7,
        borderRadius: 8,
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },

    // GRILLA DE INFORMACIÓN DEL CLIENTE Y SERVICIO (2 COLUMNAS)
    gridContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    card: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 5,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#CBD5E1',
        paddingBottom: 3,
        marginBottom: 5,
        letterSpacing: 0.4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    infoLabel: {
        color: '#64748B',
        fontSize: 8,
    },
    infoValue: {
        fontFamily: 'Helvetica-Bold',
        color: '#1E293B',
        fontSize: 8,
    },

    // TABLA DE PIEZAS / ÍTEMS EN TALLER
    sectionHeader: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    tableWrapper: {
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        overflow: 'hidden',
        marginBottom: 12,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        paddingVertical: 6,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    thCell: {
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
        fontSize: 7.5,
        textTransform: 'uppercase',
    },
    itemCard: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        padding: 8,
        backgroundColor: '#FFFFFF',
    },
    itemCardAlt: {
        backgroundColor: '#F8FAFC',
    },
    itemRowMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colIndex: { width: '5%', textAlign: 'center', color: '#64748B', fontSize: 8 },
    colType: { width: '18%', fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
    colService: { width: '22%', color: '#0F172A', fontSize: 8 },
    colMaterial: { width: '25%', color: '#475569', fontSize: 8 },
    colWeight: { width: '12%', textAlign: 'center', fontSize: 8 },
    colPrice: { width: '18%', textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#0F172A', fontSize: 8.5 },

    // DETALLES Y EVIDENCIA FOTOGRÁFICA AMPLIADA POR PIEZA
    itemDetailSection: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'column',
        gap: 6,
    },
    descContainer: {
        backgroundColor: '#FFFFFF',
        padding: 5,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    descLabel: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        marginBottom: 2,
    },
    itemDescription: {
        fontSize: 8,
        color: '#334155',
        lineHeight: 1.3,
    },
    evidenceContainer: {
        marginTop: 4,
    },
    evidenceLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    photosGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 2,
    },
    photoCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        padding: 5,
        alignItems: 'center',
    },
    itemPhotoLarge: {
        width: 170,
        height: 120,
        borderRadius: 4,
        objectFit: 'contain',
        backgroundColor: '#FFFFFF',
    },
    photoSubLabel: {
        fontSize: 7,
        color: '#64748B',
        marginTop: 3,
        fontFamily: 'Helvetica-Bold',
    },

    // TOTOALES Y RESUMEN ECONÓMICO
    summarySection: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    notesBox: {
        flex: 1.1,
        backgroundColor: '#F8FAFC',
        borderRadius: 5,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    notesTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    notesContent: {
        fontSize: 7.5,
        color: '#334155',
        lineHeight: 1.3,
    },
    financeBox: {
        flex: 0.9,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        padding: 7,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    financeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2.5,
    },
    financeRowTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        marginTop: 3,
        borderTopWidth: 1.5,
        borderTopColor: '#D97706',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 5,
        borderRadius: 3,
    },
    financeLabel: {
        fontSize: 8,
        color: '#475569',
    },
    financeValue: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
    },
    financeTotalLabel: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#92400E',
    },
    financeTotalValue: {
        fontSize: 9.5,
        fontFamily: 'Helvetica-Bold',
        color: '#92400E',
    },

    // AVISO LEGAL Y AREA DE FIRMA DEL CLIENTE
    footerArea: {
        marginTop: 'auto',
        paddingTop: 8,
    },
    termsNotice: {
        fontSize: 6.8,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 1.35,
        paddingHorizontal: 15,
    },
    signatureBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    signatureImg: {
        width: 140,
        height: 45,
        objectFit: 'contain',
        marginBottom: -4,
    },
    signatureLine: {
        width: 170,
        borderTopWidth: 1,
        borderTopColor: '#0F172A',
        marginTop: 2,
        marginBottom: 3,
    },
    signatureTitle: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
    },
    signatureSub: {
        fontSize: 7,
        color: '#64748B',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 15,
        left: 32,
        right: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 4,
    },
    bottomText: {
        fontSize: 6.8,
        color: '#94A3B8',
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES DE FORMATO Y UTILIDADES DE TEXTO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * FORMATEA UN VALOR NUMÉRICO A FORMATO DE MONEDA MONEDA MEXICANA (MXN)
 */
function formatCurrency(amount) {
    const val = Number(amount);
    if (isNaN(val)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(val);
}

/**
 * FORMATEA UNA FECHA ISO/STRING A FORMATO ESPAÑOL DD/MM/YYYY
 */
function formatDate(dateString) {
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
 * FORMATEA EL NÚMERO DE FOLIO CON RELLENO DE CEROS A LA IZQUIERDA (EJ: #00007)
 */
function formatFolio(folio) {
    if (folio === undefined || folio === null) return '#00000';
    return `#${String(folio).padStart(5, '0')}`;
}

/**
 * RETORNA LA ETIQUETA EN ESPAÑOL PARA EL TIPO DE PIEZA DE JOYERÍA
 */
function getItemLabel(typeKey) {
    return ITEM_TYPES[typeKey] || typeKey || 'Pieza';
}

/**
 * RETORNA LA ETIQUETA EN ESPAÑOL PARA EL SERVICIO SOLICITADO
 */
function getServiceLabel(serviceKey) {
    return SERVICE_TYPES[serviceKey] || serviceKey || 'Servicio';
}

/**
 * RETORNA EL ESTILO DE COLOR SEGÚN EL ESTADO DE LA ORDEN DE SERVICIO
 */
function getStatusStyle(status = '') {
    const s = String(status).toLowerCase();
    if (s.includes('pendiente')) return { backgroundColor: '#FEF3C7', color: '#92400E' };
    if (s.includes('listo')) return { backgroundColor: '#D1FAE5', color: '#065F46' };
    if (s.includes('entregado')) return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
    if (s.includes('proceso') || s.includes('reparación')) return { backgroundColor: '#E0E7FF', color: '#3730A3' };
    if (s.includes('recibido')) return { backgroundColor: '#F3E8FF', color: '#6B21A8' };
    return { backgroundColor: '#F1F5F9', color: '#334155' };
}

// ═════════════════════════════════════════════════════════════════════════════
// FUNCION PARA DESCARGAR IMAGEN DE SUPABASE Y CONVERTIR A BASE64 JPEG
// DESCARGA EL BLOB DE LA IMAGEN DIRECTAMENTE DESDE SUPABASE STORAGE USANDO SU SDK
// Y LA CONVIERTE A UN DATA URL JPEG BASE64 EN MEMORIA MEDIANTE CANVAS.
// ESTO GARANTIZA QUE @REACT-PDF/RENDERER PUEDA RENDERIZAR CUALQUIER FORMATO (INCLUYENDO WEBP)
// SIN PROBLEMAS DE RESTRICCIONES CORS O CADUCIDAD DE URLs FIRMADAS.
// ═════════════════════════════════════════════════════════════════════════════
export async function getPdfPhotoDataUrl(storagePath, bucket = 'photos') {
    if (!storagePath) return null;
    try {
        const { data: blob, error } = await supabaseClient.storage
            .from(bucket)
            .download(storagePath);

        if (error || !blob) {
            console.warn('Error al descargar blob de imagen desde Supabase:', error);
            return null;
        }

        if (typeof window === 'undefined') return null;

        return new Promise((resolve) => {
            const blobUrl = URL.createObjectURL(blob);
            const img = new window.Image();

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const maxDim = 800;
                    let w = img.naturalWidth || img.width || 400;
                    let h = img.naturalHeight || img.height || 400;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    URL.revokeObjectURL(blobUrl);
                    resolve(dataUrl);
                } catch (err) {
                    console.warn('Error al convertir blob a JPEG canvas:', err);
                    URL.revokeObjectURL(blobUrl);
                    resolve(null);
                }
            };

            img.onerror = (err) => {
                console.warn('Error al renderizar blob local:', err);
                URL.revokeObjectURL(blobUrl);
                resolve(null);
            };

            img.src = blobUrl;
        });
    } catch (e) {
        console.warn('Excepción en getPdfPhotoDataUrl:', e);
        return null;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// FUNCION PARA CONVERTIR TRAZOS DE FIRMA A SVG BASE64
// TRANSFORMA EL ARRAY DE COORDENADAS JSONB DE LA FIRMA (TRAZOS DE REACT-SIGNATURE-CANVAS)
// A UNA IMAGEN SVG VECTORIAL BASE64 COMPATIBLE CON @REACT-PDF/RENDERER.
// ═════════════════════════════════════════════════════════════════════════════
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
            : Buffer.from(svg).toString('base64');
        return `data:image/svg+xml;base64,${base64}`;
    } catch {
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// FUNCION AUXILIAR PARA PRECARGAR FOTOGRAFIAS DE ORDEN DE SERVICIO
// ITERA SOBRE LOS ÍTEMS DE UNA ORDEN Y RESUELVE SUS FOTOGRAFÍAS DESDE SUPABASE
// CONVIRTIÉNDOLAS A DATA URLs BASE64 EN UN DICCIONARIO CLAVE-VALOR { [photoId]: dataUrl }.
// ═════════════════════════════════════════════════════════════════════════════
export async function resolveOrderPhotoUrls(order) {
    if (!order || (!order.order_items && !order.items)) return {};
    const items = order.order_items || order.items || [];
    const photoMap = {};
    const allIds = [];

    items.forEach(item => {
        if (Array.isArray(item.photo_ids)) {
            allIds.push(...item.photo_ids);
        }
        if (Array.isArray(item.photos)) {
            item.photos.forEach(p => {
                if (p?.id) allIds.push(p.id);
            });
        }
    });

    const uniqueIds = [...new Set(allIds)].filter(Boolean);
    if (uniqueIds.length === 0) return {};

    await Promise.all(
        uniqueIds.map(async (id) => {
            try {
                const metaRes = await getImageById(id);
                if (metaRes?.success && metaRes.data?.image) {
                    const img = metaRes.data.image;
                    const jpegDataUrl = await getPdfPhotoDataUrl(img.storage_path, img.bucket || BUCKETS.PHOTOS || 'photos');
                    if (jpegDataUrl) {
                        photoMap[id] = jpegDataUrl;
                    }
                }
            } catch (err) {
                console.warn(`Error resolviendo imagen ${id} para PDF:`, err);
            }
        })
    );

    return photoMap;
}

// ═════════════════════════════════════════════════════════════════════════════
// FUNCION DE EXTRACCION DE FOTOS POR ITEM
// EXTRAE LAS URLs/DATA-URLs DE FOTOGRAFÍAS ASOCIADAS A UN ÍTEM ESPECÍFICO
// EVALUANDO MÚLTIPLES ESTRUCTURAS (itemPhotosMap, item.photos O item.photo_ids).
// ═════════════════════════════════════════════════════════════════════════════
function getItemPhotos(item, itemPhotosMap) {
    if (!item) return [];

    // 1. SI itemPhotosMap VIENE ESTRUCTURADO POR itemId
    if (itemPhotosMap && item.id && Array.isArray(itemPhotosMap[item.id])) {
        const urls = itemPhotosMap[item.id]
            .map(p => typeof p === 'string' ? p : p?.dataUrl || p?.signedUrl || p?.url)
            .filter(Boolean);
        if (urls.length > 0) return urls;
    }

    // 2. SI EL ÍTEM YA CONTIENE EL ARRAY `photos` CON `dataUrl` O `signedUrl`
    if (Array.isArray(item.photos)) {
        const urls = item.photos
            .map(p => typeof p === 'string' ? p : p?.dataUrl || p?.signedUrl || p?.url)
            .filter(Boolean);
        if (urls.length > 0) return urls;
    }

    // 3. BUSCAR photo_ids DENTRO DE itemPhotosMap SI ES UN MAPA POR ID DE FOTO
    if (Array.isArray(item.photo_ids) && itemPhotosMap) {
        const urls = item.photo_ids
            .map(id => {
                const entry = itemPhotosMap[id];
                if (typeof entry === 'string') return entry;
                return entry?.dataUrl || entry?.signedUrl || null;
            })
            .filter(Boolean);
        if (urls.length > 0) return urls;
    }

    return [];
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL DEL PDF DE ORDEN DE SERVICIO
// RENDERIZA EL DOCUMENTO PDF COMPLETO DE LA ORDEN DE SERVICIO DE JOYERÍA
// USANDO LOS COMPONENTES PRIMITIVOS DE @REACT-PDF/RENDERER.
// ═════════════════════════════════════════════════════════════════════════════
export default function OrderServicePDF({ order, itemPhotosMap = {} }) {
    if (!order) return null;

    const items = order.order_items || order.items || [];
    const customer = order.tbl_customers || {};
    const customerName = `${customer.names || ''} ${customer.lastnames || ''}`.trim() || 'Cliente General';
    const statusStyle = getStatusStyle(order.status);
    const signatureUrl = convertSignatureToSvgDataUrl(order.signature_data);

    const totalCost = Number(order.total_estimated_cost) || 0;
    const advance = Number(order.advance_payment) || 0;
    const balance = Math.max(0, totalCost - advance);

    return (
        <Document title={`Orden_${order.folio || 'Servicio'}.pdf`}>
            <Page size="LETTER" style={styles.page}>

                {/* ENCABEZADO / TÍTULO DE MARCA Y FOLIO */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.brandTitle}>ORDEN DE SERVICIO</Text>
                        <Text style={styles.brandSubtitle}>Joyería & Taller de Reparación</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.folioText}>Folio: {formatFolio(order.folio)}</Text>
                        <Text style={[styles.statusBadge, statusStyle]}>
                            {order.status || 'Pendiente'}
                        </Text>
                    </View>
                </View>

                {/* DATOS DEL CLIENTE E INFORMACIÓN DE LA ORDEN (2 COLUMNAS) */}
                <View style={styles.gridContainer}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Datos del Cliente</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nombre:</Text>
                            <Text style={styles.infoValue}>{customerName}</Text>
                        </View>
                        {customer.phone && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Teléfono:</Text>
                                <Text style={styles.infoValue}>{customer.phone}</Text>
                            </View>
                        )}
                        {customer.email && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Correo:</Text>
                                <Text style={styles.infoValue}>{customer.email}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Información del Servicio</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Fecha Recepción:</Text>
                            <Text style={styles.infoValue}>{formatDate(order.created_at)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Entrega Prometida:</Text>
                            <Text style={styles.infoValue}>{formatDate(order.promised_date)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>No. Piezas:</Text>
                            <Text style={styles.infoValue}>{items.length}</Text>
                        </View>
                    </View>
                </View>

                {/* TABLA DE PIEZAS / ÍTEMS REGISTRADOS EN LA ORDEN */}
                <Text style={styles.sectionHeader}>Piezas en Servicio ({items.length})</Text>
                <View style={styles.tableWrapper}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.thCell, styles.colIndex]}>#</Text>
                        <Text style={[styles.thCell, styles.colType]}>Tipo de Pieza</Text>
                        <Text style={[styles.thCell, styles.colService]}>Servicio Solicitado</Text>
                        <Text style={[styles.thCell, styles.colMaterial]}>Material / Detalles</Text>
                        <Text style={[styles.thCell, styles.colWeight]}>Peso (g)</Text>
                        <Text style={[styles.thCell, styles.colPrice]}>Precio Est.</Text>
                    </View>

                    {items.map((item, index) => {
                        const photos = getItemPhotos(item, itemPhotosMap);
                        const isAlt = index % 2 === 1;

                        return (
                            <View key={item.id || index} style={[styles.itemCard, isAlt && styles.itemCardAlt]} wrap={false}>
                                <View style={styles.itemRowMain}>
                                    <Text style={styles.colIndex}>{index + 1}</Text>
                                    <Text style={styles.colType}>{getItemLabel(item.item_type)}</Text>
                                    <Text style={styles.colService}>{getServiceLabel(item.service_requested)}</Text>
                                    <Text style={styles.colMaterial}>{item.material_details || 'N/A'}</Text>
                                    <Text style={styles.colWeight}>{item.initial_weight_grams ? `${item.initial_weight_grams} g` : '-'}</Text>
                                    <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
                                </View>

                                {(item.description || photos.length > 0) && (
                                    <View style={styles.itemDetailSection}>
                                        {item.description && (
                                            <View style={styles.descContainer}>
                                                <Text style={styles.descLabel}>Observaciones de la pieza:</Text>
                                                <Text style={styles.itemDescription}>{item.description}</Text>
                                            </View>
                                        )}

                                        {photos.length > 0 && (
                                            <View style={styles.evidenceContainer}>
                                                <Text style={styles.evidenceLabel}>
                                                    Evidencia Fotográfica ({photos.length} foto{photos.length > 1 ? 's' : ''} de recepción):
                                                </Text>
                                                <View style={styles.photosGrid}>
                                                    {photos.slice(0, 2).map((imgUrl, imgIdx) => (
                                                        <View key={imgIdx} style={styles.photoCard}>
                                                            <Image src={imgUrl} style={styles.itemPhotoLarge} />
                                                            <Text style={styles.photoSubLabel}>Foto de Recepción #{imgIdx + 1}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* OBSERVACIONES GENERALES Y RESUMEN ECONÓMICO */}
                <View style={styles.summarySection} wrap={false}>
                    <View style={styles.notesBox}>
                        <Text style={styles.notesTitle}>Observaciones Generales</Text>
                        <Text style={styles.notesContent}>
                            {order.notes_general || 'Sin observaciones.'}
                        </Text>
                    </View>

                    <View style={styles.financeBox}>
                        <View style={styles.financeRow}>
                            <Text style={styles.financeLabel}>Total Estimado:</Text>
                            <Text style={styles.financeValue}>{formatCurrency(totalCost)}</Text>
                        </View>
                        <View style={styles.financeRow}>
                            <Text style={styles.financeLabel}>Anticipo Pagado:</Text>
                            <Text style={styles.financeValue}>{formatCurrency(advance)}</Text>
                        </View>
                        <View style={styles.financeRowTotal}>
                            <Text style={styles.financeTotalLabel}>Saldo Pendiente:</Text>
                            <Text style={styles.financeTotalValue}>{formatCurrency(balance)}</Text>
                        </View>
                    </View>
                </View>

                {/* PIE DE PÁGINA, TÉRMINOS Y FIRMA DEL CLIENTE */}
                <View style={styles.footerArea} wrap={false}>
                    <Text style={styles.termsNotice}>
                        * IMPORTANTE: Presentar este comprobante para recoger la(s) pieza(s). Las fechas de entrega son estimadas. Transcurridos 30 días naturales no nos hacemos responsables por piezas no reclamadas.
                    </Text>

                    <View style={styles.signatureBlock}>
                        {signatureUrl ? (
                            <Image src={signatureUrl} style={styles.signatureImg} />
                        ) : (
                            <View style={{ height: 35 }} />
                        )}
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureTitle}>Firma de Conformidad del Cliente</Text>
                        <Text style={styles.signatureSub}>{customerName}</Text>
                    </View>
                </View>

                {/* PIE DE PÁGINA INFERIOR */}
                <View style={styles.bottomBar} fixed>
                    <Text style={styles.bottomText}>Comprobante de Orden de Servicio - Joyería</Text>
                    <Text style={styles.bottomText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>

            </Page>
        </Document>
    );
}