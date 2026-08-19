import React, { useState } from 'react';
import { RingsAlbum } from '@/components';
import { Share2, Check } from 'lucide-react';

export default function Albums() {
    const [selectedTab, setSelectedTab] = useState('anillos');
    const [copied, setCopied] = useState(false);

    const tabs = [
        { id: 'anillos', label: 'Anillos' },
        // En el futuro puedes añadir más pestañas aquí:
        // { id: 'cadenas', label: 'Cadenas' },
        // { id: 'dijes', label: 'Dijes' }
    ];

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Catálogos - Joyería',
                    text: 'Mira nuestra colección de diseños exclusivos.',
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            console.error('Error al compartir:', error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in pb-20 relative">
            {/* Botón de Compartir */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <button 
                    onClick={handleShare}
                    className="btn btn-circle btn-ghost text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Compartir catálogo"
                >
                    {copied ? <Check className="w-5 h-5 text-success" /> : <Share2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-4 pt-2">
                <h1 className="text-2xl font-bold text-base-content">Catálogos</h1>
                <p className="text-base-content/70">Explora nuestras colección de diseños.</p>
            </div>

            {/* SELECTOR DE TABS */}
            <div className="flex justify-center mb-6">
                <div className="flex gap-1 bg-base-200/50 dark:bg-base-950/40 p-1.5 rounded-2xl border border-base-200/60 dark:border-base-850/60 w-full max-w-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedTab(tab.id)}
                            className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-transform duration-200 transform active:scale-105 ease-in-out ${
                                selectedTab === tab.id
                                    ? "bg-primary text-primary-content shadow-sm"
                                    : "text-base-content/60 active:bg-base-300/35 dark:active:bg-base-900/40"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* RENDERIZADO DE TABS */}
            <div className="mt-4">
                {selectedTab === 'anillos' && <RingsAlbum />}
                {/* 
                {selectedTab === 'cadenas' && <CadenasAlbum />} 
                {selectedTab === 'dijes' && <DijesAlbum />} 
                */}
            </div>
        </div>
    );
}