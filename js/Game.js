// game.js — Caravan, EventManager, UI and Game.

const C = {
  WEIGHT_PER_OX: 20,
  WEIGHT_PER_PERSON: 2,
  FOOD_WEIGHT: 0.6,
  GAME_SPEED: 800,
  DAY_PER_STEP: 0.2,
  FOOD_PER_PERSON: 0.02,
  FULL_SPEED: 5,
  SLOW_SPEED: 3,
  FINAL_DISTANCE: 1000,
  EVENT_PROBABILITY: 0.15,
  ENEMY_FIREPOWER_AVG: 5,
  ENEMY_GOLD_AVG: 50,
};

const LANDMARKS = [
  { at: 0, name: "Slaughter's Landing" },
  { at: 250, name: 'Fort Femur' },
  { at: 500, name: 'Spleen River' },
  { at: 750, name: 'Chimney Wreck' },
  { at: 1000, name: 'Throne of Skulls' },
];

const ITEM_NAMES = { food: 'human organs', oxen: 'oxen', firepower: 'firepower', crew: 'crew' };

const EVENT_TYPES = [
  { type: 'STAT-CHANGE', notification: 'negative', stat: 'crew', value: -3, text: 'Your crew got wasted and started a fight. Casualties: ' },
  { type: 'STAT-CHANGE', notification: 'negative', stat: 'crew', value: -4, text: 'Ebola outbreak. Casualties: ' },
  { type: 'STAT-CHANGE', notification: 'negative', stat: 'crew', value: -10, text: 'Parasite infestation. Chests bursting: ' },
  { type: 'STAT-CHANGE', notification: 'negative', stat: 'money', value: -50, text: 'Pick pockets steal $' },
  { type: 'STAT-CHANGE', notification: 'negative', stat: 'oxen', value: -1, text: 'Zombie ox outbreak. Casualties: ' },
  { type: 'STAT-CHANGE', notification: 'positive', stat: 'food', value: 20, text: 'Found wild worms. Food added: ' },
  { type: 'STAT-CHANGE', notification: 'positive', stat: 'food', value: 20, text: 'Found wild snakes. Food added: ' },
  { type: 'STAT-CHANGE', notification: 'positive', stat: 'oxen', value: 1, text: 'Found wild oxen. New oxen: ' },
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
  { type: 'ATTACK', notification: 'negative', text: 'Serial killers are attacking you, demanding you put the lotion on the skin' },
  { type: 'ATTACK', notification: 'negative', text: 'A crazy new cult is attacking you, demanding that you bow to the great Platapus of Light' },
  { type: 'ATTACK', notification: 'negative', text: 'Some biker gang is trying to cause a bit of trouble. You know what to do, right?' },
];

const $ = id => document.getElementById(id);
const vary = avg => Math.round((0.7 + 0.6 * Math.random()) * avg);

const Sfx = {
  on: true,
  ctx: null,
  play(freqs, dur = 0.09) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = f;
        gain.gain.value = 0.04;
        osc.connect(gain).connect(this.ctx.destination);
        const start = this.ctx.currentTime + i * dur;
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) { /* no audio, no problem */ }
  },
  good() { this.play([523, 784]); },
  bad() { this.play([196, 131]); },
  alarm() { this.play([330, 220, 330, 220], 0.11); },
  fanfare() { this.play([392, 523, 659, 784, 1047], 0.14); },
  dirge() { this.play([262, 247, 220, 196, 131], 0.22); },
};

class Caravan {
  constructor() { this.reset(); }

  reset() {
    Object.assign(this, { day: 0, distance: 0, crew: 30, food: 80, oxen: 2, money: 300, firepower: 2 });
    this.updateWeight();
  }

  // recompute weight and capacity; returns how many organs had to be left behind
  updateWeight() {
    let dropped = 0;
    this.capacity = this.oxen * C.WEIGHT_PER_OX + this.crew * C.WEIGHT_PER_PERSON;
    this.weight = this.food * C.FOOD_WEIGHT;
    while (this.food > 0 && this.capacity <= this.weight) {
      this.food = Math.max(0, this.food - 1);
      this.weight = this.food * C.FOOD_WEIGHT;
      dropped += 1;
    }
    return dropped;
  }

  // the closer to capacity, the slower
  updateDistance() {
    if (!this.capacity) return;
    const diff = this.capacity - this.weight;
    this.distance += C.SLOW_SPEED + diff / this.capacity * C.FULL_SPEED;
  }

