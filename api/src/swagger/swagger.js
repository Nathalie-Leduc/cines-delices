import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

function setupSwagger(app) {

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


const swaggerSpec = swaggerJSDoc(options);

const checkSwaggerKey = (req, res, next) => {
  // On laisse passer les fichiers statiques (css, js, png...)
  const isStaticAsset = req.path.match(/\.(css|js|png|ico|json)$/);
  if (isStaticAsset) return next();

  // En dev : toujours accessible
  if (process.env.NODE_ENV !== 'production') return next();

  // En prod : clé obligatoire sur la page principale
  const key = req.query.key;
  if (key && key === process.env.SWAGGER_API_KEY) return next();

    return res.status(404).json({ error: 'Not found' });
  };

  app.use('/api/docs', checkSwaggerKey, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api-docs', checkSwaggerKey, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
export default setupSwagger;
