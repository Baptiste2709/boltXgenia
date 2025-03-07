// app/components/workbench/DownloadButton.tsx
import { memo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { useStore } from '@nanostores/react';

interface DownloadButtonProps {
  className?: string;
}

export const DownloadButton = memo(({ className }: DownloadButtonProps) => {
  // Utiliser useStore pour s'abonner aux changements des fichiers
  const files = useStore(workbenchStore.files);
  const hasFiles = files && Object.keys(files).length > 0;

  const downloadProject = useCallback(async () => {
    try {
      if (!files || Object.keys(files).length === 0) {
        toast.error('Aucun fichier à télécharger');
        return;
      }

      // Créer une nouvelle instance de JSZip
      // Nous utilisons une importation dynamique pour éviter les problèmes de référence
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      
      const zip = new JSZip();
      
      // Ajouter tous les fichiers au ZIP avec un compteur pour le feedback
      let fileCount = 0;
      
      // Ajouter tous les fichiers au ZIP
      for (const [filePath, fileInfo] of Object.entries(files)) {
        if (fileInfo?.type === 'file' && typeof fileInfo.content === 'string') {
          // Récupérer le chemin relatif (enlever /home/project/)
          const relativePath = filePath.replace(/^\/home\/project\//, '');
          if (!relativePath.includes('node_modules/') && 
              !relativePath.includes('.git/')) {
            zip.file(relativePath, fileInfo.content);
            fileCount++;
          }
        }
      }
      
      if (fileCount === 0) {
        toast.error('Aucun fichier pertinent à télécharger');
        return;
      }
      
      // Créer un toast de chargement
      const toastId = toast.loading(`Préparation du ZIP (${fileCount} fichiers)...`);
      
      // Générer le ZIP et le télécharger
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Mettre à jour le toast en cas de succès
      toast.update(toastId, {
        render: `Téléchargement de ${fileCount} fichiers en cours...`,
        type: 'info',
        isLoading: false,
        autoClose: 2000
      });
      
      saveAs(zipBlob, 'genia-project.zip');
      
      // Afficher un toast de succès
      setTimeout(() => {
        toast.success(`Projet téléchargé avec succès (${fileCount} fichiers)`, {
          autoClose: 3000
        });
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement du projet:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement du projet');
    }
  }, [files]);

  // Ne pas afficher le bouton s'il n'y a pas de fichiers
  if (!hasFiles) {
    return null;
  }

  return (
    <button 
      className={`${className} flex items-center gap-1.5 bg-bolt-elements-item-backgroundAccent hover:brightness-110 text-white px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-md`}
      title="Télécharger le projet en ZIP"
      onClick={downloadProject}
    >
      <div className="i-ph:file-zip-duotone text-xl"></div>
      <span className="text-sm font-medium">Télécharger ZIP</span>
    </button>
  );
});