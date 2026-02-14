import React from 'react';
import { Package, Trash2, User, Calendar, FileText, Building2, Tag, Minus, Plus } from 'lucide-react';

const BudgetSummary = ({
    items,
    updateItem,
    removeItem,
    subtotal,
    total,
    discountGlobal,
    setDiscountGlobal,
    onConfirm,
    sellers = [],
    salesRepId,
    setSalesRepId,
    notes,
    setNotes,
    date,
    setDate,
    mode = 'create',
    canChangeSeller = true,
    readOnly = false,
    isClient = false,
    selectedClient = null,
    priceList = 1,
    features = {},
    // Commission editing props
    commissionRate = 0,
    setCommissionRate = null,
    commissionAmount = 0,
    canEditCommission = false,
    orderStatus = null,
    // Discount permissions
    canEditProductDiscount = true,
    canEditBudgetDiscount = true
}) => {
    return (
        <div className="space-y-6">
            {/* Header Fields - Estilo consistente con otros pasos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cliente */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                        <Building2 size={12} /> Cliente
                    </label>
                    <div className="px-3 py-2 bg-(--bg-hover) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary) truncate">
                        {selectedClient?.businessName || 'No seleccionado'}
                    </div>
                </div>

                {/* Fecha */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                        <Calendar size={12} /> Fecha
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        disabled={readOnly || isClient}
                        className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary) focus:outline-none focus:border-primary-500 disabled:opacity-50"
                    />
                </div>

                {/* Vendedor */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                        <User size={12} /> Vendedor
                    </label>
                    <select
                        value={salesRepId}
                        onChange={(e) => setSalesRepId(e.target.value)}
                        disabled={!canChangeSeller || readOnly}
                        className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary) focus:outline-none focus:border-primary-500 disabled:opacity-50"
                    >
                        <option value="">Seleccionar vendedor</option>
                        {sellers.map(seller => (
                            <option key={seller._id} value={seller._id}>
                                {seller.firstName} {seller.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Lista de Precios + Descuento */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    {features.priceLists ? (
                        <>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                <Tag size={12} /> Lista / Descuento
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 bg-(--bg-hover) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary)">
                                    {priceList === 1 ? 'Lista 1' : 'Lista 2'}
                                </div>
                                <div className="flex items-center gap-1 px-2 py-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800 w-24">
                                    <input
                                        type="number"
                                        className="w-full bg-transparent text-xs font-bold text-success-700 dark:text-success-400 outline-none disabled:opacity-50 text-center"
                                        value={discountGlobal}
                                        onChange={(e) => setDiscountGlobal(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                        placeholder="0"
                                        disabled={readOnly || isClient || !canEditBudgetDiscount}
                                    />
                                    <span className="text-xs font-bold text-success-600/50 dark:text-success-400/50">%</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                Descuento Global
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                <input
                                    type="number"
                                    className="flex-1 bg-transparent text-sm font-bold text-success-700 dark:text-success-400 outline-none disabled:opacity-50"
                                    value={discountGlobal}
                                    onChange={(e) => setDiscountGlobal(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                    placeholder="0"
                                    disabled={readOnly || isClient || !canEditBudgetDiscount}
                                />
                                <span className="text-xs font-bold text-success-600/50 dark:text-success-400/50">%</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover) flex justify-between items-center">
                            <h3 className="text-sm font-bold text-(--text-primary)">Productos Seleccionados</h3>
                            <span className="px-2 py-1 bg-(--bg-card) rounded-md text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">{items.length} items</span>
                        </div>
                        <div className="divide-y divide-(--border-color)">
                            {items.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-(--bg-hover) rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Package size={32} className="text-(--text-muted) opacity-50" />
                                    </div>
                                    <p className="text-(--text-muted) text-sm font-medium">No hay productos seleccionados</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.productId} className="p-4 flex items-center gap-4 hover:bg-(--bg-hover) transition-colors">
                                        <div className="w-12 h-12 bg-(--bg-hover) rounded-xl flex items-center justify-center text-(--text-muted) shrink-0">
                                            <Package size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <p className="text-sm font-bold text-(--text-primary)">{item.name}</p>
                                                    <p className="text-[11px] text-(--text-muted)">{item.code}</p>
                                                </div>
                                                {!readOnly && (
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="p-1.5 text-(--text-muted) hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {readOnly ? (
                                                        <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                                                            <span className="px-2 py-1 bg-(--bg-hover) rounded-md">Cant: {item.quantity}</span>
                                                            {item.discount > 0 && <span className="text-success-600 dark:text-success-400">-{item.discount}%</span>}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-1 p-0.5 bg-(--bg-hover) rounded-lg border border-(--border-color)">
                                                                <button
                                                                    onClick={() => updateItem(item.productId, 'quantity', Math.max(1, item.quantity - 1))}
                                                                    className="w-7 h-7 flex items-center justify-center text-(--text-muted) hover:text-primary-600 hover:bg-(--bg-card) rounded-md transition-colors"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    className="w-10 bg-transparent text-center text-xs font-bold text-(--text-primary)"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                                                                />
                                                                <button
                                                                    onClick={() => updateItem(item.productId, 'quantity', item.quantity + 1)}
                                                                    className="w-7 h-7 flex items-center justify-center text-(--text-muted) hover:text-primary-600 hover:bg-(--bg-card) rounded-md transition-colors"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                            {item.discount > 0 || !isClient ? (
                                                                <div className="flex items-center gap-1 px-2 py-1.5 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                                                    <input
                                                                        type="number"
                                                                        className="w-8 bg-transparent text-center text-xs font-bold text-success-700 dark:text-success-400 disabled:opacity-60"
                                                                        value={item.discount || 0}
                                                                        onChange={(e) => updateItem(item.productId, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                                        disabled={isClient || !canEditProductDiscount}
                                                                    />
                                                                    <span className="text-[10px] font-bold text-success-600/50 dark:text-success-400/50">%</span>
                                                                </div>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-(--text-primary)">
                                                    ${(Number(item.quantity || 0) * Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100))).toLocaleString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                            <FileText size={12} /> Notas / Observaciones
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ingrese notas adicionales..."
                            rows={3}
                            disabled={readOnly}
                            className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-primary-500 resize-none disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-6 shadow-sm space-y-4 sticky top-24">
                        <h3 className="text-sm font-bold text-(--text-primary) border-b border-(--border-color) pb-3">Resumen de Totales</h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-(--text-muted) uppercase tracking-wider">
                                <span>Subtotal</span>
                                <span>${Number(subtotal || 0).toLocaleString('es-AR')}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider">
                                <span>Descuento</span>
                                <span>{discountGlobal}%</span>
                            </div>
                            <div className="pt-3 border-t border-(--border-color) flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-1">Total Final</p>
                                    <p className="text-2xl font-black text-(--text-primary)">${Number(total || 0).toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Commission Editing - Solo admin/superadmin y si no está completo */}
                        {canEditCommission && features.commissionCalculation && orderStatus !== 'completo' && (
                            <div className="pt-4 border-t border-(--border-color) space-y-3">
                                <h4 className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">
                                    Configuración de Comisión
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-(--text-muted) mb-1 block">Porcentaje</label>
                                        <div className="flex items-center gap-1 px-3 py-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={commissionRate}
                                                onChange={(e) => setCommissionRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                className="flex-1 bg-transparent text-sm font-bold text-success-700 dark:text-success-400 outline-none"
                                            />
                                            <span className="text-xs font-bold text-success-600/50 dark:text-success-400/50">%</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-(--text-muted) mb-1 block">Monto</label>
                                        <div className="px-3 py-2 bg-(--bg-hover) border border-(--border-color) rounded-lg text-sm font-bold text-success-600 dark:text-success-400">
                                            ${Number(commissionAmount || 0).toLocaleString('es-AR')}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-(--text-muted) italic">
                                    * Esta comisión se aplicará al vendedor asignado
                                </p>
                            </div>
                        )}
                        
                        {/* Commission Display (solo lectura) */}
                        {(orderStatus === 'completo' || !canEditCommission) && commissionAmount > 0 && features.commissionCalculation && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">
                                        Comisión ({commissionRate}%)
                                    </span>
                                    <span className="text-sm font-bold text-success-600 dark:text-success-400">
                                        ${Number(commissionAmount || 0).toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <p className="text-[10px] text-center text-(--text-muted) font-medium leading-relaxed italic pt-3 border-t border-(--border-color)">
                            * Los precios no incluyen IVA
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetSummary;
