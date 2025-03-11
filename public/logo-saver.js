// public/logo-saver.js - Version sans window.fs
(function() {
  // Nom de la base de données IndexedDB
  const DB_NAME = 'genia-branding-db';
  const DB_VERSION = 1;
  const LOGO_STORE = 'logos';
  
  // Fonction pour extraire les informations du type de fichier à partir d'une Data URL
  function getFileInfo(dataUrl) {
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { mimeType: 'image/png', extension: 'png', isValid: false };
    }
    
    const mimeType = matches[1];
    let extension = 'png'; // Par défaut
    
    if (mimeType.includes('svg')) extension = 'svg';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
    
    return { mimeType, extension, isValid: true, base64: matches[2] };
  }
  
  // Fonction pour ouvrir une connexion à la base de données IndexedDB
  async function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Erreur d\'ouverture de la base IndexedDB:', event);
        reject('Impossible d\'accéder au stockage local');
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Création du magasin d'objets pour les logos si nécessaire
        if (!db.objectStoreNames.contains(LOGO_STORE)) {
          db.createObjectStore(LOGO_STORE, { keyPath: 'id' });
          console.log('Magasin de logos créé dans IndexedDB');
        }
      };
    });
  }
  
  // Fonction pour sauvegarder un logo uniquement dans IndexedDB (sans window.fs)
  async function saveBrandLogo(logoDataUrl, savePath) {
    try {
      // Extraire les informations du fichier
      const { extension, isValid } = getFileInfo(logoDataUrl);
      
      if (!isValid) {
        console.warn('Format de Data URL invalide');
      }
      
      // Chemin par défaut si non spécifié
      const defaultPath = `/boltXgenia/charte_logos/logo_${Date.now()}.${extension}`;
      const outputPath = savePath || defaultPath;
      
      // Créer un ID unique pour l'enregistrement IndexedDB
      const id = `logo_${Date.now()}`;
      
      // Ouvrir la base de données et stocker le logo
      const db = await openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([LOGO_STORE], 'readwrite');
        const store = transaction.objectStore(LOGO_STORE);
        
        // Préparer l'objet à stocker
        const logoObject = {
          id,
          path: outputPath,
          dataUrl: logoDataUrl,
          mimeType: getFileInfo(logoDataUrl).mimeType || 'image/png',
          filename: outputPath.split('/').pop(),
          timestamp: Date.now()
        };
        
        const request = store.add(logoObject);
        
        request.onsuccess = () => {
          console.log('Logo sauvegardé avec succès dans IndexedDB');
          resolve(outputPath);
        };
        
        request.onerror = (event) => {
          console.error('Erreur lors de la sauvegarde du logo dans IndexedDB:', event);
          reject('Erreur lors de la sauvegarde du logo');
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du logo:', error);
      return null;
    }
  }
  
  // Expose la fonction au contexte global
  window.saveBrandLogo = saveBrandLogo;
  
  // Ajouter une fonction pour récupérer un logo par son chemin
  window.getLogoByPath = async function(path) {
    try {
      const db = await openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([LOGO_STORE], 'readonly');
        const store = transaction.objectStore(LOGO_STORE);
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            const logo = cursor.value;
            
            if (logo.path === path) {
              // Retourner l'objet logo complet
              resolve(logo);
              return;
            }
            
            cursor.continue();
          } else {
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
      return null;
    }
  };
  
  console.log('Module de gestion des logos initialisé (sans window.fs)');
})();