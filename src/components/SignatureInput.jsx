import SignatureCanvas from 'react-signature-canvas'
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

const SignatureInputInner = forwardRef(function SignatureInput(
    { defaultValue, onChange, onSave, onClear, disabled = false, className = '' },
    ref
) {
    const sigPadRef = useRef(null)
    const containerRef = useRef(null)
    const initializedRef = useRef(false)
    const savedPointsRef = useRef(null)       // Respaldo permanente de los trazos
    const pendingDataRef = useRef(null)        // Datos pendientes si el canvas aún no está listo
    const callbacksRef = useRef({ onChange, onSave, onClear })

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

    // Inicializa las dimensiones del canvas UNA sola vez
    const initCanvas = () => {
        if (initializedRef.current) return true
        if (!sigPadRef.current || !containerRef.current) return false

        const canvas = sigPadRef.current.getCanvas()
        if (!canvas) return false

        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width < 10 || rect.height < 10) return false

        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = Math.floor(rect.width * ratio)
        canvas.height = Math.floor(rect.height * ratio)
        canvas.getContext('2d').scale(ratio, ratio)
        sigPadRef.current.clear()

        initializedRef.current = true

        // Cargar datos: pendientes > respaldo > valor por defecto
        const dataToLoad = pendingDataRef.current || savedPointsRef.current || deepClonePoints(defaultValue)
        if (dataToLoad && dataToLoad.length > 0) {
            sigPadRef.current.fromData(deepClonePoints(dataToLoad))
            savedPointsRef.current = deepClonePoints(dataToLoad)
        }
        pendingDataRef.current = null

        return true
    }

    // Detección de visibilidad: ResizeObserver + intervalo de respaldo
    // Necesario porque el paso 4 inicia con display:none (clase 'hidden')
    useEffect(() => {
        if (initCanvas()) return

        let observer
        let interval

        if (containerRef.current) {
            observer = new ResizeObserver(() => {
                if (!initializedRef.current && initCanvas()) {
                    observer?.disconnect()
                    if (interval) clearInterval(interval)
                }
            })
            observer.observe(containerRef.current)
        }

        // Respaldo: chequear cada 200ms por si ResizeObserver no dispara
        interval = setInterval(() => {
            if (initCanvas()) {
                observer?.disconnect()
                clearInterval(interval)
            }
        }, 200)

        const timeout = setTimeout(() => {
            clearInterval(interval)
            observer?.disconnect()
        }, 60000)

        return () => {
            observer?.disconnect()
            clearInterval(interval)
            clearTimeout(timeout)
        }
    }, [])

    // Auto-restauración: si el navegador borra el canvas (iOS, cambio de pestaña, etc.)
    useEffect(() => {
        const restoreIfNeeded = () => {
            if (!sigPadRef.current || !initializedRef.current) return
            if (sigPadRef.current.isEmpty() && savedPointsRef.current && savedPointsRef.current.length > 0) {
                sigPadRef.current.fromData(deepClonePoints(savedPointsRef.current))
            }
        }
        document.addEventListener('visibilitychange', restoreIfNeeded)
        window.addEventListener('focus', restoreIfNeeded)
        return () => {
            document.removeEventListener('visibilitychange', restoreIfNeeded)
            window.removeEventListener('focus', restoreIfNeeded)
        }
    }, [])

    // Quita el teclado virtual al tocar el área de firma
    const handleCanvasInteraction = () => {
        if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur()
        }
        // Auto-restauración al interactuar
        if (sigPadRef.current && initializedRef.current) {
            if (sigPadRef.current.isEmpty() && savedPointsRef.current && savedPointsRef.current.length > 0) {
                sigPadRef.current.fromData(deepClonePoints(savedPointsRef.current))
            }
        }
    }

    const getSignatureData = () => {
        if (!sigPadRef.current || sigPadRef.current.isEmpty()) return null
        return deepClonePoints(sigPadRef.current.toData())
    }

    // Carga datos de forma imperativa (para restauración de borrador)
    const loadData = (data) => {
        const points = deepClonePoints(data)
        if (!points || points.length === 0) return
        savedPointsRef.current = points
        if (initializedRef.current && sigPadRef.current) {
            sigPadRef.current.fromData(deepClonePoints(points))
        } else {
            pendingDataRef.current = points
        }
    }

    useImperativeHandle(ref, () => ({
        getSignatureData,
        loadData,
        clear: handleClear,
        isEmpty: () => !sigPadRef.current || sigPadRef.current.isEmpty(),
        getCanvas: () => sigPadRef.current?.getCanvas(),
    }))

    const handleBegin = () => {
        handleCanvasInteraction()
    }

    const handleEnd = () => {
        const data = getSignatureData()
        savedPointsRef.current = data ? deepClonePoints(data) : null
        if (callbacksRef.current.onChange) callbacksRef.current.onChange(data)
        if (callbacksRef.current.onSave) callbacksRef.current.onSave(data)
    }

    const handleClear = () => {
        savedPointsRef.current = null
        if (sigPadRef.current) sigPadRef.current.clear()
        if (callbacksRef.current.onChange) callbacksRef.current.onChange(null)
        if (callbacksRef.current.onSave) callbacksRef.current.onSave(null)
        if (callbacksRef.current.onClear) callbacksRef.current.onClear()
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <div 
                ref={containerRef}
                onPointerDown={handleCanvasInteraction}
                onTouchStart={handleCanvasInteraction}
                onMouseDown={handleCanvasInteraction}
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

// BLOQUEAR TODO re-render desde el padre. El canvas maneja su propio estado internamente.
const SignatureInput = React.memo(SignatureInputInner, () => true)
export default SignatureInput
