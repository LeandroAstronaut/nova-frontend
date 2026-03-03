import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, ScanLine, Camera, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const codeReaderRef = useRef(null);
    const controlsRef = useRef(null);

    const stopScanning = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        if (codeReaderRef.current) {
            codeReaderRef.current = null;
        }
    }, []);

    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        try {
            setIsLoading(true);
            const codeReader = new BrowserMultiFormatReader();
            const result = await codeReader.decodeFromImageUrl(URL.createObjectURL(file));
            
            if (result) {
                onScan(result.getText());
            }
        } catch (err) {
            console.error('Error escaneando imagen:', err);
            setError('No se pudo leer el código de la imagen. Intenta con otra foto más nítida.');
        } finally {
            setIsLoading(false);
        }
    }, [onScan]);

    const startScanning = useCallback(async () => {
        console.log('startScanning llamado, videoRef:', videoRef.current);
        
        if (!videoRef.current) {
            console.error('Video ref no disponible');
            setError('Error: Video no disponible');
            return;
        }
        
        try {
            setIsLoading(true);
            setError(null);
            
            const video = videoRef.current;
            
            const codeReader = new BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;

            // Obtener dispositivos usando API del navegador
            console.log('Obteniendo dispositivos...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            console.log('Dispositivos encontrados:', videoDevices.length);
            
            if (videoDevices.length === 0) {
                throw new Error('No se encontró cámara');
            }

            // Seleccionar cámara trasera
            const selectedDevice = videoDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('trasera') ||
                device.label.toLowerCase().includes('environment')
            ) || videoDevices[videoDevices.length - 1];

            console.log('Usando dispositivo:', selectedDevice.deviceId.slice(0,8), selectedDevice.label);

            // Iniciar escaneo
            console.log('Iniciando decodeFromVideoDevice...');
            controlsRef.current = await codeReader.decodeFromVideoDevice(
                selectedDevice.deviceId,
                video,
                (result, err) => {
                    if (result) {
                        const code = result.getText();
                        console.log('✅ Código:', code);
                        onScan(code);
                    }
                }
            );
            
            console.log('Escáner iniciado correctamente');
            setIsLoading(false);
            
        } catch (err) {
            console.error('Error completo:', err);
            setIsLoading(false);
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Permiso de cámara denegado.');
            } else if (err.message?.includes('No camera')) {
                setError('No se encontró cámara.');
            } else {
                setError(`Error: ${err.message || 'Desconocido'}`);
            }
        }
    }, [onScan]);

    // Efecto para iniciar escaneo cuando el modal abre
    useEffect(() => {
        if (!isOpen) {
            stopScanning();
            return;
        }

        if (!window.isSecureContext) {
            setError('HTTPS requerido');
            return;
        }

        // Esperar a que el video element esté listo
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkAndStart = () => {
            attempts++;
            console.log(`Intento ${attempts}, videoRef:`, videoRef.current);
            
            if (videoRef.current) {
                startScanning();
            } else if (attempts < maxAttempts) {
                setTimeout(checkAndStart, 100);
            } else {
                console.error('Video element no disponible después de', maxAttempts, 'intentos');
                setError('Error: Video no disponible');
            }
        };
        
        checkAndStart();

        return () => stopScanning();
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
                                <h3 className="font-semibold text-[var(--text-primary)]">Escanear código</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Botón foto */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                    title="Usar foto"
                                >
                                    <ImageIcon size={18} />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 relative bg-black min-h-[350px] flex items-center justify-center">
                            {!isHttps ? (
                                <div className="text-center p-6">
                                    <Camera size={48} className="text-amber-500 mx-auto mb-3" />
                                    <p className="text-amber-500 font-medium">HTTPS requerido</p>
                                </div>
                            ) : error ? (
                                <div className="text-center p-6">
                                    <Camera size={48} className="text-red-500 mx-auto mb-3" />
                                    <p className="text-red-500 font-medium mb-2">{error}</p>
                                    <div className="mt-4 space-y-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
                                        >
                                            <ImageIcon size={16} />
                                            Usar foto
                                        </button>
                                        <button
                                            onClick={handleRetry}
                                            className="text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)]"
                                        >
                                            Reintentar cámara
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={(el) => {
                                            videoRef.current = el;
                                            console.log('Video element asignado:', el);
                                        }}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        playsInline
                                        muted
                                        autoPlay
                                    />
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32">
                                            <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-primary-500" />
                                            <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-primary-500" />
                                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-primary-500" />
                                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-primary-500" />
                                            <div 
                                                className="absolute left-0 right-0 h-0.5 bg-primary-400"
                                                style={{ animation: 'scan 2s linear infinite' }}
                                            />
                                        </div>
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <p className="text-white text-sm font-medium drop-shadow-md">
                                                {isLoading ? 'Iniciando...' : 'Acerca el código al recuadro'}
                                            </p>
                                            {!isLoading && (
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="mt-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white/90 text-xs backdrop-blur-sm transition-colors pointer-events-auto"
                                                >
                                                    📷 Si tu cámara no enfoca, tocá acá
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-body)]">
                            <p className="text-xs text-[var(--text-muted)] text-center">
                                {error ? 'Intenta con la opción de foto' : 'Escanea el código de barras del producto'}
                            </p>
                        </div>
                    </motion.div>
                    
                    <style>{`
                        @keyframes scan {
                            0% { top: 0; }
                            50% { top: 100%; }
                            100% { top: 0; }
                        }
                        .border-t-3 { border-top-width: 3px; }
                        .border-l-3 { border-left-width: 3px; }
                        .border-r-3 { border-right-width: 3px; }
                        .border-b-3 { border-bottom-width: 3px; }
                    `}</style>
                </>
            )}
        </AnimatePresence>
    );
};

export default BarcodeScanner;
