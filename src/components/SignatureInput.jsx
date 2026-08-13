import SignatureCanvas from 'react-signature-canvas'
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'

const SignatureInput = forwardRef(function SignatureInput(
    { value, onChange, onSave, onClear, disabled = false, className = '' },
    ref
) {
    const sigPadRef = useRef(null)
    const containerRef = useRef(null)

    // Clonador profundo seguro para evitar mutaciones de array compartidos con signature_pad
    const deepClonePoints = (data) => {
        if (!data) return null
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data
            if (Array.isArray(parsed) && parsed.length > 0) {
                return JSON.parse(JSON.stringify(parsed))
            }
        } catch (e) {
            console.error('Error al clonar puntos de la firma:', e)
        }
        return null
    }

    // Ajusta la resolución interna del canvas al tamaño real del contenedor (basado en ancho inmutable)
    const resizeCanvas = useCallback(() => {
        if (!sigPadRef.current || !containerRef.current) return
        const canvas = sigPadRef.current.getCanvas()
        if (!canvas) return

        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const newWidth = Math.floor(rect.width * ratio)
        // Usar la altura basada en la proporción del ancho (aspect ratio 2.5:1) para evitar compresión vertical por teclado
        const targetHeight = Math.max(rect.height, Math.floor(rect.width / 2.5))
        const newHeight = Math.floor(targetHeight * ratio)

        // Solo re-dimensionar si el ANCHO cambia (evita borrados por compresión vertical al enfocar campos o abrir teclado)
        if (Math.abs(canvas.width - newWidth) > 5 || !canvas.width) {
            let currentPoints = null
            if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
                currentPoints = deepClonePoints(sigPadRef.current.toData())
            }
            if (!currentPoints && value) {
                currentPoints = deepClonePoints(value)
            }

            canvas.width = newWidth
            canvas.height = newHeight
            const ctx = canvas.getContext('2d')
            ctx.scale(ratio, ratio)

            sigPadRef.current.clear()
            if (currentPoints && currentPoints.length > 0) {
                sigPadRef.current.fromData(currentPoints)
            }
        }
    }, [value])

    useEffect(() => {
        resizeCanvas()
        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas()
        })
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }
        return () => {
            resizeObserver.disconnect()
        }
    }, [resizeCanvas])

    // Obtiene los datos de la firma en formato JSONB (array de trazos/puntos clonado)
    const getSignatureData = () => {
        if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
            return null
        }
        return deepClonePoints(sigPadRef.current.toData())
    }

    // Expone métodos al ref padre para que el formulario solicitante obtenga los datos al guardar
    useImperativeHandle(ref, () => ({
        getSignatureData,
        clear: handleClear,
        isEmpty: () => !sigPadRef.current || sigPadRef.current.isEmpty(),
        getCanvas: () => sigPadRef.current?.getCanvas(),
    }))

    // Cargar datos existentes si la propiedad 'value' viene provista desde afuera (ej: borrador o reset)
    useEffect(() => {
        if (!sigPadRef.current) return

        const dataToLoad = deepClonePoints(value)
        if (dataToLoad && dataToLoad.length > 0) {
            const currentData = sigPadRef.current.toData()
            if (JSON.stringify(currentData) !== JSON.stringify(dataToLoad)) {
                sigPadRef.current.fromData(dataToLoad)
            }
        }
    }, [value])

    const handleBegin = () => {
        // Inicio de trazo
    }

    // Se ejecuta al finalizar cada trazo en el lienzo
    const handleEnd = () => {
        const data = getSignatureData()
        if (onChange) onChange(data)
        if (onSave) onSave(data)
    }

    // Limpia el canvas y notifica al padre
    const handleClear = () => {
        if (sigPadRef.current) {
            sigPadRef.current.clear()
        }
        if (onChange) onChange(null)
        if (onSave) onSave(null)
        if (onClear) onClear()
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <div 
                ref={containerRef}
                className="relative w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white overflow-hidden shadow-inner focus-within:border-primary transition-all"
            >
                <SignatureCanvas
                    ref={sigPadRef}
                    penColor="black"
                    onBegin={handleBegin}
                    onEnd={handleEnd}
                    canvasProps={{
                        className: 'w-full h-full block cursor-crosshair touch-none bg-white sigCanvas'
                    }}
                />
                {disabled && (
                    <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-[1px] cursor-not-allowed" />
                )}
            </div>

            <div className="flex justify-between items-center px-1">
                <span className="text-xs text-gray-500">
                    Firme sobre el área recuadrada
                </span>
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={disabled}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors border border-red-200"
                >
                    Limpiar firma
                </button>
            </div>
        </div>
    )
})

export default SignatureInput




