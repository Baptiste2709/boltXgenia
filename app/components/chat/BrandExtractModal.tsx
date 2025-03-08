// app/components/chat/BrandExtractModal.tsx
import React, { useState } from 'react';
import { useBranding } from '~/components/chat/BrandContext';
import { BrandfetchService } from '~/utils/brandfetch-service';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

interface BrandExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandExtractModal: React.FC<BrandExtractModalProps> = ({ isOpen, onClose }) => {
  const { updateBranding } = useBranding();
  const [isExtracting, setIsExtracting] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const modalVariants = {
    hidden: { 
      opacity: 0,
      y: -50,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] 
      }
    },
    exit: { 
      opacity: 0,
      y: 50,
      scale: 0.95,
      transition: { 
        duration: 0.2, 
        ease: [0.4, 0, 0.2, 1] 
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const extractBrandInfo = async () => {
    if (!urlInput) {
      toast.error('Veuillez entrer une URL valide');
      return;
    }

    try {
      setIsExtracting(true);
      setProgressMessage('Validation de l\'URL...');
      
      // Valider l'URL avant de continuer
      const validUrl = BrandfetchService.validateUrl(urlInput);
      if (!validUrl) {
        throw new Error('URL invalide. Veuillez entrer une URL valide (ex: google.com)');
      }
      
      // Utiliser la fonction de progression pour mettre à jour l'état
      const updateProgress = (message: string) => {
        setProgressMessage(message);
      };
      
      // Appeler l'API Brandfetch
      const brandInfo = await BrandfetchService.fetchBrandInfo(urlInput, updateProgress);
      
      // Journaliser les informations reçues
      console.log("Informations de marque reçues:", {
        ...brandInfo,
        hasLogo: !!brandInfo.logo
      });
      
      // Mettre à jour le contexte de branding
      updateBranding({
        ...brandInfo,
        isCustomBranding: true
      });
      
      // Afficher un toast avec des informations sur ce qui a été récupéré
      const features = [
        brandInfo.logo ? "logo" : null,
        "couleurs",
        "typographie"
      ].filter(Boolean).join(", ");
      
      toast.success(`Charte graphique extraite avec succès (${features}) !`);
      
      // Fermer le modal
      onClose();
    } catch (error) {
      console.error('Erreur d\'extraction:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'extraction');
    } finally {
      setIsExtracting(false);
      setProgressMessage('');
    }
  };
  
  // Si le modal n'est pas ouvert, ne pas rendre le composant
  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      {/* Modal avec animation - stopPropagation pour éviter que les clics dans le modal ferment le backdrop */}
      <motion.div 
        className="bg-bolt-elements-background-depth-2 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="border-b border-bolt-elements-borderColor p-4">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">
            Extraire une charte graphique
          </h3>
          <p className="text-sm text-bolt-elements-textSecondary mt-1">
            Entrez l'URL du site web d'une entreprise pour extraire automatiquement sa charte graphique via l'API Brandfetch.
          </p>
        </div>

        {/* Corps du modal */}
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="url-input" className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
              URL du site web
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="flex-shrink-0 px-3 flex items-center bg-bolt-elements-background-depth-3 border border-r-0 border-bolt-elements-borderColor rounded-l-md">
                <div className="i-ph:globe text-bolt-elements-textTertiary"></div>
              </div>
              <input
                type="text"
                name="url-input"
                id="url-input"
                className="block w-full p-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-r-md text-bolt-elements-textPrimary focus:ring-bolt-elements-item-contentAccent focus:border-bolt-elements-item-contentAccent"
                placeholder="exemple.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isExtracting && urlInput) {
                    extractBrandInfo();
                  }
                }}
                disabled={isExtracting}
              />
            </div>
            <p className="mt-1 text-xs text-bolt-elements-textTertiary">
              Exemple: google.com, apple.com, microsoft.com
            </p>
          </div>

          {/* Affichage de la progression */}
          {isExtracting && (
            <div className="mb-4 p-3 bg-bolt-elements-background-depth-3 rounded-md">
              <div className="flex items-center">
                <div className="mr-3 text-bolt-elements-loader-progress">
                  <div className="i-svg-spinners:3-dots-fade animate-pulse text-2xl"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-bolt-elements-textPrimary">{progressMessage}</p>
                  <div className="mt-1 w-full bg-bolt-elements-background-depth-1 rounded-full h-1.5">
                    <div className="bg-bolt-elements-loader-progress h-1.5 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Note d'information */}
          <div className="mt-2 text-xs text-bolt-elements-textTertiary bg-bolt-elements-background-depth-1 p-2 rounded-md">
            <p>
              <span className="font-medium">Note:</span> L'extraction peut prendre quelques secondes. Les informations récupérées incluent les couleurs principales, la police de caractères et le logo quand ils sont disponibles.
            </p>
          </div>
        </div>

        {/* Pied du modal avec boutons */}
        <div className="border-t border-bolt-elements-borderColor p-4 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-md hover:bg-bolt-elements-button-secondary-backgroundHover transition-colors duration-200"
            onClick={onClose}
            disabled={isExtracting}
          >
            Annuler
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-bolt-elements-item-contentAccent text-white rounded-md hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={extractBrandInfo}
            disabled={isExtracting || !urlInput}
          >
            {isExtracting ? 'Extraction en cours...' : 'Extraire la charte'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BrandExtractModal;