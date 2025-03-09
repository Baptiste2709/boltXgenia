// app/routes/admin.logos.tsx
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import React, { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { toast } from 'react-toastify';
import { LogoViewer } from '~/components/admin/LogoViewer';
import { useBranding } from '~/components/chat/BrandContext';
import type { LogoMetadata } from '~/utils/logo-storage';

export const loader = () => {
    return json({
        title: 'Gestion des logos - Genia Admin'
    });
};

export default function LogosAdminPage() {
    const { branding, updateBranding } = useBranding();
    const { title } = useLoaderData<{ title: string }>();
    const [dragActive, setDragActive] = useState(false);

    // Gestionnaire pour le drag & drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Gestionnaire pour le drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // Gestionnaire pour la sélection de fichiers via input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    // Fonction pour traiter les fichiers sélectionnés
    const handleFiles = (files: FileList) => {
        const file = files[0];

        // Vérifier que c'est bien une image
        if (!file.type.match('image.*')) {
            toast.error('Veuillez sélectionner une image valide');
            return;
        }

        // Afficher un toast de chargement
        const toastId = toast.loading('Chargement du logo...');

        // Lire le fichier et convertir en Data URL
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (event.target?.result) {
                    const dataUrl = event.target.result as string;

                    // Mettre à jour le toast
                    toast.update(toastId, {
                        render: 'Enregistrement du logo...',
                        type: 'info',
                        isLoading: true
                    });

                    // Sauvegarder le logo via le contexte
                    const savedPath = await useBranding().saveLogo(dataUrl);

                    if (savedPath) {
                        // Mettre à jour le contexte de branding
                        updateBranding({
                            logo: dataUrl,
                            savedPath
                        });

                        // Mettre à jour le toast
                        toast.update(toastId, {
                            render: 'Logo enregistré avec succès!',
                            type: 'success',
                            isLoading: false,
                            autoClose: 3000
                        });
                    } else {
                        throw new Error('Erreur lors de la sauvegarde du logo');
                    }
                }
            } catch (error) {
                console.error('Erreur:', error);
                toast.update(toastId, {
                    render: 'Erreur lors de la sauvegarde du logo',
                    type: 'error',
                    isLoading: false,
                    autoClose: 3000
                });
            }
        };

        reader.readAsDataURL(file);
    };

    // Gestionnaire pour sélectionner un logo depuis la galerie
    const handleSelectLogo = (logo: LogoMetadata) => {
        updateBranding({
            logo: logo.dataUrl,
            savedPath: logo.path
        });

        toast.success('Logo sélectionné et appliqué à la charte graphique');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-bolt-elements-textPrimary mb-6">{title}</h1>

            {/* Indicateur de logo actuel */}
            <div className="mb-8 p-4 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg">
                <h2 className="text-lg font-medium text-bolt-elements-textPrimary mb-3">Logo actuel</h2>

                {branding.logo ? (
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="bg-white p-4 rounded-md border border-bolt-elements-borderColor w-40 h-40 flex items-center justify-center">
                            <img src={branding.logo} alt="Logo actuel" className="max-w-full max-h-full" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-bolt-elements-textSecondary mb-2">
                                <span className="font-medium">Chemin virtuel:</span> {branding.savedPath || 'Non spécifié'}
                            </p>
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Charte graphique actuelle</h3>
                                <div className="flex gap-2">
                                    <div
                                        className="w-8 h-8 rounded-md"
                                        style={{ backgroundColor: branding.primaryColor }}
                                        title="Couleur principale"
                                    ></div>
                                    <div
                                        className="w-8 h-8 rounded-md"
                                        style={{ backgroundColor: branding.secondaryColor }}
                                        title="Couleur secondaire"
                                    ></div>
                                    <div
                                        className="w-8 h-8 rounded-md"
                                        style={{ backgroundColor: branding.accentColor }}
                                        title="Couleur d'accent"
                                    ></div>
                                </div>
                                <p className="text-sm text-bolt-elements-textSecondary">
                                    <span className="font-medium">Police:</span> {branding.fontFamily}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 text-bolt-elements-textTertiary">
                        <div className="i-ph:image-square-duotone text-4xl mx-auto mb-2"></div>
                        <p>Aucun logo n'est actuellement défini dans la charte graphique</p>
                    </div>
                )}
            </div>

            {/* Zone de téléchargement de nouveau logo */}
            <div className="mb-8">
                <h2 className="text-lg font-medium text-bolt-elements-textPrimary mb-3">Ajouter un nouveau logo</h2>

                <form onSubmit={(e) => e.preventDefault()}>
                    <div
                        className={`border-2 border-dashed ${dragActive ? 'border-bolt-elements-item-contentAccent bg-bolt-elements-item-backgroundAccent/10' : 'border-bolt-elements-borderColor'} rounded-lg p-8 text-center transition-colors duration-200`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="logo-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleChange}
                        />

                        <label
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center cursor-pointer"
                        >
                            <div className="i-ph:image-square-duotone text-5xl mb-4 text-bolt-elements-item-contentAccent"></div>
                            <p className="text-bolt-elements-textPrimary mb-2">
                                Glissez-déposez votre logo ici ou cliquez pour sélectionner
                            </p>
                            <p className="text-sm text-bolt-elements-textTertiary">
                                Formats supportés: PNG, JPG, SVG
                            </p>
                        </label>
                    </div>
                </form>
            </div>
        </div>
    )
};