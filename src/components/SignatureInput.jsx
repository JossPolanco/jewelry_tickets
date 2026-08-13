import SignatureCanvas from 'react-signature-canvas'
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

const SignatureInput = forwardRef(function SignatureInput(
    { value, onChange, onSave, onClear, disabled = false, className = '' },
    ref
) {
    const sigPadRef = useRef(null)
    const containerRef = useRef(null)
    const valueRef = useRef(value)
    const initializedRef = useRef(false)

    // Mantener valueRef siempre sincronizado con la última prop value
    valueRef.current = value

    // Clon profundo para evitar mutaciones internas de signature_pad
    const deepClonePoints = (data) => {
        if (!data) return null
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data
            if (Array.isArray(parsed) && parsed.length > 0) {
                return JSON.parse(JSON.stringify(parsed))
            }
        } catch (e) { /* silencioso */ }
        return null
    }

    // Inicializar canvas UNA SOLA VEZ al montar
    useEffect(() => {
        if (!sigPadRef.current || !containerRef.current || initializedRef.current) return

        const canvas = sigPadRef.current.getCanvas()
        if (!canvas) return

        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = Math.floor(rect.width * ratio)
        canvas.height = Math.floor(rect.height * ratio)
        const ctx = canvas.getContext('2d')
        ctx.scale(ratio, ratio)

        initializedRef.current = true

        // Cargar datos iniciales si existen
        const initialData = deepClonePoints(valueRef.current)
        if (initialData && initialData.length > 0) {
            sigPadRef.current.fromData(initialData)
        }
    }, [])

    // Cargar datos cuando value cambia desde AFUERA (ej: restaurar borrador)
    useEffect(() => {
        if (!sigPadRef.current || !initializedRef.current) return

        const dataToLoad = deepClonePoints(value)

        if (!dataToLoad || dataToLoad.length === 0) {
            // No borrar el canvas si ya tiene trazos del usuario - solo borrar si value es explícitamente null/vacío
            // Y el canvas tiene datos que no son del usuario (evitar borrar firma activa)
            return
        }

        // Solo cargar si los datos son diferentes a lo que ya está dibujado
        const currentData = sigPadRef.current.toData()
        if (currentData && currentData.length > 0 && JSON.stringify(currentData) === JSON.stringify(dataToLoad)) {
            return // Ya está dibujado, no hacer nada
        }

        sigPadRef.current.fromData(dataToLoad)
    }, [value])

    // Obtiene los datos de la firma clonados
    const getSignatureData = () => {
        if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
            return null
        }
        return deepClonePoints(sigPadRef.current.toData())
    }

    // Expone métodos al ref padre
    useImperativeHandle(ref, () => ({
        getSignatureData,
        clear: handleClear,
        isEmpty: () => !sigPadRef.current || sigPadRef.current.isEmpty(),
        getCanvas: () => sigPadRef.current?.getCanvas(),
    }))

    const handleBegin = () => {
        // Inicio de trazo - no hacer nada
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
