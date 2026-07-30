/**
 * ═════════════════════════════════════════════════════════════════════════════
 * UTILIDAD DE PROCESAMIENTO DE IMÁGENES PARA COMPONENTES @REACT-PDF/RENDERER
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 * DESCARGA CUALQUIER FOTOGRAFÍA ALMACENADA EN SUPABASE STORAGE MEDIANTE EL SDK OFICIAL
 * Y LA CONVIERTE A UN DATA URL JPEG EN BASE64 EN MEMORIA USANDO UN BLOB Y CANVAS HTML5.
 * 
 * ¿POR QUÉ ES NECESARIO?:
 * @REACT-PDF/RENDERER SOLO SOPORTA FORMATOS NATIVOS JPG Y PNG EN EL NAVEGADOR.
 * LAS IMÁGENES GUARDADAS COMO WEBP O CON RESTRICCIONES CORS NO SE RENDERIZAN SI SE PASA LA URL DIRECTA.
 * ESTA FUNCIÓN GARANTIZA QUE CUALQUIER IMAGEN SE CONVIERTA A JPEG BASE64 COMPATIBLE 100%.
 * 
 * USO EN OTROS COMPONENTES PDF:
 * const jpegBase64 = await getPdfPhotoDataUrl(image.storage_path, image.bucket);
 * <Image src={jpegBase64} style={styles.photo} />
 */

import { supabaseClient } from '@/utils/supabase';

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
