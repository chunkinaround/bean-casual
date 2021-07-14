import {
  print,
  getLocationMonsters,
  myLocation,
  toMonster,
  myMp,
  haveSkill,
  useSkill,
  myFamiliar,
  haveEffect,
  runaway,
  abort,
  handlingChoice,
  lastChoice,
  count,
  availableChoiceOptions,
  runChoice,
  adv1,
  choiceFollowsFight,
  inMultiFight,
  runCombat,
  visitUrl,
  removeProperty,
} from 'kolmafia';
import { $skill, $familiar, $effect, Macro as LibramMacro, set, get } from 'libram';
import { myFamiliarWeight } from './lib';

// multiFight() stolen from Aenimus: https://github.com/Aenimus/aen_cocoabo_farm/blob/master/scripts/aen_combat.ash.
// Thanks! Licensed under MIT license.
function multiFight() {
  while (inMultiFight()) runCombat();
  if (choiceFollowsFight()) visitUrl('choice.php');
}

export class Macro extends LibramMacro {
  submit() {
    print(`Submitting macro: ${this.toString()}`);
    return super.submit();
  }

  kill() {
    return this.skill($skill`Stuffed Mortar Shell`)
      .skill($skill`Saucestorm`)
      .skill($skill`Saucegeyser`)
      .repeat()
      .skill($skill`Saucestorm`)
      .repeat();
  }

  static kill() {
    return new Macro().kill();
  }

  runaway() {
    return this.step('runaway');
  }

  static runaway() {
    return new Macro().runaway();
  }
}

export const MODE_NULL = '';
export const MODE_MACRO = 'macro';
export const MODE_FIND_MONSTER_THEN = 'findthen';
export const MODE_RUN_UNLESS_FREE = 'rununlessfree';
export const MODE_RUN_UNLESS_MONSTER = 'rununlessmon';

export function setMode(mode: string, arg1: string | null = null, arg2: string | null = null) {
  set('bcas_combatMode', mode);
  if (arg1 !== null) set('bcas_combatArg1', arg1);
  if (arg2 !== null) set('bcas_combatArg2', arg2);
}

export function getMode() {
  return get('bcas_combatMode');
}

export function getArg1() {
  return get<string>('bcas_combatArg1');
}

export function getArg2() {
  return get<string>('bcas_combatArg2');
}

function banishedMonsters() {
  const banishedstring = get('banishedMonsters');
  const banishedComponents = banishedstring.split(':');
  const result: { [index: string]: Monster } = {};
  if (banishedComponents.length < 3) return result;
  for (let idx = 0; idx < banishedComponents.length / 3 - 1; idx++) {
    const foe = Monster.get(banishedComponents[idx * 3]);
    const banisher = banishedComponents[idx * 3 + 1];
    print(`Banished ${foe.name} using ${banisher}`);
    result[banisher] = foe;
  }
  return result;
}

function usedBanisherInZone(banished: { [index: string]: Monster }, banisher: string, loc: Location) {
  print(`Checking to see if we've used ${banisher} in ${loc}.`);
  if (banished[banisher] === undefined) return false;
  print(`Used it to banish ${banished[banisher].name}`);
  return getLocationMonsters(loc)[banished[banisher].name] === undefined;
}

