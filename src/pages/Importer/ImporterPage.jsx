import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { motion } from 'framer-motion';
import {
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle,
    AlertCircle,
    X,
    Table,
    Info
} from 'lucide-react';
import Button from '../../components/common/Button';

const ImporterPage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importType, setImportType] = useState('products');

    const isAdmin = user?.role?.name === 'admin';
    const features = user?.company?.features || {};

    const importTypes = [
        { id: 'products', label: 'Productos', description: 'Importa productos con código, nombre, precio, stock, etc.' },
        { id: 'clients', label: 'Clientes', description: 'Importa clientes con nombre, contacto, dirección, etc.' },
        { id: 'stock', label: 'Movimientos de Stock', description: 'Importa ajustes de stock masivos' },
    ];

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
                addToast('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV', 'error');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
                addToast('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV', 'error');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownloadTemplate = () => {
        // Aquí se descargaría la plantilla correspondiente al tipo de importación
        addToast(`Descargando plantilla de ${importTypes.find(t => t.id === importType)?.label}...`, 'info');
        // TODO: Implementar descarga real de plantilla
    };

    const handleImport = async () => {
        if (!selectedFile) {
            addToast('Por favor selecciona un archivo para importar', 'error');
            return;
        }

        setUploading(true);
        
        try {
            // TODO: Implementar llamada al backend para procesar el archivo
            // const formData = new FormData();
            // formData.append('file', selectedFile);
            // formData.append('type', importType);
            // await importService.upload(formData);
            
            // Simulación de proceso
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            addToast('Archivo importado exitosamente', 'success');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error importing file:', error);
            addToast('Error al importar el archivo', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Verificar acceso
    if (!isAdmin || features.importer !== true) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-[var(--text-muted)] text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <h2 className="text-lg font-semibold mb-2">Acceso Restringido</h2>
                    <p className="text-sm">No tienes permiso para acceder a esta sección o el módulo no está habilitado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    Importador
                </h1>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 font-medium">
                    Importa datos masivamente desde archivos Excel o CSV.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda - Tipo de importación */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-5">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Table size={14} />
                                Tipo de Importación
                            </h3>

                            <div className="space-y-2">
                                {importTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setImportType(type.id)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                                            importType === type.id
                                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                                                : 'border-[var(--border-color)] hover:border-primary-300 hover:bg-[var(--bg-hover)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                importType === type.id
                                                    ? 'border-primary-500 bg-primary-500'
                                                    : 'border-[var(--border-color)]'
                                            }`}>
                                                {importType === type.id && (
                                                    <CheckCircle size={12} className="text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-[13px] font-semibold ${
                                                    importType === type.id ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--text-primary)]'
                                                }`}>
                                                    {type.label}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                    {type.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Instrucciones */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <Info size={16} className="text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-[12px] font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                    Importante
                                </p>
                                <ul className="text-[11px] text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                                    <li>Usa las plantillas proporcionadas</li>
                                    <li>No modifiques los encabezados</li>
                                    <li>Verifica los datos antes de importar</li>
                                    <li>Máximo 10,000 filas por archivo</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha - Upload */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-5">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Upload size={14} />
                                Subir Archivo
                            </h3>

                            {/* Drop Zone */}
                            {!selectedFile ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className="border-2 border-dashed border-[var(--border-color)] hover:border-primary-400 rounded-xl p-10 text-center cursor-pointer transition-all duration-200 hover:bg-primary-50/30 dark:hover:bg-primary-900/10"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                                        <FileSpreadsheet size={28} className="text-primary-600" />
                                    </div>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
                                        Arrastra un archivo aquí o haz clic para seleccionar
                                    </p>
                                    <p className="text-[12px] text-[var(--text-muted)]">
                                        Formatos soportados: .xlsx, .xls, .csv
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <FileSpreadsheet size={24} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)]">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveFile}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-[var(--text-muted)] hover:text-red-600 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={handleDownloadTemplate}
                                    className="flex-1"
                                >
                                    <Download size={16} className="mr-2" />
                                    Descargar Plantilla
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleImport}
                                    loading={uploading}
                                    disabled={!selectedFile}
                                    className="flex-1"
                                >
                                    <Upload size={16} className="mr-2" />
                                    {uploading ? 'Importando...' : 'Importar Datos'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Historial de importaciones (placeholder) */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-5">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-4">
                                Últimas Importaciones
                            </h3>
                            
                            <div className="text-center py-8 text-[var(--text-muted)]">
                                <Table size={32} className="mx-auto mb-3 opacity-50" />
                                <p className="text-[13px]">No hay importaciones recientes</p>
                                <p className="text-[11px] mt-1">
                                    Las importaciones realizadas aparecerán aquí
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImporterPage;
