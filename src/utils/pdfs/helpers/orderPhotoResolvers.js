/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SERVICIO AUXILIAR PARA RESOLUCIÓN Y PRECARGA DE FOTOGRAFÍAS EN PDFS DE ORDENES
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 * CONTIENE FUNCIONES ASÍNCRONAS Y DE EXTRACCIÓN DE FOTOGRAFÍAS ASOCIADAS A
 * UNA ORDEN DE SERVICIO. OBTIENE LA METADATA Y CONVIERTE CADA IMAGEN A DATA URL BASE64
 * USANDO `getPdfPhotoDataUrl`.
 */

import { getImageById } from '@/services/images/imageMetadata';
import { BUCKETS } from '@/services/images/imageUploader';
import { getPdfPhotoDataUrl } from './pdfImageHelpers';

/**
 * RECORRE LOS ÍTEMS DE UNA ORDEN, RECUPERA LA METADATA DE SUS FOTOGRAFÍAS
 * Y GENERA UN DICCIONARIO { [photoId]: dataUrlBase64 } PREPARADO PARA COMPILAR EN EL PDF.
 */
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

/**
 * EXTRAE Y RETORNA EL ARRAY DE URLs/DATA-URLs DE FOTOGRAFÍAS CORRESPONDIENTES A UN ÍTEM.
 * EVALÚA MÚLTIPLES ESTRUCTURAS DE DATOS DE FORMA ROBUSTA (itemPhotosMap, item.photos, item.photo_ids).
 */
export function getItemPhotos(item, itemPhotosMap) {
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
