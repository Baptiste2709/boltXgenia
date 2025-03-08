// app/utils/brandfetch-service.ts
import type { BrandingInfo } from '~/components/chat/BrandContext';
import { toast } from 'react-toastify';

// Complément de déclaration pour la méthode globale saveBrandLogo
declare global {
  interface Window {
    saveBrandLogo?: (imageUrl: string, savePath?: string) => Promise<string | null>;
  }
}

/**
 * Interface pour les couleurs récupérées depuis Brandfetch
 */
interface BrandfetchColor {
  hex: string;
  type: string;
  brightness: number;
}

/**
 * Interface pour les polices récupérées depuis Brandfetch
 */
interface BrandfetchFont {
  name: string;
  type: string;
  origin: string;
}

/**
 * Interface pour le logo récupéré depuis Brandfetch
 */
interface BrandfetchLogo {
  format: string;
  src: string;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
}

/**
 * Interface pour la réponse de l'API Brandfetch
 */
interface BrandfetchResponse {
  name: string;
  domain: string;
  description?: string;
  logos?: BrandfetchLogo[];
  colors?: BrandfetchColor[];
  fonts?: BrandfetchFont[];
  links?: Array<{name: string, url: string}>;
  icon?: BrandfetchLogo;
}

/**
 * Service permettant d'extraire les informations de marque via l'API Brandfetch
 */
