// app/components/chat/BrandContext.tsx
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

// Interface pour les informations de la charte graphique
export interface BrandingInfo {
  logo: string | null;
  savedPath?: string | null; // Chemin où le logo a été sauvegardé dans le projet
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

// Créer le contexte
interface BrandingContextType {
  branding: BrandingInfo;
  updateBranding: (newBranding: Partial<BrandingInfo>) => void;
  resetBranding: () => void;
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

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding }}>
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