export function main(initialRound: number, foe: Monster) {
  const mode = getMode();
  const loc = myLocation();
  if (mode === MODE_MACRO) {
    Macro.load().submit();
  } else if (mode === MODE_FIND_MONSTER_THEN) {
    const monsterId = parseInt(getArg1(), 10);
    const desired = toMonster(monsterId);
    const banished = banishedMonsters();
    if (foe === desired) {
      Macro.load().submit();
    } else if (
      myMp() >= 50 &&
      haveSkill($skill`Snokebomb`) &&
      get('_snokebombUsed') < 3 &&
      !usedBanisherInZone(banished, 'snokebomb', loc)
    ) {
      useSkill(1, $skill`Snokebomb`);
    } else if (
      haveSkill($skill`Reflex Hammer`) &&
      get('ReflexHammerUsed') < 3 &&
      !usedBanisherInZone(banished, 'Reflex Hammer', loc)
    ) {
      useSkill(1, $skill`Reflex Hammer`);
    } else if (haveSkill($skill`Macrometeorite`) && get('_macrometeoriteUses') < 10) {
      useSkill(1, $skill`Macrometeorite`);
    } else if (haveSkill($skill`CHEAT CODE: Replace Enemy`) && get('_powerfulGloveBatteryPowerUsed') <= 80) {
      const originalBattery = get('_powerfulGloveBatteryPowerUsed');
      useSkill(1, $skill`CHEAT CODE: Replace Enemy`);
      const newBattery = get('_powerfulGloveBatteryPowerUsed');
      if (newBattery === originalBattery) {
        print('WARNING: Mafia is not updating PG battery charge.');
        set('_powerfulGloveBatteryPowerUsed', newBattery + 10);
      }
      // At this point it comes back to the consult script.
    }
  } else if (mode === MODE_RUN_UNLESS_MONSTER) {
    const monsterId = parseInt(getArg1(), 10);
    const desired = toMonster(monsterId);
    if (foe === desired) {
      print('foe found.');
      Macro.load().submit();
    } else print('foe not found');
    runaway();
  } else if (mode === MODE_RUN_UNLESS_FREE) {
    if (foe.attributes.includes('FREE')) {
      print(get('libram_savedMacro'));
      Macro.load().submit();
    } else if (
      myFamiliar() === $familiar`Frumious Bandersnatch` &&
      haveEffect($effect`Ode to Booze`) > 0 &&
      get('_banderRunaways') < myFamiliarWeight() / 5
    ) {
      const banderRunaways = get('_banderRunaways');
      runaway();
      if (get('_banderRunaways') === banderRunaways) {
        print('WARNING: Mafia is not tracking bander runaways correctly.');
        set('_banderRunaways', banderRunaways + 1);
      }
    } else if (haveSkill($skill`Reflex Hammer`) && get('_reflexHammerUsed') < 3) {
      useSkill(1, $skill`Reflex Hammer`);
    } else if (myMp() >= 50 && haveSkill($skill`Snokebomb`) && get('_snokebombUsed') < 3) {
      useSkill(1, $skill`Snokebomb`);
    } else {
      // non-free, whatever
      runaway();
    }
  } else {
    abort('Unrecognized mode.');
  }
}

export function saberYr() {
  if (!handlingChoice()) abort('No choice?');
  if (lastChoice() === 1387 && count(availableChoiceOptions()) > 0) {
    runChoice(3);
  }
}

export function adventureMode(loc: Location, mode: string, arg1: string | null = null, arg2: string | null = null) {
  setMode(mode, arg1, arg2);
  try {
    adv1(loc, -1, '');
    multiFight();
  } finally {
    setMode(MODE_NULL, '', '');
  }
}

export function adventureMacro(loc: Location, macro: Macro) {
  macro.save();
  try {
    adventureMode(loc, MODE_MACRO);
  } finally {
    Macro.clearSaved();
  }
}

export function findMonsterThen(loc: Location, foe: Monster, macro: Macro) {
  macro.save();
  setMode(MODE_FIND_MONSTER_THEN, foe.id.toString());
  try {
    set('bcas_combatFound', false);
    while (!get<boolean>('bcas_combatFound')) {
      adv1(loc, -1, '');
    }
  } finally {
    removeProperty('bcas_combatFound');
    setMode(MODE_NULL, '');
    Macro.clearSaved();
  }
}

export function findMonsterSaberYr(loc: Location, foe: Monster) {
  set('choiceAdventure1387', '3');
  findMonsterThen(loc, foe, Macro.skill($skill`Use the Force`));
}

export function adventureCopy(loc: Location, foe: Monster) {
  adventureMacro(
    loc,
    Macro.if_(`!monstername ${foe.name}`, 'abort')
      .trySkill($skill`Lecture on Relativity`)
      .kill()
  );
}

export function adventureRunUnlessFree(loc: Location) {
  setMode(MODE_RUN_UNLESS_FREE);
  adv1(loc, -1, '');
  setMode(MODE_NULL);
}

export function adventurefindMonsterElseRun(loc: Location, foe: Monster, macro: Macro) {
  macro.save();
  setMode(MODE_RUN_UNLESS_MONSTER, foe.id.toString());
  try {
    set('bcas_combatFound', false);
    while (!get<boolean>('bcas_combatFound')) {
      adv1(loc, -1, '');
    }
  } finally {
    removeProperty('bcas_combatFound');
    setMode(MODE_NULL, '');
    Macro.clearSaved();
  }
}
