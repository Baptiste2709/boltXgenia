// app/utils/zip-service.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { FileMap } from '~/lib/stores/files';

/**
 * Service pour générer et télécharger un fichier ZIP à partir des fichiers du projet
 */
export const ZipService = {
  /**
   * Crée un fichier ZIP à partir des fichiers du projet et le télécharge
   * @param files - Map des fichiers du projet
   * @param fileName - Nom du fichier ZIP (sans extension)
   * @returns Promise qui se résout quand le téléchargement est lancé
   */
  async downloadProjectAsZip(files: FileMap, fileName: string = 'genia-project'): Promise<void> {
    // Créer une nouvelle instance de JSZip
    const zip = new JSZip();
    
    // Compteur pour les fichiers ajoutés
    let fileCount = 0;
    
    // Ajouter tous les fichiers au ZIP
    for (const [filePath, fileInfo] of Object.entries(files)) {
      if (fileInfo?.type === 'file' && typeof fileInfo.content === 'string') {
        // Récupérer le chemin relatif (enlever /home/project/)
        const relativePath = filePath.replace(/^\/home\/project\//, '');
        
        // Ignorer les dossiers node_modules, .git, etc.
        if (!relativePath.includes('node_modules/') && 
            !relativePath.includes('.git/') &&
            !relativePath.startsWith('.')) {
          zip.file(relativePath, fileInfo.content);
          fileCount++;
        }
      }
    }
    
    if (fileCount === 0) {
      throw new Error('Aucun fichier à télécharger');
    }
    
    // Générer le ZIP et le télécharger
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Télécharger le fichier
    saveAs(zipBlob, `${fileName}.zip`);
    
    return Promise.resolve();
  }
};