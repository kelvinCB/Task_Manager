import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { useTranslation } from 'react-i18next';
import { cn, getAvatarColor } from '@/lib/utils';
import { ImagePlus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogClose,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/Avatar';
import ImageCropModal from './ImageCropModal';
import { useCharacterLimit } from '../../../hooks/use-character-limit';

interface MyProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
    isOpen,
    onClose
}) => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { profile, updateProfile, uploadAvatar } = useUserProfile();
    const { t } = useTranslation();

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [linkedin, setLinkedin] = useState('');
    // about state managed by useCharacterLimit hook below

    // Character limit for About
    const maxLength = 180;
    const {
        value: aboutValue,
        characterCount,
        handleChange: handleAboutChange,
        setValue: setAboutValue
    } = useCharacterLimit({ maxLength, initialValue: '' });

    // Avatar State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    // Initialize form when profile loads
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setLinkedin(profile.linkedin || '');
            setAboutValue(profile.about || '');
        }
    }, [profile, setAboutValue]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(t('account.image_too_large'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        try {
            setIsUploading(true);
            const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
            await uploadAvatar(file);
            setIsCropModalOpen(false);
            setSelectedImage(null);
            toast.success(t('account.upload_success'));
        } catch (err: any) {
            console.error('Failed to upload avatar:', err);
            toast.error(t('common.error'), {
                description: err.message || t('account.upload_error'),
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            await updateProfile({
                display_name: displayName,
                linkedin: linkedin,
                about: aboutValue
            });
            toast.success('Profile updated successfully');
            onClose();
        } catch (error: any) {
            console.error('Error updating profile', error);
            toast.error('Failed to update profile');
        }
    };

    const profileImage = profile?.avatar_url || "https://github.com/shadcn.png";

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent data-testid="my-profile-modal" className={`sm:max-w-xl p-0 overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
                    <DialogHeader className="sr-only">
                        <DialogTitle>My Profile</DialogTitle>
                        <DialogDescription>Edit your profile information and settings</DialogDescription>
                    </DialogHeader>

                    {/* Gradient Banner */}
                    <div
                        className="px-6 py-4 h-36"
                        style={{
                            background: theme === 'dark'
                                ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" // Indigo-600 to Violet-600
                                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", // Indigo-500 to Violet-500
                        }}
                    />

                    {/* Avatar Section */}
                    {/* Avatar Section */}
                    <div className="-mt-14 flex justify-center">
                        <div
                            className="relative group cursor-pointer"
                            onClick={handleAvatarClick}
                            role="button"
                            aria-label="Change profile picture"
                        >
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg rounded-full group-hover:opacity-90 transition-opacity">
                                <AvatarImage src={profileImage} alt="Profile" />
                                <AvatarFallback className={`${getAvatarColor(profile?.username || 'U')} text-4xl text-white`}>
                                    {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>

                            {/* Overlay for hover effect */}
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ImagePlus className="text-white w-8 h-8" />
                            </div>

                            {/* Persistent badge */}
                            <div
                                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white group-hover:opacity-0 transition-opacity"
                            >
                                <ImagePlus size={16} />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-10">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="max-h-[50vh] overflow-y-auto px-6 py-6 space-y-4">
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <div className="space-y-1.5">
                                <Label htmlFor="displayName" className={theme === 'dark' ? 'text-gray-200' : ''}>Full Name</Label>
                                <Input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-indigo-500' : ''}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className={theme === 'dark' ? 'text-gray-200' : ''}>{t('account.email')}</Label>
                                    <Input
                                        id="email"
                                        value={user?.email || ''}
                                        disabled
                                        className={theme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-muted text-muted-foreground'}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="username" className={theme === 'dark' ? 'text-gray-200' : ''}>{t('account.username')}</Label>
                                    <Input
                                        id="username"
                                        value={profile?.username || ''}
                                        disabled
                                        className={theme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-muted text-muted-foreground'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="credits" className={theme === 'dark' ? 'text-gray-200' : ''}>Remaining credits</Label>
                                <div className="relative">
                                    <Input
                                        id="credits"
                                        value={profile?.credits?.toString() || '0'}
                                        disabled
                                        className={`pl-9 opacity-70 cursor-not-allowed ${theme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-muted'}`}
                                    />
                                    <div className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                        <CreditCard size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="linkedin" className={theme === 'dark' ? 'text-gray-200' : ''}>LinkedIn Profile</Label>
                                <Input
                                    id="linkedin"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    placeholder="https://linkedin.com/in/..."
                                    className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-indigo-500' : ''}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <Label htmlFor="about" className={theme === 'dark' ? 'text-gray-200' : ''}>About</Label>
                                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                        {characterCount}/{maxLength}
                                    </span>
                                </div>
                                <Textarea
                                    id="about"
                                    value={aboutValue}
                                    onChange={handleAboutChange}
                                    placeholder="Tell us a bit about yourself..."
                                    className={`min-h-[100px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-indigo-500' : ''}`}
                                    maxLength={maxLength}
                                />
                            </div>
                        </form>
                    </div>

                    <DialogFooter className={`border-t px-6 py-4 rounded-b-2xl ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                        <DialogClose asChild>
                            <Button variant="outline" onClick={onClose} className={theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' : 'border-gray-200 hover:bg-gray-100'}>Cancel</Button>
                        </DialogClose>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>

            </Dialog>
            {isCropModalOpen && selectedImage && (
                <ImageCropModal
                    image={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setIsCropModalOpen(false);
                        setSelectedImage(null);
                    }}
                    isUploading={isUploading}
                    error={null}
                />
            )}
        </>
    );
};
