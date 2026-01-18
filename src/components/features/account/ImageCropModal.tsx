import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface ImageCropModalProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
    isUploading?: boolean;
    error?: string | null;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    image,
    onCropComplete,
    onCancel,
    isUploading = false,
    error = null
}) => {
    const { theme } = useTheme();
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const confirmButtonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        // Force focus on the confirm button after mount to ensure keyboard navigation works 
        // and clicks are registered immediately without a "focusing" click first.
        const timer = setTimeout(() => {
            confirmButtonRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleConfirm = async () => {
        if (croppedAreaPixels) {
            try {
                const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
                onCropComplete(croppedImageBlob);
            } catch (e) {
                console.error('Error cropping image:', e);
            }
        }
    };

    return (
        <DialogPrimitive.Root open={true} onOpenChange={(open) => !open && onCancel()}>
            <DialogPrimitive.Portal>
                {/* Manual Overlay with High Z-Index */}
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-[100] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                />

                {/* Manual Content with Higher Z-Index */}
                <DialogPrimitive.Content
                    className={`
                        fixed left-[50%] top-[50%] z-[101] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%]
                        gap-0 border rounded-2xl shadow-2xl p-0 overflow-hidden duration-200
                        data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                        data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                    `}
                >
                    <DialogPrimitive.Title className="sr-only">Ajustar foto de perfil</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">Corta y ajusta tu nueva foto de perfil</DialogPrimitive.Description>

                    {/* Header */}
                    <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Ajustar foto de perfil
                        </h3>
                        <button
                            onClick={onCancel}
                            disabled={isUploading}
                            className={`p-1 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Cropper Area */}
                    <div className="relative h-80 bg-gray-900">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteInternal}
                            onZoomChange={onZoomChange}
                        />
                    </div>

                    {/* Controls */}
                    <div className="px-6 py-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <ZoomOut size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => onZoomChange(Number(e.target.value))}
                                className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-indigo-500`}
                            />
                            <ZoomIn size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        </div>

                        {error && (
                            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <div className="flex-1 font-medium leading-relaxed">
                                    <p className="font-bold mb-0.5 text-red-800">Error de subida</p>
                                    {error}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={onCancel}
                                disabled={isUploading}
                                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                                    ${theme === 'dark'
                                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                                `}
                            >
                                Cancelar
                            </button>
                            <button
                                ref={confirmButtonRef}
                                onClick={handleConfirm}
                                disabled={isUploading}
                                className={`
                                    px-6 py-2 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20
                                    flex items-center gap-2 transition-all
                                    ${theme === 'dark'
                                        ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    'Aceptar'
                                )}
                            </button>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default ImageCropModal;
