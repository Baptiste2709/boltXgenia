// app/components/chat/BaseChat.tsx
import type { Message } from 'ai';
import React, { useState, type RefCallback, useEffect} from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { useBranding } from '~/components/chat/BrandContext';
import { AnimatePresence } from 'framer-motion';
import BrandExtractModal from '~/components/chat/BrandExtractModal';
import BrandManualModal from '~/components/chat/BrandManualModal';

import styles from './BaseChat.module.scss';

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
  { text: 'Crée le site vitrine de l\'école ECE, une école d\'ingénieur à Paris avec React et Tailwind' },
  { text: 'Concevoir une application mobile de suivi des habitudes avec React Native' },
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
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [showBrandingForm, setShowBrandingForm] = useState(false);
    const [showBrandExtractModal, setShowBrandExtractModal] = useState(false);
    const [showBrandManualModal, setShowBrandManualModal] = useState(false);
    const { branding, updateBranding } = useBranding();

    // Effet pour masquer le formulaire pendant la génération
    useEffect(() => {
      if (isStreaming && showBrandingForm) {
        setShowBrandingForm(false);
      }
    }, [isStreaming]);

    useEffect(() => {
      if (showBrandingForm && branding.logo) {
        // Si le formulaire est ouvert et qu'un logo existe dans branding, l'afficher
        const imgPreview = document.getElementById('logo-preview') as HTMLImageElement;
        const uploadText = document.getElementById('logo-upload-text');

        if (imgPreview) {
          imgPreview.src = branding.logo;
          imgPreview.classList.remove('hidden');

          // Masquer le texte quand logo présent
          if (uploadText) {
            uploadText.classList.add('hidden');
          }
        }
      }
    }, [showBrandingForm, branding.logo]);

    useEffect(() => {
      // Vérifier si nous sommes côté client
      if (typeof window !== 'undefined') {
        const script = document.createElement('script');
        script.src = '/logo-saver.js';
        script.async = true;
        
        // Vérifier si le script n'est pas déjà chargé
        if (!document.querySelector('script[src="/logo-saver.js"]')) {
          document.body.appendChild(script);
        }
    
        return () => {
          // Ne supprimer que si le script existe encore
          const existingScript = document.querySelector('script[src="/logo-saver.js"]');
          if (existingScript) {
            document.body.removeChild(existingScript);
          }
        };
      }
    }, []);

    const toggleCustomBranding = (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      setShowBrandingForm(isChecked);
      updateBranding({ isCustomBranding: isChecked });
      event.target.closest('label')?.setAttribute('data-custom-branding', String(isChecked));
    };

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {/* Contenu principal conteneur */}
            <div className="flex flex-col items-center justify-center w-full h-full">
              {/* Titre et intro */}
              {!chatStarted && (
                <div id="intro" className="mt-[10vh] w-full max-w-chat mx-auto mb-2">
                  <h1 className="text-5xl text-center font-bold text-bolt-elements-textPrimary mb-1">
                    GenIA
                  </h1>
                  <p className="text-center text-bolt-elements-textSecondary">
                    Génialement simple, Simplement génial !
                  </p>
                </div>
              )}

              {/* Zone des messages */}
              <div className="w-full max-w-chat mx-auto flex flex-col flex-grow overflow-y-auto">
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

              {/* Zone de saisie et formulaire de charte graphique dans un layout flexible */}
              <div className="w-full max-w-chat mx-auto z-prompt pb-4 relative">
                <div className="flex flex-col items-center">
                  {/* Textarea principal - toujours centré */}
                  <div className="shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden w-full">
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
                  <div className="flex items-center pl-4 mt-2 mb-2 w-full">
                  <label className="relative inline-flex items-center cursor-pointer" data-custom-branding={branding.isCustomBranding ? "true" : "false"}>
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
                </div>

                {/* Layout flexible pour le formulaire */}
                <div className={`fixed right-0 top-[10%] transform transition-all duration-300 z-50 ${showBrandingForm && !isStreaming ? 'translate-x-0' : 'translate-x-full'}`}>
                  {/* Formulaire de charte graphique */}
                  {showBrandingForm && !isStreaming && (
                    <div className="flex flex-col space-y-4 px-4 py-3 mx-4 mb-4 w-80 rounded-l-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor border-r-0 shadow-lg">
                      <div className="flex justify-between items-center border-b border-bolt-elements-borderColor pb-2 mb-2">
                        <h3 className="font-medium text-bolt-elements-textPrimary">Charte graphique</h3>
                        <button
                          className="text-bolt-elements-textSecondary bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textSecondary"
                          onClick={() => setShowBrandingForm(false)}
                        >
                          <div className="i-ph:x-circle"></div>
                        </button>
                      </div>
                      
                      {/* Boutons d'action pour les différentes méthodes */}
                      <div className="flex flex-col space-y-3">
                        {/* Bouton pour saisie manuelle */}
                        <button
                          onClick={() => setShowBrandManualModal(true)}
                          className="flex items-center justify-center w-full p-3 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded-md hover:brightness-110 transition-all"
                        >
                          <div className="i-ph:pencil-duotone mr-2"></div>
                          Saisie manuelle
                        </button>
                        
                        {/* Bouton pour extraction via API */}
                        <button
                          onClick={() => setShowBrandExtractModal(true)}
                          className="flex items-center justify-center w-full p-3 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded-md hover:brightness-110 transition-all"
                        >
                          <div className="i-ph:globe-duotone mr-2"></div>
                          Extraire via API
                        </button>

                        {/* Aperçu de la charte actuelle si elle existe */}
                        {branding.isCustomBranding && (
                          <div className="mt-4 p-3 bg-bolt-elements-background-depth-1 rounded-md">
                            <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">Charte actuelle :</h4>
                            <div className="space-y-2">
                              {branding.logo && (
                                <div className="flex justify-center">
                                  <img src={branding.logo} alt="Logo actuel" className="max-h-12 max-w-full" />
                                </div>
                              )}
                              <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: branding.primaryColor }}></div>
                                <span className="text-xs text-bolt-elements-textSecondary">{branding.primaryColor}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: branding.secondaryColor }}></div>
                                <span className="text-xs text-bolt-elements-textSecondary">{branding.secondaryColor}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: branding.accentColor }}></div>
                                <span className="text-xs text-bolt-elements-textSecondary">{branding.accentColor}</span>
                              </div>
                              <div className="text-xs text-bolt-elements-textSecondary">
                                Police : {branding.fontFamily}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exemples de prompts */}
              {!chatStarted && (
                <div id="examples" className="w-full max-w-chat mx-auto mb-30">
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
        
        {/* Modals pour la charte graphique */}
        <AnimatePresence>
          {showBrandExtractModal && (
            <BrandExtractModal 
              isOpen={showBrandExtractModal} 
              onClose={() => setShowBrandExtractModal(false)} 
            />
          )}
          {showBrandManualModal && (
            <BrandManualModal 
              isOpen={showBrandManualModal} 
              onClose={() => setShowBrandManualModal(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  },
);