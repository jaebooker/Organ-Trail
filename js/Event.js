// Event.js

// eslint-disable-next-line no-var
var OregonH = OregonH || {};

OregonH.Event = {};

OregonH.Event.eventTypes = [
  {
    type: 'STAT-CHANGE',
    notification: 'negative',
    stat: 'crew',
    value: -3,
    text: 'Your crew got wasted and started a fight. Casualties: ',
  },
  {
    type: 'STAT-CHANGE',
    notification: 'negative',
    stat: 'crew',
    value: -4,
    text: 'Ebola outbreak. Casualties: ',
  },
  {
    type: 'STAT-CHANGE',
    notification: 'negative',
    stat: 'crew',
    value: -10,
    text: 'Parasite infestation. Chests bursting: ',
  },
  {
    type: 'STAT-CHANGE',
    notification: 'negative',
    stat: 'money',
    value: -50,
    text: 'Pick pockets steal $',
  },
  {
    type: 'STAT-CHANGE',
    notification: 'negative',
    stat: 'oxen',
    value: -1,
    text: 'Zombie ox outbreak. Casualties: ',
  },
  {
    type: 'STAT-CHANGE',
    notification: 'positive',
    stat: 'food',
    value: 20,
    text: 'Found wild worms. Food added: ',
  },
  {
    type: 'STAT-CHANGE',
    notification: 'positive',
    stat: 'food',
    value: 20,
    text: 'Found wild snakes. Food added: ',
  },
  {
    type: 'STAT-CHANGE',
    notification: 'positive',
    stat: 'oxen',
    value: 1,
    text: 'Found wild oxen. New oxen: ',
  },
  {
    type: 'SHOP',
    notification: 'neutral',
    text: 'Some small band of misfits',
    products: [
      { item: 'food', qty: 20, price: 50 },
      { item: 'oxen', qty: 1, price: 200 },
      { item: 'firepower', qty: 2, price: 50 },
      { item: 'crew', qty: 5, price: 80 },
    ],
  },
  {
    type: 'SHOP',
    notification: 'neutral',
    text: 'Some starving people with supplies',
    products: [
      { item: 'food', qty: 30, price: 50 },
      { item: 'oxen', qty: 1, price: 200 },
      { item: 'firepower', qty: 2, price: 20 },
      { item: 'crew', qty: 10, price: 80 },
    ],
  },
  {
    type: 'SHOP',
    notification: 'neutral',
    text: 'Smugglers selling various goods',
    products: [
      { item: 'food', qty: 20, price: 60 },
      { item: 'oxen', qty: 1, price: 300 },
      { item: 'firepower', qty: 2, price: 80 },
      { item: 'crew', qty: 5, price: 60 },
    ],
  },
  {
    type: 'ATTACK',
    notification: 'negative',
    text: 'Serial killers are attacking you, demanding you put the lotion on the skin',
  },
  {
    type: 'ATTACK',
    notification: 'negative',
    text: 'A crazy new cult is attacking you, demanding that you bow to the great Platapus of Light',
  },
  {
    type: 'ATTACK',
    notification: 'negative',
    text: 'Some biker gang is trying to cause a bit of trouble. You know what to do, right?',
  },
];

OregonH.Event.generateEvent = function generateEvent() {
  // pick random one
  const eventIndex = Math.floor(Math.random() * this.eventTypes.length);
  const eventData = this.eventTypes[eventIndex];

  // events that consist in updating a stat
  if (eventData.type === 'STAT-CHANGE') {
    this.stateChangeEvent(eventData);
  } else if (eventData.type === 'SHOP') {
    // shops
    // pause game
    this.game.pauseJourney();

    // notify user
    this.ui.notify(eventData.text, eventData.notification);

    // prepare event
    this.shopEvent(eventData);
  } else if (eventData.type === 'ATTACK') {
    // attacks
    // pause game
    this.game.pauseJourney();

    // notify user
    this.ui.notify(eventData.text, eventData.notification);

    // prepare event
    this.attackEvent(eventData);
  }
};

OregonH.Event.stateChangeEvent = function stateChangeEvent(eventData) {
  // can't have negative quantities
  if (eventData.value + this.caravan[eventData.stat] >= 0) {
    this.caravan[eventData.stat] += eventData.value;
    this.ui.notify(eventData.text + Math.abs(eventData.value), eventData.notification);
  }
};

OregonH.Event.shopEvent = function shopEvent(eventData) {
  // number of products for sale
  const numProds = Math.ceil(Math.random() * 4);

  // product list
  const products = [];
  let j;
  let priceFactor;

  for (let i = 0; i < numProds; i += 1) {
    // random product
    j = Math.floor(Math.random() * eventData.products.length);

    // multiply price by random factor +-30%
    priceFactor = 0.7 + 0.6 * Math.random();

    products.push({
      item: eventData.products[j].item,
      qty: eventData.products[j].qty,
      price: Math.round(eventData.products[j].price * priceFactor),
    });
  }

  this.ui.showShop(products);
};

// prepare an attack event
OregonH.Event.attackEvent = function attackEvent() {
  const firepower = Math.round((0.7 + 0.6 * Math.random()) * OregonH.ENEMY_FIREPOWER_AVG);
  const gold = Math.round((0.7 + 0.6 * Math.random()) * OregonH.ENEMY_GOLD_AVG);

  this.ui.showAttack(firepower, gold);
};
