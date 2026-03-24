import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { generateUniqueSlug } from '../src/utils/slug.js';


// adapter obligaoire avec Prisma V7
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('🌱 Démarrage du seed Ciné Délices v2...\n');
  
  //utilisation de "upsert" => crée si absent, ne touche pas si déjà présent

  // ── 1. Catégories ────────────────────────────────────────
  const [catEntree, catPlat, catDessert, catBoisson] = await Promise.all([
    prisma.category.upsert({ where: { nom: 'Entrée' },   update: {}, create: { nom: 'Entrée',   description: 'Amuse-bouches et entrées' } }),
    prisma.category.upsert({ where: { nom: 'Plat' },     update: {}, create: { nom: 'Plat',     description: 'Plats principaux' } }),
    prisma.category.upsert({ where: { nom: 'Dessert' },  update: {}, create: { nom: 'Dessert',  description: 'Douceurs sucrées' } }),
    prisma.category.upsert({ where: { nom: 'Boisson' },  update: {}, create: { nom: 'Boisson',  description: 'Boissons et cocktails' } }),
  ]);
  console.log('✅ Catégories :', [catEntree, catPlat, catDessert, catBoisson].map(c => c.nom).join(', '));

  // ── 2. Genres TMDB ───────────────────────────────────────
  const [genreDrame, genreComedy, genreAnimation, genreAction, genreThriller, genreFantasy] = await Promise.all([
    prisma.genre.upsert({ where: { tmdbGenreId: 18 }, update: {}, create: { nom: 'Drame',     tmdbGenreId: 18 } }),
    prisma.genre.upsert({ where: { tmdbGenreId: 35 }, update: {}, create: { nom: 'Comédie',   tmdbGenreId: 35 } }),
    prisma.genre.upsert({ where: { tmdbGenreId: 16 }, update: {}, create: { nom: 'Animation', tmdbGenreId: 16 } }),
    prisma.genre.upsert({ where: { tmdbGenreId: 28 }, update: {}, create: { nom: 'Action',    tmdbGenreId: 28 } }),
    prisma.genre.upsert({ where: { tmdbGenreId: 53 }, update: {}, create: { nom: 'Thriller',  tmdbGenreId: 53 } }),
    prisma.genre.upsert({ where: { tmdbGenreId: 14 }, update: {}, create: { nom: 'Fantasy',   tmdbGenreId: 14 } }),
  ]);
  console.log('✅ Genres :', [genreDrame, genreComedy, genreAnimation, genreAction, genreThriller, genreFantasy].map(g => g.nom).join(', '));

  // ── 3. Médias ─────────────────────────────────────────────
  // 10 médias variés pour couvrir les 40 recettes
  const mediaDefs = [
    { tmdbId: 2062,   titre: 'Ratatouille',       annee: 2007, type: 'MOVIE',  poster: 'https://image.tmdb.org/t/p/w500/npHNjldbeTHdKKw28bJKs7lzqzj.jpg', synopsis: 'Un rat doué pour la cuisine dans un restaurant parisien.',              genres: [genreAnimation.id, genreComedy.id]   },
    { tmdbId: 8467,   titre: 'Chocolat',           annee: 2000, type: 'MOVIE',  poster: 'https://image.tmdb.org/t/p/w500/7sbyD6e7Y4aNNuRxz2a0aUxBvGk.jpg', synopsis: 'Une femme ouvre une chocolaterie dans un village bourguignon.',        genres: [genreDrame.id]                       },
    { tmdbId: 1396,   titre: 'Breaking Bad',       annee: 2008, type: 'SERIES', poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', synopsis: 'Un prof de chimie reconverti dans la fabrication de drogue.',          genres: [genreDrame.id, genreThriller.id]     },
    { tmdbId: 24094,  titre: 'Julie & Julia',      annee: 2009, type: 'MOVIE',  poster: 'https://image.tmdb.org/t/p/w500/tUpvsj7yMHqR8byXBVnNXxHBWjA.jpg', synopsis: 'Une blogueuse cuisine toutes les recettes de Julia Child en un an.',  genres: [genreDrame.id, genreComedy.id]       },
    { tmdbId: 14290,  titre: 'Le Festin de Babette',annee: 1987, type: 'MOVIE', poster: 'https://image.tmdb.org/t/p/w500/zPHpT8PQOQ1kFHcXBN7nKpIeVay.jpg', synopsis: 'Une réfugiée française prépare un festin gastronomique au Danemark.', genres: [genreDrame.id]                       },
    { tmdbId: 37735,  titre: 'Soul Kitchen',       annee: 2009, type: 'MOVIE',  poster: 'https://image.tmdb.org/t/p/w500/3jGaYNkTRO3pxPHiOjvQM0L5iKX.jpg', synopsis: 'Un restaurateur hambourgeois lutte pour garder son établissement.',   genres: [genreComedy.id]                      },
    { tmdbId: 44217,  titre: 'The Bear',            annee: 2022, type: 'SERIES', poster: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg', synopsis: 'Un chef étoilé reprend le sandwich shop familial à Chicago.',        genres: [genreDrame.id]                       },
    { tmdbId: 680,    titre: 'Pulp Fiction',        annee: 1994, type: 'MOVIE',  poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', synopsis: 'Histoires entrelacées de criminels à Los Angeles.',                  genres: [genreDrame.id, genreThriller.id]     },
    { tmdbId: 120,    titre: 'Le Seigneur des Anneaux', annee: 2001, type: 'MOVIE', poster: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', synopsis: 'Un hobbit part en quête pour détruire l\'Anneau Unique.',         genres: [genreAction.id, genreFantasy.id]     },
    { tmdbId: 475557, titre: 'Joker',               annee: 2019, type: 'MOVIE',  poster: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', synopsis: 'La descente aux enfers d\'Arthur Fleck, futur Joker.',              genres: [genreDrame.id, genreThriller.id]     },
  ];

  const medias = {};
  for (const def of mediaDefs) {
    const slug = await generateUniqueSlug(`${def.titre} ${def.annee}`,
      (s) => prisma.media.findUnique({ where: { slug: s } }));
    medias[def.tmdbId] = await prisma.media.upsert({
      where:  { tmdbId: def.tmdbId },
      update: {},
      create: {
        tmdbId: def.tmdbId, titre: def.titre, slug, type: def.type,
        posterUrl: def.poster, synopsis: def.synopsis, annee: def.annee,
        genres: { create: def.genres.map(gId => ({ genreId: gId })) },
      },
    });
  }
  console.log(`✅ ${Object.keys(medias).length} médias créés`);

  // ── 4. Utilisateurs ──────────────────────────────────────
  const adminHash  = await argon2.hash('Admin1234!');
  const memberHash = await argon2.hash('Member1234!');

  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@cinesdelices.fr' }, update: {},
    create: { email: 'admin@cinesdelices.fr', nom: 'Delices', pseudo: 'Admin', passwordHash: adminHash, role: 'ADMIN' },
  });
  const userMarie = await prisma.user.upsert({
    where: { email: 'marie@cinesdelices.fr' }, update: {},
    create: { email: 'marie@cinesdelices.fr', nom: 'Dubois', pseudo: 'Marie', passwordHash: memberHash },
  });
  const userRemy = await prisma.user.upsert({
    where: { email: 'remy@cinesdelices.fr' }, update: {},
    create: { email: 'remy@cinesdelices.fr', nom: 'Martin', pseudo: 'ReMyChef', passwordHash: memberHash },
  });
  console.log('✅ Users :', [userAdmin, userMarie, userRemy].map(u => u.email).join(', '));

  // ── 5. Ingrédients ───────────────────────────────────────
  const nomsIngredients = [
    'courgette', 'aubergine', 'tomate', 'oignon', 'poivron rouge', 'poivron vert',
    'huile d\'olive', 'herbes de provence', 'sel', 'poivre', 'ail',
    'lait entier', 'chocolat noir 70%', 'cannelle', 'piment de cayenne', 'sucre',
    'bœuf (paleron)', 'vin rouge', 'lardons', 'champignon', 'carotte', 'farine',
    'beurre', 'crème fraîche', 'œuf', 'fromage râpé', 'mozzarella',
    'basilic', 'thym', 'laurier', 'persil', 'ciboulette',
    'poulet', 'saumon', 'crevettes', 'moules', 'pâtes', 'riz',
    'pomme de terre', 'citron', 'orange', 'pomme', 'fraise', 'framboises',
    'levure chimique', 'extrait de vanille', 'miel', 'vinaigre balsamique',
    'sauce soja', 'gingembre', 'cumin', 'paprika', 'curry',
    'jambon', 'anchois', 'câpres', 'olives noires',
    'bouillon de poulet', 'bouillon de légumes', 'concentré de tomates',
    'amandes', 'noix', 'noisettes', 'raisins secs', 'chapelure', 'semoule',
    'rhum', 'whisky', 'vin blanc', 'champagne',
    'sirop de grenadine', 'jus de citron', 'eau gazeuse', 'thé', 'café',
    'lentilles', 'pois chiches','mangue',
  ];

  const allIngredients = await Promise.all(
    nomsIngredients.map(nom =>
      prisma.ingredient.upsert({
        where:  { nom: nom.trim().toLowerCase() },
        update: {},
        create: { nom: nom.trim().toLowerCase() },
      })
    )
  );
  console.log(`✅ ${allIngredients.length} ingrédients créés`);

  // Helper — lance une erreur claire si l'ingrédient est introuvable
  const ing = (nom) => {
    const found = allIngredients.find(i => i.nom === nom.trim().toLowerCase());
    if (!found) throw new Error(`Ingrédient introuvable : "${nom}"`);
    return found;
  };

  // Helper — crée une recette seulement si elle n'existe pas encore (idempotent)
  const createRecipe = async (data) => {
    const existing = await prisma.recipe.findFirst({ where: { titre: data.titre } });
    if (existing) { console.log(`  ⏭️  ${data.titre} (déjà présente)`); return existing; }
    const slug = await generateUniqueSlug(data.titre,
      (s) => prisma.recipe.findUnique({ where: { slug: s } }));
    const created = await prisma.recipe.create({ data: { ...data, slug } });
    console.log(`  ✅ ${data.titre} (${slug})`);
    return created;
  };

  // ════════════════════════════════════════════════════════
  // ENTRÉES — 10 recettes
  // ════════════════════════════════════════════════════════
  console.log('\n📋 Entrées...');

  await createRecipe({
    titre: 'Bruschetta façon Ratatouille',
    imageURL: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=600',
    instructions: '1. Griller des tranches de pain au four à 200°C (5 min).\n2. Frotter chaque tranche avec une gousse d\'ail.\n3. Déposer des dés de tomates, aubergine et basilic frais.\n4. Arroser d\'huile d\'olive et assaisonner.',
    nombrePersonnes: 4, tempsPreparation: 15, tempsCuisson: 5,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catEntree.id, mediaId: medias[2062].id,
    ingredients: { create: [
      { ingredientId: ing('tomate').id,         quantity: '3',  unit: 'pièces'  },
      { ingredientId: ing('aubergine').id,      quantity: '1',  unit: 'pièce'   },
      { ingredientId: ing('ail').id,            quantity: '2',  unit: 'gousses' },
      { ingredientId: ing('basilic').id,        quantity: '1',  unit: 'poignée' },
      { ingredientId: ing('huile d\'olive').id, quantity: '3',  unit: 'c.à.s'  },
      { ingredientId: ing('sel').id,            quantity: null, unit: null      },
    ]},
  });

  await createRecipe({
    titre: 'Gaspacho de Breaking Bad',
    imageURL: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600',
    instructions: '1. Mixer tomates, poivron rouge, oignon, ail et concombre.\n2. Ajouter huile d\'olive, vinaigre balsamique, sel.\n3. Réfrigérer 2h minimum.\n4. Servir bien frais avec des croûtons grillés.',
    nombrePersonnes: 4, tempsPreparation: 15, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catEntree.id, mediaId: medias[1396].id,
    ingredients: { create: [
      { ingredientId: ing('tomate').id,              quantity: '6',  unit: 'pièces' },
      { ingredientId: ing('poivron rouge').id,       quantity: '1',  unit: 'pièce'  },
      { ingredientId: ing('oignon').id,              quantity: '1',  unit: 'pièce'  },
      { ingredientId: ing('ail').id,                 quantity: '1',  unit: 'gousse' },
      { ingredientId: ing('vinaigre balsamique').id, quantity: '2',  unit: 'c.à.s'  },
      { ingredientId: ing('huile d\'olive').id,      quantity: '4',  unit: 'c.à.s'  },
    ]},
  });

  await createRecipe({
    titre: 'Velouté de champignons de The Bear',
    imageURL: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600',
    instructions: '1. Faire revenir champignons et oignon dans le beurre (10 min).\n2. Ajouter bouillon de légumes et cuire 20 min.\n3. Mixer finement jusqu\'à texture soyeuse.\n4. Incorporer la crème fraîche, assaisonner et servir.',
    nombrePersonnes: 4, tempsPreparation: 10, tempsCuisson: 30,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catEntree.id, mediaId: medias[44217].id,
    ingredients: { create: [
      { ingredientId: ing('champignon').id,          quantity: '500', unit: 'g'    },
      { ingredientId: ing('oignon').id,              quantity: '1',   unit: 'pièce'},
      { ingredientId: ing('beurre').id,              quantity: '30',  unit: 'g'    },
      { ingredientId: ing('crème fraîche').id,       quantity: '20',  unit: 'cl'   },
      { ingredientId: ing('bouillon de légumes').id, quantity: '50',  unit: 'cl'   },
    ]},
  });

  await createRecipe({
    titre: 'Salade César de Julie Child',
    imageURL: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600',
    instructions: '1. Préparer la sauce : mixer anchois, ail, citron, fromage râpé, huile.\n2. Griller les croûtons au beurre jusqu\'à dorure.\n3. Couper la laitue romaine en morceaux et assaisonner.\n4. Garnir de croûtons, fromage râpé et servir.',
    nombrePersonnes: 4, tempsPreparation: 20, tempsCuisson: 5,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catEntree.id, mediaId: medias[24094].id,
    ingredients: { create: [
      { ingredientId: ing('anchois').id,      quantity: '4',  unit: 'filets' },
      { ingredientId: ing('ail').id,          quantity: '1',  unit: 'gousse' },
      { ingredientId: ing('citron').id,       quantity: '1',  unit: 'pièce'  },
      { ingredientId: ing('fromage râpé').id, quantity: '60', unit: 'g'      },
      { ingredientId: ing('beurre').id,       quantity: '30', unit: 'g'      },
      { ingredientId: ing('huile d\'olive').id, quantity: '5', unit: 'c.à.s' },
    ]},
  });

  await createRecipe({
    titre: 'Tartare de saumon du Festin de Babette',
    imageURL: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
    instructions: '1. Couper le saumon très frais en petits dés réguliers.\n2. Assaisonner avec jus de citron, câpres et ciboulette ciselée.\n3. Ajouter une cuillère d\'huile d\'olive, sel, poivre.\n4. Dresser dans un emporte-pièce et servir immédiatement.',
    nombrePersonnes: 4, tempsPreparation: 20, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catEntree.id, mediaId: medias[14290].id,
    ingredients: { create: [
      { ingredientId: ing('saumon').id,         quantity: '400', unit: 'g'     },
      { ingredientId: ing('citron').id,         quantity: '1',   unit: 'pièce' },
      { ingredientId: ing('câpres').id,         quantity: '2',   unit: 'c.à.s' },
      { ingredientId: ing('ciboulette').id,     quantity: '1',   unit: 'botte' },
      { ingredientId: ing('huile d\'olive').id, quantity: '2',   unit: 'c.à.s' },
    ]},
  });

  await createRecipe({
    titre: 'Soupe à l\'oignon de Soul Kitchen',
    imageURL: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600',
    instructions: '1. Émincer les oignons et les caraméliser 30 min à feu doux dans le beurre.\n2. Déglacer au vin blanc et laisser évaporer.\n3. Ajouter le bouillon et mijoter 15 min.\n4. Verser en cocotte sur des croûtons, recouvrir de fromage râpé et gratiner 5 min.',
    nombrePersonnes: 4, tempsPreparation: 10, tempsCuisson: 50,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catEntree.id, mediaId: medias[37735].id,
    ingredients: { create: [
      { ingredientId: ing('oignon').id,              quantity: '6',  unit: 'pièces' },
      { ingredientId: ing('beurre').id,              quantity: '50', unit: 'g'      },
      { ingredientId: ing('vin blanc').id,           quantity: '15', unit: 'cl'     },
      { ingredientId: ing('bouillon de légumes').id, quantity: '1',  unit: 'litre'  },
      { ingredientId: ing('fromage râpé').id,        quantity: '100',unit: 'g'      },
    ]},
  });

  await createRecipe({
    titre: 'Ceviche de crevettes de Pulp Fiction',
    imageURL: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600',
    instructions: '1. Décortiquer les crevettes et les couper en morceaux.\n2. Faire mariner dans le jus de citron vert 20 min — elles "cuisent" à l\'acide.\n3. Ajouter oignon rouge émincé, tomate, piment et coriandre.\n4. Assaisonner et servir immédiatement avec des chips.',
    nombrePersonnes: 4, tempsPreparation: 30, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catEntree.id, mediaId: medias[680].id,
    ingredients: { create: [
      { ingredientId: ing('crevettes').id,         quantity: '400', unit: 'g'     },
      { ingredientId: ing('citron').id,            quantity: '4',   unit: 'pièces'},
      { ingredientId: ing('oignon').id,            quantity: '1',   unit: 'pièce' },
      { ingredientId: ing('tomate').id,            quantity: '2',   unit: 'pièces'},
      { ingredientId: ing('piment de cayenne').id, quantity: '1',   unit: 'pincée'},
    ]},
  });

  await createRecipe({
    titre: 'Gougères au fromage du Hobbit',
    imageURL: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a318?w=600',
    instructions: '1. Porter à ébullition eau, beurre et sel.\n2. Hors du feu, incorporer la farine d\'un coup et dessécher 2 min.\n3. Ajouter les œufs un par un puis le fromage râpé.\n4. Dresser des petites boules sur plaque et cuire 20 min à 180°C.',
    nombrePersonnes: 6, tempsPreparation: 20, tempsCuisson: 20,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catEntree.id, mediaId: medias[120].id,
    ingredients: { create: [
      { ingredientId: ing('farine').id,       quantity: '125', unit: 'g'      },
      { ingredientId: ing('beurre').id,       quantity: '80',  unit: 'g'      },
      { ingredientId: ing('œuf').id,          quantity: '3',   unit: 'pièces' },
      { ingredientId: ing('fromage râpé').id, quantity: '100', unit: 'g'      },
      { ingredientId: ing('sel').id,          quantity: null,  unit: null     },
    ]},
  });

  await createRecipe({
    titre: 'Rillettes de saumon du Bear',
    imageURL: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600',
    instructions: '1. Pocher le saumon 10 min dans de l\'eau frémissante salée.\n2. Effeuiller et mélanger avec crème fraîche, citron et câpres.\n3. Assaisonner généreusement et réfrigérer 1h.\n4. Servir sur des toasts grillés avec de la ciboulette.',
    nombrePersonnes: 4, tempsPreparation: 15, tempsCuisson: 10,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catEntree.id, mediaId: medias[44217].id,
    ingredients: { create: [
      { ingredientId: ing('saumon').id,         quantity: '300', unit: 'g'    },
      { ingredientId: ing('crème fraîche').id,  quantity: '10',  unit: 'cl'   },
      { ingredientId: ing('citron').id,         quantity: '1',   unit: 'pièce'},
      { ingredientId: ing('câpres').id,         quantity: '1',   unit: 'c.à.s'},
      { ingredientId: ing('ciboulette').id,     quantity: '1',   unit: 'botte'},
    ]},
  });

  await createRecipe({
    titre: 'Tartines chèvre-miel du Joker',
    imageURL: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
    instructions: '1. Griller les tranches de pain de campagne.\n2. Écraser le fromage de chèvre frais et le répartir.\n3. Arroser de miel et parsemer de noix concassées et de thym.\n4. Passer 3 min sous le gril du four jusqu\'à légère dorure.',
    nombrePersonnes: 4, tempsPreparation: 10, tempsCuisson: 5,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catEntree.id, mediaId: medias[475557].id,
    ingredients: { create: [
      { ingredientId: ing('miel').id,   quantity: '3',  unit: 'c.à.s'  },
      { ingredientId: ing('noix').id,   quantity: '50', unit: 'g'      },
      { ingredientId: ing('thym').id,   quantity: '1',  unit: 'branche'},
      { ingredientId: ing('fromage râpé').id, quantity: '150', unit: 'g'},
      { ingredientId: ing('sel').id,    quantity: null, unit: null     },
    ]},
  });

  console.log('✅ 10 entrées créées\n');

  // ════════════════════════════════════════════════════════
  // PLATS — 10 recettes
  // ════════════════════════════════════════════════════════
  console.log('🍽️  Plats...');

  await createRecipe({
    titre: 'Ratatouille de Rémy',
    imageURL: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=600',
    instructions: '1. Préchauffer le four à 180°C.\n2. Couper courgette, aubergine, tomates et poivron en rondelles fines (3mm).\n3. Faire revenir l\'oignon dans l\'huile, ajouter les tomates en dés, sel, poivre — mijoter 15 min et mixer.\n4. Étaler la sauce en fond de plat à gratin.\n5. Disposer les rondelles en rosace en alternant les légumes.\n6. Arroser d\'huile, saupoudrer d\'herbes, couvrir de papier sulfurisé.\n7. Cuire 40 min puis 10 min à découvert pour dorer.',
    nombrePersonnes: 4, tempsPreparation: 20, tempsCuisson: 50,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catPlat.id, mediaId: medias[2062].id,
    ingredients: { create: [
      { ingredientId: ing('courgette').id,          quantity: '2',  unit: 'pièces' },
      { ingredientId: ing('aubergine').id,          quantity: '1',  unit: 'pièce'  },
      { ingredientId: ing('tomate').id,             quantity: '5',  unit: 'pièces' },
      { ingredientId: ing('poivron rouge').id,      quantity: '1',  unit: 'pièce'  },
      { ingredientId: ing('oignon').id,             quantity: '1',  unit: 'pièce'  },
      { ingredientId: ing('huile d\'olive').id,     quantity: '4',  unit: 'c.à.s'  },
      { ingredientId: ing('herbes de provence').id, quantity: '1',  unit: 'c.à.c'  },
      { ingredientId: ing('sel').id,                quantity: null, unit: null     },
      { ingredientId: ing('poivre').id,             quantity: null, unit: null     },
    ]},
  });

  await createRecipe({
    titre: 'Bœuf bourguignon de Julia Child',
    imageURL: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600',
    instructions: '1. Couper le bœuf en morceaux et les faire dorer par fournées dans une cocotte.\n2. Faire revenir lardons, oignons et carottes dans la même cocotte.\n3. Remettre la viande, saupoudrer de farine, verser le vin rouge et le bouillon.\n4. Ajouter thym et laurier, couvrir et cuire 2h30 à 160°C.\n5. Ajouter les champignons sautés 30 min avant la fin.',
    nombrePersonnes: 6, tempsPreparation: 30, tempsCuisson: 150,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catPlat.id, mediaId: medias[24094].id,
    ingredients: { create: [
      { ingredientId: ing('bœuf (paleron)').id,      quantity: '1.5', unit: 'kg'    },
      { ingredientId: ing('vin rouge').id,           quantity: '75',  unit: 'cl'    },
      { ingredientId: ing('lardons').id,             quantity: '200', unit: 'g'     },
      { ingredientId: ing('carotte').id,             quantity: '3',   unit: 'pièces'},
      { ingredientId: ing('champignon').id,          quantity: '300', unit: 'g'     },
      { ingredientId: ing('bouillon de légumes').id, quantity: '30',  unit: 'cl'    },
      { ingredientId: ing('farine').id,              quantity: '2',   unit: 'c.à.s' },
    ]},
  });

  await createRecipe({
    titre: 'Poulet rôti du Festin de Babette',
    imageURL: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600',
    instructions: '1. Sortir le poulet 30 min à température ambiante.\n2. Badigeonner de beurre mou mélangé à thym et ail haché.\n3. Saler, poivrer intérieur et extérieur, farcir avec thym et laurier.\n4. Rôtir 1h20 à 200°C en arrosant toutes les 20 min.\n5. Laisser reposer 15 min sous alu avant de découper.',
    nombrePersonnes: 4, tempsPreparation: 20, tempsCuisson: 80,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catPlat.id, mediaId: medias[14290].id,
    ingredients: { create: [
      { ingredientId: ing('poulet').id,  quantity: '1.5', unit: 'kg'      },
      { ingredientId: ing('beurre').id,  quantity: '80',  unit: 'g'       },
      { ingredientId: ing('ail').id,     quantity: '4',   unit: 'gousses' },
      { ingredientId: ing('thym').id,    quantity: '4',   unit: 'branches'},
      { ingredientId: ing('laurier').id, quantity: '2',   unit: 'feuilles'},
      { ingredientId: ing('sel').id,     quantity: null,  unit: null      },
    ]},
  });

  await createRecipe({
    titre: 'Pasta al Forno de Soul Kitchen',
    imageURL: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e4?w=600',
    instructions: '1. Cuire les pâtes al dente et égoutter.\n2. Faire revenir les lardons, ajouter concentré de tomates et basilic.\n3. Mélanger pâtes et sauce, transférer dans un plat à gratin.\n4. Couvrir de mozzarella tranchée et gratiner 20 min à 180°C.',
    nombrePersonnes: 4, tempsPreparation: 15, tempsCuisson: 35,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catPlat.id, mediaId: medias[37735].id,
    ingredients: { create: [
      { ingredientId: ing('pâtes').id,                quantity: '400', unit: 'g'      },
      { ingredientId: ing('lardons').id,              quantity: '150', unit: 'g'      },
      { ingredientId: ing('concentré de tomates').id, quantity: '3',   unit: 'c.à.s'  },
      { ingredientId: ing('mozzarella').id,           quantity: '250', unit: 'g'      },
      { ingredientId: ing('basilic').id,              quantity: '1',   unit: 'poignée'},
    ]},
  });

  await createRecipe({
    titre: 'Risotto parmesan de The Bear',
    imageURL: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600',
    instructions: '1. Faire revenir l\'oignon haché dans le beurre à feu doux.\n2. Ajouter le riz à risotto et nacrer 2 min.\n3. Verser le vin blanc et laisser absorber.\n4. Incorporer le bouillon chaud louche par louche en remuant constamment (18-20 min).\n5. Hors du feu, mantecare avec beurre froid et fromage râpé. Poivrer.',
    nombrePersonnes: 4, tempsPreparation: 10, tempsCuisson: 25,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catPlat.id, mediaId: medias[44217].id,
    ingredients: { create: [
      { ingredientId: ing('riz').id,                 quantity: '320', unit: 'g'     },
      { ingredientId: ing('oignon').id,              quantity: '1',   unit: 'pièce' },
      { ingredientId: ing('beurre').id,              quantity: '80',  unit: 'g'     },
      { ingredientId: ing('vin blanc').id,           quantity: '10',  unit: 'cl'    },
      { ingredientId: ing('bouillon de légumes').id, quantity: '1.2', unit: 'litre' },
      { ingredientId: ing('fromage râpé').id,        quantity: '80',  unit: 'g'     },
    ]},
  });

  await createRecipe({
    titre: 'Burger Royale de Pulp Fiction',
    imageURL: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    instructions: '1. Former 4 steaks avec la viande hachée, saler et poivrer.\n2. Griller 3 min de chaque côté sur plancha très chaude.\n3. Toaster les pains au beurre dans la même plancha.\n4. Monter : pain, salade, steak, fromage fondu, tomate, oignon et sauce au choix.',
    nombrePersonnes: 4, tempsPreparation: 15, tempsCuisson: 10,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catPlat.id, mediaId: medias[680].id,
    ingredients: { create: [
      { ingredientId: ing('bœuf (paleron)').id, quantity: '600', unit: 'g'     },
      { ingredientId: ing('tomate').id,         quantity: '2',   unit: 'pièces'},
      { ingredientId: ing('fromage râpé').id,   quantity: '100', unit: 'g'     },
      { ingredientId: ing('oignon').id,         quantity: '1',   unit: 'pièce' },
      { ingredientId: ing('beurre').id,         quantity: '30',  unit: 'g'     },
      { ingredientId: ing('sel').id,            quantity: null,  unit: null    },
    ]},
  });

  await createRecipe({
    titre: 'Ragoût du Comté de Hobbiton',
    imageURL: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600',
    instructions: '1. Faire dorer les morceaux de bœuf en cocotte, réserver.\n2. Faire revenir oignon, ail et carottes 5 min.\n3. Remettre la viande, ajouter pommes de terre, thym, laurier et bouillon.\n4. Mijoter 2h à feu très doux jusqu\'à ce que la viande soit fondante.',
    nombrePersonnes: 6, tempsPreparation: 25, tempsCuisson: 120,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catPlat.id, mediaId: medias[120].id,
    ingredients: { create: [
      { ingredientId: ing('bœuf (paleron)').id,      quantity: '1',   unit: 'kg'      },
      { ingredientId: ing('pomme de terre').id,      quantity: '4',   unit: 'pièces'  },
      { ingredientId: ing('carotte').id,             quantity: '3',   unit: 'pièces'  },
      { ingredientId: ing('oignon').id,              quantity: '2',   unit: 'pièces'  },
      { ingredientId: ing('bouillon de légumes').id, quantity: '50',  unit: 'cl'      },
      { ingredientId: ing('thym').id,                quantity: '2',   unit: 'branches'},
      { ingredientId: ing('laurier').id,             quantity: '2',   unit: 'feuilles'},
    ]},
  });

  await createRecipe({
    titre: 'Saumon en papillote du Festin',
    imageURL: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
    instructions: '1. Déposer le filet de saumon sur une feuille d\'alu.\n2. Assaisonner avec citron, herbes de Provence, sel et poivre.\n3. Fermer hermétiquement la papillote.\n4. Cuire 20 min au four à 180°C — la vapeur garde tout le moelleux.',
    nombrePersonnes: 4, tempsPreparation: 10, tempsCuisson: 20,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catPlat.id, mediaId: medias[14290].id,
    ingredients: { create: [
      { ingredientId: ing('saumon').id,             quantity: '600', unit: 'g'    },
      { ingredientId: ing('citron').id,             quantity: '2',   unit: 'pièces'},
      { ingredientId: ing('herbes de provence').id, quantity: '1',   unit: 'c.à.c'},
      { ingredientId: ing('huile d\'olive').id,     quantity: '2',   unit: 'c.à.s'},
      { ingredientId: ing('sel').id,                quantity: null,  unit: null  },
    ]},
  });

  await createRecipe({
    titre: 'Tacos au poulet épicé de Breaking Bad',
    imageURL: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
    instructions: '1. Mariner le poulet 1h avec citron, cumin, paprika, ail et huile.\n2. Griller 6-7 min de chaque côté sur plancha chaude.\n3. Laisser reposer 5 min puis trancher en lamelles.\n4. Garnir les tortillas avec poulet, tomate, crème fraîche et coriandre.',
    nombrePersonnes: 4, tempsPreparation: 20, tempsCuisson: 15,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catPlat.id, mediaId: medias[1396].id,
    ingredients: { create: [
      { ingredientId: ing('poulet').id,         quantity: '600', unit: 'g'     },
      { ingredientId: ing('citron').id,         quantity: '2',   unit: 'pièces'},
      { ingredientId: ing('cumin').id,          quantity: '1',   unit: 'c.à.c' },
      { ingredientId: ing('paprika').id,        quantity: '1',   unit: 'c.à.c' },
      { ingredientId: ing('crème fraîche').id,  quantity: '10',  unit: 'cl'    },
      { ingredientId: ing('tomate').id,         quantity: '2',   unit: 'pièces'},
    ]},
  });

  await createRecipe({
    titre: 'Moules marinières du Joker',
    imageURL: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600',
    instructions: '1. Gratter et laver soigneusement les moules.\n2. Faire revenir échalote et ail dans le beurre 2 min.\n3. Verser le vin blanc, ajouter les moules, couvrir.\n4. Cuire à feu vif 5 min en secouant la casserole.\n5. Jeter les moules fermées et parsemer de persil ciselé.',
    nombrePersonnes: 4, tempsPreparation: 15, tempsCuisson: 10,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catPlat.id, mediaId: medias[475557].id,
    ingredients: { create: [
      { ingredientId: ing('moules').id,    quantity: '2',  unit: 'kg'     },
      { ingredientId: ing('vin blanc').id, quantity: '20', unit: 'cl'     },
      { ingredientId: ing('ail').id,       quantity: '3',  unit: 'gousses'},
      { ingredientId: ing('oignon').id,    quantity: '2',  unit: 'pièces' },
      { ingredientId: ing('beurre').id,    quantity: '40', unit: 'g'      },
      { ingredientId: ing('persil').id,    quantity: '1',  unit: 'botte'  },
    ]},
  });

  console.log('✅ 10 plats créés\n');

  // ════════════════════════════════════════════════════════
  // DESSERTS — 10 recettes
  // ════════════════════════════════════════════════════════
  console.log('🍰 Desserts...');

  await createRecipe({
    titre: 'Crème brûlée de Babette',
    imageURL: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600',
    instructions: '1. Fouetter 5 jaunes d\'œufs avec 80g de sucre jusqu\'au ruban.\n2. Chauffer la crème avec la vanille et verser doucement sur les œufs.\n3. Filtrer et répartir dans des ramequins.\n4. Cuire au bain-marie 45 min à 150°C.\n5. Réfrigérer 3h minimum, saupoudrer de sucre et caraméliser au chalumeau.',
    nombrePersonnes: 4, tempsPreparation: 20, tempsCuisson: 45,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catDessert.id, mediaId: medias[14290].id,
    ingredients: { create: [
      { ingredientId: ing('crème fraîche').id,      quantity: '50',  unit: 'cl'     },
      { ingredientId: ing('œuf').id,                quantity: '5',   unit: 'jaunes' },
      { ingredientId: ing('sucre').id,              quantity: '120', unit: 'g'      },
      { ingredientId: ing('extrait de vanille').id, quantity: '1',   unit: 'gousse' },
    ]},
  });

  await createRecipe({
    titre: 'Mousse au chocolat de Ratatouille',
    imageURL: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600',
    instructions: '1. Faire fondre le chocolat au bain-marie avec le beurre, laisser tiédir.\n2. Incorporer les jaunes d\'œufs un par un.\n3. Monter les blancs en neige très ferme avec une pincée de sel.\n4. Incorporer 1/3 des blancs énergiquement puis le reste délicatement.\n5. Réfrigérer minimum 2h avant de servir.',
    nombrePersonnes: 6, tempsPreparation: 25, tempsCuisson: 10,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catDessert.id, mediaId: medias[2062].id,
    ingredients: { create: [
      { ingredientId: ing('chocolat noir 70%').id, quantity: '200', unit: 'g'     },
      { ingredientId: ing('beurre').id,            quantity: '40',  unit: 'g'     },
      { ingredientId: ing('œuf').id,               quantity: '6',   unit: 'pièces'},
      { ingredientId: ing('sucre').id,             quantity: '30',  unit: 'g'     },
      { ingredientId: ing('sel').id,               quantity: null,  unit: null    },
    ]},
  });

  await createRecipe({
    titre: 'Tarte aux pommes normande de Julie Child',
    imageURL: 'https://images.unsplash.com/photo-1562007908-17c67e878c88?w=600',
    instructions: '1. Préparer la pâte brisée : sabler farine et beurre, ajouter œuf et eau froide.\n2. Foncer un moule à tarte, piquer le fond et précuire 10 min à blanc.\n3. Peler et émincer les pommes en fines lamelles.\n4. Les disposer en rosace, saupoudrer de sucre et cannelle.\n5. Cuire 35 min à 180°C jusqu\'à belle dorure.',
    nombrePersonnes: 6, tempsPreparation: 30, tempsCuisson: 45,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catDessert.id, mediaId: medias[24094].id,
    ingredients: { create: [
      { ingredientId: ing('pomme').id,   quantity: '6',   unit: 'pièces'},
      { ingredientId: ing('farine').id,  quantity: '250', unit: 'g'     },
      { ingredientId: ing('beurre').id,  quantity: '125', unit: 'g'     },
      { ingredientId: ing('sucre').id,   quantity: '80',  unit: 'g'     },
      { ingredientId: ing('cannelle').id,quantity: '1',   unit: 'c.à.c' },
      { ingredientId: ing('œuf').id,     quantity: '1',   unit: 'pièce' },
    ]},
  });

  await createRecipe({
    titre: 'Fondant au chocolat coulant de Breaking Bad',
    imageURL: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600',
    instructions: '1. Faire fondre chocolat et beurre au bain-marie.\n2. Fouetter œufs et sucre jusqu\'au ruban.\n3. Incorporer la préparation chocolatée puis la farine tamisée.\n4. Beurrer et fariner des moules individuels, verser la pâte.\n5. Cuire exactement 10-12 min à 200°C — le cœur doit rester coulant.',
    nombrePersonnes: 6, tempsPreparation: 15, tempsCuisson: 12,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catDessert.id, mediaId: medias[1396].id,
    ingredients: { create: [
      { ingredientId: ing('chocolat noir 70%').id, quantity: '200', unit: 'g'     },
      { ingredientId: ing('beurre').id,            quantity: '150', unit: 'g'     },
      { ingredientId: ing('sucre').id,             quantity: '150', unit: 'g'     },
      { ingredientId: ing('farine').id,            quantity: '60',  unit: 'g'     },
      { ingredientId: ing('œuf').id,               quantity: '4',   unit: 'pièces'},
    ]},
  });

  await createRecipe({
    titre: 'Profiteroles de Soul Kitchen',
    imageURL: 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=600',
    instructions: '1. Préparer la pâte à choux : bouillir eau, beurre, sel, incorporer farine, dessécher, ajouter les œufs.\n2. Dresser des petites boules à la poche, cuire 20 min à 180°C.\n3. Préparer une ganache : verser crème chaude sur le chocolat, émulsionner.\n4. Garnir les choux de glace vanille et napper de ganache chaude.',
    nombrePersonnes: 6, tempsPreparation: 30, tempsCuisson: 20,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catDessert.id, mediaId: medias[37735].id,
    ingredients: { create: [
      { ingredientId: ing('farine').id,            quantity: '125', unit: 'g'     },
      { ingredientId: ing('beurre').id,            quantity: '100', unit: 'g'     },
      { ingredientId: ing('œuf').id,               quantity: '4',   unit: 'pièces'},
      { ingredientId: ing('chocolat noir 70%').id, quantity: '150', unit: 'g'     },
      { ingredientId: ing('crème fraîche').id,     quantity: '15',  unit: 'cl'    },
    ]},
  });

  await createRecipe({
    titre: 'Tiramisu du Bear',
    imageURL: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
    instructions: '1. Séparer les œufs. Fouetter jaunes et sucre jusqu\'au ruban.\n2. Incorporer le mascarpone en 3 fois, puis les blancs montés en neige.\n3. Tremper rapidement les biscuits dans le café froid.\n4. Alterner couches de crème et biscuits (2 fois).\n5. Réfrigérer 6h minimum. Saupoudrer de cacao avant de servir.',
    nombrePersonnes: 8, tempsPreparation: 30, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catDessert.id, mediaId: medias[44217].id,
    ingredients: { create: [
      { ingredientId: ing('crème fraîche').id,     quantity: '500', unit: 'g'     },
      { ingredientId: ing('œuf').id,               quantity: '4',   unit: 'pièces'},
      { ingredientId: ing('sucre').id,             quantity: '100', unit: 'g'     },
      { ingredientId: ing('café').id,              quantity: '30',  unit: 'cl'    },
      { ingredientId: ing('chocolat noir 70%').id, quantity: '30',  unit: 'g (cacao poudre)'},
    ]},
  });

  await createRecipe({
    titre: 'Banoffee Pie de Pulp Fiction',
    imageURL: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
    instructions: '1. Écraser les biscuits et mélanger avec le beurre fondu, tasser dans un moule.\n2. Faire un caramel avec sucre et beurre, incorporer la crème — laisser épaissir.\n3. Verser le caramel sur la base biscuitée, réfrigérer 30 min.\n4. Disposer les tranches de banane.\n5. Recouvrir de chantilly et râper du chocolat noir dessus.',
    nombrePersonnes: 8, tempsPreparation: 25, tempsCuisson: 10,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catDessert.id, mediaId: medias[680].id,
    ingredients: { create: [
      { ingredientId: ing('pomme').id,             quantity: '3',   unit: 'bananes'},
      { ingredientId: ing('crème fraîche').id,     quantity: '30',  unit: 'cl'     },
      { ingredientId: ing('beurre').id,            quantity: '100', unit: 'g'      },
      { ingredientId: ing('sucre').id,             quantity: '150', unit: 'g'      },
      { ingredientId: ing('chocolat noir 70%').id, quantity: '50',  unit: 'g'      },
    ]},
  });

  await createRecipe({
    titre: 'Lembas du Comté (shortbread aux amandes)',
    imageURL: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600',
    instructions: '1. Mélanger farine, sucre glace et amandes en poudre.\n2. Incorporer le beurre froid en morceaux et sabler.\n3. Ajouter miel et extrait de vanille, former une boule.\n4. Étaler à 1cm, couper en carrés et marquer une croix.\n5. Cuire 18-20 min à 175°C — dorés mais pas trop cuits.',
    nombrePersonnes: 12, tempsPreparation: 20, tempsCuisson: 20,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catDessert.id, mediaId: medias[120].id,
    ingredients: { create: [
      { ingredientId: ing('farine').id,             quantity: '250', unit: 'g'    },
      { ingredientId: ing('beurre').id,             quantity: '150', unit: 'g'    },
      { ingredientId: ing('sucre').id,              quantity: '80',  unit: 'g'    },
      { ingredientId: ing('amandes').id,            quantity: '100', unit: 'g'    },
      { ingredientId: ing('miel').id,               quantity: '2',   unit: 'c.à.s'},
      { ingredientId: ing('extrait de vanille').id, quantity: '1',   unit: 'c.à.c'},
    ]},
  });

  await createRecipe({
    titre: 'Panna cotta chocolat du Joker',
    imageURL: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
    instructions: '1. Faire tremper la gélatine dans l\'eau froide.\n2. Chauffer crème, lait, sucre et chocolat en morceaux — remuer jusqu\'à fonte.\n3. Hors du feu, incorporer la gélatine essorée.\n4. Verser dans des ramequins et réfrigérer minimum 4h.\n5. Démouler sur assiette et décorer d\'un coulis de framboise.',
    nombrePersonnes: 4, tempsPreparation: 15, tempsCuisson: 10,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catDessert.id, mediaId: medias[475557].id,
    ingredients: { create: [
      { ingredientId: ing('crème fraîche').id,     quantity: '40',  unit: 'cl'},
      { ingredientId: ing('lait entier').id,       quantity: '10',  unit: 'cl'},
      { ingredientId: ing('chocolat noir 70%').id, quantity: '120', unit: 'g' },
      { ingredientId: ing('sucre').id,             quantity: '50',  unit: 'g' },
      { ingredientId: ing('framboises').id,        quantity: '100', unit: 'g' },
    ]},
  });

  await createRecipe({
    titre: 'Madeleines au citron de Julie Child',
    imageURL: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    instructions: '1. Fouetter œufs et sucre 5 min jusqu\'au ruban.\n2. Incorporer farine, levure, zeste de citron et beurre fondu.\n3. Laisser reposer la pâte 1h au réfrigérateur — c\'est le secret de la bosse.\n4. Beurrer les moules à madeleines, remplir aux 3/4.\n5. Cuire 12 min à 200°C — sortir dès que les bords sont dorés.',
    nombrePersonnes: 12, tempsPreparation: 20, tempsCuisson: 12,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catDessert.id, mediaId: medias[24094].id,
    ingredients: { create: [
      { ingredientId: ing('farine').id,           quantity: '200', unit: 'g'     },
      { ingredientId: ing('beurre').id,           quantity: '150', unit: 'g'     },
      { ingredientId: ing('sucre').id,            quantity: '150', unit: 'g'     },
      { ingredientId: ing('œuf').id,              quantity: '3',   unit: 'pièces'},
      { ingredientId: ing('levure chimique').id,  quantity: '1',   unit: 'c.à.c' },
      { ingredientId: ing('citron').id,           quantity: '1',   unit: 'zeste' },
    ]},
  });

  console.log('✅ 10 desserts créés\n');

  // ════════════════════════════════════════════════════════
  // BOISSONS — 10 recettes
  // ════════════════════════════════════════════════════════
  console.log('🥤 Boissons...');

  await createRecipe({
    titre: 'Chocolat chaud épicé de Vianne',
    imageURL: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600',
    instructions: '1. Casser le chocolat en petits morceaux.\n2. Chauffer le lait à feu moyen sans laisser bouillir.\n3. Hors du feu, incorporer le chocolat en fouettant jusqu\'à fonte complète.\n4. Ajouter cannelle, piment de Cayenne et sucre selon goût.\n5. Remettre à feu doux et fouetter vigoureusement pour faire mousser. Servir chaud.',
    nombrePersonnes: 2, tempsPreparation: 5, tempsCuisson: 10,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catBoisson.id, mediaId: medias[8467].id,
    ingredients: { create: [
      { ingredientId: ing('lait entier').id,       quantity: '500', unit: 'ml'    },
      { ingredientId: ing('chocolat noir 70%').id, quantity: '100', unit: 'g'     },
      { ingredientId: ing('cannelle').id,          quantity: '1',   unit: 'c.à.c' },
      { ingredientId: ing('piment de cayenne').id, quantity: '1',   unit: 'pincée'},
      { ingredientId: ing('sucre').id,             quantity: '2',   unit: 'c.à.s' },
    ]},
  });

  await createRecipe({
    titre: 'Pour-over café de The Bear',
    imageURL: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    instructions: '1. Moudre 20g de café à mouture moyenne-fine.\n2. Chauffer l\'eau à exactement 93°C (retirer du feu 30 sec après ébullition).\n3. Rincer le filtre, verser le café, faire un "bloom" : verser 40ml d\'eau, attendre 30s.\n4. Verser le reste de l\'eau en cercles réguliers sur 3-4 min.\n5. Le café doit couler lentement — déguster noir.',
    nombrePersonnes: 2, tempsPreparation: 5, tempsCuisson: 5,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catBoisson.id, mediaId: medias[44217].id,
    ingredients: { create: [
      { ingredientId: ing('café').id, quantity: '20', unit: 'g pour 300ml d\'eau' },
    ]},
  });

  await createRecipe({
    titre: 'Milkshake fraise de Pulp Fiction',
    imageURL: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600',
    instructions: '1. Laver et équeuter les fraises fraîches.\n2. Mixer fraises, lait entier froid et sirop de grenadine à pleine puissance.\n3. Ajouter 2-3 boules de glace vanille, mixer à nouveau rapidement.\n4. Verser dans un grand verre givré, garnir de chantilly et d\'une fraise entière.',
    nombrePersonnes: 2, tempsPreparation: 5, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catBoisson.id, mediaId: medias[680].id,
    ingredients: { create: [
      { ingredientId: ing('lait entier').id,        quantity: '200', unit: 'ml'   },
      { ingredientId: ing('fraise').id,             quantity: '150', unit: 'g'    },
      { ingredientId: ing('sirop de grenadine').id, quantity: '2',   unit: 'c.à.s'},
      { ingredientId: ing('crème fraîche').id,      quantity: '10',  unit: 'cl'   },
    ]},
  });

  await createRecipe({
    titre: 'Thé de l\'Après-midi au Comté',
    imageURL: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600',
    instructions: '1. Porter l\'eau à 90°C (ne pas faire bouillir — cela rendrait le thé amer).\n2. Préchauffer la théière avec un peu d\'eau chaude puis vider.\n3. Mettre 1 cuillère à café de thé par tasse, infuser exactement 3 min.\n4. Filtrer dans des tasses, ajouter miel et une tranche de citron.\n5. Servir avec des biscuits sablés.',
    nombrePersonnes: 4, tempsPreparation: 5, tempsCuisson: 5,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catBoisson.id, mediaId: medias[120].id,
    ingredients: { create: [
      { ingredientId: ing('thé').id,    quantity: '4',  unit: 'c.à.c' },
      { ingredientId: ing('miel').id,   quantity: '2',  unit: 'c.à.s' },
      { ingredientId: ing('citron').id, quantity: '1',  unit: 'pièce' },
    ]},
  });

  await createRecipe({
    titre: 'Mojito de Soul Kitchen',
    imageURL: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600',
    instructions: '1. Déposer les feuilles de menthe et le sucre dans un verre.\n2. Presser le citron vert, verser le jus et piler doucement (muddling) — sans brutaliser la menthe.\n3. Remplir le verre de glace pilée.\n4. Verser le rhum blanc, compléter d\'eau gazeuse très froide.\n5. Mélanger délicatement et garnir d\'un brin de menthe.',
    nombrePersonnes: 1, tempsPreparation: 5, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catBoisson.id, mediaId: medias[37735].id,
    ingredients: { create: [
      { ingredientId: ing('rhum').id,        quantity: '5',  unit: 'cl'   },
      { ingredientId: ing('citron').id,      quantity: '1',  unit: 'pièce'},
      { ingredientId: ing('sucre').id,       quantity: '2',  unit: 'c.à.c'},
      { ingredientId: ing('eau gazeuse').id, quantity: '10', unit: 'cl'   },
    ]},
  });

  await createRecipe({
    titre: 'Whisky Sour de Breaking Bad',
    imageURL: 'https://images.unsplash.com/photo-1527761939622-933c972a8b17?w=600',
    instructions: '1. Verser whisky, jus de citron fraîchement pressé, sucre et blanc d\'œuf dans un shaker.\n2. Shaker sans glace 15 sec (dry shake) pour émulsionner le blanc d\'œuf.\n3. Ajouter des glaçons et reshaker vigoureusement 15 sec.\n4. Double-filtrer dans un verre à cocktail refroidi.\n5. Décorer d\'un zeste de citron et de quelques gouttes d\'Angostura.',
    nombrePersonnes: 1, tempsPreparation: 5, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catBoisson.id, mediaId: medias[1396].id,
    ingredients: { create: [
      { ingredientId: ing('whisky').id,       quantity: '5',  unit: 'cl'   },
      { ingredientId: ing('jus de citron').id,quantity: '2',  unit: 'cl'   },
      { ingredientId: ing('sucre').id,        quantity: '1',  unit: 'c.à.c'},
      { ingredientId: ing('œuf').id,          quantity: '1',  unit: 'blanc'},
    ]},
  });

  await createRecipe({
    titre: 'Champagne rosé du Festin de Babette',
    imageURL: 'https://images.unsplash.com/photo-1600456899121-68eda5b33ef7?w=600',
    instructions: '1. Réfrigérer la bouteille 3h minimum — idéalement toute une nuit.\n2. Ouvrir délicatement sans faire sauter le bouchon (tenir à 45°, faire tourner la bouteille).\n3. Incliner légèrement les flûtes pour verser doucement le long du verre.\n4. Déposer une framboise fraîche dans chaque flûte — elle libère des bulles.\n5. Servir immédiatement, très froid.',
    nombrePersonnes: 6, tempsPreparation: 2, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catBoisson.id, mediaId: medias[14290].id,
    ingredients: { create: [
      { ingredientId: ing('champagne').id,  quantity: '75',  unit: 'cl'    },
      { ingredientId: ing('framboises').id, quantity: '12',  unit: 'pièces'},
    ]},
  });

  await createRecipe({
    titre: 'Limonade du Joker',
    imageURL: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600',
    instructions: '1. Presser tous les citrons, récupérer le jus (environ 20cl).\n2. Préparer un sirop : chauffer 100ml d\'eau avec le sucre jusqu\'à dissolution complète. Laisser refroidir.\n3. Mélanger jus de citron et sirop dans un pichet.\n4. Compléter d\'eau gazeuse très froide, ajouter des glaçons.\n5. Décorer de tranches de citron et feuilles de menthe. Servir immédiatement.',
    nombrePersonnes: 4, tempsPreparation: 10, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catBoisson.id, mediaId: medias[475557].id,
    ingredients: { create: [
      { ingredientId: ing('citron').id,      quantity: '6',   unit: 'pièces'},
      { ingredientId: ing('sucre').id,       quantity: '100', unit: 'g'     },
      { ingredientId: ing('eau gazeuse').id, quantity: '1',   unit: 'litre' },
    ]},
  });

  await createRecipe({
    titre: 'Kir champêtre de Ratatouille',
    imageURL: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600',
    instructions: '1. Placer les verres à vin au congélateur 10 min pour les givrer légèrement.\n2. Verser environ 1 c.à.s de sirop de grenadine (ou crème de cassis) au fond de chaque verre.\n3. Verser délicatement le vin blanc bien frais en inclinant le verre — ne pas mélanger.\n4. Les couleurs se marient naturellement à la dégustation. Servir avec des gougères.',
    nombrePersonnes: 4, tempsPreparation: 2, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userRemy.id, categoryId: catBoisson.id, mediaId: medias[2062].id,
    ingredients: { create: [
      { ingredientId: ing('vin blanc').id,          quantity: '75',  unit: 'cl'   },
      { ingredientId: ing('sirop de grenadine').id, quantity: '4',   unit: 'c.à.s'},
    ]},
  });

  await createRecipe({
    titre: 'Smoothie vert détox de Julie Child',
    imageURL: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600',
    instructions: '1. Éplucher et vider la pomme, peler et trancher le gingembre.\n2. Presser le citron.\n3. Tout mettre dans le blender avec 150ml d\'eau froide.\n4. Mixer à pleine puissance 1 min.\n5. Goûter et ajuster avec le miel si trop acide. Servir immédiatement.',
    nombrePersonnes: 2, tempsPreparation: 5, tempsCuisson: 0,
    status: 'PUBLISHED', userId: userMarie.id, categoryId: catBoisson.id, mediaId: medias[24094].id,
    ingredients: { create: [
      { ingredientId: ing('pomme').id,     quantity: '2',  unit: 'pièces'},
      { ingredientId: ing('citron').id,    quantity: '1',  unit: 'pièce' },
      { ingredientId: ing('gingembre').id, quantity: '3',  unit: 'cm'    },
      { ingredientId: ing('miel').id,      quantity: '1',  unit: 'c.à.s' },
    ]},
  });

  console.log('✅ 10 boissons créées\n')
  
// RECETTES PENDING / DRAFT
  console.log('✅ recette PENDING')

  await createRecipe({
    titre: 'Soupe exotique',
    imageURL: 'https://images.unsplash.com/photo-1589308051-0b4c6b182b8c?w=600',
    instructions: '1. Couper mangue et papaye.\n2. Mixer avec lait de coco et citron vert.\n3. Servir frais avec feuilles de menthe.',
    nombrePersonnes: 4,
    tempsPreparation: 15,
    tempsCuisson: 0,
    status: 'PENDING',   // <-- statut PENDING
    userId: userMarie.id,
    categoryId: catEntree.id,
    mediaId: medias[2062].id, //  media associé
    ingredients: { create: [
      { ingredientId: ing('mangue').id, quantity: '1', unit: 'pièce' },
      { ingredientId: ing('lait entier').id, quantity: '20', unit: 'cl' },
      { ingredientId: ing('citron').id, quantity: '1', unit: 'pièce' },
    ]},
});


console.log('✅ recette DRAFT');

await createRecipe({
    titre: 'Dessert chocolaté',
    imageURL: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600',
    instructions: '1. Mélanger chocolat fondu et lait.\n2. Ajouter sucre et œufs.\n3. Verser dans moules et réfrigérer.',
    nombrePersonnes: 2,
    tempsPreparation: 10,
    tempsCuisson: 0,
    status: 'DRAFT',      // <-- statut DRAFT
    rejectionReason: 'La recette est incomplète, il manque la cuisson exacte.', // <-- raison
    userId: userRemy.id,
    categoryId: catDessert.id,
    mediaId: medias[8467].id,
    ingredients: { create: [
      { ingredientId: ing('chocolat noir 70%').id, quantity: '100', unit: 'g' },
      { ingredientId: ing('lait entier').id, quantity: '50', unit: 'cl' },
      { ingredientId: ing('œuf').id, quantity: '2', unit: 'pièces' },
    ]},
});




  // ── Résumé final ─────────────────────────────────────────
  const [nEntree, nPlat, nDessert, nBoisson] = await Promise.all([
    prisma.recipe.count({ where: { categoryId: catEntree.id } }),
    prisma.recipe.count({ where: { categoryId: catPlat.id } }),
    prisma.recipe.count({ where: { categoryId: catDessert.id } }),
    prisma.recipe.count({ where: { categoryId: catBoisson.id } }),
  ]);

  console.log('🎬 Seed v2 terminé !\n');
  console.log('────────────────────────────────────────────────');
  console.log(`  Entrées  : ${nEntree}  recettes`);
  console.log(`  Plats    : ${nPlat}  recettes`);
  console.log(`  Desserts : ${nDessert} recettes`);
  console.log(`  Boissons : ${nBoisson} recettes`);
  console.log(`  TOTAL    : ${nEntree + nPlat + nDessert + nBoisson} recettes`);
  console.log('────────────────────────────────────────────────');
  console.log('  ADMIN   : admin@cinesdelices.fr  / Admin1234!');
  console.log('  MEMBRE  : marie@cinesdelices.fr  / Member1234!');
  console.log('  MEMBRE  : remy@cinesdelices.fr   / Member1234!');
  console.log('────────────────────────────────────────────────\n');
}

main()
  .catch(e => { console.error('❌ Erreur seed :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

