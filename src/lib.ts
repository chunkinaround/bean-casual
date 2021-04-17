import {
  getProperty,
  abort,
  itemAmount,
  closetAmount,
  takeCloset,
  shopAmount,
  takeShop,
  buy,
  eat,
  drink,
  chew,
  mallPrice,
  use,
  print,
  setProperty,
  familiarWeight,
  myFamiliar,
  weightAdjustment,
  haveEffect,
  cliExecute,
  toEffect,
  haveSkill,
  useSkill,
  sweetSynthesis,
  availableAmount,
  retrieveItem,
  getClanName,
  visitUrl,
  maximize,
  myBasestat,
  create,
  getFuel,
} from 'kolmafia';
import { $effect, $skill, $stat, $item } from 'libram';

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export function ensureItem(quantity: number, it: Item) {
  if (availableAmount(it) < quantity) {
    buy(quantity - availableAmount(it), it);
  }
  if (availableAmount(it) < quantity) {
    throw `Could not buy ${quantity} of item ${it.name}: only ${availableAmount(it)}.`;
  }
}

export function ensureCreateItem(quantity: number, it: Item) {
  if (availableAmount(it) < quantity) {
    create(quantity - availableAmount(it), it);
  }
  if (availableAmount(it) < quantity) {
    throw 'Could not create item.';
  }
}

export function getPropertyString(name: string, def: string) {
  const str = getProperty(name);
  return str === '' ? def : str;
}

export function getPropertyInt(name: string, default_: number | null = null): number {
  const str = getProperty(name);
  if (str === '') {
    if (default_ === null) throw `Unknown property ${name}.`;
    else return default_;
  }
  return parseInt(str, 10);
}

export function getPropertyBoolean(name: string, default_: boolean | null = null) {
  const str = getProperty(name);
  if (str === '') {
    if (default_ === null) throw `Unknown property ${name}.`;
    else return default_;
  }
  return str === 'true';
}

export function setPropertyInt(name: string, value: number) {
  setProperty(name, value.toString());
}

export function itemPriority(...items: Item[]): Item {
  if (items.length === 1) return items[0];
  else return itemAmount(items[0]) > 0 ? items[0] : itemPriority(...items.slice(1));
}

export function cheaper(...items: Item[]) {
  if (items.length === 1) return items[0];
  else return itemAmount(items[0]) > 0 ? items[0] : itemPriority(...items.slice(1));
}

const priceCaps: { [index: string]: number } = {
  'jar of fermented pickle juice': 75000,
  "Frosty's frosty mug": 45000,
  'extra-greasy slider': 45000,
  "Ol' Scratch's salad fork": 45000,
  'transdermal smoke patch': 7000,
  'voodoo snuff': 36000,
  'blood-drive sticker': 210000,
  'spice melange': 500000,
  'splendid martini': 10000,
  'stuffing fluffer': 25000,
  'cornucopia': 30000,
  'cashew': 9000,
};

export function getCapped(qty: number, item: Item, maxPrice: number) {
  if (qty > 30) throw 'bad get!';

  let remaining = Math.round(qty) - itemAmount(item);
  if (remaining <= 0) return;

  const getCloset = Math.min(remaining, closetAmount(item));
  if (!takeCloset(getCloset, item)) throw 'failed to remove from closet';
  remaining -= getCloset;
  if (remaining <= 0) return;

  const getMall = Math.min(remaining, shopAmount(item));
  if (!takeShop(getMall, item)) throw 'failed to remove from shop';
  remaining -= getMall;
  if (remaining <= 0) return;

  if (buy(remaining, item, maxPrice) < remaining) throw `Mall price too high for ${item.name}.`;
}

export function get(qty: number, item: Item) {
  getCapped(qty, item, priceCaps[item.name]);
}

export function eatSafe(qty: number, item: Item) {
  get(1, item);
  if (!eat(qty, item)) throw 'Failed to eat safely';
}

export function drinkSafe(qty: number, item: Item) {
  get(1, item);
  if (!drink(qty, item)) throw 'Failed to drink safely';
}

export function chewSafe(qty: number, item: Item) {
  get(1, item);
  if (!chew(qty, item)) throw 'Failed to chew safely';
}

function propTrue(prop: string | boolean) {
  if (typeof prop === 'boolean') {
    return prop as boolean;
  } else {
    return getPropertyBoolean(prop as string);
  }
}

export function useIfUnused(item: Item, prop: string | boolean, maxPrice: number) {
  if (!propTrue(prop)) {
    if (mallPrice(item) <= maxPrice) {
      getCapped(1, item, maxPrice);
      use(1, item);
    } else {
      print(`Skipping ${item.name}; too expensive (${mallPrice(item)} > ${maxPrice}).`);
    }
  }
}

export function totalAmount(item: Item): number {
  return shopAmount(item) + itemAmount(item);
}

export function setChoice(adv: number, choice: number) {
  setProperty(`choiceAdventure${adv}`, `${choice}`);
}

export function myFamiliarWeight() {
  return familiarWeight(myFamiliar()) + weightAdjustment();
}

export function ensureEffect(ef: Effect, turns = 1) {
  if (!tryEnsureEffect(ef, turns)) {
    throw 'Failed to get effect ' + ef.name + '.';
  }
}

