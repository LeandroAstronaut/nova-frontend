import React from 'react';

const Input = ({ label, labelRight, icon: Icon, error, ...props }) => {
    return (
        <div className="mb-4">
            {(label || labelRight) && (
                <div className="flex items-center justify-between mb-1.5 px-1">
                    {label && (
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                            {label}
                        </label>
                    )}
                    {labelRight && (
                        <div className="flex items-center">
                            {labelRight}
                        </div>
                    )}
                </div>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary-500 transition-colors">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    className={`
                        input
                        ${Icon ? 'pl-9' : 'pl-4'} py-2.5
                        ${error ? 'input-error' : ''}
                    `}
                    {...props}
                />
            </div>
            {error && <p className="mt-1.5 ml-1 text-xs text-danger-500 font-medium">{error}</p>}
        </div>
    );
};

export default Input;
