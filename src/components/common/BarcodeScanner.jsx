import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, ScanLine, Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied', 'checking'
    const [scanning, setScanning] = useState(false);
    const codeReaderRef = useRef(null);
    const controlsRef = useRef(null);

    // Verificar permisos de cámara
    const checkCameraPermission = useCallback(async () => {
        try {
            setPermissionState('checking');
            
            // Verificar si la API de permisos está disponible
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'camera' });
                setPermissionState(result.state);
                
                result.addEventListener('change', () => {
                    setPermissionState(result.state);
                });
                
                return result.state;
            }
            
            // Fallback: intentar getUserMedia directamente
            return 'prompt';
        } catch (err) {
            console.log('No se puede verificar permisos:', err);
            return 'prompt';
        }
    }, []);

    // Solicitar permiso explícitamente
    const requestCameraPermission = async () => {
        try {
            setError(null);
            setPermissionState('checking');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            // Si llegamos aquí, tenemos permiso
            setPermissionState('granted');
            
            // Detener el stream temporal, el escáner usará el suyo propio
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (err) {
            console.error('Error solicitando permiso:', err);
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setPermissionState('denied');
                setError('Permiso de cámara denegado. Por favor, habilita el acceso en la configuración de tu navegador.');
            } else if (err.name === 'NotFoundError') {
                setError('No se encontró cámara disponible en este dispositivo.');
            } else if (err.name === 'NotReadableError') {
                setError('La cámara está siendo usada por otra aplicación.');
            } else {
                setError(`Error al acceder a la cámara: ${err.message}`);
            }
            
            return false;
        }
    };

    const startScanning = useCallback(async () => {
        if (!videoRef.current) return;
        
        try {
            setError(null);
            setScanning(true);
            
            const codeReader = new BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;

            // Intentar obtener dispositivos de video
            let videoInputDevices = [];
            try {
                videoInputDevices = await codeReader.listVideoInputDevices();
            } catch (e) {
                console.log('No se pueden listar dispositivos, intentando directamente');
            }
            
            // Configuración de video optimizada para códigos de barras
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }
            };

            // Si tenemos dispositivos específicos, usar el trasero
            if (videoInputDevices.length > 0) {
                const backCamera = videoInputDevices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('trasera') ||
                    device.label.toLowerCase().includes('rear')
                );
                
                if (backCamera) {
                    constraints.video.deviceId = { exact: backCamera.deviceId };
                    delete constraints.video.facingMode;
                } else {
                    constraints.video.deviceId = { exact: videoInputDevices[0].deviceId };
                    delete constraints.video.facingMode;
                }
            }

            // Iniciar decodificación desde stream con constraints específicos
            controlsRef.current = await codeReader.decodeFromConstraints(
                constraints,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        const code = result.getText();
                        console.log('Código detectado:', code);
                        onScan(code);
                    }
                    // Ignorar errores cuando no se encuentra código (es normal mientras se enfoca)
                    if (err && err.name !== 'NotFoundException') {
                        console.error('Error de decodificación:', err);
                    }
                }
            );
            
            setPermissionState('granted');
        } catch (err) {
            console.error('Error iniciando escáner:', err);
            setScanning(false);
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setPermissionState('denied');
                setError('Permiso de cámara denegado. Por favor, habilita el acceso en la configuración de tu navegador.');
            } else {
                setError(`Error al iniciar la cámara: ${err.message}`);
            }
        }
    }, [onScan]);

    useEffect(() => {
        if (!isOpen) return;

        // Verificar si es HTTPS o localhost
        const isSecureContext = window.isSecureContext;
        if (!isSecureContext) {
            setError('La cámara requiere una conexión segura (HTTPS). Por favor, accede usando https:// o localhost.');
            setPermissionState('denied');
            return;
        }

        // Verificar soporte de getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Tu navegador no soporta acceso a la cámara. Intenta con Chrome, Firefox o Safari actualizados.');
            setPermissionState('denied');
            return;
        }

        // Verificar permisos y luego iniciar
        const init = async () => {
            const permission = await checkCameraPermission();
            
            if (permission === 'granted') {
                startScanning();
            } else if (permission === 'prompt') {
                // Solicitar permiso explícitamente
                const granted = await requestCameraPermission();
                if (granted) {
                    startScanning();
                }
            } else {
                setError('Permiso de cámara denegado. Por favor, habilita el acceso en la configuración de tu navegador.');
            }
        };

        init();

        return () => {
            if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
            }
            if (codeReaderRef.current) {
                codeReaderRef.current = null;
            }
            setScanning(false);
        };
    }, [isOpen, checkCameraPermission, startScanning]);

    const handleClose = () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
        }
        onClose();
    };

    const handleRetry = async () => {
        const granted = await requestCameraPermission();
        if (granted) {
            startScanning();
        }
    };

    // Verificar si estamos en HTTPS
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 z-50"
                    />
                    
                    {/* Modal */}
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

                        {/* Content */}
                        <div className="flex-1 relative bg-black min-h-[300px] flex items-center justify-center">
                            {!isHttps ? (
                                <div className="text-center p-6">
                                    <Camera size={48} className="text-amber-500 mx-auto mb-3" />
                                    <p className="text-amber-500 font-medium mb-2">Conexión no segura</p>
                                    <p className="text-white/70 text-sm">
                                        La cámara requiere HTTPS. Usa un navegador con https:// o localhost.
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="text-center p-6">
                                    <Camera size={48} className="text-red-500 mx-auto mb-3" />
                                    <p className="text-red-500 font-medium mb-2">{error}</p>
                                    {permissionState === 'denied' && (
                                        <div className="mt-4 space-y-3">
                                            <p className="text-white/70 text-sm">
                                                Para habilitar la cámara:
                                            </p>
                                            <ol className="text-white/70 text-sm text-left list-decimal pl-5 space-y-1">
                                                <li>Haz clic en el ícono 🔒 al lado de la URL</li>
                                                <li>Busca &quot;Cámara&quot; o &quot;Camera&quot;</li>
                                                <li>Cambia a &quot;Permitir&quot; o &quot;Allow&quot;</li>
                                                <li>Recarga la página</li>
                                            </ol>
                                            <button
                                                onClick={handleRetry}
                                                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                                            >
                                                <RefreshCw size={16} />
                                                Intentar nuevamente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : permissionState === 'checking' || permissionState === 'prompt' ? (
                                <div className="text-center p-6">
                                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-white/80">Solicitando acceso a la cámara...</p>
                                    <p className="text-white/60 text-sm mt-2">
                                        Por favor, acepta el permiso cuando el navegador lo solicite.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        playsInline
                                        muted
                                        autoPlay
                                    />
                                    {/* Overlay de guía */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-white/50 rounded-lg">
                                            <div className="absolute inset-0 border-2 border-primary-500/50 rounded-lg animate-pulse" />
                                            {/* Esquinas */}
                                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary-500" />
                                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary-500" />
                                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary-500" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary-500" />
                                        </div>
                                        <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
                                            Centra el código de barras en el recuadro
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-body)]">
                            {error ? (
                                <p className="text-xs text-[var(--text-muted)] text-center">
                                    {isHttps 
                                        ? 'Si el problema persiste, verifica que tu dispositivo tenga cámara disponible.' 
                                        : 'La cámara requiere una conexión segura (HTTPS).'}
                                </p>
                            ) : (
                                <p className="text-xs text-[var(--text-muted)] text-center">
                                    Escanea el código de barras del producto para buscarlo
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BarcodeScanner;