export function tryEnsureEffect(ef: Effect, turns = 1) {
  if (haveEffect(ef) < turns) {
    return cliExecute(ef.default) && haveEffect(ef) > 0;
  }
  return true;
}

export function tryEnsureSkill(sk: Skill) {
  const ef = toEffect(sk);
  if (haveSkill(sk) && ef !== $effect`none` && haveEffect(ef) === 0) {
    useSkill(1, sk);
  }
}

export function trySynthesize(ef: Effect) {
  if (haveEffect(ef) === 0 && haveSkill($skill`Sweet Synthesis`)) sweetSynthesis(ef);
}

export function shrug(ef: Effect) {
  if (haveEffect(ef) > 0) {
    cliExecute('shrug ' + ef.name);
  }
}

// Mechanics for managing song slots.
// We have Stevedave's, Ur-Kel's on at all times during leveling; third and fourth slots are variable.
const songSlots: Effect[][] = [
  Effect.get(["Stevedave's Shanty of Superiority", "Fat Leon's Phat Loot Lyric"]),
  Effect.get(["Ur-Kel's Aria of Annoyance"]),
  Effect.get([
    'Power Ballad of the Arrowsmith',
    'The Magical Mojomuscular Melody',
    'The Moxious Madrigal',
    'Ode to Booze',
    "Jackasses' Symphony of Destruction",
  ]),
  Effect.get(["Carlweather's Cantata of Confrontation", 'The Sonata of Sneakiness', 'Polka of Plenty']),
];
export function openSongSlot(song: Effect) {
  for (const songSlot of songSlots) {
    if (songSlot.includes(song)) {
      for (const shruggable of songSlot) {
        shrug(shruggable);
      }
    }
  }
}

export function tryEnsureSong(sk: Skill) {
  const ef = toEffect(sk);
  if (haveEffect(ef) === 0) {
    openSongSlot(ef);
    if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
      return false;
    }
  }
  return true;
}

export function ensureOde(turns = 1) {
  while (haveEffect($effect`Ode to Booze`) < turns) {
    openSongSlot($effect`Ode to Booze`);
    if (!useSkill(1, $skill`The Ode to Booze`)) throw "Couldn't get Ode for some reason.";
  }
}

export function tryUse(quantity: number, it: Item) {
  if (availableAmount(it) > 0) {
    return use(quantity, it);
  } else {
    return false;
  }
}

const clanCache: { [index: string]: number } = {};
export function setClan(target: string) {
  if (getClanName() !== target) {
    if (clanCache[target] === undefined) {
      const recruiter = visitUrl('clan_signup.php');
      const clanRe = /<option value=([0-9]+)>([^<]+)<\/option>/g;
      let result;
      while ((result = clanRe.exec(recruiter)) !== null) {
        clanCache[result[2]] = parseInt(result[1], 10);
      }
    }

    visitUrl(`showclan.php?whichclan=${clanCache[target]}&action=joinclan&confirm=on&pwd`);
    if (getClanName() !== target) {
      throw `failed to switch clans to ${target}. Did you spell it correctly? Are you whitelisted?`;
    }
  }
  return true;
}

export function maximizeCached(objective: string) {
  if (myBasestat($stat`Muscle`) > 40) {
    objective += objective.length > 0 ? ', equip mafia thumb ring' : 'equip mafia thumb ring';
  }
  if (getProperty('bcas_objective') === objective) return;
  setProperty('bcas_objective', objective);
  maximize(objective, false);
}

export function questStep(questName: string) {
  const stringStep = getProperty(questName);
  if (stringStep === 'unstarted') return -1;
  else if (stringStep === 'started') return 0;
  else if (stringStep === 'finished') return 999;
  else {
    if (stringStep.substring(0, 4) !== 'step') {
      throw 'Quest state parsing error.';
    }
    return parseInt(stringStep.substring(4), 10);
  }
}

export function ensureDough(goal: number) {
  while (availableAmount($item`wad of dough`) < goal) {
    buy(1, $item`all-purpose flower`);
    use(1, $item`all-purpose flower`);
  }
}

export function fuelAsdon(goal: number) {
  const startingFuel = getFuel();
  if (startingFuel > goal) return startingFuel;

  print(`Fueling asdon. Currently ${startingFuel} litres.`);
  const estimated = Math.floor((goal - startingFuel) / 5);
  const bread = availableAmount($item`loaf of soda bread`);
  ensureDough(estimated - bread);
  ensureItem(estimated - bread, $item`soda water`);
  ensureCreateItem(estimated, $item`loaf of soda bread`);
  cliExecute(`asdonmartin fuel ${estimated} loaf of soda bread`);
  while (getFuel() < goal) {
    ensureDough(1);
    ensureItem(1, $item`soda water`);
    ensureCreateItem(1, $item`loaf of soda bread`);
    cliExecute('asdonmartin fuel 1 loaf of soda bread');
  }
  const endingFuel = getFuel();
  print(`Done fueling. Now ${endingFuel} litres.`);
  return endingFuel;
}

export function ensureAsdonEffect(ef: Effect) {
  if (haveEffect(ef) === 0) {
    fuelAsdon(37);
  }
  ensureEffect(ef);
}
