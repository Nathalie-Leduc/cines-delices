import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CinéDélices API',
      version: '1.0.0',
      description: "Documentation de l'API CinéDélices",
    },
    servers: [
      {
        url: `${process.env.API_BASE_URL || 'http://localhost:3000'}`,
        description: process.env.NODE_ENV === 'production'
          ? 'Serveur de production'
          : 'Serveur de développement',
      },
    ],
  },
  apis: ['./src/docs/*.swagger.js'],
};


export const swaggerSpec = swaggerJSDoc(options);

//Middleware qui vérifie la clé API
function checkSwaggerKey(req, res, next) {
  const key = req.query.key; // ?key=xxxx dans l'URL

  // En dev : toujours accessible
  if (process.env.NODE_ENV !== 'production') return next();

  // En prod : clé obligatoire
  if (key && key === process.env.SWAGGER_API_KEY) return next();

  // Sinon : refus discret (404 et non 401 pour ne pas révéler l'existence)
  return res.status(404).json({ error: 'Not found' });
}

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export default setupSwagger;
