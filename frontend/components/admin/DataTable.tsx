'use client';

import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    currentSort?: { key: string; direction: 'asc' | 'desc' };
}

export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    onSort,
    currentSort
}: DataTableProps<T>) {
    const handleSort = (key: string) => {
        if (!onSort) return;

        const newDirection = currentSort?.key === key && currentSort?.direction === 'asc' ? 'desc' : 'asc';
        onSort(key, newDirection);
    };

    const getSortIcon = (key: string) => {
        if (!currentSort || currentSort.key !== key) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
        }
        return currentSort.direction === 'asc'
            ? <ChevronUp className="w-4 h-4 text-blue-600" />
            : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
                <div className="p-12 text-center">
                    <div className="relative inline-block">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-emerald-500"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500/20"
                        />
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-slate-600"
                    >
                        Loading data...
                    </motion.p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200"
            >
                <div className="p-12 text-center">
                    <p className="text-slate-500 text-lg">No data available</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200"
        >
            <div className="overflow-x-auto custom-scrollbar table-scroll">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                            {columns.map((column, index) => (
                                <motion.th
                                    key={column.key}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    scope="col"
                                    className={`px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''
                                        }`}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {column.sortable && (
                                            <motion.div
                                                whileHover={{ scale: 1.2 }}
                                                transition={{ type: 'spring', stiffness: 400 }}
                                            >
                                                {getSortIcon(column.key)}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item, index) => (
                            <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03, duration: 0.3 }}
                                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', scale: 1.01 }}
                                className="transition-all"
                            >
                                {columns.map((column) => (
                                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {column.render ? column.render(item) : item[column.key]}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