export const BrandfetchService = {
  /**
   * URL de l'API proxy pour Brandfetch
   * Cette approche est plus sécurisée car elle ne nécessite pas d'exposer la clé API au client
   */
  API_PROXY_URL: '/api/brandfetch',

  /**
   * Extrait le nom de domaine d'une URL
   * @param url URL complète
   * @returns Nom de domaine (ex: "example.com")
   */
  extractDomain(url: string): string {
    try {
      // Supprime le protocole et les chemins
      let domain = url.replace(/(https?:\/\/)?(www\.)?/i, '');
      
      // Récupère uniquement le domaine (sans chemin)
      domain = domain.split('/')[0];
      
      return domain;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du domaine:', error);
      return url;
    }
  },

  /**
   * Valide et nettoie une URL
   * @param url URL à valider
   * @returns URL nettoyée ou null si invalide
   */
  validateUrl(url: string): string | null {
    // Enlever les espaces
    url = url.trim();
    
    // Si l'URL ne commence pas par http:// ou https://, ajouter https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    try {
      // Vérifier si l'URL est valide
      const parsedUrl = new URL(url);
      return parsedUrl.href;
    } catch (e) {
      return null;
    }
  },

  /**
   * Récupère les informations de marque depuis l'API Brandfetch
   * @param url URL du site web de la marque
   * @param onProgress Fonction de callback pour mise à jour du progrès
   * @returns Informations de marque formatées pour l'application
   */
  async fetchBrandInfo(url: string, onProgress?: (message: string) => void): Promise<Partial<BrandingInfo>> {
    try {
      // Valider et nettoyer l'URL
      const validatedUrl = this.validateUrl(url);
      if (!validatedUrl) {
        throw new Error('URL invalide');
      }
      
      const domain = this.extractDomain(validatedUrl);
      
      // Vérification que le domaine est valide
      if (!domain || domain.length < 3 || !domain.includes('.')) {
        throw new Error('Domaine invalide');
      }
      
      onProgress?.('Connexion à l\'API Brandfetch...');
      
      // Préparation de la requête à notre API proxy Brandfetch
      const response = await fetch(this.API_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain })
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Marque non trouvée pour le domaine ${domain}`);
        } else if (response.status === 429) {
          throw new Error(`Limite d'API dépassée. Veuillez réessayer plus tard.`);
        } else {
          throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }
      }
      
      onProgress?.('Analyse des données de la marque...');
      const data: BrandfetchResponse = await response.json();
      
      // Extraction des couleurs pertinentes
      onProgress?.('Extraction des couleurs de la marque...');
      let primaryColor = '#3B82F6';   // Couleur par défaut
      let secondaryColor = '#10B981'; // Couleur par défaut
      let accentColor = '#F59E0B';    // Couleur par défaut
      
      if (data.colors && data.colors.length > 0) {
        // Trie les couleurs par type et brillance
        const sortedColors = [...data.colors].sort((a, b) => {
          // Priorité aux couleurs primaires
          if (a.type === 'primary' && b.type !== 'primary') return -1;
          if (a.type !== 'primary' && b.type === 'primary') return 1;
          
          // Ensuite par luminosité (des plus sombres aux plus claires)
          return a.brightness - b.brightness;
        });
        
        // Sélection des couleurs
        primaryColor = sortedColors[0]?.hex || primaryColor;
        
        // Pour la couleur secondaire, on prend la deuxième couleur ou une version plus claire de la première
        secondaryColor = sortedColors[1]?.hex || this.lightenColor(primaryColor, 20);
        
        // Pour l'accent, on cherche une couleur contrastante ou on prend la troisième couleur
        const accentIndex = sortedColors.findIndex(c => 
          this.getColorContrast(c.hex, primaryColor) > 4.5);
        
        accentColor = accentIndex > -1 
          ? sortedColors[accentIndex].hex 
          : (sortedColors[2]?.hex || this.adjustHue(primaryColor, 180));
      }
      
      // Récupération de la police
      onProgress?.('Extraction des polices...');
      let fontFamily = 'Inter'; // Police par défaut
      
      if (data.fonts && data.fonts.length > 0) {
        // Priorité aux polices primaires et de titres
        const primaryFont = data.fonts.find(f => 
          f.type === 'primary' || f.type === 'heading' || f.type === 'brand');
        
        if (primaryFont) {
          fontFamily = this.normalizeFont(primaryFont.name);
        }
      }
      
      // Récupération du logo
      onProgress?.('Récupération du logo...');
      let logo = null;
      
      if (data.logos && data.logos.length > 0 || data.icon) {
        // Priorité au format SVG pour une meilleure qualité
        const svgLogo = data.logos?.find(l => l.format === 'svg');
        const primaryLogo = data.logos?.find(l => l.type === 'primary' && (l.format === 'svg' || l.format === 'png'));
        const anyLogo = data.logos?.find(l => l.src);
        
        // Utiliser l'icône comme fallback si pas de logo
        const icon = data.icon?.src;
        
        // Sélectionne le meilleur logo disponible
        logo = svgLogo?.src || primaryLogo?.src || anyLogo?.src || icon || null;
        
        // Pour déboguer
        console.log("Logos trouvés:", data.logos);
        console.log("Logo SVG:", svgLogo?.src);
        console.log("Logo primaire:", primaryLogo?.src);
        console.log("Logo sélectionné:", logo);
      } else {
        console.log("Aucun logo trouvé dans les données:", data);
      }
      
      onProgress?.('Finalisation de la charte graphique...');
      
      // Sauvegarder le logo dans le projet si disponible
      let savedPath = null;
      if (logo && typeof window.saveBrandLogo === 'function') {
        try {
          onProgress?.('Sauvegarde du logo dans le projet...');
          savedPath = await window.saveBrandLogo(logo);
          
          if (savedPath) {
            onProgress?.(`Logo sauvegardé dans ${savedPath}`);
          }
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du logo:', error);
          // Continuer même si la sauvegarde échoue
        }
      }
      
      // Préparer le résultat
      const result = {
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        logo,
        savedPath,
        isCustomBranding: true
      };
      
      onProgress?.('Charte graphique récupérée avec succès!');
      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de marque:', error);
      throw new Error('Impossible de récupérer les informations de marque');
    }
  },
  
  /**
   * Normalise le nom de la police pour l'utiliser dans CSS
   * @param fontName Nom brut de la police
   * @returns Nom normalisé de la police
   */
  normalizeFont(fontName: string): string {
    // Liste des polices courantes et disponibles
    const availableFonts = [
      'Inter', 'Poppins', 'Montserrat', 'Roboto', 
      'Open Sans', 'Lato', 'Raleway', 'Playfair Display', 
      'Source Code Pro', 'Merriweather', 'Space Grotesk'
    ];
    
    // Nettoie le nom de la police
    const cleanName = fontName.replace(/[^a-zA-Z0-9 ]/g, '');
    
    // Vérifie si la police est dans notre liste
    const matchedFont = availableFonts.find(font => 
      cleanName.toLowerCase().includes(font.toLowerCase()));
    
    return matchedFont || 'Inter';
  },
  
  /**
   * Éclaircit une couleur d'un certain pourcentage
   * @param color Couleur hexadécimale
   * @param percent Pourcentage d'éclaircissement (0-100)
   * @returns Couleur éclaircie
   */
  lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
      0x1000000 + 
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  },
  
  /**
   * Modifie la teinte d'une couleur
   * @param color Couleur hexadécimale
   * @param degrees Degrés de rotation dans le cercle chromatique
   * @returns Couleur avec teinte modifiée
   */
  adjustHue(color: string, degrees: number): string {
    // Convertit hex en RGB
    let hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Convertit RGB en HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatique
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      
      h /= 6;
    }
    
    // Ajuste la teinte
    h = (h * 360 + degrees) % 360;
    if (h < 0) h += 360;
    h /= 360;
    
    // Convertit HSL en RGB
    let r1, g1, b1;
    
    if (s === 0) {
      r1 = g1 = b1 = l; // achromatique
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r1 = hue2rgb(p, q, h + 1/3);
      g1 = hue2rgb(p, q, h);
      b1 = hue2rgb(p, q, h - 1/3);
    }
    
    // Convertit RGB en hex
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  },
  
  /**
   * Calcule le contraste entre deux couleurs (selon WCAG)
   * @param color1 Première couleur hexadécimale
   * @param color2 Deuxième couleur hexadécimale
   * @returns Ratio de contraste
   */
  getColorContrast(color1: string, color2: string): number {
    // Convertit les couleurs hex en luminance relative
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const channels = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    
    const luminance1 = getLuminance(color1);
    const luminance2 = getLuminance(color2);
    
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
};