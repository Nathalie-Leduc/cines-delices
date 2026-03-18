import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';


// adapter obligaoire avec Prisma V7
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL})
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('🌱 Démarrage du seed Ciné Délices v1...\n');
  
  //utilisation de "upsert" => crée si absent, ne touche pas si déjà présent

  // 1. Catégories
  const [catEntree, catPlat, catDessert, catBoisson] = await Promise.all([
    prisma.category.upsert({ where: { nom: 'Entrée' },   update: {}, create: { nom: 'Entrée',   description: 'Amuse-bouches et entrées' } }),
    prisma.category.upsert({ where: { nom: 'Plat' },   update: {}, create: { nom: 'Plat',   description: 'Plats principaux' } }),
    prisma.category.upsert({ where: { nom: 'Dessert' },   update: {}, create: { nom: 'Dessert',   description: 'Douceurs sucrées' } }),
    prisma.category.upsert({ where: { nom: 'Boisson' },   update: {}, create: { nom: 'Boisson',   description: 'Boissons et cocktails' } }),
  ]);
  console.log('✅ Catégories :', [catEntree, catPlat, catDessert, catBoisson].map(c => c.nom).join(', '));


  // 2. Genres TMDB
  const [genreDrame, genreComedy, genreAnimation] = await Promise.all([
    prisma.genre.upsert({ where: { tmdbGenreId: 18 },  update: {}, create: { nom: 'Drame',     tmdbGenreId: 18 } }),
    prisma.genre.upsert({ where: { tmdbGenreId: 35 },  update: {}, create: { nom: 'Comédie',   tmdbGenreId: 35 } }),
    prisma.genre.upsert({ where: { tmdbGenreId: 16 },  update: {}, create: { nom: 'Animation', tmdbGenreId: 16 } }),
  ]);
  console.log('✅ Genres TMDB :', [genreDrame, genreComedy, genreAnimation].map(g => g.nom).join(', '));


  // 3. Médias (films/séries avec tmdbId réels
  const mediaRatatouille = await prisma.media.upsert({
    where:  { tmdbId: 2062 },
    update: {},
    create: {
      tmdbId:    2062,
      titre:     'Ratatouille',
      type:      'MOVIE',
      posterUrl: 'https://image.tmdb.org/t/p/w500/npHNjldbeTHdKKw28bJKs7lzqzj.jpg',
      synopsis:  'Un rat doué pour la cuisine s\'associe avec un jeune plongeur dans un restaurant parisien.',
      annee:     2007,
      genres:    { create: [{ genreId: genreAnimation.id }, { genreId: genreComedy.id }] },
    },
  });

  const mediaChocolat = await prisma.media.upsert({
    where:  { tmdbId: 8467 },
    update: {},
    create: {
      tmdbId:    8467,
      titre:     'Chocolat',
      type:      'MOVIE',
      posterUrl: 'https://image.tmdb.org/t/p/w500/7sbyD6e7Y4aNNuRxz2a0aUxBvGk.jpg',
      synopsis:  'Une femme ouvre une chocolaterie dans un village bourguignon conservateur.',
      annee:     2000,
      genres:    { create: [{ genreId: genreDrame.id }] },
    },
  });

  const mediaBreakingBad = await prisma.media.upsert({
    where:  { tmdbId: 1396 },
    update: {},
    create: {
      tmdbId:    1396,
      titre:     'Breaking Bad',
      type:      'SERIES',
      posterUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      synopsis:  'Un professeur de chimie se reconvertit dans la fabrication de méthamphétamine.',
      annee:     2008,
      genres:    { create: [{ genreId: genreDrame.id }] },
    },
  });
  console.log('✅ Genres TMDB :', [mediaRatatouille, mediaChocolat, mediaBreakingBad].map(m => m.titre).join(', '));

// 4. Utilisateurs
const adminHash = await argon2.hash('Admin1234!');
const memberHash = await argon2.hash('Member1234!');

const userAdmin = await prisma.user.upsert({
  where:  { email: 'admin@cinesdelices.fr' },
    update: {},
    create: { email: 'admin@cinesdelices.fr', pseudo: 'Admin',    passwordHash: adminHash,  role: 'ADMIN' },
});
const userMarie = await prisma.user.upsert({
    where:  { email: 'marie@cinesdelices.fr' },
    update: {},
    create: { email: 'marie@cinesdelices.fr', pseudo: 'Marie',    passwordHash: memberHash },
  });
  const userRemy = await prisma.user.upsert({
    where:  { email: 'remy@cinesdelices.fr' },
    update: {},
    create: { email: 'remy@cinesdelices.fr',  pseudo: 'ReMyChef', passwordHash: memberHash },
  });
  console.log('✅ Users :', [userAdmin, userMarie, userRemy].map(u => u.email).join(', '));  


// 5. Ingrédients de base
// Normalisé : trim() + tolowerCase() appliqués à la création
const ingredients = await Promise.all([
  'courgette', 'aubergine', 'tomate', 'oignon', 'poivron rouge',
  'huile d\'olive', 'herbes de provence', 'sel', 'poivre',
  'lait entier', 'chocolat noir 70%', 'cannelle', 'piment de cayenne', 'sucre',
  'bœuf (paleron)', 'vin rouge', 'lardons', 'champignon', 'carotte', 'farine'
].map(nom =>
  prisma.ingredient.upsert({
    where: { nom : nom.trim().toLowerCase()},
    update: {},
    create: { nom : nom.trim().toLowerCase()},    
  })
));
console.log(`✅ ${ingredients.length} ingrédients créés`);   

