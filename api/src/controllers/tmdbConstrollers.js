import { mapMedia } from "../mappers/mediaMapper.js";
import dotenv from "dotenv";

dotenv.config();

export const getAllMedias = async (req,res) =>{
    try {
        // Récupère le type depuis l'URL (:type) → "movie", "tv", ou undefined si /medias
        const type = req.params.type;
        // Fonction interne : récupère et mappe les médias d'un type donné
        const fetchByType = async (t) => {
            // Construit l'URL TMDB selon le type (movie ou tv)
            const response = await fetch(
            `${process.env.TMDB_BASE_URL}/discover/${t}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`
        );
        // Si TMDB répond avec une erreur, on lance une exception
        if (!response.ok) throw new Error(`erreur TMDB ${t}`);
         // Convertit la réponse en JSON
        const data = await response.json();
         // Mappe chaque item brut TMDB vers notre format standardisé
        return data.results.map(item => mapMedia(item, t));
    };
    // Contiendra le tableau final des médias mappés
    let results;

    if (type === "movie" || type === "tv") {
       // Un type précis est demandé → une seule requête TMDB  
      results = await fetchByType(type);
    } else {
       // Pas de type → on récupère films ET séries en parallèle 
      const [movies, tv] = await Promise.all([
        fetchByType("movie"),
        fetchByType("tv")
      ]);
       // On fusionne les deux tableaux en un seul
      results = [...movies, ...tv];
    }

    res.json(results);
    } catch (error){
         // Affiche l'erreur dans le terminal pour le debug
        console.error(error)
         // Renvoie une erreur 500 au front
        res.status(500).json({message: "Erreur serveur lors de la récupération des médias"})
    }
}

export const getMediaById = async (req, res) =>{
    try{
        // On récupère l'ID du film depuis l'URL
         // Optionnel : type du média, par défaut "movie"
        const {type = "movie", id} = req.params;  // "movie" ou "tv"
        // Si aucun ID n'est fourni, on renvoie une erreur HTTP 400 (Bad Request)
        if (!id) return res.status(400).json({message: "ID requis"})
         // Construction de l'URL TMDB pour récupérer le film par son ID    
        const url = `${process.env.TMDB_BASE_URL}/${type}/${id}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`;
         // Envoi de la requête GET et attente de la réponse
        const response = await fetch(url);
        // Si TMDB renvoie une erreur, on déclenche une exception
        if (!response.ok) throw new Error("Erreur TMDB by ID")
         // Conversion en JSON
        const data = await response.json()
        //Initialisation du champ director
        let director = null
        // Si c'est un film, on récupère le réalisateur via l'endpoint /credits
        if (type === "movie"){
            const creditsUrl = `${process.env.TMDB_BASE_URL}/movie/${id}/credits?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`;
            
            const creditsRes = await fetch(creditsUrl);
            // Si la requête credits réussit
            if (creditsRes.ok){
                const creditsData = await creditsRes.json()
                //  Cherche dans le crew la personne dont le job est Director
                const dir = creditsData.crew.find(c => c.job === "Director");
                //si trouvé, on récupère le nom
                if (dir) director = dir.name;
            }
        };
         // On renvoie l'objet complet du film
        res.json(mapMedia(data, type, {director}));

    } catch(error){
        console.error(error)
        res.status(500).json({message: "Erreur serveur lors de la récupération du média"})
    }
}

export const searchMedia = async (req,res)=>{
    try{
    //Récupère le mot-clé de recherche depuis la query string, ex: ?query=ratatouille
    const searchTerm = req.query.searchTerm
    // Vérifie que l'utilisateur a bien fourni un mot-clé
    // si aucun searchTerm n'est fourni, on renvoie une erreur 400
    if (!searchTerm){
        return res.status(400).json({message: "Paramètre 'searchTerm' requis"});
    }
    // Type de média recherché : movie, tv ou multi
    // "multi" permet de chercher films + séries.
    // "multi" valeur par défaut.
    const type = req.params.type || "multi";
    // Construction de l'URL TMDB pour la recherche
    // "multi" permet de rechercher films + séries en même temps.
    // on prend ce que l’utilisateur tape {encodeURIComponent} le convertit pour qu’il soit valide dans une URL.
    const url = `${process.env.TMDB_BASE_URL}/search/${type}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(searchTerm)}`;


    // Envoi de la requête HTTP GET à TMDB
    const response = await fetch(url);
    // Vérifie si TMDB a répondu correctement
    if (!response.ok) throw new Error("Erreur TMDB searchMovie");

    const data = await response.json();

    // envoi du tableau mappé au frontend.
    res.json(data.results.map(item => mapMedia(item, type)));

    }catch(error){
        console.error(error)
        res.status(500).json({message:"Erreur serveur lors de la recherche de média"});
    }
}



