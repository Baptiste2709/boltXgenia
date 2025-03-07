// app/routes/api/search.js ou un fichier similaire selon votre structure
import { json } from '@remix-run/node';

// En production, vous devriez utiliser une vraie API comme:
// - Google Custom Search API
// - Bing Search API
// - SerpAPI
// - Algolia
// - ou une autre solution similaire

export async function loader({ request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  
  if (!query) {
    return json({ error: 'Requête de recherche manquante' }, { status: 400 });
  }
  
  try {
    // Remplacer ce mock par un appel API réel
    // Exemple avec Google Custom Search API:
    // const API_KEY = process.env.GOOGLE_API_KEY;
    // const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
    // const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`);
    // const data = await response.json();
    // const results = data.items.map(item => ({
    //   title: item.title,
    //   link: item.link,
    //   snippet: item.snippet
    // }));
    
    // Données simulées pour la démonstration
    const results = [
      {
        title: "Résultat de recherche 1 pour " + query,
        link: "https://example.com/1",
        snippet: "Ceci est un extrait du premier résultat de recherche concernant " + query + ". Ce texte contient des informations pertinentes sur le sujet demandé."
      },
      {
        title: "Résultat de recherche 2 pour " + query,
        link: "https://example.com/2",
        snippet: "Voici un second extrait avec d'autres informations sur " + query + ". Claude pourra utiliser ces données pour enrichir sa réponse."
      },
      {
        title: "Résultat de recherche 3 pour " + query,
        link: "https://example.com/3",
        snippet: "Troisième résultat contenant des détails supplémentaires sur " + query + " qui pourraient être utiles pour une réponse complète."
      }
    ];
    
    // Ajouter un délai artificiel pour simuler une vraie recherche
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return json({ results });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return json({ error: 'Erreur lors de la recherche' }, { status: 500 });
  }
}