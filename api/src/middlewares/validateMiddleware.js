// Middleware générique de validation Zod
// Structure validée : { body, params, query }
// Utilisation dans un router

import { ZodError } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    // safeParse ne lève pas d'exception : retourne ( success, data, error )
    const result = schema.safeParse({
      body:   req.body,
      params: req.params,
      query:  req.query,
    });

    if (!result.success) {
      // Formater les erreurs Zod en messages lisibles
      // ZodError.flatten() regroupe par champ : { fieldErrors, formErrors }
      const formatted = result.error.flatten();

      // Construire un tableau de messages clairs pour le front
      // ex: ["email: Format email invalide", "password: 8 caractères minimum"]
      const messages = [];

      // Erreurs par champ (dans body, params, query)
      for (const [field, errors] of Object.entries(formatted.fieldErrors)) {
        // field peut être "body.email", on enlève le préfixe "body."
        const cleanField = field;
        errors.forEach(msg => messages.push(`${cleanField}: ${msg}`));
      }

      // Erreurs globales (ex: refine sur l'objet entier)
      formatted.formErrors.forEach(msg => messages.push(msg));
      
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: messages.map((msg) => ({ message: msg })),
        data: null,
      });
    }

    // Données valides et transformées (ex: email normalisé en lowercase)
<<<<<<< HEAD
<<<<<<< HEAD
    // On réinjecte les données nettoyées dans req pour que le controller
    // récupère des données propres sans refaire le travail
    req.body    = result.data.body    ?? req.body;
    req.params  = result.data.params  ?? req.params;
    req.query   = result.data.query   ?? req.query;
=======
    // On réinjecte les données nettoyées dans req 
    // req.body et req.params sont modifiables — req.query est en lecture
    // seule dans Express, on copie ses propriétés plutôt que de le remplacer
    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params;
    if (result.data.query) {
      // req.query est un getter - on copie les propriétés une par une
      Object.assign(req.query, result.data.query);
    }
>>>>>>> c54f4678d8bb23804d36ae2bc5e82fac87b033e7
=======
    // On réinjecte les données nettoyées dans req pour que le controller
    // récupère des données propres sans refaire le travail
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    // Sur Express récent, req.query est un getter (read-only) : on merge sans réassigner.
    if (result.data.query && typeof req.query === 'object' && req.query !== null) {
      Object.assign(req.query, result.data.query);
    }
>>>>>>> 8ed9f51e5d5144ad38d4d4b4912def4abd37a7b7
    
    next()

  } catch (error) {
<<<<<<< HEAD
<<<<<<< HEAD
    // Ne devrait pas arriver mais ceinture-bretelles
=======
    // Ne devrait pas arriver mais on fait ceinture-bretelles
>>>>>>> c54f4678d8bb23804d36ae2bc5e82fac87b033e7
=======
    // Ne devrait pas arriver mais ceinture-bretelles
>>>>>>> 8ed9f51e5d5144ad38d4d4b4912def4abd37a7b7
    next(error);
  }
};
