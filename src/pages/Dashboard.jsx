import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Users, FileText, ArrowRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card hover:shadow-soft-lg dark:hover:shadow-soft-lg-dark transition-all group">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-xl bg-${color}-50 dark:bg-${color}-900/30 flex items-center justify-center text-${color}-600 dark:text-${color}-400 group-hover:bg-${color}-600 group-hover:text-white dark:group-hover:bg-${color}-500 transition-all`}>
                <Icon size={22} />
            </div>
            <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">Hoy</span>
        </div>
        <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{value}</div>
        <div className="text-sm font-medium text-[var(--text-secondary)]">{title}</div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const isSuperadmin = user?.role?.name === 'superadmin';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                        {isSuperadmin ? 'Panel de Super Administrador' : 'Panel de Control'}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm">
                        {isSuperadmin 
                            ? 'Vista general de todas las compañías del sistema NOVA Orden.' 
                            : 'Resumen general de tu actividad en NOVA Orden.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Pedidos Nuevos" value="12" icon={ShoppingCart} color="primary" />
                <StatCard title="Clientes Activos" value="148" icon={Users} color="success" />
                <StatCard title="Recibos Pendientes" value="7" icon={FileText} color="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card rounded-[2.5rem]">
                    <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        Próximos Pasos
                        <ArrowRight size={18} className="text-primary-600 dark:text-primary-400" />
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover:bg-[var(--bg-card)] transition-all cursor-pointer">
                            <p className="font-bold text-[var(--text-primary)] text-sm mb-1">Implementar Módulo de Pedidos</p>
                            <p className="text-xs text-[var(--text-secondary)]">Datatables avanzados con filtros estilo Metronic.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-transparent hover:border-success-200 dark:hover:border-success-800 hover:bg-[var(--bg-card)] transition-all cursor-pointer">
                            <p className="font-bold text-[var(--text-primary)] text-sm mb-1">Configurar Catálogo Online</p>
                            <p className="text-xs text-[var(--text-secondary)]">Grilla de productos con visor de imágenes preview.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-600 dark:bg-primary-700 p-8 rounded-[2.5rem] shadow-lg shadow-primary-100 dark:shadow-primary-900/30 text-white relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                    <h3 className="text-xl font-bold mb-4 relative z-10">NOVA Orden Premium</h3>
                    <p className="text-primary-100 dark:text-primary-200 text-sm leading-relaxed mb-6 relative z-10">
                        Estás usando la versión v1.0. Pronto incluiremos sincronización automática con tu ERP local y notificaciones por WhatsApp.
                    </p>
                    <button className="bg-white text-primary-600 dark:text-primary-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-50 transition-colors relative z-10">
                        Explorar Novedades
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
