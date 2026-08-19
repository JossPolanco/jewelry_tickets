import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

// Import all images eagerly using Vite's import.meta.glob
const allImages = import.meta.glob('@/assets/images/rings_album/*.{png,jpg,jpeg}', { eager: true });

export default function RingsAlbum() {
    const [selectedImage, setSelectedImage] = useState(null);

    // Separate cover from the rest
    let coverImage = null;
    const rings = [];

    Object.entries(allImages).forEach(([path, module]) => {
        // In Vite 4+ with eager: true, module.default has the URL string
        const url = module.default;
        
        if (path.includes('portada_album')) {
            coverImage = url;
        } else {
            rings.push({ path, url });
        }
    });

    // Sort naturally so ring_2 comes before ring_10
    rings.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }));

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Cover Image */}
            {coverImage && (
                <div 
                    className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-base-100 border border-base-200 shadow-sm cursor-pointer group relative"
                    onClick={() => setSelectedImage(coverImage)}
                >
                    <img 
                        src={coverImage} 
                        alt="Portada del Álbum" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-base-content/0 group-hover:bg-base-content/10 transition-colors duration-300 flex items-center justify-center">
                        <ZoomIn className="text-base-100 opacity-0 group-hover:opacity-100 drop-shadow-md w-12 h-12 transition-opacity duration-300" />
                    </div>
                </div>
            )}

            {/* Rings Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {rings.map((ring, index) => (
                    <div 
                        key={ring.path} 
                        className="aspect-square rounded-xl overflow-hidden bg-base-100 border border-base-200 shadow-sm cursor-pointer group relative"
                        onClick={() => setSelectedImage(ring.url)}
                    >
                        <img 
                            src={ring.url} 
                            alt={`Anillo ${index + 1}`} 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-base-content/0 group-hover:bg-base-content/10 transition-colors duration-300 flex items-center justify-center">
                            <ZoomIn className="text-base-100 opacity-0 group-hover:opacity-100 drop-shadow-md w-8 h-8 transition-opacity duration-300" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Fullscreen Image Preview */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-base-content/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 btn btn-circle btn-ghost text-base-100 hover:bg-base-content/50"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    
                    <img 
                        src={selectedImage} 
                        alt="Vista ampliada" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
}
