import { useEffect, useState } from "react";
import { fetchMedia } from "../services/mediaService";

export function searchBar(){
    const [query, setQuery] = useState(""); // Texte que l'utilisateur tape
    const [results, setResults] = useState ([]); // Stocke les résultats TMDB

    // Fonction déclenchée quand l'utilisateur clique sur "Rechercher"
    const handleSearch = async() => {
        const data = await fetchMedia("movie", query);// "movie" = type de média 
        setResults(data); // On met à jour la liste des résultats
    }
    useEffect(() => {
    fetchMedia('movie').then(data => console.log(data));
    }, []);

    return( 
        <div>
            {/* Input pour taper le titre du film */}
            <input 
                type="text" 
                placeholder="Rechercher un film..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} // Met à jour query à chaque frappe
            />
            {/* Bouton pour déclencher la recherche */}
            <button onClick={handleSearch}>Recherche</button>
             {/* Affichage des résultats */}
            <ul>
                {results.map(media => (
                     {/* Affiche le titre du film */},
                    <li key={media.id}>{media.title}</li>
                ))}
            </ul>
        </div>
    );

}