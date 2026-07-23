import { useImages, useDeleteImage } from "../../hooks/images/useImages"
import { useState } from "react"
import { Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"

const formatBytes = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function GalleryPanel({ bucket = 'photos', gallery = 'default', dateId = null, relation = null, enableDelete = false }) {
    const { images, total, isLoading, isError, error, refetch } = useImages(bucket, gallery, { dateId, relation })
    const [selectedImage, setSelectedImage] = useState(null)

    const deleteMutation = useDeleteImage({
        bucket,
        gallery,
        dateId,
        relation,
        onSuccess: () => {
            // Si la imagen seleccionada en el Lightbox se elimina, cerrarlo
            setSelectedImage(null)
        }
    })

    const handleDeleteClick = (e, photo) => {
        e.stopPropagation()
        if (confirm("¿Estás seguro de que deseas eliminar esta foto de la cita? 😢")) {
            deleteMutation.mutate(photo)
        }
    }

    const handlePrev = (e) => {
        e.stopPropagation()
        if (images.length <= 1) return
        const index = images.findIndex((img) => img.id === selectedImage.id)
        if (index > 0) {
            setSelectedImage(images[index - 1])
        } else {
            setSelectedImage(images[images.length - 1])
        }
    }

    const handleNext = (e) => {
        e.stopPropagation()
        if (images.length <= 1) return
        const index = images.findIndex((img) => img.id === selectedImage.id)
        if (index < images.length - 1) {
            setSelectedImage(images[index + 1])
        } else {
            setSelectedImage(images[0])
        }
    }

    if (isLoading) {
        return (
            <div className="card bg-base-100 dark:bg-base-900/40 border border-base-200 dark:border-base-800/60 shadow-3xs rounded-3xl">
                <div className="card-body items-center py-10">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="text-sm text-base-content/60 font-medium">Cargando fotos de la galería...</p>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="card bg-base-100 dark:bg-base-900/40 border border-base-200 dark:border-base-800/60 shadow-3xs rounded-3xl">
                <div className="card-body space-y-2">
                    <div className="alert alert-error">
                        <span className="text-sm">{error?.message || "Error al cargar la galería."}</span>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={refetch}>
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="card bg-base-100 dark:bg-base-900/40 border border-base-200 dark:border-base-800/60 shadow-3xs rounded-3xl">
            <div className="card-body space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="card-title text-base font-bold flex items-center gap-2">
                        Galería de fotos
                        <span className="badge badge-ghost font-normal text-xs">{total} fotos</span>
                    </h2>
                    <button type="button" className="btn btn-ghost btn-xs text-primary font-bold" onClick={refetch}>
                        Refrescar
                    </button>
                </div>

                {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="text-3xl mb-2">📸</span>
                        <p className="text-sm text-base-content/50 font-semibold">
                            Aún no hay fotos en esta cita.
                        </p>
                        <p className="text-xs text-base-content/40 mt-0.5">
                            ¡Sube la primera foto para capturar el momento!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((photo) => (
                            <div
                                key={photo.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`Ver foto ${photo.original_name ?? ''}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setSelectedImage(photo);
                                    }
                                }}
                                className="group relative rounded-2xl overflow-hidden bg-base-200 dark:bg-base-950 aspect-square border border-base-200/55 dark:border-base-800/40 cursor-pointer shadow-3xs hover:shadow-xs transition-transform duration-300 active:scale-98"
                                onClick={() => setSelectedImage(photo)}
                            >
                                {photo.signedUrl ? (
                                    <img
                                        src={photo.signedUrl}
                                        alt={photo.original_name ?? 'Foto'}
                                        width={photo.width ?? 300}
                                        height={photo.height ?? 300}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-base-content/30 text-xs">
                                        Error al cargar foto
                                    </div>
                                )}

                                {/* Botón de eliminar (Hover) */}
                                {enableDelete && (
                                    <button type="button"
                                        onClick={(e) => handleDeleteClick(e, photo)}
                                        className="absolute top-2 right-2 btn btn-circle btn-error btn-xs text-white shadow-md border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                        title="Eliminar imagen"
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending && deleteMutation.variables?.id === photo.id ? (
                                            <span className="loading loading-spinner loading-xs" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                )}

                                {/* Overlay con info al hacer hover */}
                                <div className="absolute inset-x-0 bottom-0 bg-base-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                                    <p className="text-white text-xs font-semibold truncate">{photo.original_name ?? '—'}</p>
                                    <p className="text-white/70 text-[10px]">{formatBytes(photo.file_size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal Premium */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setSelectedImage(null)} >
                    {/* Botón de cerrar */}
                    <button type="button" className="absolute top-4 right-4 btn btn-circle btn-ghost text-white/80 hover:text-white z-50" onClick={() => setSelectedImage(null)} aria-label="Cerrar" >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Flecha izquierda */}
                    {images.length > 1 && (
                        <button className="absolute left-4 btn btn-circle btn-ghost text-white/80 hover:text-white hover:bg-white/10 hidden md:flex z-50"
                            onClick={handlePrev}
                            type="button"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                    )}

                    {/* Imagen principal y contenedor */}
                    <div className="max-w-4xl max-h-[85vh] px-4 flex flex-col items-center justify-center relative select-none animate-scale-up" onClick={(e) => e.stopPropagation()} >
                        <img
                            src={selectedImage.signedUrl}
                            alt={selectedImage.original_name ?? 'Imagen'}
                            className="max-w-full max-h-[75vh] rounded-3xl object-contain shadow-2xl border border-white/10"
                        />
                        <div className="text-center mt-4 text-white space-y-1">
                            <p className="font-semibold text-sm truncate max-w-xs md:max-w-md">
                                {selectedImage.original_name ?? 'Imagen de la cita'}
                            </p>
                            <p className="text-xs text-white/60">
                                {formatBytes(selectedImage.file_size)}
                            </p>
                        </div>
                    </div>

                    {/* Flecha derecha */}
                    {images.length > 1 && (
                        <button
                            className="absolute right-4 btn btn-circle btn-ghost text-white/80 hover:text-white hover:bg-white/10 hidden md:flex z-50"
                            onClick={handleNext}
                            type="button"
                            aria-label="Siguiente"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    )}

                    {/* Controles de swipe/navigation móviles (abajo) */}
                    {images.length > 1 && (
                        <div className="absolute bottom-6 flex gap-4 md:hidden z-50">
                            <button
                                className="btn btn-circle btn-sm btn-ghost text-white border border-white/20"
                                onClick={handlePrev}
                                type="button"
                                aria-label="Imagen anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                className="btn btn-circle btn-sm btn-ghost text-white border border-white/20"
                                onClick={handleNext}
                                type="button"
                                aria-label="Siguiente imagen"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}