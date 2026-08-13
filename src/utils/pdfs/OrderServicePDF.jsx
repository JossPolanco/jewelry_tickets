import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import {
    formatCurrency,
    formatDate,
    formatDateTime,
    formatFolio,
    getItemLabel,
    getServiceLabel,
    getStatusStyle,
    convertSignatureToSvgDataUrl,
    getPdfPhotoDataUrl,
    resolveOrderPhotoUrls,
    getItemPhotos
} from './helpers';

// RE-EXPORTAR FUNCIONES AUXILIARES PARA MANTENER COMPATIBILIDAD CON IMPORTS EN OTROS ARCHIVOS
export { getPdfPhotoDataUrl, convertSignatureToSvgDataUrl, resolveOrderPhotoUrls, getItemPhotos };

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
    colService: { width: '22%', fontFamily: 'Helvetica-Bold', fontSize: 8 },
    colMaterial: { width: '25%', fontFamily: 'Helvetica-Bold', fontSize: 8 },
    colWeight: { width: '12%', textAlign: 'center', fontSize: 8 },
    colPrice: { width: '18%', textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

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
    },

    // BLOQUE DE ENTREGA Y FINIQUITO
    deliveryCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#10B981',
        padding: 7,
        marginTop: 6,
        marginBottom: 6,
    },
    deliveryHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#A7F3D0',
        paddingBottom: 3,
        marginBottom: 4,
    },
    deliveryTitle: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: '#065F46',
        letterSpacing: 0.4,
    },
    deliveryBadge: {
        backgroundColor: '#059669',
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
        fontSize: 7,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        textTransform: 'uppercase',
    },
    deliveryLegalText: {
        fontSize: 7.2,
        color: '#047857',
        fontFamily: 'Helvetica',
        lineHeight: 1.3,
        marginBottom: 3,
    },
    deliveryDateText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#065F46',
    },
    dualSignatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    dualSignatureBlock: {
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default function OrderServicePDF({ order, itemPhotosMap = {}, termsAndConditions, organizationInfo }) {
    if (!order) {
        return (
            <Document title="Orden_Servicio.pdf">
                <Page size="LETTER" style={styles.page}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.brandTitle}>{organizationInfo?.name || 'ORDEN DE SERVICIO'}</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    const items = order.order_items || order.items || [];
    const customer = order.tbl_customers || {};
    const customerName = `${customer.names || ''} ${customer.lastnames || ''}`.trim() || 'Cliente General';
    const statusStyle = getStatusStyle(order.status);
    const signatureUrl = convertSignatureToSvgDataUrl(order.signature_data);
    const deliverySignatureUrl = convertSignatureToSvgDataUrl(order.delivery_signature_data);
    const isDelivered = Boolean(order.delivered_at && order.delivery_signature_data) || order.status?.toLowerCase() === 'entregado';

    const deliveryPhotos = [];
    if (Array.isArray(order.delivery_photos_urls)) {
        order.delivery_photos_urls.forEach((url) => { if (url) deliveryPhotos.push(url); });
    }
    if (deliveryPhotos.length === 0 && Array.isArray(order.delivery_photo_ids) && itemPhotosMap) {
        order.delivery_photo_ids.forEach((pId) => {
            const entry = itemPhotosMap[pId];
            const src = typeof entry === 'string' ? entry : entry?.dataUrl || entry?.signedUrl || entry?.url;
            if (src) deliveryPhotos.push(src);
        });
    }
    if (deliveryPhotos.length === 0 && Array.isArray(order.delivery_photos)) {
        order.delivery_photos.forEach((p) => {
            const src = typeof p === 'string' ? p : p?.dataUrl || p?.signedUrl || p?.url;
            if (src) deliveryPhotos.push(src);
        });
    }

    const uniqueDeliveryPhotos = [...new Set(deliveryPhotos)];

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
                        <Text style={styles.brandSubtitle}>
                            {organizationInfo?.name ? `${organizationInfo.name.toUpperCase()} • TALLER` : 'Joyería & Taller de Reparación'}
                        </Text>
                        {(organizationInfo?.address || organizationInfo?.number) ? (
                            <Text style={{ fontSize: 7, color: '#475569', marginTop: 1 }}>
                                {[organizationInfo?.address, organizationInfo?.number ? `Tel: ${organizationInfo.number}` : null].filter(Boolean).join(' | ')}
                            </Text>
                        ) : null}
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
                        {customer.phone ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Teléfono:</Text>
                                <Text style={styles.infoValue}>{customer.phone}</Text>
                            </View>
                        ) : null}
                        {customer.email ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Correo:</Text>
                                <Text style={styles.infoValue}>{customer.email}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Información del Servicio</Text>
                        {organizationInfo?.name ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Taller / Empresa:</Text>
                                <Text style={styles.infoValue}>{organizationInfo.name}</Text>
                            </View>
                        ) : null}
                        {organizationInfo?.number ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Tel. Taller:</Text>
                                <Text style={styles.infoValue}>{organizationInfo.number}</Text>
                            </View>
                        ) : null}
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

                                {(item.description || item.price_detail || photos.length > 0) ? (
                                    <View style={styles.itemDetailSection}>
                                        {item.description ? (
                                            <View style={styles.descContainer}>
                                                <Text style={styles.descLabel}>Observaciones de la pieza:</Text>
                                                <Text style={styles.itemDescription}>{item.description}</Text>
                                            </View>
                                        ) : null}

                                        {item.price_detail ? (
                                            <View style={styles.descContainer}>
                                                <Text style={styles.descLabel}>Desglose / Justificación del Precio:</Text>
                                                <Text style={styles.itemDescription}>{item.price_detail}</Text>
                                            </View>
                                        ) : null}

                                        {photos.length > 0 ? (
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
                                        ) : null}
                                    </View>
                                ) : null}
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

                {/* BLOQUE DE CONFORMIDAD DE ENTREGA Y FINIQUITO (SI APLICA) */}
                {isDelivered || uniqueDeliveryPhotos.length > 0 ? (
                    <View style={styles.deliveryCard} wrap={false}>
                        <View style={styles.deliveryHeaderRow}>
                            <Text style={styles.deliveryTitle}>CONFORMIDAD DE ENTREGA Y FINIQUITO</Text>
                            <Text style={styles.deliveryBadge}>PAGADO Y ENTREGADO</Text>
                        </View>
                        <Text style={styles.deliveryLegalText}>
                            El cliente confirma recibir la(s) pieza(s) a entera satisfacción y liquida el total del servicio.
                        </Text>
                        {order.delivered_at ? (
                            <Text style={styles.deliveryDateText}>
                                Fecha y hora de entrega: {formatDateTime(order.delivered_at)}
                            </Text>
                        ) : null}

                        {uniqueDeliveryPhotos.length > 0 ? (
                            <View style={{ marginTop: 6 }}>
                                <Text style={[styles.evidenceLabel, { color: '#065F46', marginBottom: 4 }]}>
                                    Evidencia Fotográfica de Entrega ({uniqueDeliveryPhotos.length} foto{uniqueDeliveryPhotos.length > 1 ? 's' : ''}):
                                </Text>
                                <View style={styles.photosGrid}>
                                    {uniqueDeliveryPhotos.slice(0, 2).map((imgUrl, imgIdx) => (
                                        <View key={imgIdx} style={[styles.photoCard, { borderColor: '#A7F3D0', backgroundColor: '#FFFFFF' }]}>
                                            <Image src={imgUrl} style={styles.itemPhotoLarge} />
                                            <Text style={[styles.photoSubLabel, { color: '#047857' }]}>Foto de Entrega #{imgIdx + 1}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {/* PIE DE PÁGINA, TÉRMINOS Y FIRMAS */}
                <View style={styles.footerArea} wrap={false}>
                    <Text style={styles.termsNotice}>
                        {termsAndConditions}
                    </Text>

                    {isDelivered && deliverySignatureUrl ? (
                        <View style={styles.dualSignatureRow}>
                            {/* FIRMA 1: RECEPCIÓN */}
                            <View style={styles.dualSignatureBlock}>
                                {signatureUrl ? (
                                    <Image src={signatureUrl} style={styles.signatureImg} />
                                ) : (
                                    <View style={{ height: 35 }} />
                                )}
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureTitle}>Firma 1: Recepción de Pieza</Text>
                                <Text style={styles.signatureSub}>{customerName}</Text>
                            </View>

                            {/* FIRMA 2: ENTREGA Y FINIQUITO */}
                            <View style={styles.dualSignatureBlock}>
                                <Image src={deliverySignatureUrl} style={styles.signatureImg} />
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureTitle}>Firma 2: Entrega y Finiquito</Text>
                                <Text style={styles.signatureSub}>{customerName}</Text>
                            </View>
                        </View>
                    ) : (
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
                    )}
                </View>

                {/* PIE DE PÁGINA INFERIOR */}
                <View style={styles.bottomBar} fixed>
                    <Text style={styles.bottomText}>
                        {[
                            'Comprobante de Orden de Servicio',
                            organizationInfo?.name,
                            organizationInfo?.number ? `Tel: ${organizationInfo.number}` : null,
                            organizationInfo?.address
                        ].filter(Boolean).join(' • ')}
                    </Text>
                    <Text style={styles.bottomText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>

            </Page>
        </Document>
    );
}