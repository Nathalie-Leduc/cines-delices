import SwaggerParser from '@apidevtools/swagger-parser';
import { swaggerSpec } from '../swagger/swagger.js';

try {
  const validated = await SwaggerParser.validate(swaggerSpec);
  const pathCount = Object.keys(validated.paths || {}).length;
  const schemaCount = Object.keys(validated.components?.schemas || {}).length;

  console.log(`Swagger spec valide (${pathCount} paths, ${schemaCount} schemas).`);
} catch (error) {
  console.error('Validation Swagger echouee.');
  console.error(error.message);
  process.exit(1);
}
