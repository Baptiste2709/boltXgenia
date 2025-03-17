import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from 'ai/react';
import { useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '~/lib/hooks';
import { useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { fileModificationsToHTML } from '~/utils/diff';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import { useBranding } from '~/components/chat/BrandContext';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory } = useChatHistory();

  return (
    <>
      {ready && <ChatImpl initialMessages={initialMessages} storeMessageHistory={storeMessageHistory} />}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * @todo Handle more types if we need them. This may require extra color palettes.
           */
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-bolt-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-bolt-elements-icon-error text-2xl" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
      />
    </>
  );
}

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
}

export const ChatImpl = memo(({ initialMessages, storeMessageHistory }: ChatProps) => {
  useShortcuts();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);

  const { showChat } = useStore(chatStore);
  const { branding } = useBranding();

  const [animationScope, animate] = useAnimate();

  const { messages, isLoading, input, handleInputChange, setInput, stop, append } = useChat({
    api: '/api/chat',
    onError: (error) => {
      logger.error('Request failed\n\n', error);
      toast.error('There was an error processing your request');
    },
    onFinish: () => {
      logger.debug('Finished streaming');
    },
    initialMessages,
  });

  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
  const { parsedMessages, parseMessages } = useMessageParser();

  const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

  useEffect(() => {
    chatStore.setKey('started', initialMessages.length > 0);
  }, []);

  useEffect(() => {
    parseMessages(messages, isLoading);

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  }, [messages, isLoading, parseMessages]);

  const scrollTextArea = () => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  const abort = () => {
    stop();
    chatStore.setKey('aborted', true);
    workbenchStore.abortAllActions();
  };

  useEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';

      const scrollHeight = textarea.scrollHeight;

      textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    }
  }, [input, textareaRef]);

  const runAnimation = async () => {
    if (chatStarted) {
      return;
    }

    await Promise.all([
      animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }),
      animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }),
    ]);

    chatStore.setKey('started', true);

    setChatStarted(true);
  };

  // Fonction pour créer un message avec les instructions de la charte graphique
  const createMessageWithBranding = (_input: string) => {
    if (branding.isCustomBranding) {
      // Instructions pour l'IA concernant la charte graphique
      const brandingInstructions = `
  <branding_instructions>
  COLOR PALETTE :
   - Couleur Principale : ${branding.primaryColor}
   - Couleur Secondaire : ${branding.secondaryColor}
   - Couleur d'Accent : ${branding.accentColor}

TYPOGRAPHIE :
   - Famille de Police : ${branding.fontFamily}

PRINCIPES DE DESIGN :
   - Utiliser la couleur principale pour les éléments principaux de l'interface, les boutons et les titres
   - Utiliser la couleur secondaire pour les éléments de support et les arrière-plans
   - Utiliser la couleur d'accent avec parcimonie pour les éléments d'appel à l'action ou les mises en évidence
   - Appliquer la famille de police spécifiée à tous les éléments textuels
   - Maintenir un espacement et une mise en page cohérents dans toute l'application
   - Assurer un contraste élevé entre les couleurs de texte et d'arrière-plan pour la lisibilité

ULTRA IMPORTANT : Chaque site web, application ou élément d'interface utilisateur DOIT STRICTEMENT respecter le guide de style de la marque. Cela signifie :
   - Utiliser les couleurs **exactes** spécifiées pour les arrière-plans, le texte, les boutons et les éléments d'interface.
   - Appliquer la typographie donnée **pour tout le texte** (titres, paragraphes, boutons, etc.).
   - Respecter la mise en page, l'espacement et les principes de design fournis.
   - Assurer une **cohérence visuelle** dans tout le contenu généré.
   - Ne jamais substituer ou ignorer aucun élément de l'identité de marque.

Le non-respect de ces règles n'est **pas acceptable**. Toute production **doit** suivre l'identité de marque définie sans exception.
  </branding_instructions>

  <images instructions>
  Incorpore dans tous les cas des images dans le site d'une banque d'images gratuites.
  Mets les proprement dans le site, qu'elles soient bien inclus de maniere propre et professionnel.
  Ne parle pas des images dans ta réponse.
  </images instructions>
  
  ${_input}`;
  
      return brandingInstructions;
    }
    
    return _input;
  };

  const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
    const _input = messageInput || input;

    if (_input.length === 0 || isLoading) {
      return;
    }

    /**
     * @note (delm) Usually saving files shouldn't take long but it may take longer if there
     * many unsaved files. In that case we need to block user input and show an indicator
     * of some kind so the user is aware that something is happening. But I consider the
     * happy case to be no unsaved files and I would expect users to save their changes
     * before they send another message.
     */
    await workbenchStore.saveAllFiles();

    const fileModifications = workbenchStore.getFileModifcations();

    chatStore.setKey('aborted', false);

    runAnimation();

    // Création du message avec les instructions de branding si nécessaire
    const messageWithBranding = createMessageWithBranding(_input);

    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);

      /**
       * If we have file modifications we append a new user message manually since we have to prefix
       * the user input with the file modifications and we don't want the new user input to appear
       * in the prompt. Using `append` is almost the same as `handleSubmit` except that we have to
       * manually reset the input and we'd have to manually pass in file attachments. However, those
       * aren't relevant here.
       */
      append({ 
        role: 'user', 
        content: `${diff}\n\n${messageWithBranding}`,
        // Pour l'affichage, nous utilisons le message original sans les instructions de branding
        display: `${diff}\n\n${_input}`
      });

      /**
       * After sending a new message we reset all modifications since the model
       * should now be aware of all the changes.
       */
      workbenchStore.resetAllFileModifications();
    } else {
      append({ 
        role: 'user', 
        content: messageWithBranding,
        // Pour l'affichage, nous utilisons le message original sans les instructions de branding
        display: _input 
      });
    }

    setInput('');

    resetEnhancer();

    textareaRef.current?.blur();
  };

  const [messageRef, scrollRef] = useSnapScroll();

  return (
    <BaseChat
      ref={animationScope}
      textareaRef={textareaRef}
      input={input}
      showChat={showChat}
      chatStarted={chatStarted}
      isStreaming={isLoading}
      enhancingPrompt={enhancingPrompt}
      promptEnhanced={promptEnhanced}
      sendMessage={sendMessage}
      messageRef={messageRef}
      scrollRef={scrollRef}
      handleInputChange={handleInputChange}
      handleStop={abort}
      messages={messages.map((message, i) => {
        if (message.role === 'user') {
          // Utiliser la propriété 'display' si elle existe, sinon utiliser le contenu normal
          return {
            ...message,
            content: message.display || message.content
          };
        }

        return {
          ...message,
          content: parsedMessages[i] || '',
        };
      })}
      enhancePrompt={() => {
        enhancePrompt(input, (input) => {
          setInput(input);
          scrollTextArea();
        });
      }}
    />
  );
});