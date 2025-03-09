import { toast } from 'react-toastify';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { saveLogo as saveLogoToStorage, getLogoByPath } from '~/utils/logo-storage';

// Interface pour les informations de la charte graphique
export interface BrandingInfo {
  logo: string | null;
  savedPath?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  isCustomBranding: boolean;
}

// Valeurs par défaut
const defaultBranding: BrandingInfo = {
  logo: null,
  savedPath: null,
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
  isCustomBranding: false,
};

// Clé localStorage
const STORAGE_KEY = 'genia-branding-info';

// Créer le contexte
interface BrandingContextType {
  branding: BrandingInfo;
  updateBranding: (newBranding: Partial<BrandingInfo>) => void;
  resetBranding: () => void;
  saveLogo: (logoDataUrl: string) => Promise<string | null>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Provider component
export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Chargement initial depuis localStorage
  const loadInitialState = (): BrandingInfo => {
    if (typeof window === 'undefined') {
      return defaultBranding;
    }
    
    try {
      const savedBranding = localStorage.getItem(STORAGE_KEY);
      if (savedBranding) {
        return JSON.parse(savedBranding);
      }
    } catch (error) {
      console.error('Error loading branding from localStorage:', error);
    }
    
    return defaultBranding;
  };

  const [branding, setBranding] = useState<BrandingInfo>(loadInitialState);

  // Restaurer le logo depuis IndexedDB au chargement si nécessaire
  useEffect(() => {
    const loadLogoFromStorage = async () => {
      // Si nous avons un chemin sauvegardé mais pas de logo en mémoire
      if (branding.savedPath && !branding.logo) {
        try {
          const logoData = await getLogoByPath(branding.savedPath);
          if (logoData) {
            // Mise à jour silencieuse du logo sans modifier le localStorage
            setBranding(prev => ({ ...prev, logo: logoData.dataUrl }));
          }
        } catch (error) {
          console.error('Erreur lors du chargement du logo depuis IndexedDB:', error);
        }
      }
    };
    
    loadLogoFromStorage();
  }, [branding.savedPath]);

  // Sauvegarder dans localStorage à chaque mise à jour
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    } catch (error) {
      console.error('Error saving branding to localStorage:', error);
    }
  }, [branding]);

  const updateBranding = (newBranding: Partial<BrandingInfo>) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
  };

  const resetBranding = () => {
    setBranding(defaultBranding);
  };
  
  // Fonction pour sauvegarder le logo
  const saveLogo = async (logoDataUrl: string): Promise<string | null> => {
    try {
      // Chemin virtuel personnalisé pour respecter la structure demandée
      const virtualPath = `/boltXgenia/charte_logos/logo_${Date.now()}.png`;
      
      // Utiliser notre fonction de stockage IndexedDB
      const savedPath = await saveLogoToStorage(logoDataUrl, virtualPath);
      
      // Déclencher un téléchargement automatique
      const link = document.createElement('a');
      link.href = logoDataUrl;
      link.download = virtualPath.split('/').pop() || 'logo.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Logo sauvegardé avec succès et téléchargé pour votre usage local!');
      
      return savedPath;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du logo:', error);
      toast.error('Erreur lors de la sauvegarde du logo');
      
      return null;
    }
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding, saveLogo }}>
      {children}
    </BrandingContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};