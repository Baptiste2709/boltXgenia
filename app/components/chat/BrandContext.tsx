// 1. Remplacer la fonction saveBrandLogo dans BrandContext.tsx
import { toast } from 'react-toastify';

import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

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
  fontFamily: 'inter',
  isCustomBranding: false,
};

// Clé localStorage
const STORAGE_KEY = 'genia-branding-info';

// Fonction utilitaire pour sauvegarder un logo dans le système de fichiers
export async function saveBrandLogo(logoDataUrl: string) {
  console.log("Tentative de sauvegarde du logo");
  
  if (!window.fs) {
    console.error("window.fs n'est pas disponible");
    return null;
  }
  
  try {
    toast('1');
    // Créer le dossier charte_logos s'il n'existe pas
    const logoDir = '/home/project/charte_logos';
    
    try {
      await window.fs.mkdir(logoDir, { recursive: true });
      console.log("Dossier créé ou existant:", logoDir);
    } catch (dirError) {
      console.error("Erreur lors de la création du dossier:", dirError);
    }
    
    // Traiter la Data URL pour obtenir le binaire
    const matches = logoDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Format de Data URL invalide");
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const binaryData = atob(base64Data);
    
    // Convertir en Uint8Array
    const uint8Array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }
    
    // Déterminer l'extension de fichier
    let extension = 'png';
    if (mimeType.includes('svg')) extension = 'svg';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
    
    // Chemin du fichier
    const logoPath = `${logoDir}/logo.${extension}`;
    
    // Écrire le fichier
    await window.fs.writeFile(logoPath, uint8Array);
    console.log("Logo sauvegardé avec succès à:", logoPath);
    
    return logoPath;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du logo:", error);
    return null;
  }
}

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
  const saveLogo = async (logoDataUrl: string) => {
    return await saveBrandLogo(logoDataUrl);
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