  consumeFood() {
    this.food = Math.max(0, this.food - this.crew * C.FOOD_PER_PERSON);
  }
}

class UI {
  constructor(game) {
    this.game = game;
    this.caravan = game.caravan;
    this.buttons = [];

    $('marks').innerHTML = LANDMARKS
      .map(l => `<span style="left:${100 - l.at / 10}%"><i>${l.name}</i></span>`).join('');

    $('mute').addEventListener('click', () => {
      Sfx.on = !Sfx.on;
      $('mute').textContent = `SOUND: ${Sfx.on ? 'ON' : 'OFF'}`;
    });

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      let index = -1;
      if (e.key === ' ' || e.key === 'Enter') index = 0;
      else if (/^[1-9]$/.test(e.key)) index = +e.key - 1;
      const btn = this.buttons[index];
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
    });
  }

  notify(message, type) {
    const line = document.createElement('div');
    line.className = `update-${type}`;
    line.textContent = `Day ${Math.ceil(this.caravan.day)}: ${message}`;
    const log = $('log');
    log.prepend(line);
    while (log.children.length > 80) log.lastChild.remove();
    log.scrollTop = 0;
  }

  clearLog() { $('log').innerHTML = ''; }

  showJourney(show) {
    $('hud').classList.toggle('hidden', !show);
    $('trail').classList.toggle('hidden', !show);
  }

  overlay(html) { $('overlay').innerHTML = html; }

  prompt(text) { $('prompt').textContent = text; }

  // options: [{ label, fn, disabled }]
  panel(text, options) {
    this.prompt(text);
    const box = $('options');
    box.innerHTML = '';
    this.buttons = options.map((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${i + 1}. ${opt.label}`;
      btn.disabled = !!opt.disabled;
      btn.addEventListener('click', opt.fn);
      box.appendChild(btn);
      return btn;
    });
  }

  refreshStats() {
    const { day, distance, crew, oxen, food, money, firepower, weight, capacity } = this.caravan;
    const { ceil, floor, min } = Math;
    $('stat-day').textContent = ceil(day);
    $('stat-distance').textContent = `${min(floor(distance), C.FINAL_DISTANCE)} / ${C.FINAL_DISTANCE}`;
    $('stat-crew').textContent = crew;
    $('stat-oxen').textContent = oxen;
    $('stat-food').textContent = ceil(food);
    $('stat-money').textContent = `$${money}`;
    $('stat-firepower').textContent = firepower;
    $('stat-weight').textContent = `${ceil(weight)} / ${capacity}`;

    $('marker').style.left = `${100 - min(distance, C.FINAL_DISTANCE) / 10}%`;
    [...$('marks').children].forEach((el, i) => el.classList.toggle('reached', distance >= LANDMARKS[i].at));
  }
}

class EventManager {
  constructor(game) {
    this.game = game;
    this.caravan = game.caravan;
    this.ui = game.ui;
  }

  generateEvent() {
    const eventData = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    if (eventData.type === 'STAT-CHANGE') {
      this.statChangeEvent(eventData);
    } else {
      this.ui.notify(eventData.text, eventData.notification);
      if (eventData.type === 'SHOP') this.shopEvent(eventData);
      else this.attackEvent(eventData);
    }
  }

  statChangeEvent({ stat, value, text, notification }) {
    // can't have negative quantities
    if (value + this.caravan[stat] < 0) return;
    this.caravan[stat] += value;
    this.ui.notify(text + Math.abs(value), notification);
    if (notification === 'positive') Sfx.good(); else Sfx.bad();
  }

  shopEvent(eventData) {
    const numProds = Math.ceil(Math.random() * 4);
    const products = [];
    for (let i = 0; i < numProds; i += 1) {
      const base = eventData.products[Math.floor(Math.random() * eventData.products.length)];
      // multiply price by random factor +-30%
      products.push({ ...base, price: Math.round(base.price * (0.7 + 0.6 * Math.random())) });
    }
    Sfx.good();
    this.game.setState('shop');
    this.renderShop(eventData.text, products);
  }

  renderShop(text, products) {
    const options = products.map(p => ({
      label: `${p.qty} ${ITEM_NAMES[p.item]} - $${p.price}`,
      disabled: p.price > this.caravan.money,
      fn: () => {
        this.buy(p);
        this.renderShop(text, products);
      },
    }));
    options.push({ label: 'Leave shop', fn: () => this.game.resumeJourney() });
    this.ui.panel(`${text}. You have $${this.caravan.money}. You may buy:`, options);
  }

  buy({ item, qty, price }) {
    if (price > this.caravan.money) {
      this.ui.notify('Not enough money', 'negative');
      return;
    }
    this.caravan.money -= price;
    this.caravan[item] += qty;
    this.ui.notify(`Bought ${qty} x ${ITEM_NAMES[item]}`, 'positive');
    Sfx.good();
    this.game.dropExcess();
    this.ui.refreshStats();
  }

  attackEvent(eventData) {
    const firepower = vary(C.ENEMY_FIREPOWER_AVG);
    const gold = vary(C.ENEMY_GOLD_AVG);
    Sfx.alarm();
    this.game.setState('attack');
    this.ui.panel(`${eventData.text}. Enemy firepower: ${firepower}. Yours: ${this.caravan.firepower}. What is your choice?`, [
      { label: 'Slay them and make their teeth into a necklace', fn: () => this.fight(firepower, gold) },
      { label: 'Run away like a little bitch', fn: () => this.runaway(firepower) },
    ]);
  }

  fight(firepower, gold) {
    // damage can be 0 to 2 * firepower
    const damage = Math.ceil(Math.max(0, firepower * 2 * Math.random() - this.caravan.firepower));
    if (damage < this.caravan.crew) {
      this.caravan.crew -= damage;
      this.caravan.money += gold;
      this.ui.notify(`${damage} people had their heads put on pikes`, 'negative');
      this.ui.notify(`Found $${gold}`, 'positive');
      this.game.resumeJourney();
    } else {
      this.caravan.crew = 0;
      this.game.lose('Everyone died. The end!');
    }
  }

  runaway(firepower) {
    // damage can be 0 to firepower / 2
    const damage = Math.ceil(Math.max(0, firepower * Math.random() / 2));
    if (damage < this.caravan.crew) {
      this.caravan.crew -= damage;
      this.ui.notify(`${damage} people were killed for running like the panzies they were`, 'negative');
      this.game.resumeJourney();
    } else {
      this.caravan.crew = 0;
      this.game.lose('Everybody died running away... you are a disgrace to the name of degenerate');
    }
  }
}

class Game {
  constructor() {
    this.caravan = new Caravan();
    this.ui = new UI(this);
    this.eventManager = new EventManager(this);
    this.ctx = $('scene').getContext('2d');
    this.scroll = 0;
    this.acc = 0;
    this.last = 0;
    this.showTitle();
    requestAnimationFrame(ts => this.frame(ts));
  }

  setState(state) { this.state = state; }

  showTitle() {
    this.setState('title');
    this.ui.showJourney(false);
    this.ui.overlay('<div class="logo">THE ORGAN TRAIL</div><div class="tag">Hunt for human organs with your band of savages</div>');
    this.ui.panel('HUMAN HUNTING!!! HUMAN HUNTING!!!! THE STRONG WILL SURVIVE AND THE BEAST SHALL RISE!! AS IT WAS PROPHESIED!!!', [
      { label: 'Travel the trail', fn: () => this.start() },
      { label: 'Learn about the trail', fn: () => this.showHelp() },
    ]);
  }

  showHelp() {
    this.ui.panel(`It is ${C.FINAL_DISTANCE} miles from Slaughter's Landing to the Throne of Skulls. Your crew eats human organs every day. Run out and it is over. Oxen and crew let you carry more, and a light caravan travels faster. Firepower keeps heads on shoulders when you fight. Buy what you need from the folks you meet. Use the number keys or tap.`, [
      { label: 'Travel the trail', fn: () => this.start() },
    ]);
  }

  start() {
    this.caravan.reset();
    this.nextLandmark = 1;
    this.acc = 0;
    this.ui.clearLog();
    this.ui.overlay('');
    this.ui.showJourney(true);
    this.ui.notify('A great adventure begins', 'positive');
    Sfx.good();
    this.resumeJourney();
    this.updateGame();
  }

  frame(ts) {
    const dt = Math.min(ts - this.last, 100);
    this.last = ts;
    const moving = this.state === 'travel' || this.state === 'title';
    if (moving) this.scroll += dt * 0.035;
    if (this.state === 'travel') {
      this.acc += dt;
      if (this.acc >= C.GAME_SPEED) {
        this.acc = 0;
        this.updateGame();
      }
    }
    const modes = { shop: 'shop', attack: 'attack', dead: 'dead', win: 'win' };
    Art.draw(this.ctx, {
      t: ts,
      scroll: this.scroll,
      distance: this.state === 'title' ? 0 : this.caravan.distance,
      oxen: this.state === 'title' ? 2 : this.caravan.oxen,
      moving,
      mode: modes[this.state] || 'travel',
    });
    requestAnimationFrame(next => this.frame(next));
  }

  dropExcess() {
    const dropped = this.caravan.updateWeight();
    if (dropped) this.ui.notify(`Left ${dropped} human organs behind`, 'negative');
  }

  travelPrompt() {
    const zone = Art.zoneAt(this.caravan.distance);
    const next = LANDMARKS[this.nextLandmark];
    const miles = Math.max(0, Math.ceil(next.at - this.caravan.distance));
    this.ui.prompt(`${zone.name}. Next landmark: ${next.name}, ${miles} miles.`);
  }

  updateGame() {
    const { caravan, ui } = this;
    caravan.day += C.DAY_PER_STEP;
    caravan.consumeFood();

    if (caravan.food === 0) {
      ui.refreshStats();
      this.lose('Your caravan kept eating each other, until the sole survivor starved to death');
      return;
    }

    this.dropExcess();
    caravan.updateDistance();
    ui.refreshStats();

    if (caravan.crew <= 0) {
      caravan.crew = 0;
      this.lose('Everyone died. The end!');
      return;
    }

    if (caravan.distance >= C.FINAL_DISTANCE) {
      this.win();
      return;
    }

    const next = LANDMARKS[this.nextLandmark];
    if (caravan.distance >= next.at) {
      ui.notify(`You have reached ${next.name}`, 'neutral');
      Sfx.good();
      this.nextLandmark += 1;
    }
    this.travelPrompt();

    if (Math.random() <= C.EVENT_PROBABILITY) this.eventManager.generateEvent();
  }

  pauseJourney() {
    this.setState('paused');
    this.ui.panel('You stop to rest. The organs are not getting any fresher.', [
      { label: 'Continue on the trail', fn: () => this.resumeJourney() },
    ]);
  }

  resumeJourney() {
    this.setState('travel');
    this.ui.refreshStats();
    this.ui.panel('', [{ label: 'Stop to rest', fn: () => this.pauseJourney() }]);
    this.travelPrompt();
  }

  lose(message) {
    const { caravan, ui } = this;
    this.setState('dead');
    ui.refreshStats();
    ui.notify(message, 'negative');
    Sfx.dirge();
    ui.overlay(`<div class="epitaph">HERE LIES YOUR CARAVAN<br><br>DAY ${Math.ceil(caravan.day)}<br>${Math.floor(caravan.distance)} MILES</div>`);
    ui.panel(message, [{ label: 'Hit the trail again', fn: () => this.start() }]);
  }

  win() {
    const { caravan, ui } = this;
    let sayMyName = 'President Vlad the Unmemorable';
    if (caravan.crew > 30) sayMyName = 'High Priest Zoltan the Charismatic';
    if (caravan.food > 70) sayMyName = 'Igor the Fat';
    if (caravan.food < 10) sayMyName = 'Ivan the Bony-Ribbed';
    if (caravan.firepower > 10) sayMyName = 'Sloan the Terrible';
    if (caravan.firepower > 10 && caravan.crew > 30) sayMyName = 'Emperor Igor the Cruel';
    if (caravan.oxen > 8) sayMyName = 'Captain Ahab the Swift';

    const message = `You have slain all your enemies, and consumed them, making you stronger. You are the Alpha and the Omega. You are the Beta, the Theta, to the max! All who see you fall down in worship. You are like a god. You ARE God. You are... ${sayMyName}`;
    this.setState('win');
    ui.notify(message, 'positive');
    Sfx.fanfare();
    ui.overlay(`<div class="hail">ALL HAIL</div><div class="name">${sayMyName.toUpperCase()}</div>`);
    ui.panel(message, [{ label: 'Hit the trail again', fn: () => this.start() }]);
  }
}

const game = new Game();
