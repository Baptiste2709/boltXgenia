// app/utils/vscode-service.ts - Version améliorée
import { WORK_DIR } from '~/utils/constants';
import type { FileMap } from '~/lib/stores/files';
import { ZipService } from './zip-service';

// Types d'environnements dans lesquels l'application peut s'exécuter
export enum VSCodeEnvironment {
  LOCAL = 'local',     // Installation VS Code locale
  CODESPACES = 'codespaces', // GitHub Codespaces
  WEB = 'web',         // VS Code pour le Web
  UNKNOWN = 'unknown'  // Environnement inconnu
}

/**
 * Service pour interagir avec VS Code depuis l'application
 */
export const VSCodeService = {
  /**
   * Détecte l'environnement VS Code disponible
   * @returns Le type d'environnement détecté
   */
  detectEnvironment(): VSCodeEnvironment {
    // Détection de GitHub Codespaces par l'URL
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.dev')) {
      return VSCodeEnvironment.CODESPACES;
    }
    
    // Détection si l'application s'exécute dans un iframe (comme dans Codespaces)
    if (typeof window !== 'undefined' && window !== window.top) {
      return VSCodeEnvironment.CODESPACES;
    }
    
    // Par défaut, essayer le protocole vscode:// - il fonctionnera si VSCode est installé
    return VSCodeEnvironment.LOCAL;
  },

  /**
   * Ouvre le projet dans VS Code en fonction de l'environnement détecté
   * @param files Les fichiers du projet
   * @returns Promise indiquant si l'ouverture a réussi
   */
  async openInVSCode(files: FileMap): Promise<boolean> {
    const environment = this.detectEnvironment();
    
    try {
      switch (environment) {
        case VSCodeEnvironment.LOCAL:
          // Utiliser le protocole URI vscode://
          const vscodeUri = `vscode://file${WORK_DIR}`;
          const opened = window.open(vscodeUri, '_blank');
          
          // Si l'ouverture directe échoue, proposer la solution web
          if (!opened) {
            // Télécharger le zip pour une utilisation locale
            await ZipService.downloadProjectAsZip(files, 'genia-project');
            // Ouvrir vscode.dev comme solution de secours
            window.open('https://vscode.dev/', '_blank');
          }
          
          return true;
          
        case VSCodeEnvironment.CODESPACES:
          // Pour les environnements Codespaces, simplement télécharger le ZIP
          // car nous sommes déjà dans un environnement GitHub
          await ZipService.downloadProjectAsZip(files, 'genia-project');
          return true;
          
        case VSCodeEnvironment.WEB:
        default:
          // Pour l'environnement web, offrir un téléchargement et instructions
          // pour ouvrir avec vscode.dev
          await ZipService.downloadProjectAsZip(files, 'genia-project');
          
          // Ouvrir vscode.dev dans un nouvel onglet
          window.open('https://vscode.dev/', '_blank');
          return true;
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture dans VS Code:', error);
      return false;
    }
  },
  
  /**
   * Vérifie si VS Code est disponible en fonction de l'environnement
   * @returns true si VS Code est disponible, false sinon
   */
  isVSCodeAvailable(): boolean {
    const environment = this.detectEnvironment();
    
    // VS Code est considéré comme disponible dans tous les cas car nous avons des solutions de repli
    // pour chaque environnement (local, web, codespaces)
    return true;
  }
}