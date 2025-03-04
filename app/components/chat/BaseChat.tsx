import type { Message } from 'ai';
import React, { useState, type RefCallback, useRef, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { useBranding } from '~/components/chat/BrandContext';

import styles from './BaseChat.module.scss';

interface BrandingData {
  isEnabled: boolean;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const EXAMPLE_PROMPTS = [
  { text: 'Développer un site de gestion de projets pour étudiants en React' },
  { text: 'Créer un portfolio interactif avec Three.js' },
  { text: 'Mettre en place un site de révision collaboratif avec Next.js' },
  { text: 'Concevoir une application mobile de suivi des habitudes avec React Native' },
  { text: 'Comment intégrer une base de données Firebase dans une application web ?' },
];

const TEXTAREA_MIN_HEIGHT = 76;

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
    },
    ref,
  ) => {
    // Récupérer les données de branding depuis le stockage
const brandingData = typeof window !== 'undefined' ? 
((window as any).currentBrandingData || 
 JSON.parse(localStorage.getItem('brandingData') || '{"isEnabled":false}'))
: { isEnabled: false };
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [showBrandingForm, setShowBrandingForm] = useState(false);
    const { branding, updateBranding } = useBranding();

    const primaryColorInputRef = useRef<HTMLInputElement>(null);
    const primaryColorTextRef = useRef<HTMLInputElement>(null);
    const secondaryColorInputRef = useRef<HTMLInputElement>(null);
    const secondaryColorTextRef = useRef<HTMLInputElement>(null);
    const accentColorInputRef = useRef<HTMLInputElement>(null);
    const accentColorTextRef = useRef<HTMLInputElement>(null);
    const fontFamilyRef = useRef<HTMLSelectElement>(null);
    
    const toggleCustomBranding = (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      setShowBrandingForm(isChecked);
      updateBranding({ isCustomBranding: isChecked });
      event.target.closest('label')?.setAttribute('data-custom-branding', String(isChecked));
    };
    
    // Utiliser useEffect pour gérer le scroll quand le formulaire s'ouvre/se ferme
    useEffect(() => {
      if (showBrandingForm) {
        // Permettre le scroll et se positionner sur l'input
        const mainContainer = document.querySelector('.' + styles.BaseChat) as HTMLElement;
        if (mainContainer) {
          mainContainer.style.overflow = 'auto';
          
          // Scroll to input
          if (textareaRef?.current) {
            textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else {
        // Réinitialiser
        const mainContainer = document.querySelector('.' + styles.BaseChat) as HTMLElement;
        if (mainContainer) {
          mainContainer.style.overflow = '';
        }
      }
    }, [showBrandingForm]);6

    const handleColorChange = (type: 'primary' | 'secondary' | 'accent', value: string, isInput: boolean) => {
      if (isInput) {
        // Mise à jour du champ texte correspondant
        switch(type) {
          case 'primary':
            if (primaryColorTextRef.current) primaryColorTextRef.current.value = value;
            break;
          case 'secondary':
            if (secondaryColorTextRef.current) secondaryColorTextRef.current.value = value;
            break;
          case 'accent':
            if (accentColorTextRef.current) accentColorTextRef.current.value = value;
            break;
        }
      } else {
        // Mise à jour du champ couleur correspondant
        switch(type) {
          case 'primary':
            if (primaryColorInputRef.current) primaryColorInputRef.current.value = value;
            break;
          case 'secondary':
            if (secondaryColorInputRef.current) secondaryColorInputRef.current.value = value;
            break;
          case 'accent':
            if (accentColorInputRef.current) accentColorInputRef.current.value = value;
            break;
        }
      }
    };

    // Gestionnaire de drag & drop
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.add('border-bolt-elements-item-contentAccent');
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.currentTarget.classList.remove('border-bolt-elements-item-contentAccent');
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-bolt-elements-item-contentAccent');
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        // Traitement du fichier logo
        if (file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgPreview = document.getElementById('logo-preview') as HTMLImageElement;
            if (imgPreview && event.target?.result) {
              imgPreview.src = event.target.result as string;
              imgPreview.classList.remove('hidden');
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };

    // Gestionnaire pour appliquer les changements
    const applyBrandingChanges = () => {
      const logoPreview = document.getElementById('logo-preview') as HTMLImageElement;
      const logoSrc = logoPreview && !logoPreview.classList.contains('hidden') ? logoPreview.src : null;
      
      const newBranding = {
        logo: logoSrc,
        primaryColor: primaryColorInputRef.current?.value || branding.primaryColor,
        secondaryColor: secondaryColorInputRef.current?.value || branding.secondaryColor,
        accentColor: accentColorInputRef.current?.value || branding.accentColor,
        fontFamily: fontFamilyRef.current?.value || branding.fontFamily,
        isCustomBranding: true
      };
      
      updateBranding(newBranding);
      alert('Charte graphique appliquée !');
    };

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full bg-bolt-elements-background-depth-1',
          showBrandingForm ? 'overflow-auto' : 'overflow-hidden'
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div 
          ref={scrollRef} 
          className="flex w-full h-full overflow-y-auto" 
          style={{ 
            maxHeight: '100vh',
            position: showBrandingForm ? 'relative' : 'static',
            overflowY: 'auto'
          }}
        >
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {/* Contenu principal conteneur */}
            <div className="flex flex-col items-center justify-center w-full h-full">
              {/* Titre et intro */}
              {!chatStarted && (
                <div id="intro" className="mt-[18vh] w-full max-w-chat mx-auto mb-3">
                  <h1 className="text-5xl text-center font-bold text-bolt-elements-textPrimary mb-1">
                    GenIA
                  </h1>
                  <p className="text-center text-bolt-elements-textSecondary">
                    Génialement simple, Simplement génial !
                  </p>
                </div>
              )}
              
              {/* Zone des messages */}
              <div className="w-full max-w-chat mx-auto flex flex-col flex-grow">
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        ref={messageRef}
                        className="flex flex-col w-full flex-1 px-4 pb-6 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                      />
                    ) : null;
                  }}
                </ClientOnly>
              </div>
              
              {/* Zone de saisie et fonctionnalités */}
              <div className="w-full max-w-chat mx-auto z-prompt pb-4 sticky top-0 bg-bolt-elements-background-depth-1" id="input-container">
                {/* Textarea principal */}
                <div className="shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    className="w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) return;
                        event.preventDefault();
                        sendMessage?.(event);
                      }
                    }}
                    value={input}
                    onChange={(event) => {
                      handleInputChange?.(event);
                    }}
                    style={{
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder="Comment Genia peut vous aider ?"
                    translate="no"
                  />
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }
                          sendMessage?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  
                  {/* Section avec les boutons et conseils */}
                  <div className="flex justify-between text-sm p-4 pt-2">
                    <div className="flex gap-1 items-center">
                      <IconButton
                        title="Enhance prompt"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames({
                          'opacity-100!': enhancingPrompt,
                          'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!': promptEnhanced,
                        })}
                        onClick={() => enhancePrompt?.()}
                      >
                        {enhancingPrompt ? (
                          <>
                            <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl"></div>
                            <div className="ml-1.5">Enhancing prompt...</div>
                          </>
                        ) : (
                          <>
                            <div className="i-bolt:stars text-xl"></div>
                            {promptEnhanced && <div className="ml-1.5">Prompt enhanced</div>}
                          </>
                        )}
                      </IconButton>
                    </div>
                    {input.length > 3 ? (
                      <div className="text-xs text-bolt-elements-textTertiary">
                        Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                      </div>
                    ) : null}
                  </div>
                </div>
                
                {/* Toggle pour importer sa propre charte graphique */}
                <div className="flex items-center pl-4 mt-2 mb-2" id="toggle-container">
                  <label className="relative inline-flex items-center cursor-pointer" data-custom-branding="false">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      onChange={toggleCustomBranding}
                      checked={branding.isCustomBranding}
                    />
                    <div className="w-11 h-6 bg-bolt-elements-borderColor peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bolt-elements-item-contentAccent"></div>
                    <span className="ml-3 text-sm text-bolt-elements-textSecondary">Importer sa propre charte graphique</span>
                  </label>
                </div>
                
                {/* Formulaire de charte graphique */}
                {showBrandingForm && (
                  <div className="flex flex-col space-y-4 px-4 py-3 mx-4 mb-4 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor transition-all duration-300" id="branding-form">
                    {/* Zone de drop pour le logo */}
                    <div className="flex flex-col">
                      <label className="text-sm text-bolt-elements-textSecondary mb-1">Logo de votre entreprise</label>
                      <div 
                        className="h-24 flex items-center justify-center border-2 border-dashed border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-1 transition-colors duration-150 cursor-pointer"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('logo-input')?.click()}
                      >
                        <input 
                          id="logo-input" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const imgPreview = document.getElementById('logo-preview') as HTMLImageElement;
                                if (imgPreview && event.target?.result) {
                                  imgPreview.src = event.target.result as string;
                                  imgPreview.classList.remove('hidden');
                                }
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="flex flex-col items-center">
                          <img id="logo-preview" src="" alt="Logo preview" className="hidden max-h-20 mb-2" />
                          <div className="text-sm text-bolt-elements-textTertiary">Glissez-déposez votre logo ou cliquez pour sélectionner</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sélecteurs de couleurs */}
                    <div className="flex flex-col">
                      <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur principale</label>
                      <div className="flex items-center">
                        <input
                          ref={primaryColorInputRef}
                          type="color"
                          defaultValue={branding.primaryColor}
                          className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                          onChange={(e) => handleColorChange('primary', e.target.value, true)}
                        />
                        <input
                          ref={primaryColorTextRef}
                          type="text"
                          defaultValue={branding.primaryColor}
                          className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                          onChange={(e) => handleColorChange('primary', e.target.value, false)}
                        />
                      </div>
                    </div>

                    {/* Couleur secondaire */}
                    <div className="flex flex-col">
                      <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur secondaire</label>
                      <div className="flex items-center">
                        <input
                          ref={secondaryColorInputRef}
                          type="color"
                          defaultValue={branding.secondaryColor}
                          className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                          onChange={(e) => handleColorChange('secondary', e.target.value, true)}
                        />
                        <input
                          ref={secondaryColorTextRef}
                          type="text"
                          defaultValue={branding.primaryColor}
                          className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                          onChange={(e) => handleColorChange('secondary', e.target.value, false)}
                        />
                      </div>
                    </div>

                    {/* Couleur tertiaire */}5
                    <div className="flex flex-col">
                      <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur d'accent</label>
                      <div className="flex items-center">
                        <input
                          ref={accentColorInputRef}
                          type="color"
                          defaultValue={branding.accentColor}
                          className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                          onChange={(e) => handleColorChange('accent', e.target.value, true)}
                        />
                        <input
                          ref={accentColorTextRef}
                          type="text"
                          defaultValue={branding.accentColor}
                          className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                          onChange={(e) => handleColorChange('accent', e.target.value, false)}
                        />
                      </div>
                    </div>


                    {/* Sélecteur de police */}
                    <div className="flex flex-col">
                      <label className="text-sm text-bolt-elements-textSecondary mb-1">Police de caractères</label>
                      <select
                        ref={fontFamilyRef}
                        className="p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                        defaultValue={branding.fontFamily}
                        onChange={(e) => {
                          // Vous pouvez ajouter ici un gestionnaire si vous souhaitez une prévisualisation
                          // Par exemple : updateBranding({ fontFamily: e.target.value });
                          // Mais cela n'est pas nécessaire si vous appliquez les changements uniquement avec le bouton
                        }}
                      >
                        <option value="inter">Inter (Par défaut)</option>
                        <option value="poppins">Poppins</option>
                        <option value="montserrat">Montserrat</option>
                        <option value="roboto">Roboto</option>
                        <option value="opensans">Open Sans</option>
                        <option value="lato">Lato</option>
                        <option value="raleway">Raleway</option>
                        <option value="playfair">Playfair Display</option>
                        <option value="sourcecode">Source Code Pro</option>
                        <option value="merriweather">Merriweather</option>
                      </select>
                    </div>
                    
                    {/* Bouton d'application des changements */}
                    <div className="flex justify-end">
                      <button 
                        className="px-4 py-2 bg-bolt-elements-item-contentAccent text-white rounded-md text-sm hover:bg-opacity-90 transition-colors"
                        onClick={applyBrandingChanges}
                      >
                        Appliquer les changements
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Exemples de prompts */}
              {!chatStarted && (
                <div id="examples" className="w-full max-w-chat mx-auto mb-6">
                  <div className="flex flex-col space-y-2">
                    {EXAMPLE_PROMPTS.map((examplePrompt, index) => {
                      return (
                        <button
                          key={index}
                          onClick={(event) => {
                            sendMessage?.(event, examplePrompt.text);
                          }}
                          className="group flex items-center w-full gap-2 justify-start bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-theme"
                        >
                          <div className="i-ph:arrow-bend-down-left" />
                          {examplePrompt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);