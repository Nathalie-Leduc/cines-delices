import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CinéDélices API',
      version: '1.0.0',
      description: 'Documentation de l’API CinéDélices',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/docs/*.swagger.js'], // chemins vers les fichiers à documenter
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export default setupSwagger;
