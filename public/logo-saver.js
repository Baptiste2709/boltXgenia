// public/logo-saver.js

/**
 * Ce script est chargé côté client pour gérer l'enregistrement des logos
 * dans le système de fichiers WebContainer.
 */
(function() {
    // Fonction pour sauvegarder une image depuis une URL vers le projet
    async function saveBrandLogo(imageUrl, savePath = '/home/project/assets/logo.svg') {
      // Vérifier si window.fs existe (dans l'environnement WebContainer)
      if (!window.fs) {
        console.warn('WebContainer filesystem (window.fs) non disponible.');
        return null;
      }
      
      try {
        // Créer le dossier assets s'il n'existe pas
        try {
          await window.fs.mkdir('/home/project/assets', { recursive: true });
          console.log('Dossier assets créé ou déjà existant');
        } catch (err) {
          console.error('Erreur lors de la création du dossier assets:', err);
        }
        
        // Récupérer l'image depuis l'URL
        console.log('Téléchargement du logo depuis:', imageUrl);
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Convertir l'image en ArrayBuffer
        const imageBuffer = await response.arrayBuffer();
        
        // Déterminer l'extension de fichier correcte
        const fileExt = getFileExtension(imageUrl, response.headers.get('content-type'));
        const finalPath = savePath.replace(/\.[^.]+$/, `.${fileExt}`);
        
        // Enregistrer l'image dans le système de fichiers
        await window.fs.writeFile(finalPath, new Uint8Array(imageBuffer));
        console.log('Logo enregistré avec succès dans:', finalPath);
        
        return finalPath;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du logo:', error);
        return null;
      }
    }
    
    // Fonction pour déterminer l'extension de fichier
    function getFileExtension(url, contentType) {
      // D'abord essayer par l'URL
      const urlExt = url.split('.').pop().toLowerCase();
      if (['svg', 'png', 'jpg', 'jpeg', 'webp'].includes(urlExt)) {
        return urlExt;
      }
      
      // Sinon essayer par le content-type
      if (contentType) {
        if (contentType.includes('svg')) return 'svg';
        if (contentType.includes('png')) return 'png';
        if (contentType.includes('jpeg')) return 'jpg';
        if (contentType.includes('webp')) return 'webp';
      }
      
      // Par défaut
      return 'png';
    }
    
    // Exposer la fonction globalement
    window.saveBrandLogo = saveBrandLogo;
    
    console.log('Logo Saver script chargé!');
  })();