// Helper pour récupérer un ingrédient par nom
const ing = (nom) => ingredients.find(i => i.nom === nom.trim().toLowerCase());


// 6. Recettes (Toutes PUBLISHED)
// Recette 1 : Ratatouille de Rémy (PUBLISHED)
  const existingR1 = await prisma.recipe.findFirst({ where: { titre: 'Ratatouille de Rémy' } });
  if (!existingR1) {
    await prisma.recipe.create({
      data: {
        titre:           'Ratatouille de Rémy',
        instructions:    '1. Préchauffer le four à 180°C.\n2. Couper les légumes en rondelles fines (3mm).\n3. Préparer la sauce tomate : faire revenir l\'oignon, ajouter les tomates en dés, sel, poivre, mijoter 15 min.\n4. Mixer la sauce et l\'étaler dans un plat à gratin.\n5. Disposer les rondelles en rosace, arroser d\'huile d\'olive, saupoudrer d\'herbes.\n6. Couvrir de papier sulfurisé, enfourner 40 min.\n7. Retirer le papier les 10 dernières minutes pour dorer.',
        nombrePersonnes: 4,
        tempsPreparation: 20,
        tempsCuisson:    50,
        status:          'PUBLISHED',
        userId:          userMarie.id,
        categoryId:      catPlat.id,
        mediaId:         mediaRatatouille.id,
        ingredients: {
          create: [
            { ingredientId: ing('courgette').id,         quantity: '2',  unit: 'pièces' },
            { ingredientId: ing('aubergine').id,         quantity: '1',  unit: 'pièce' },
            { ingredientId: ing('tomate').id,            quantity: '5',  unit: 'pièces' },
            { ingredientId: ing('poivron rouge').id,     quantity: '1',  unit: 'pièce' },
            { ingredientId: ing('oignon').id,            quantity: '1',  unit: 'pièce' },
            { ingredientId: ing('huile d\'olive').id,    quantity: '4',  unit: 'c.à.s' },
            { ingredientId: ing('herbes de provence').id, quantity: '1', unit: 'c.à.c' },
            { ingredientId: ing('sel').id,               quantity: null, unit: null },
            { ingredientId: ing('poivre').id,            quantity: null, unit: null },
          ],
        },
      },
    });
    console.log('✅ Recette 1 : Ratatouille de Rémy (PUBLISHED)');
  }

  // Recette 2 : Chocolat chaud de Vianne (PUBLISHED)
  const existingR2 = await prisma.recipe.findFirst({ where: { titre: 'Chocolat chaud de Vianne' } });
  if (!existingR2) {
    await prisma.recipe.create({
      data: {
        titre:           'Chocolat chaud de Vianne',
        instructions:    '1. Casser le chocolat en morceaux.\n2. Chauffer le lait à feu moyen sans bouillir.\n3. Incorporer le chocolat en remuant jusqu\'à fonte complète.\n4. Ajouter la cannelle, le piment de Cayenne, le sucre.\n5. Fouetter vigoureusement pour obtenir une mousse.\n6. Servir dans de grandes tasses.',
        nombrePersonnes: 2,
        tempsPreparation: 5,
        tempsCuisson:    10,
        status:          'PUBLISHED',
        userId:          userRemy.id,
        categoryId:      catBoisson.id,
        mediaId:         mediaChocolat.id,
        ingredients: {
          create: [
            { ingredientId: ing('lait entier').id,         quantity: '500', unit: 'ml' },
            { ingredientId: ing('chocolat noir 70%').id,   quantity: '100', unit: 'g' },
            { ingredientId: ing('cannelle').id,            quantity: '1',   unit: 'c.à.c' },
            { ingredientId: ing('piment de cayenne').id,   quantity: '1',   unit: 'pincée' },
            { ingredientId: ing('sucre').id,               quantity: '2',   unit: 'c.à.s' },
          ],
        },
      },
    });
    console.log('✅ Recette 2 : Chocolat chaud de Vianne (PUBLISHED)');
  }

  // Recette 3 : Bœuf braisé de Gusteau (DRAFT — invisible du catalogue)
  const existingR3 = await prisma.recipe.findFirst({ where: { titre: 'Bœuf braisé de Gusteau' } });
  if (!existingR3) {
    await prisma.recipe.create({
      data: {
        titre:           'Bœuf braisé de Gusteau',
        instructions:    'À compléter...',
        status:          'DRAFT',
        userId:          userMarie.id,
        categoryId:      catPlat.id,
        mediaId:         mediaRatatouille.id,
        ingredients: {
          create: [
            { ingredientId: ing('bœuf (paleron)').id,  quantity: '1.5', unit: 'kg' },
            { ingredientId: ing('vin rouge').id,        quantity: '75',  unit: 'cl' },
          ],
        },
      },
    });
    console.log('✅ Recette 3 : Bœuf braisé de Gusteau (DRAFT — non visible)');
  }

  console.log('\n🎬 Seed terminé !\n');
  console.log('────────────────────────────────────────────────');
  console.log('  ADMIN   : admin@cinesdelices.fr  / Admin1234!');
  console.log('  MEMBRE  : marie@cinesdelices.fr  / Member1234!');
  console.log('  MEMBRE  : remy@cinesdelices.fr   / Member1234!');
  console.log('────────────────────────────────────────────────');
  console.log('  Prisma Studio  : npx prisma studio');
  console.log('  Test API       : node tests/test-api.js\n');
}

main()
  .catch(e => { console.error('❌ Erreur seed :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

