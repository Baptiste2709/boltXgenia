// Fichier: app/utils/logo-storage.ts
// Service de stockage des logos utilisant IndexedDB

/**
 * Constantes pour la configuration IndexedDB
 */
const DB_NAME = 'genia-branding-db';
const DB_VERSION = 1;
const LOGO_STORE = 'logos';

/**
 * Interface pour les métadonnées du logo
 */
export interface LogoMetadata {
  id: string;          // Identifiant unique du logo
  path: string;        // Chemin virtuel (pour référence)
  dataUrl: string;     // Contenu du logo en Data URL
  mimeType: string;    // Type MIME
  filename: string;    // Nom de fichier
  timestamp: number;   // Date d'enregistrement
}

/**
 * Ouvre une connexion à la base de données IndexedDB
 * @returns Promise avec la connexion à la base
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Erreur d\'ouverture de la base IndexedDB:', event);
      reject('Impossible d\'accéder au stockage local');
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Création du magasin d'objets pour les logos si nécessaire
      if (!db.objectStoreNames.contains(LOGO_STORE)) {
        db.createObjectStore(LOGO_STORE, { keyPath: 'id' });
        console.log('Magasin de logos créé dans IndexedDB');
      }
    };
  });
}

/**
 * Extrait les informations du type de fichier à partir d'une Data URL
 * @param dataUrl URL de données du logo
 * @returns Informations sur le type de fichier
 */
export function getFileInfo(dataUrl: string) {
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { mimeType: 'image/png', extension: 'png', isValid: false };
  }
  
  const mimeType = matches[1];
  let extension = 'png'; // Par défaut
  
  if (mimeType.includes('svg')) extension = 'svg';
  else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
  
  return { mimeType, extension, isValid: true };
}

/**
 * Sauvegarde un logo dans IndexedDB
 * @param logoDataUrl URL de données du logo
 * @param customPath Chemin personnalisé (optionnel)
 * @returns Promise avec le chemin virtuel du logo
 */
export async function saveLogo(logoDataUrl: string, customPath?: string): Promise<string> {
  try {
    // Extraire les infos du fichier
    const { mimeType, extension, isValid } = getFileInfo(logoDataUrl);
    
    if (!isValid) {
      console.warn("Format de Data URL invalide, utilisation des valeurs par défaut");
    }
    
    // Générer un ID unique et un nom de fichier
    const id = `logo_${Date.now()}`;
    const filename = `logo.${extension}`;
    const virtualPath = customPath || `/boltXgenia/charte_logos/${filename}`;
    
    // Préparer les métadonnées
    const logoMetadata: LogoMetadata = {
      id,
      path: virtualPath,
      dataUrl: logoDataUrl,
      mimeType,
      filename,
      timestamp: Date.now()
    };
    
    // Ouvrir la base et stocker le logo
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGO_STORE], 'readwrite');
      const store = transaction.objectStore(LOGO_STORE);
      
      const request = store.add(logoMetadata);
      
      request.onsuccess = () => {
        console.log(`Logo sauvegardé avec succès avec l'ID ${id}`);
        resolve(virtualPath);
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la sauvegarde du logo:', event);
        reject('Erreur lors de la sauvegarde du logo');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du logo:', error);
    return Promise.reject('Échec de la sauvegarde du logo');
  }
}

/**
 * Récupère un logo depuis IndexedDB par son chemin virtuel
 * @param path Chemin virtuel du logo
 * @returns Promise avec les métadonnées du logo
 */
export async function getLogoByPath(path: string): Promise<LogoMetadata | null> {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGO_STORE], 'readonly');
      const store = transaction.objectStore(LOGO_STORE);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        
        if (cursor) {
          const logo = cursor.value as LogoMetadata;
          
          if (logo.path === path) {
            resolve(logo);
            return;
          }
          
          cursor.continue();
        } else {
          // Aucun logo correspondant trouvé
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la recherche du logo:', event);
        reject('Erreur lors de la recherche du logo');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du logo:', error);
    return Promise.reject('Échec de la récupération du logo');
  }
}

/**
 * Liste tous les logos stockés dans IndexedDB
 * @returns Promise avec un tableau de métadonnées de logos
 */
export async function getAllLogos(): Promise<LogoMetadata[]> {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGO_STORE], 'readonly');
      const store = transaction.objectStore(LOGO_STORE);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const logos = (event.target as IDBRequest).result as LogoMetadata[];
        resolve(logos);
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la récupération des logos:', event);
        reject('Erreur lors de la récupération des logos');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logos:', error);
    return Promise.reject('Échec de la récupération des logos');
  }
}

/**
 * Supprime un logo de IndexedDB par son ID
 * @param id Identifiant du logo
 * @returns Promise indiquant le succès de l'opération
 */
export async function deleteLogo(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGO_STORE], 'readwrite');
      const store = transaction.objectStore(LOGO_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la suppression du logo:', event);
        reject('Erreur lors de la suppression du logo');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du logo:', error);
    return Promise.reject('Échec de la suppression du logo');
  }
}