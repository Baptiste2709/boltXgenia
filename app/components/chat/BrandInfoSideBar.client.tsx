import React from 'react';
import { useBranding } from '~/components/chat/BrandContext';

export const BrandInfoSidebar: React.FC = () => {
  const { branding } = useBranding();
  
  if (!branding.isCustomBranding) {
    return null;
  }

  return (
    <div className="p-4 border-b border-bolt-elements-borderColor">
      <h3 className="text-md font-semibold text-bolt-elements-textPrimary mb-3">Charte graphique</h3>
      
      {branding.logo && (
        <div className="mb-3">
          <p className="text-xs text-bolt-elements-textSecondary mb-1">Logo</p>
          <img 
            src={branding.logo} 
            alt="Logo de l'entreprise" 
            className="max-h-10 mb-2"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-bolt-elements-textSecondary mb-1">Couleur principale</p>
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: branding.primaryColor }}
            ></div>
            <span className="text-xs text-bolt-elements-textPrimary">{branding.primaryColor}</span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-bolt-elements-textSecondary mb-1">Couleur secondaire</p>
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: branding.secondaryColor }}
            ></div>
            <span className="text-xs text-bolt-elements-textPrimary">{branding.secondaryColor}</span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-bolt-elements-textSecondary mb-1">Couleur d'accent</p>
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: branding.accentColor }}
            ></div>
            <span className="text-xs text-bolt-elements-textPrimary">{branding.accentColor}</span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-bolt-elements-textSecondary mb-1">Police</p>
          <span className="text-xs text-bolt-elements-textPrimary">{branding.fontFamily}</span>
        </div>
      </div>
    </div>
  );
};