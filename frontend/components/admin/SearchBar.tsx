'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
}

export default function SearchBar({
    value,
    onChange,
    placeholder = 'Search...',
    debounceMs = 300
}: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localValue, debounceMs, onChange]);

    return (
        <div className="relative">
            <motion.div
                animate={{
                    scale: isFocused ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative"
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <motion.div
                        animate={{
                            rotate: isFocused ? 90 : 0,
                            scale: isFocused ? 1.1 : 1,
                        }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <Search className={`h-5 w-5 transition-colors ${isFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                    </motion.div>
                </div>
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-500 
                        focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        sm:text-sm transition-all duration-200 ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-gray-300 shadow-sm'
                        }`}
                    placeholder={placeholder}
                />
                <AnimatePresence>
                    {localValue && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setLocalValue('');
                                onChange('');
                            }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <X className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
