import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine, Camera, RefreshCw, Image as ImageIcon, Camera as CameraIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState('camera'); // 'camera' | 'file'
    const scannerRef = useRef(null);
    const isScanningRef = useRef(false);

    const stopScanning = useCallback(() => {
        if (scannerRef.current && isScanningRef.current) {
            scannerRef.current.stop()
                .then(() => {
                    console.log('Escáner detenido');
                    isScanningRef.current = false;
                })
                .catch(err => console.error('Error deteniendo:', err));
        }
    }, []);

    const startCameraScanning = useCallback(async () => {
        if (!containerRef.current) return;
        
        try {
            setIsLoading(true);
            setError(null);
            setMode('camera');
            
            const containerId = 'qr-reader';
            
            // Crear elemento div para el scanner si no existe
            let scannerDiv = document.getElementById(containerId);
            if (!scannerDiv) {
                scannerDiv = document.createElement('div');
                scannerDiv.id = containerId;
                scannerDiv.style.width = '100%';
                scannerDiv.style.height = '100%';
                containerRef.current.appendChild(scannerDiv);
            }
            
            // Limpiar scanner anterior
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                } catch (e) {}
            }
            
            // Crear nuevo scanner
            const scanner = new Html5Qrcode(containerId);
            scannerRef.current = scanner;
            
            // Configuración optimizada para códigos de barras 1D en mobile
            const config = {
                fps: 10,
                qrbox: { width: 280, height: 140 },
                aspectRatio: 1.777,
                disableFlip: false,
                videoConstraints: {
                    facingMode: 'environment',
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                }
            };
            
            console.log('Iniciando escáner con config:', config);
            
            await scanner.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    console.log('✅ Código detectado:', decodedText);
                    onScan(decodedText);
                },
                (errorMessage) => {
                    // Errores de scanning son normales cuando no hay código
                    // No loguear para no llenar la consola
                }
            );
            
            isScanningRef.current = true;
            console.log('Escáner iniciado correctamente');
            setIsLoading(false);
            
        } catch (err) {
            console.error('Error iniciando escáner:', err);
            setIsLoading(false);
            
            if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
                setError('Permiso de cámara denegado.');
            } else if (err.message?.includes('No camera')) {
                setError('No se encontró cámara disponible.');
            } else {
                setError(`Error: ${err.message}`);
            }
        }
    }, [onScan]);

    // Escanear desde archivo/imagen
    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            const scanner = new Html5Qrcode('file-reader');
            const result = await scanner.scanFile(file, true);
            
            console.log('✅ Código detectado en imagen:', result);
            onScan(result);
            
        } catch (err) {
            console.error('Error escaneando imagen:', err);
            setError('No se pudo detectar código en la imagen. Intenta con otra foto.');
            setIsLoading(false);
        }
    }, [onScan]);

    useEffect(() => {
        if (!isOpen) {
            stopScanning();
            return;
        }

        if (!window.isSecureContext) {
            setError('La cámara requiere HTTPS.');
            return;
        }

        // Iniciar automáticamente en modo cámara
        const timer = setTimeout(() => {
            startCameraScanning();
        }, 300);

        return () => {
            clearTimeout(timer);
            stopScanning();
        };
    }, [isOpen, startCameraScanning, stopScanning]);

    const handleClose = () => {
        stopScanning();
        onClose();
    };

    const handleRetry = () => {
        setError(null);
        startCameraScanning();
    };

    const switchToFileMode = () => {
        stopScanning();
        setMode('file');
        setError(null);
        // Abrir selector de archivo
        fileInputRef.current?.click();
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
                            <div className="flex items-center gap-2">
                                {/* Botón modo archivo */}
                                <button
                                    onClick={switchToFileMode}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                    title="Escanear desde foto"
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
                        <div className="flex-1 relative bg-black min-h-[350px]">
                            {!isHttps ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <CameraIcon size={48} className="text-amber-500 mb-3" />
                                    <p className="text-amber-500 font-medium">HTTPS requerido</p>
                                </div>
                            ) : error ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <CameraIcon size={48} className="text-red-500 mb-3" />
                                    <p className="text-red-500 font-medium mb-2">{error}</p>
                                    
                                    {/* Fallback a archivo */}
                                    <div className="mt-4 space-y-3">
                                        <p className="text-white/70 text-sm">
                                            ¿La cámara no funciona bien?
                                        </p>
                                        <button
                                            onClick={switchToFileMode}
                                            className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                                        >
                                            <ImageIcon size={16} />
                                            Subir foto del código
                                        </button>
                                        <button
                                            onClick={handleRetry}
                                            className="flex items-center gap-2 mx-auto px-4 py-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)]"
                                        >
                                            <RefreshCw size={16} />
                                            Reintentar cámara
                                        </button>
                                    </div>
                                </div>
                            ) : mode === 'file' ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <ImageIcon size={48} className="text-primary-500 mb-3" />
                                    <p className="text-white font-medium mb-2">Sube una foto del código</p>
                                    <p className="text-white/70 text-sm mb-4">
                                        Selecciona una imagen clara del código de barras
                                    </p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                Analizando...
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={16} />
                                                Seleccionar imagen
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMode('camera');
                                            startCameraScanning();
                                        }}
                                        className="mt-3 text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)]"
                                    >
                                        Volver a cámara
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Contenedor del scanner */}
                                    <div 
                                        ref={containerRef}
                                        className="absolute inset-0"
                                        style={{ 
                                            overflow: 'hidden'
                                        }}
                                    />
                                    
                                    {/* Overlay con instrucciones */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
                                        
                                        {/* Marco de escaneo */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-36">
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
                                        
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <p className="text-white text-sm font-medium drop-shadow-md">
                                                {isLoading ? 'Iniciando cámara...' : 'Acerca el código al recuadro'}
                                            </p>
                                            <p className="text-white/70 text-xs mt-1">
                                                Toca 📷 para usar foto si no enfoca
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* Input oculto para archivos */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            
                            {/* Div oculto para escaneo de archivo */}
                            <div id="file-reader" className="hidden" />
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-body)]">
                            <p className="text-xs text-[var(--text-muted)] text-center">
                                {error ? 'Intenta usar la opción de foto' : 'Escanea el código de barras del producto'}
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
