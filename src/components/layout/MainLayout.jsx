import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import ConfirmModal from '../common/ConfirmModal';
import { useNavigationGuard } from '../../context/NavigationGuardContext';

const MainLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    
    const { 
        showConfirmModal, 
        handleConfirmNavigation, 
        handleCancelNavigation, 
        modalConfig 
    } = useNavigationGuard();

    return (
        <div className="relative min-h-screen app-body theme-transition overflow-x-hidden">
            {/* Sidebar */}
            <Sidebar 
                collapsed={collapsed} 
                setCollapsed={setCollapsed} 
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content */}
            <div
                className={`
                    relative z-0
                    min-h-screen flex flex-col
                    transition-all duration-300 ease-out
                    ${collapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'}
                `}
            >
                <Header onMenuClick={() => setMobileOpen(true)} />

                <motion.main
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 p-4 lg:p-6"
                >
                    {children}
                </motion.main>
            </div>

            {/* Global Navigation Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={handleCancelNavigation}
                onConfirm={handleConfirmNavigation}
                title={modalConfig.title}
                description={modalConfig.description}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                type={modalConfig.type}
            />
        </div>
    );
};

export default MainLayout;
