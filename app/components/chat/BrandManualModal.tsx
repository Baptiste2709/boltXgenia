// app/components/chat/BrandManualModal.tsx (version mise à jour)
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useBranding } from './BrandContext';

interface BrandManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrandManualModal: React.FC<BrandManualModalProps> = ({ isOpen, onClose }) => {
  const { branding, updateBranding, saveLogo } = useBranding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs pour les champs du formulaire
  const logoInputRef = useRef<HTMLInputElement>(null);
  const primaryColorRef = useRef<HTMLInputElement>(null);
  const secondaryColorRef = useRef<HTMLInputElement>(null);
  const accentColorRef = useRef<HTMLInputElement>(null);
  const fontFamilyRef = useRef<HTMLSelectElement>(null);

  // État pour prévisualiser le logo
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logo);

  // Gérer le changement de fichier logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Gestionnaire pour le drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-bolt-elements-item-contentAccent');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-bolt-elements-item-contentAccent');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-bolt-elements-item-contentAccent');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setLogoPreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Soumettre les informations de la charte
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Application de la charte graphique...");
    
    try {
      // Récupérer les valeurs du formulaire
      const primaryColor = primaryColorRef.current?.value || branding.primaryColor;
      const secondaryColor = secondaryColorRef.current?.value || branding.secondaryColor;
      const accentColor = accentColorRef.current?.value || branding.accentColor;
      const fontFamily = fontFamilyRef.current?.value || branding.fontFamily;
      
      // Variables pour stocker le chemin du logo sauvegardé
      let savedLogoPath = null;
      
      // Si un logo est présent, le sauvegarder dans le projet
      if (logoPreview) {
        console.log("Tentative de sauvegarde du logo:", logoPreview.substring(0, 50) + "...");
        
        toast.update(toastId, {
          render: "Sauvegarde du logo en cours...",
          isLoading: true
        });
        
        try {
          // Utiliser la fonction saveLogo du contexte
          savedLogoPath = await saveLogo(logoPreview);

          
          if (savedLogoPath) {
            console.log("Logo sauvegardé avec succès dans:", savedLogoPath);
            toast.update(toastId, {
              render: `Logo sauvegardé dans: ${savedLogoPath}`,
              type: "info",
              isLoading: true
            });
          } else {
            console.warn("Échec de la sauvegarde du logo");
          }
        } catch (logoError) {
          console.error("Erreur lors de la sauvegarde du logo:", logoError);
        }
      }
      
      // Mettre à jour le branding
      updateBranding({
        logo: logoPreview,
        savedPath: savedLogoPath,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        isCustomBranding: true
      });
      
      // Mettre à jour le toast et fermer le modal
      toast.update(toastId, {
        render: "Charte graphique appliquée avec succès!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
      
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'application de la charte:", error);
      toast.update(toastId, {
        render: "Une erreur est survenue",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-max flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md rounded-lg bg-bolt-elements-background-depth-2 p-6 shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-bolt-elements-borderColor pb-3">
          <h2 className="text-xl font-medium text-bolt-elements-textPrimary">Saisie manuelle de la charte graphique</h2>
          <button
            onClick={onClose}
            className="text-bolt-elements-textSecondary bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary"
          >
            <div className="i-ph:x-circle text-xl"></div>
          </button>
        </div>

        <div className="space-y-5">
          {/* Zone de drop pour le logo */}
          <div className="flex flex-col">
            <label className="text-sm text-bolt-elements-textSecondary mb-2">Logo</label>
            <div
              className="h-32 flex items-center justify-center border-2 border-dashed border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-1 transition-colors duration-150 cursor-pointer"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => logoInputRef.current?.click()}
            >
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <div className="flex flex-col items-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="max-h-24 max-w-full mb-2" />
                ) : (
                  <div className="text-sm text-bolt-elements-textTertiary">
                    <div className="i-ph:image-duotone text-3xl mb-2 mx-auto"></div>
                    Glissez-déposez votre logo ou cliquez pour sélectionner
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Couleur principale */}
          <div className="flex flex-col">
            <label className="text-sm text-bolt-elements-textSecondary mb-2">Couleur principale</label>
            <div className="flex items-center">
              <input
                ref={primaryColorRef}
                type="color"
                defaultValue={branding.primaryColor}
                className="w-12 h-12 p-0 border-none rounded-md mr-3 cursor-pointer"
              />
              <input
                type="text"
                defaultValue={branding.primaryColor}
                className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                onChange={(e) => {
                  if (primaryColorRef.current) {
                    primaryColorRef.current.value = e.target.value;
                  }
                }}
              />
            </div>
          </div>

          {/* Couleur secondaire */}
          <div className="flex flex-col">
            <label className="text-sm text-bolt-elements-textSecondary mb-2">Couleur secondaire</label>
            <div className="flex items-center">
              <input
                ref={secondaryColorRef}
                type="color"
                defaultValue={branding.secondaryColor}
                className="w-12 h-12 p-0 border-none rounded-md mr-3 cursor-pointer"
              />
              <input
                type="text"
                defaultValue={branding.secondaryColor}
                className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                onChange={(e) => {
                  if (secondaryColorRef.current) {
                    secondaryColorRef.current.value = e.target.value;
                  }
                }}
              />
            </div>
          </div>

          {/* Couleur d'accent */}
          <div className="flex flex-col">
            <label className="text-sm text-bolt-elements-textSecondary mb-2">Couleur d'accent</label>
            <div className="flex items-center">
              <input
                ref={accentColorRef}
                type="color"
                defaultValue={branding.accentColor}
                className="w-12 h-12 p-0 border-none rounded-md mr-3 cursor-pointer"
              />
              <input
                type="text"
                defaultValue={branding.accentColor}
                className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                onChange={(e) => {
                  if (accentColorRef.current) {
                    accentColorRef.current.value = e.target.value;
                  }
                }}
              />
            </div>
          </div>

          {/* Sélecteur de police */}
          <div className="flex flex-col">
            <label className="text-sm text-bolt-elements-textSecondary mb-2">Police de caractères</label>
            <select
              ref={fontFamilyRef}
              className="p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
              defaultValue={branding.fontFamily}
            >
              <option value="Inter">Inter (Par défaut)</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Raleway">Raleway</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Source Code Pro">Source Code Pro</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Space Grotesk">Space Grotesk</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex justify-end pt-3 mt-5 border-t border-bolt-elements-borderColor">
            <button
              onClick={onClose}
              className="mr-3 px-4 py-2 bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary rounded-md hover:bg-bolt-elements-background-depth-3"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-bolt-elements-item-contentAccent text-white rounded-md hover:brightness-110 transition-all flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="i-svg-spinners:90-ring-with-bg mr-2"></div>
                  Traitement...
                </>
              ) : (
                'Appliquer la charte'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BrandManualModal;