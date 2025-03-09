import { toast } from 'react-toastify';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

// Type pour le résultat de la sauvegarde du logo
interface LogoSaveResult {
  url: string;
  path: string;
}

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

// Fonction utilitaire pour sauvegarder un logo
export async function saveBrandLogo(logoDataUrl: string) {
  console.log("Tentative de sauvegarde du logo");
  
  // Déterminer le type de fichier et l'extension à partir de la Data URL
  const getFileInfo = (dataUrl: string) => {
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { mimeType: 'image/png', extension: 'png', isValid: false };
    }
    
    const mimeType = matches[1];
    let extension = 'png'; // Par défaut
    
    if (mimeType.includes('svg')) extension = 'svg';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
    
    return { mimeType, extension, isValid: true };
  };
  
  // Essayer d'abord d'utiliser window.fs si disponible
  if (typeof window !== 'undefined' && window.fs) {
    try {
      // Créer le dossier assets s'il n'existe pas
      const logoDir = '/home/project/assets';
      
      try {
        await window.fs.mkdir(logoDir, { recursive: true });
        console.log("Dossier créé ou existant:", logoDir);
      } catch (dirError) {
        console.error("Erreur lors de la création du dossier:", dirError);
      }
      
      // Obtenir les informations du fichier
      const { extension, isValid } = getFileInfo(logoDataUrl);
      
      if (!isValid) {
        console.warn("Format de Data URL invalide");
        // Si le format est invalide, on continue quand même avec l'extension par défaut
      }
      
      // Chemin du fichier
      const logoPath = `${logoDir}/logo.${extension}`;
      
      // Traiter la Data URL
      try {
        const response = await fetch(logoDataUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Écrire le fichier
        await window.fs.writeFile(logoPath, uint8Array);
        console.log("Logo sauvegardé avec succès à:", logoPath);
        
        // Notifier l'utilisateur
        toast.success("Logo sauvegardé avec succès dans le projet");
        
        return logoPath;
      } catch (error) {
        console.error("Erreur lors du traitement ou de l'écriture du fichier:", error);
        // Si l'écriture échoue, on tombe sur la solution de téléchargement
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde via window.fs:", error);
      // Si toute tentative window.fs échoue, on tombe sur la solution de téléchargement
    }
  }
  
  // Méthode alternative: téléchargement direct côté client
  try {
    console.log("Utilisation de la méthode de téléchargement direct");
    
    const { extension } = getFileInfo(logoDataUrl);
    const filename = `logo.${extension}`;
    
    // Créer un élément a pour le téléchargement
    const downloadLink = document.createElement('a');
    downloadLink.href = logoDataUrl;
    downloadLink.download = filename;
    downloadLink.target = '_blank';
    
    // Ajouter temporairement au DOM et simuler un clic
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Notifier l'utilisateur
    toast.info(`Le logo a été téléchargé sous le nom "${filename}"`);
    toast.info("Assurez-vous de placer ce fichier dans un dossier 'assets' de votre projet");
    
    // Pour les besoins de l'application, on considère que le chemin serait
    const virtualPath = `/home/project/assets/${filename}`;
    
    // Retourner l'URL pour une utilisation en mémoire + chemin virtuel pour référence
    return {
      url: logoDataUrl,
      path: virtualPath
    };
  } catch (downloadError) {
    console.error("Erreur lors du téléchargement:", downloadError);
    
    // En dernier recours, retourner simplement l'URL
    return logoDataUrl;
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
    const result = await saveBrandLogo(logoDataUrl);
    
    // Si le résultat est un objet avec url et path, on extrait le path
    if (typeof result === 'object' && result !== null && 'path' in result) {
      return result.path;
    }
    
    // Sinon on retourne directement le résultat (url ou chemin)
    return result;
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