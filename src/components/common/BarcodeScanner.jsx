import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, ScanLine, Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
    const videoElementRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const codeReaderRef = useRef(null);
    const controlsRef = useRef(null);

    const stopScanning = useCallback(() => {
        console.log('Deteniendo escáner...');
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        if (codeReaderRef.current) {
            codeReaderRef.current = null;
        }
        setIsStarted(false);
    }, []);

    const startScanning = useCallback(async () => {
        console.log('Intentando iniciar escáner...');
        console.log('Video element:', videoElementRef.current);
        
        if (!videoElementRef.current) {
            console.error('Video element no disponible');
            setError('Error: Elemento de video no encontrado');
            return;
        }
        
        try {
            setIsLoading(true);
            setError(null);
            
            const video = videoElementRef.current;
            const codeReader = new BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;
            
            console.log('Iniciando decodeFromVideoDevice...');
            
            // Usar undefined como deviceId para que elija automáticamente
            controlsRef.current = await codeReader.decodeFromVideoDevice(
                undefined, // Auto-seleccionar cámara
                video,
                (result, err) => {
                    if (result) {
                        const code = result.getText();
                        console.log('✅ Código detectado:', code);
                        onScan(code);
                    }
                    if (err && err.name !== 'NotFoundException') {
                        console.log('Scan error:', err.name);
                    }
                }
            );
            
            console.log('Escáner iniciado correctamente');
            setIsStarted(true);
            setIsLoading(false);
            
        } catch (err) {
            console.error('Error iniciando escáner:', err);
            setIsLoading(false);
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Permiso de cámara denegado. Habilita el acceso en la configuración.');
            } else if (err.name === 'NotFoundError') {
                setError('No se encontró cámara disponible.');
            } else {
                setError(`Error: ${err.message}`);
            }
        }
    }, [onScan]);

    // Iniciar cuando el modal se abre y el video está listo
    useEffect(() => {
        if (!isOpen) {
            stopScanning();
            return;
        }

        // Verificar HTTPS
        if (!window.isSecureContext) {
            setError('La cámara requiere HTTPS.');
            return;
        }

        // Verificar soporte
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Tu navegador no soporta acceso a la cámara.');
            return;
        }

        // Esperar a que el DOM esté listo
        const timer = setTimeout(() => {
            startScanning();
        }, 300);

        return () => {
            clearTimeout(timer);
            stopScanning();
        };
    }, [isOpen, startScanning, stopScanning]);

    const handleClose = () => {
        stopScanning();
        onClose();
    };

    const handleRetry = () => {
        setError(null);
        startScanning();
    };

    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 z-50"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <div className="flex items-center gap-2">
                                <ScanLine size={20} className="text-primary-600" />
                                <h3 className="font-semibold text-[var(--text-primary)]">
                                    Escanear código
                                </h3>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Video Area */}
                        <div className="flex-1 relative bg-black min-h-[350px] flex items-center justify-center">
                            {!isHttps ? (
                                <div className="text-center p-6">
                                    <Camera size={48} className="text-amber-500 mx-auto mb-3" />
                                    <p className="text-amber-500 font-medium">HTTPS requerido</p>
                                    <p className="text-white/70 text-sm mt-2">Usa https:// o localhost</p>
                                </div>
                            ) : error ? (
                                <div className="text-center p-6">
                                    <Camera size={48} className="text-red-500 mx-auto mb-3" />
                                    <p className="text-red-500 font-medium mb-4">{error}</p>
                                    <button
                                        onClick={handleRetry}
                                        className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                                    >
                                        <RefreshCw size={16} />
                                        Intentar de nuevo
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Video Element - usando callback ref */}
                                    <video
                                        ref={(el) => {
                                            videoElementRef.current = el;
                                            console.log('Video element asignado:', el);
                                        }}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        playsInline
                                        muted
                                        autoPlay
                                        style={{ 
                                            backgroundColor: 'black',
                                            minHeight: '100%',
                                            minWidth: '100%'
                                        }}
                                    />
                                    
                                    {/* Overlay de guía */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
                                        
                                        {/* Marco de escaneo */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-40">
                                            {/* Esquinas */}
                                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500" />
                                            
                                            {/* Línea de escaneo */}
                                            <div 
                                                className="absolute left-0 right-0 h-0.5 bg-primary-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                                                style={{
                                                    animation: 'scan 2.5s ease-in-out infinite',
                                                    top: '0%'
                                                }}
                                            />
                                        </div>
                                        
                                        <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-md">
                                            {isLoading ? 'Iniciando cámara...' : 'Acerca el código de barras al recuadro'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-body)]">
                            <p className="text-xs text-[var(--text-muted)] text-center">
                                {error ? 'Verifica los permisos de cámara' : 'Escanea el código de barras del producto'}
                            </p>
                        </div>
                    </motion.div>
                    
                    <style>{`
                        @keyframes scan {
                            0%, 100% { top: 0%; }
                            50% { top: 100%; }
                        }
                    `}</style>
                </>
            )}
        </AnimatePresence>
    );
};

export default BarcodeScanner;
