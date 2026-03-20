// Mock data for Admin pages testing

export const mockRecipes = [
  {
    id: 1,
    title: 'Soupe à l\'oignon',
    category: 'Entrée',
  },
  {
    id: 2,
    title: 'Terrine de foie gras',
    category: 'Entrée',
  },
  {
    id: 3,
    title: 'Escargots de Bourgogne',
    category: 'Entrée',
  },
  {
    id: 4,
    title: 'Coq au vin',
    category: 'Plat',
  },
  {
    id: 5,
    title: 'Boeuf Bourguignon',
    category: 'Plat',
  },
  {
    id: 6,
    title: 'Cassoulet Toulousain',
    category: 'Plat',
  },
  {
    id: 7,
    title: 'Crème brûlée',
    category: 'Dessert',
  },
  {
    id: 8,
    title: 'Tarte tatin',
    category: 'Dessert',
  },
  {
    id: 9,
    title: 'Moelleux au chocolat',
    category: 'Dessert',
  },
  {
    id: 10,
    title: 'Vin rouge Bordeaux',
    category: 'Boisson',
  },
  {
    id: 11,
    title: 'Champagne Veuve Clicquot',
    category: 'Boisson',
  },
  {
    id: 12,
    title: 'Cidre de Normandie',
    category: 'Boisson',
  },
];

export const mockUsers = [
  {
    id: 1,
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie.dupont@email.com',
    recipeCounts: {
      entree: 3,
      plat: 5,
      dessert: 2,
      boisson: 1,
    },
  },
  {
    id: 2,
    nom: 'Martin',
    prenom: 'Jean',
    email: 'jean.martin@email.com',
    recipeCounts: {
      entree: 2,
      plat: 4,
      dessert: 3,
      boisson: 2,
    },
  },
  {
    id: 3,
    nom: 'Bernard',
    prenom: 'Sophie',
    email: 'sophie.bernard@email.com',
    recipeCounts: {
      entree: 5,
      plat: 2,
      dessert: 4,
      boisson: 0,
    },
  },
  {
    id: 4,
    nom: 'Thomas',
    prenom: 'Pierre',
    email: 'pierre.thomas@email.com',
    recipeCounts: {
      entree: 1,
      plat: 6,
      dessert: 1,
      boisson: 3,
    },
  },
  {
    id: 5,
    nom: 'Robert',
    prenom: 'Anne',
    email: 'anne.robert@email.com',
    recipeCounts: {
      entree: 4,
      plat: 3,
      dessert: 5,
      boisson: 2,
    },
  },
];

export const mockCategories = [
  {
    id: 1,
    name: 'Entrée',
    color: '#84a767',
  },
  {
    id: 2,
    name: 'Plat',
    color: '#b3364c',
  },
  {
    id: 3,
    name: 'Dessert',
    color: '#8e1f2f',
  },
  {
    id: 4,
    name: 'Boisson',
    color: '#5cb1c2',
  },
  {
    id: 5,
    name: 'Accompagnement',
    color: '#b58a5d',
  },
];
