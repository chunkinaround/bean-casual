import { canAdv } from 'canadv.ash';
import { adventureMacro, adventureRunUnlessFree, Macro, adventurefindMonsterElseRun } from './combat';
import * as Combat from './combat';

import {
  clamp,
  drinkSafe,
  ensureEffect,
  get as getItem,
  getPropertyBoolean,
  getPropertyInt,
  questStep,
  maximizeCached,
  setChoice,
  tryEnsureSkill,
  tryEnsureSong,
  tryEnsureEffect,
  getCapped,
  shrug,
  ensureAsdonEffect,
  fuelAsdon,
} from './lib';
import {
  myMp,
  eat,
  getProperty,
  cliExecute,
  use,
  availableAmount,
  useFamiliar,
  myInebriety,
  abort,
  retrieveItem,
  visitUrl,
  runCombat,
  setProperty,
  adv1,
  mallPrice,
  create,
  haveFamiliar,
  weightAdjustment,
  familiarWeight,
  getCampground,
  print,
  equip,
  itemAmount,
  toString,
  runaway,
  council,
  toInt,
  myHp,
  myMaxhp,
  useSkill,
  lastMonster,
  numericModifier,
  myAscensions,
  maximize,
  haveEffect,
  runChoice,
  myAdventures,
  myHash,
  containsText,
} from 'kolmafia';
import { $item, $skill, $location, $familiar, $effect, $monster, get, set, have, $slot } from 'libram';
import { Z_ASCII } from 'node:zlib';

export function moodBaseline() {
  if (myMp() < 200) {
    eat(1, $item`magical sausage`);
  }
  // Stats.
  tryEnsureSkill($skill`Get Big`);

  // Combat.
  tryEnsureSkill($skill`Carol of the Hells`);

  // Elemental res.
  tryEnsureSkill($skill`Elemental Saucesphere`);
  tryEnsureSkill($skill`Astral Shell`);

  // Misc.
  tryEnsureSong($skill`The Polka of Plenty`);
  tryEnsureSkill($skill`Singer's Faithful Ocelot`);
  tryEnsureSkill($skill`Blood Bond`);
  tryEnsureSkill($skill`Empathy of the Newt`);
  tryEnsureSkill($skill`Leash of Linguini`);
}

export function moodNoncombat() {
  moodBaseline();
  ensureAsdonEffect($effect`Driving Stealthily`);
  tryEnsureSkill($skill`The Sonata of Sneakiness`);
  tryEnsureSkill($skill`Smooth Movement`);
  if (getPropertyBoolean('horseryAvailable') && getProperty('_horsery') !== 'dark horse') cliExecute('horsery dark');
}

export function addFamiliarWeight() {
  shrug($effect`Ur-Kel's Aria of Annoyance`);
  tryEnsureEffect($effect`Chorale of Companionship`);
  tryEnsureEffect($effect`Billiards Belligerence`);
  tryEnsureEffect($effect`Do I Know You From Somewhere?`);
  if (getCampground()['Witchess Set'] !== undefined && get('puzzleChampBonus') === 20 && !get('_witchessBuff')) {
    tryEnsureEffect($effect`Puzzle Champ`);
  }
  if (getCampground()['Witchess Set'] !== undefined && get('puzzleChampBonus') === 20 && !get('_witchessBuff')) {
    tryEnsureEffect($effect`Puzzle Champ`);
  }
}

export function billiards() {
  if (!canAdv($location`The Haunted Kitchen`)) {
    use(1, $item`telegram from Lady Spookyraven`);
  }

  while (availableAmount($item`Spookyraven billiards room key`) === 0) {
    useFamiliar($familiar`Exotic Parrot`);
    moodBaseline();
    maximizeCached('hot res 9 min, stench res 9 min, equip Kramco');
    adventureMacro($location`The Haunted Kitchen`, Macro.skill($skill`Saucestorm`).repeat());
  }

  while (availableAmount($item`Spookyraven library key`) === 0) {
    while (myInebriety() < 5 && availableAmount($item`astral pilsner`) > 0) {
      tryEnsureSong($skill`The Ode to Booze`);
      drinkSafe(1, $item`astral pilsner`);
    }

    ensureEffect($effect`Chalky Hand`);

    if (myInebriety() + 13 < 18) abort("Couldn't get enough pool skill.");

    setChoice(875, 1); // Welcome to our Ool Table
    setChoice(1436, 2); // Maps
    useFamiliar($familiar`Disgeist`);
    moodNoncombat();
    maximizeCached('-combat');
    adventureMacro($location`The Haunted Billiards Room`, Macro.skill($skill`Saucestorm`));
  }
}

export function airship() {
  if (questStep('questL10Garbage') < 7) {
    if (questStep('questL10Garbage') < 1) use(1, $item`enchanted bean`);

    const freeRunFamiliar = haveFamiliar($familiar`Frumious Bandersnatch`)
      ? $familiar`Frumious Bandersnatch`
      : $familiar`Pair of Stomping Boots`;
    if (!get<boolean>('_bcas_banderRunawaysUsed') && haveFamiliar(freeRunFamiliar)) {
      useFamiliar(freeRunFamiliar);
      moodNoncombat();
      addFamiliarWeight();
      maximizeCached('familiar weight, -combat');
      const myFamiliarWeight = familiarWeight(freeRunFamiliar) + weightAdjustment();

      while (
        questStep('questL10Garbage') < 7 &&
        getPropertyInt('_banderRunaways') < Math.floor(myFamiliarWeight / 5) &&
        (freeRunFamiliar !== $familiar`Frumious Bandersnatch` || tryEnsureSong($skill`The Ode to Booze`))
      ) {
        moodNoncombat();
        addFamiliarWeight();
        adventureMacro($location`The Penultimate Fantasy Airship`, Macro.runaway());
      }

      set('_bcas_banderRunawaysUsed', true);
    }
  }
}

function ensureFluffers(flufferCount: number) {
  const neededFluffers = flufferCount - availableAmount($item`stuffing fluffer`);
  const stuffingFlufferSources: [Item, number][] = [
    [$item`cashew`, 3],
    [$item`stuffing fluffer`, 1],
    [$item`cornucopia`, (1 / 3.5) * 3],
  ];
  stuffingFlufferSources.sort(([item1, mult1], [item2, mult2]) => mallPrice(item1) * mult1 - mallPrice(item2) * mult2);
  const [stuffingFlufferSource, sourceMultiplier] = stuffingFlufferSources[0];

  const neededOfSource = Math.ceil(neededFluffers * sourceMultiplier);
  getItem(neededOfSource, stuffingFlufferSource);
  if (stuffingFlufferSource === $item`cornucopia`) {
    use(neededOfSource, $item`cornucopia`);
  }
  if (stuffingFlufferSource !== $item`stuffing fluffer`) {
    create(neededFluffers, $item`stuffing fluffer`);
  }
}

export function war() {
  retrieveItem(1, $item`skeletal skiff`);
  retrieveItem(1, $item`beer helmet`);
  retrieveItem(1, $item`distressed denim pants`);
  retrieveItem(1, $item`bejeweled pledge pin`);

  while (getProperty('warProgress') === 'unstarted') {
    setChoice(142, 3); // Lookout Tower
    setChoice(1433, 3); // Maps
    useFamiliar($familiar`Disgeist`);
    moodNoncombat();
    maximizeCached('-combat, outfit Frat Warrior Fatigues');
    adventureRunUnlessFree($location`Hippy Camp`);
  }

  if (getPropertyInt('hippiesDefeated') < 1000) {
    const count = clamp((1000 - getPropertyInt('hippiesDefeated')) / 46, 0, 24);

    ensureFluffers(count);
    use(count, $item`stuffing fluffer`);
    while (getPropertyInt('hippiesDefeated') < 1000) {
      ensureFluffers(1);
      use(1, $item`stuffing fluffer`);
    }
  }

  if (getProperty('warProgress') !== 'finished') {
    moodBaseline();
    maximizeCached('outfit Frat Warrior Fatigues');
    Combat.setMode(Combat.MODE_MACRO);
    Macro.kill().save();
    visitUrl('bigisland.php?place=camp&whichcamp=1');
    visitUrl('bigisland.php?action=bossfight');
    runCombat();
    Combat.setMode(Combat.MODE_NULL);
  }
}

export function dailyDungeon() {
  while (availableAmount($item`fat loot token`) < 2 && !getPropertyBoolean('dailyDungeonDone')) {
    if (availableAmount($item`fat loot token`) === 0) {
      getCapped(1, $item`daily dungeon malware`, 40000);
    }
    setChoice(690, 2); // Chest 5
    setChoice(691, 2); // Chest 10
    setChoice(692, 11); // Lockpicks
    setChoice(693, 2); // Eleven-foot pole
    moodBaseline();
    maximizeCached('equip Ring of Detect Boring Doors');
    adventureMacro(
      $location`The Daily Dungeon`,
      Macro.externalIf(!get('_dailyDungeonMalwareUsed'), Macro.tryItem($item`daily dungeon malware`)).kill()
    );
  }
}

export function ores() {
  if (!canAdv($location`Lair of the Ninja Snowmen`)) {
    visitUrl('place.php?whichplace=mclargehuge&action=trappercabin');
    retrieveItem(3, Item.get(getProperty('trapperOre')));
    retrieveItem(3, $item`goat cheese`);
    visitUrl('place.php?whichplace=mclargehuge&action=trappercabin');
  }
}

export function bridge() {
  if (getPropertyInt('chasmBridgeProgress') < 30) {
    const count = (34 - getPropertyInt('chasmBridgeProgress')) / 5;
    getCapped(count, $item`smut orc keepsake box`, 20000);
    use(count, $item`smut orc keepsake box`);
    visitUrl(`place.php?whichplace=orc_chasm&action=bridge${getProperty('chasmBridgeProgress')}`);
  }
}

export function aboo() {
  let theoreticalProgress = getPropertyInt('booPeakProgress') - 30 * availableAmount($item`A-Boo Clue`);
  while (theoreticalProgress > 0) {
    // while blasts through intro adventure here...
    retrieveItem(1, $item`ten-leaf clover`);
    setProperty('cloverProtectActive', 'false');
    adv1($location`A-Boo Peak`, -1, '');
    setProperty('cloverProtectActive', 'true');
    theoreticalProgress = getPropertyInt('booPeakProgress') - 30 * availableAmount($item`A-Boo Clue`);
  }

  while (getPropertyInt('booPeakProgress') > 0 && availableAmount($item`A-Boo Clue`) > 0) {
    maximizeCached('0.1hp, spooky res, cold res');
    use(1, $item`A-Boo Clue`);
    adv1($location`A-Boo Peak`, -1, '');
  }
  if (getPropertyBoolean('booPeakLit') == false) {
    adv1($location`A-Boo Peak`, -1, '');
  }
}

export function blackForest() {
  while (questStep('questL11Black') < 2) {
    setChoice(924, 1);
    useFamiliar($familiar`Reassembled Blackbird`);
    moodBaseline();
    maximizeCached('0.1 combat rate 5 min, equip blackberry galoshes');
    adventureMacro($location`The Black Forest`, Macro.kill());
  }

  if (questStep('questL11Black') < 3) {
    retrieveItem(1, $item`forged identification documents`);
    retrieveItem(1, $item`bitchin' meatcar`);
    adv1($location`The Shore, Inc.Travel Agency`, -1, '');
  }
}

export function shen() {
  if (questStep('questL11Shen') < 1) {
    maximizeCached('mainstat');
    Macro.kill().save();
    adventureRunUnlessFree($location`The Copperhead Club`);
  }
}

export function bossbat() {
  if (questStep('questL04Bat') < 3) {
    use(3, $item`sonar in a biscuit`);
  }
  while (questStep('questL04Bat') < 4) {
    equip($item`Greatest American Pants`);
    adventureMacro($location`The Boss Bat's Lair`, Macro.if_(`monstername Boss Bat`, Macro.kill()).runaway());
  }
}

export function prezeppelin() {
  if (questStep('questL11Ron') < 2) {
    retrieveItem(1, $item`lynyrdskin tunic`);
    retrieveItem(1, $item`lynyrdskin cap`);
    retrieveItem(1, $item`lynyrdskin breeches`);
    retrieveItem(1, $item`lynyrd musk`);
    use(1, $item`lynyrd musk`);
    equip($item`lynyrdskin tunic`);
    equip($item`lynyrdskin cap`);
    equip($item`lynyrdskin breeches`);
    setProperty('cloverProtectActive', 'false');
    setChoice(856, 1); // Go to Lynyrd
    setChoice(866, 1); // scare Lynyrd
    retrieveItem(4, $item`ten-leaf clover`);
  }

  while (questStep('questL11Ron') < 2) {
    adv1($location`A Mob of Zeppelin Protesters`, -1, '');
  }
  setProperty('cloverProtectActive', 'true');
  if (questStep('questL11Ron') < 2) {
    abort('Somehow you did not clear protesters as planned');
  }
}

export function trapperpeak() {
  if (questStep('questL08Trapper') === 2) {
    retrieveItem(1, $item`ninja rope`);
    retrieveItem(1, $item`ninja carabiner`);
    retrieveItem(1, $item`ninja crampons`);
    visitUrl('place.php?whichplace=mclargehuge&action=cloudypeak');
  }
  Combat.setMode(Combat.MODE_MACRO);
  Macro.kill().save();
  while (questStep('questL08Trapper') < 5) {
    adv1($location`Mist-Shrouded Peak`, -1, '');
  }
  visitUrl('place.php?whichplace=mclargehuge&action=trappercabin');
}

export function friars() {
  if (questStep('questL06Friar') < 2) {
    useFamiliar($familiar`Disgeist`);
    equip($item`Greatest American Pants`);
    while (itemAmount($item`dodecagram`) < 1) {
      moodNoncombat();
      maximizeCached('-combat, +equip Greatest American Pants');
      Macro.kill().save();
      adventureRunUnlessFree($location`The Dark Neck of the Woods`);
      cliExecute('refresh inv');
    }
    while (itemAmount($item`box of birthday candles`) < 1) {
      moodNoncombat();
      maximizeCached('-combat, +equip Greatest American Pants');
      adventureRunUnlessFree($location`The Dark Heart of the Woods`);
      cliExecute('refresh inv');
    }
    while (itemAmount($item`eldritch butterknife`) < 1) {
      moodNoncombat();
      maximizeCached('-combat, +equip Greatest American Pants');
      adventureRunUnlessFree($location`The Dark Elbow of the Woods`);
      cliExecute('refresh inv');
    }
    //this didnt work?
    visitUrl('friars.php?action=ritual');
  }
}

export function goblinking() {
  if (questStep('questL05Goblin') < 2) {
    while (itemAmount($item`Knob Goblin encryption key`) < 1 && questStep('questL05Goblin') === 0) {
      Macro.kill().save();
      adventureRunUnlessFree($location`The Outskirts of Cobb's Knob`);
      cliExecute('refresh inv');
    }
    if (questStep('questL05Goblin') === 0) {
      use(1, $item`Cobb's Knob map`);
    }
    ensureEffect($effect`Knob Goblin perfume`);
    equip($item`Knob Goblin Harem veil`);
    equip($item`Knob Goblin harem Pants`);
    Macro.kill().save();
    //Kill didnt work here
    adventureMacro($location`Throne Room`, Macro.kill());
  }
}

export function steelmarg() {
  if (questStep('questM10Azazel') < 3) {
    visitUrl('friars.php?action=ritual');
    if (questStep('questM10Azazel') == -1) {
      visitUrl('pandamonium.php');
      visitUrl('pandamonium.php?action=moan');
      visitUrl('pandamonium.php?action=infe');
      visitUrl('pandamonium.php?action=sven');
      visitUrl('pandamonium.php?action=sven');
      visitUrl('pandamonium.php?action=beli');
      visitUrl('pandamonium.php?action=mourn');
    }
    useFamiliar($familiar`Ms. Puck Man`);
    while (
      itemAmount($item`Observational Glasses`) < 1 &&
      itemAmount($item`Azazel's lollipop`) == 0 &&
      questStep('questM10Azazel') == 0
    ) {
      maximizeCached('+combat');
      ensureAsdonEffect($effect`Driving Obnoxiously`);
      ensureEffect($effect`Musk of the Moose`);
      tryEnsureSong($skill`Carlweather's Cantata of Confrontation`);
      adventureMacro($location`The Laugh Floor`, Macro.kill());
      cliExecute('refresh inv');
    }
    if (itemAmount($item`Azazel's lollipop`) == 0 && questStep('questM10Azazel') == 0) {
      equip($item`Observational Glasses`);
      visitUrl('pandamonium.php?action=mourn&whichitem=' + toInt($item`Observational Glasses`));
    }
    while (
      itemAmount($item`Azazel's Unicorn`) == 0 &&
      itemAmount($item`Azazel's Tutu`) == 0 &&
      questStep('questM10Azazel') == 0
    ) {
      maximizeCached('-combat');
      moodNoncombat();
      var jim: number = 0;
      var flargwurm: number = 0;
      var bognort: number = 0;
      var stinkface: number = 0;
      var need: number = 4;
      if (itemAmount($item`Comfy Pillow`) > 0) {
        jim = toInt($item`Comfy Pillow`);
        need -= 1;
      }
      if (itemAmount($item`Booze-Soaked Cherry`) > 0) {
        flargwurm = toInt($item`Booze-Soaked Cherry`);
        need -= 1;
      }
      if (itemAmount($item`Giant Marshmallow`) > 0) {
        bognort = toInt($item`Giant Marshmallow`);
        need -= 1;
      }
      if (itemAmount($item`Beer-Scented Teddy Bear`) > 0) {
        stinkface = toInt($item`Beer-Scented Teddy Bear`);
        need -= 1;
      }
      if (need > 0) {
        var cake: number = itemAmount($item`Sponge Cake`);
        if (jim == 0 && cake > 0) {
          jim = toInt($item`Sponge Cake`);
          need -= 1;
          cake -= 1;
        }
        if (flargwurm == 0 && cake > 0) {
          flargwurm = toInt($item`Sponge Cake`);
          need -= 1;
          cake -= 1;
        }
        var paper: number = itemAmount($item`Gin-Soaked Blotter Paper`);
        if (bognort == 0 && paper > 0) {
          bognort = toInt($item`Gin-Soaked Blotter Paper`);
          need -= 1;
          paper -= 1;
        }
        if (stinkface == 0 && paper > 0) {
          stinkface = toInt($item`Gin-Soaked Blotter Paper`);
          need -= 1;
          paper -= 1;
        }
      }
      print(`Still need ${need}`, 'blue');
      if (need == 0 && itemAmount($item`Azazel's Unicorn`) == 0) {
        //Give the bandmembers their items
        visitUrl('pandamonium.php?action=sven');
        visitUrl('pandamonium.php?action=sven&bandmember=Jim&togive=' + jim + '&preaction=try');
        visitUrl('pandamonium.php?action=sven');
        visitUrl('pandamonium.php?action=sven&bandmember=Flargwurm&togive=' + flargwurm + '&preaction=try');
        visitUrl('pandamonium.php?action=sven');
        visitUrl('pandamonium.php?action=sven&bandmember=Bognort&togive=' + bognort + '&preaction=try');
        visitUrl('pandamonium.php?action=sven');
        visitUrl('pandamonium.php?action=sven&bandmember=Stinkface&togive=' + stinkface + '&preaction=try');
      } else {
        adventureMacro($location`Infernal Rackets Backstage`, Macro.kill());
        cliExecute('refresh inv');
      }
      //Time to finish this up.
    }
    if (itemAmount($item`Azazel's Tutu`) == 0 && questStep('questM10Azazel') == 0) {
      retrieveItem(5, $item`Bus Pass`);
      retrieveItem(5, $item`Imp Air`);
      visitUrl('pandamonium.php?action=moan');
      visitUrl('pandamonium.php?action=temp');
    }
    if (itemAmount($item`steel margarita`) < 1) {
      abort('You should have had a steel margarita here?');
    }
  }
  if (itemAmount($item`steel margarita`) == 1) {
    drinkSafe(1, $item`steel margarita`);
  }
}

export function twinpeak() {
  if (getPropertyInt('twinPeakProgress') == 0) {
    setProperty('choiceAdventure604', '1'); //welcome NC to twin peak step 1 = "continue"
    setProperty('choiceAdventure605', '1'); //welcome NC to twin peak step 2 = "everything goes black"
    setProperty('choiceAdventure607', '1'); //finish stench / room 237
    setProperty('choiceAdventure608', '1'); //finish food drop / pantry
    setProperty('choiceAdventure609', '1'); //do jar of oil / sound of music... goto 616
    setProperty('choiceAdventure616', '1'); //finish jar of oil / sound of music
    setProperty('choiceAdventure610', '1'); //do init / "who's that" / "to catch a killer"... goto 1056
    setProperty('choiceAdventure1056', '1'); //finish init / "now it's dark"
    setProperty('choiceAdventure618', '2'); //burn this hotel pity NC to skip the zone if you spent over 50 adventures there.
    retrieveItem(4, $item`rusty hedge trimmer`);
  }

  if (getPropertyInt('twinPeakProgress') == 0) {
    cliExecute('maximize stench res');
    setProperty('choiceAdventure606', '1');
    cliExecute('use rusty hedge trimmer');
  }

  if (getPropertyInt('twinPeakProgress') == 1) {
    cliExecute('maximize item');
    setProperty('choiceAdventure606', '2');
    cliExecute('use rusty hedge trimmer');
  }
  if (getPropertyInt('twinPeakProgress') == 3) {
    cliExecute('acquire jar of oil');
    setProperty('choiceAdventure606', '3');
    cliExecute('use rusty hedge trimmer');
  }
  if (getPropertyInt('twinPeakProgress') == 7) {
    cliExecute('maximize init, -equip helps-you-sleep');
    setProperty('choiceAdventure606', '4');
    cliExecute('use rusty hedge trimmer');
  }
  if (questStep('questL09Topping') == 3) {
    visitUrl('place.php?whichplace=highlands&action=highlands_dude');
    council();
  }
}
export function mosquito() {
  setChoice(502, 2);
  setChoice(505, 1);
  Macro.kill().save();
  while (questStep('questL02Larva') == 0) {
    if ($location`The Spooky Forest`.turnsSpent > 5) {
      moodNoncombat();
      maximizeCached('-combat, +equip greatest american pants');
      useFamiliar($familiar`Disgeist`);
      adventureRunUnlessFree($location`The Spooky Forest`);
    } else {
      useFamiliar($familiar`Artistic Goth Kid`);
      adventureRunUnlessFree($location`The Spooky Forest`);
    }
    if ($location`The Spooky Forest`.turnsSpent > 10) {
      abort();
    }
  }
}

export function UnlockTemple() {
  if (questStep('questM16Temple') > 2) {
    return;
  }
  useFamiliar($familiar`Disgeist`);
  retrieveItem(1, $item`Spooky-Gro fertilizer`);
  while (itemAmount($item`spooky sapling`) == 0) {
    moodNoncombat();
    maximizeCached('-combat, +equip greatest american pants');
    setChoice(502, 1);
    setChoice(503, 3);
    setChoice(504, 3);
    adventureRunUnlessFree($location`The Spooky Forest`);
  }
  while (itemAmount($item`tree-holed coin`) == 0 && itemAmount($item`Spooky Temple map`) == 0) {
    moodNoncombat();
    maximizeCached('-combat, +equip greatest american pants');
    print('getting tree coin', 'blue');
    setChoice(502, 2);
    setChoice(505, 2);
    adventureRunUnlessFree($location`The Spooky Forest`);
  }
  while (itemAmount($item`Spooky Temple map`) == 0) {
    moodNoncombat();
    maximizeCached('-combat, +equip greatest american pants');
    setChoice(502, 3);
    setChoice(506, 3);
    setChoice(507, 1);
    print('getting temple map', 'blue');
    adventureRunUnlessFree($location`The Spooky Forest`);
  }
  if (
    itemAmount($item`spooky sapling`) > 0 &&
    itemAmount($item`Spooky-Gro fertilizer`) > 0 &&
    itemAmount($item`Spooky Temple map`) > 0
  ) {
    print('using map', 'blue');
    //set choiceadvs for normal adventuring
    setChoice(502, 3);
    setChoice(506, 1);
    setChoice(26, 2);
    setChoice(28, 2);
    use(1, $item`Spooky Temple map`);
  } else {
    abort();
  }
}

export function spookylibrary() {
  if (questStep('questM20Necklace') == 3) {
    equip($item`Latte lovers member's mug`);
    equip($item`Lil' Doctor™ bag`, $slot`acc1`);
    while (itemAmount($item`Lady Spookyraven's necklace`) == 0) {
      //Lady Spookyraven's necklace
      adventureMacro(
        $location`The Haunted Library`,
        Macro.if_('monstername bookbat', Macro.skill('Reflex Hammer'))
          .if_('monstername banshee librarian', Macro.skill('Throw Latte on Opponent'))
          .if_('monstername writing desk', Macro.kill())
      );
      cliExecute('refresh inv');
    }
  }
}
export function opencity() {
  if (questStep('questL11Worship') == 1) {
    use($item`stone wool`);
    setChoice(582, 1);
    setChoice(579, 2);
    adv1($location`The Hidden Temple`, -1, '');
    use($item`stone wool`);
    visitUrl('adventure.php?snarfblat=280');
    visitUrl('choice.php?whichchoice=582&option=2&pwd');
    visitUrl('choice.php?whichchoice=580&option=2&pwd');
    visitUrl('choice.php?whichchoice=584&option=4&pwd');
    visitUrl('choice.php?whichchoice=580&option=1&pwd');
    visitUrl('choice.php?whichchoice=123&option=2&pwd');
    visitUrl('choice.php');
    cliExecute('dvorak');
    visitUrl('choice.php?whichchoice=125&option=3&pwd');
  }
}
export function hiddencity() {
  useFamiliar($familiar`Melodramedary`);
  equip($item`dromedary drinking helmet`);
  if (questStep('questL11Worship') == 3) {
    equip($item`antique machete`);
    if (getPropertyInt('hiddenTavernUnlock') != myAscensions()) {
      use($item`book of matches`);
    }
    while (questStep('questL11Business') == -1) {
      adventureMacro($location`An Overgrown Shrine (Northeast)`, Macro.kill());
    }
    while (questStep('questL11Curses') == -1) {
      adventureMacro($location`An Overgrown Shrine (Northwest)`, Macro.kill());
    }
    while (questStep('questL11Doctor') == -1) {
      adventureMacro($location`An Overgrown Shrine (Southwest)`, Macro.kill());
    }
    while (questStep('questL11Spare') == -1) {
      adventureMacro($location`An Overgrown Shrine (Southeast)`, Macro.kill());
    }
  }
  if (questStep('questL11Spare') == 0) {
    retrieveItem(5, $item`bowling ball`);
    setChoice(788, 1);
    while (questStep('questL11Spare') < 1) {
      adventureMacro($location`The Hidden Bowling Alley`, Macro.kill());
    }
  }
  if (questStep('questL11Doctor') == 0) {
    setChoice(784, 1);
    equip($item`half-size scalpel`);
    equip($item`head mirror`);
    equip($item`surgical mask`, $slot`acc1`);
    equip($item`surgical apron`);
    equip($item`bloodied surgical dungarees`);
    while (questStep('questL11Doctor') < 1) {
      adventureMacro($location`The Hidden Hospital`, Macro.kill());
    }
  }
  if (questStep('questL11Curses') == 0) {
    equip($item`mafia middle finger ring`, $slot`acc1`);
    while (questStep('questL11Curses') < 1) {
      setChoice(780, 1);
      adventureMacro(
        $location`The Hidden Apartment Building`,
        Macro.if_('monstername pygmy janitor', Macro.skill('Show them your ring'))
          .if_('monstername pygmy witch lawyer', Macro.item('Louder Than Bomb'))
          .if_('monstername pygmy shaman', Macro.skill('Transcendent Olfaction').kill())
          .kill()
      );
    }
  }
  if (questStep('questL11Business') == 0) {
    setChoice(786, 1);
    if (getPropertyBoolean('_latteBanishUsed')) {
      cliExecute('latte refill vanilla ink pumpkin');
    }
    equip($item`Latte lovers member's mug`);
    while (questStep('questL11Business') < 1) {
      adventureMacro(
        $location`The Hidden Office Building`,
        //TODO: add logic to runaway if mclusky file is complete
        Macro.if_('monstername pygmy headhunter', Macro.skill('Throw Latte on Opponent').kill()).kill()
      );
    }
  }
  if (getPropertyInt('hiddenOfficeProgress') == 7) {
    adv1($location`An Overgrown Shrine (Northeast)`, -1, '');
  }
  if (getPropertyInt('hiddenApartmentProgress') == 7) {
    adv1($location`An Overgrown Shrine (Northwest)`, -1, '');
  }
  if (getPropertyInt('hiddenBowlingAlleyProgress') == 7) {
    adv1($location`An Overgrown Shrine (Southeast)`, -1, '');
  }
  if (getPropertyInt('hiddenHospitalProgress') == 7) {
    adv1($location`An Overgrown Shrine (Southwest)`, -1, '');
  }
  if (questStep('questL11Worship') == 4) {
    equip($item`antique machete`);
    setChoice(791, 1);
  }
  while (questStep('questL11Worship') == 4) {
    adventureMacro($location`A Massive Ziggurat`, Macro.kill());
  }
}

export function spookyLevel2() {
  if (itemAmount($item`Lady Spookyraven's necklace`) > 0 && questStep('questM20Necklace') == 4) {
    visitUrl('place.php?whichplace=manor1&action=manor1_ladys');
  }
  if (questStep('questM21Dance') == 99) {
    return;
  }
  //setting choices
  setChoice(880, 1); // Bedroom, Elegant Nightstand: Get Lady Spookyraven's finest gown
  setChoice(878, 3); //Bedroom, Ornate Nightstand: Get spectacles
  setProperty('louvreDesiredGoal', '7'); //"Haunted Gallery: Get Lady Spookyraven's dancing shoes"
  if (questStep('questM21Dance') == -1) {
    visitUrl('place.php?whichplace=manor2&action=manor2_ladys');
  }
  if (questStep('questM21Dance') < 2) {
    useFamiliar($familiar`Artistic Goth Kid`);
    Macro.kill().save;
    while (itemAmount($item`Lady Spookyraven's powder puff`) < 1) {
      moodNoncombat();
      maximizeCached('-combat, +equip greatest american pants, +equip kramco');
      adventureMacro(
        $location`The Haunted Bathroom`,
        Macro.if_('monstername cosmetics wraith', Macro.kill()).runaway()
      );
      cliExecute('refresh inv');
    }
    while (itemAmount($item`Lady Spookyraven's dancing shoes`) < 1) {
      moodNoncombat();
      maximizeCached('-combat, +equip greatest american pants, +equip kramco');
      Macro.kill().save();
      adventureRunUnlessFree($location`The Haunted Gallery`);
      cliExecute('refresh inv');
    }
    equip($item`Lil' Doctor™ bag`, $slot`acc1`);
    equip($item`Kremlin's Greatest Briefcase`, $slot`acc2`);
    while (itemAmount($item`Lady Spookyraven\'s finest gown`) < 1) {
      adventureMacro(
        $location`The Haunted Bedroom`,
        Macro.if_('monstername animated rustic nightstand', Macro.skill('Reflex Hammer'))
          .if_('monstername animated mahogany nightstand', Macro.skill('KGB tranquilizer dart'))
          .if_('monstername Wardröb nightstand', Macro.item('Louder Than Bomb'))
          .if_('monstername animated ornate nightstand', Macro.kill())
          .if_('monstername elegant animated nightstand', Macro.kill())
          .kill()
      );
    }
    if (
      itemAmount($item`Lady Spookyraven\'s finest gown`) == 1 &&
      itemAmount($item`Lady Spookyraven's dancing shoes`) == 1 &&
      itemAmount($item`Lady Spookyraven's powder puff`) == 1
    ) {
      visitUrl('place.php?whichplace=manor2&action=manor2_ladys');
    }
  }
  while (questStep('questM21Dance') == 3) {
    Macro.kill().save();
    adventureRunUnlessFree($location`The Haunted Ballroom`);
  }
}

export function wallofskin() {
  if (questStep('questL13Final') == 6) {
    useFamiliar($familiar`Imitation Crab`);
    cliExecute('restore hp');
    //Wall of Skin killing outfit
    equip($item`tiny bowler`);
    equip($item`Fourth of May Cosplay Saber`);
    equip($item`hot plate`);
    equip($item`bottle opener belt buckle`, $slot`acc1`);
    equip($item`hippy protest button`, $slot`acc1`);
    if (getPropertyBoolean('horseryAvailable') && getProperty('_horsery') !== 'pale horse') cliExecute('horsery pale');
    //Wall of Skin killing Effects
    ensureEffect($effect`Chalky Hand`);
    ensureEffect($effect`Jalapeño Saucesphere`);
    tryEnsureSong($skill`Psalm of Pointiness`);
    ensureEffect($effect`Scarysauce`);
    ensureEffect($effect`Spiky Shell`);
    while (myHp() < myMaxhp()) {
      useSkill($skill`Cannelloni Cocoon`);
    }
    adventureMacro(
      $location`Tower Level 1`,
      Macro.attack()
        .attack()
        .attack()
        .skill($skill`Shell Up`)
        .skill($skill`Sauceshell`)
    );
  }
}

export function wallofmeat() {
  if (questStep('questL13Final') == 7) {
    useFamiliar($familiar`hobo monkey`);
    //Wall of Skin killing outfit
    maximizeCached('meat drop');
    //Wall of Skin killing Effects
    ensureEffect($effect`Disco Leer`);
    tryEnsureSong($skill`Polka of Plenty`);
    ensureAsdonEffect($effect`Driving Observantly`);
    adventureMacro($location`Tower Level 2`, Macro.kill());
  }
}

export function wallofbones() {
  if (questStep('questL13Final') == 8) {
    maximizeCached('spell damage percent');
    equip($item`Space Trip safety headphones`, $slot`acc3`);
    //Wall of Bones killing Effects
    ensureAsdonEffect($effect`Driving Intimidatingly`);
    adventureMacro($location`Tower Level 3`, Macro.skill($skill`Garbage Nova`));
  }
  //Immediately being confident
  if (questStep('questL13Final') == 9) {
    visitUrl('place.php?whichplace=nstower&action=ns_08_monster4');
    visitUrl('choice.php?pwd=&whichchoice=1015&option=2');
  }
}

export function shadow() {
  if (questStep('questL13Final') == 10) {
    retrieveItem(10, $item`gauze garter`);
    //Wall of Skin killing outfit
    maximizeCached('hp');
    adventureMacro(
      $location`Tower Level 5`,
      Macro.item([$item`gauze garter`, $item`gauze garter`])
        .item([$item`gauze garter`, $item`gauze garter`])
        .item([$item`gauze garter`, $item`gauze garter`])
        .item([$item`gauze garter`, $item`gauze garter`])
        .item([$item`gauze garter`, $item`gauze garter`])
    );
  }
}
export function ns() {
  if (questStep('questL13Final') == 11) {
    retrieveItem(1, $item`Wand of Nagamar`);
    maximizeCached('moxie, -10ml, +equip fourth of may cosplay saber');
    adventureMacro($location`The Naughty Sorceress Chamber`, Macro.attack().repeat());
    if (lastMonster() == $monster`Naughty Sorceress`) {
      adventureMacro($location`The Naughty Sorceress Chamber`, Macro.attack().repeat());
    }
    if (lastMonster() == $monster`Naughty Sorceress`) {
      adventureMacro($location`The Naughty Sorceress Chamber`, Macro.attack().repeat());
    }
  }
}

export function crypt() {
  print('crypt');
  if (questStep('questL07Cyrptic') == 999) {
    return;
  }
  while (toInt(getProperty('cyrptAlcoveEvilness')) > 0) {
    maximizeCached('init, -equip Helps-You-Sleep');
    if (Math.round(numericModifier('initiative')) < 850) {
      cliExecute('gain 850 initiative 5000 maxmeatspent');
    }
    adventureMacro($location`The Defiled Alcove`, Macro.kill());
  }
  equip($item`Lil' Doctor™ bag`, $slot`acc1`);
  equip($item`Kremlin's Greatest Briefcase`, $slot`acc2`);
  while (toInt(getProperty('cyrptNicheEvilness')) > 0) {
    adventureMacro(
      $location`The Defiled Niche`,
      Macro.if_('monstername basic lihc', Macro.skill('Reflex Hammer'))
        .if_('monstername senile lihc', Macro.skill('KGB tranquilizer dart'))
        .if_('monstername slick lihc', Macro.item('Louder Than Bomb'))
        .if_('monstername dirty old lihc', Macro.kill())
        .if_('monstername gargantulihc', Macro.kill())
    );
  }
  while (toInt(getProperty('cyrptNookEvilness')) > 0) {
    maximizeCached('item, -equip champagne');
    tryEnsureSong($skill`Fat Leon's Phat Loot Lyric`);
    tryEnsureSkill($skill`Singer's Faithful Ocelot`);
    tryEnsureSkill($skill`The Spirit of Taking`);
    ensureAsdonEffect($effect`Driving Observantly`);
    useFamiliar($familiar`Grimstone Golem`);
    setChoice(1429, 2);
    if (Math.round(numericModifier('item drop')) < 400) {
      cliExecute('gain 400 item drop 5000 maxmeatspent');
    }
    while (itemAmount($item`evil eye`) > 0) {
      use(1, $item`evil eye`);
    }
    adventureMacro(
      $location`The Defiled Nook`,
      Macro.if_('monstername party skelteon', Macro.item('Louder Than Bomb')).kill()
    );
  }
}
export function unlockspookyL2() {
  /*
  if 
  while (questStep('questL10Garbage') == 7){
    maximizeCached('-combat, +equip Greatest American Pants, +equip amulet of extreme plot significance');
    adventureRunUnlessFree($location`The Dark Neck of the Woods`);
  }
*/
}
export function giants() {
  if (questStep('questL10Garbage') < 99) {
    useFamiliar($familiar`Disgeist`);
    Macro.kill().save();
  }
  while (questStep('questL10Garbage') == 7) {
    maximizeCached('-combat, +equip Greatest American Pants, +equip amulet of extreme plot significance');
    adventureRunUnlessFree($location`The Castle in the Clouds in the Sky (Basement)`);
  }
  useFamiliar($familiar`Artistic Goth Kid`);
  equip($item`Kramco Sausage-o-Matic™`);
  while (questStep('questL10Garbage') == 8) {
    adventureRunUnlessFree($location`The Castle in the Clouds in the Sky (Ground Floor)`);
  }
}

export function shen2() {
  if (getProperty('shenQuestItem') == 'The Stankara Stone') {
    equip($item`Greatest American Pants`);
    while (itemAmount($item`The Stankara Stone`) == 0) {
      adventureMacro(
        $location`The Batrat and Ratbat Burrow`,
        Macro.if_('monstername Batsnake', Macro.kill()).runaway()
      );
    }
  }
  while (questStep('questL11Shen') == 2 && itemAmount($item`The Stankara Stone`) == 1) {
    Macro.kill().save();
    adventureRunUnlessFree($location`The Copperhead Club`);
  }
  if (getProperty('shenQuestItem') == 'The First Pizza') {
    equip($item`Greatest American Pants`);
    if (itemAmount($item`li'l ninja costume`)) {
      useFamiliar($familiar`Trick-or-Treating Tot`);
      adventureMacro($location`Lair of the Ninja Snowmen`, Macro.kill());
    }
    while (itemAmount($item`The First Pizza`) == 0) {
      adventureMacro(
        $location`Lair of the Ninja Snowmen`,
        Macro.if_('monstername Frozen Solid Snake', Macro.kill()).runaway()
      );
    }
  }
  while (questStep('questL11Shen') == 4 && itemAmount($item`The First Pizza`) == 1) {
    Macro.kill().save();
    adventureRunUnlessFree($location`The Copperhead Club`);
  }
  if (getProperty('shenQuestItem') == "Murphy's Rancid Black Flag") {
    setChoice(677, 1); // Copper Feel use airshop
    setChoice(678, 1); //get the punks attention
    retrieveItem(1, $item`mohawk wig`);
    setChoice(1431, 4); // go to punks choice
    while (itemAmount($item`Murphy's Rancid Black Flag`) == 0) {
      moodNoncombat();
      maximizeCached('-combat, +equip Greatest American Pants, +equip mohawk wig');
      adventureMacro(
        $location`The Castle in the Clouds in the Sky (Top Floor)`,
        Macro.if_('monstername Burning Snake of Fire', Macro.kill()).runaway()
      );
    }
  }
  while (questStep('questL11Shen') == 6 && itemAmount($item`Murphy's Rancid Black Flag`) == 1) {
    Macro.kill().save();
    adventureRunUnlessFree($location`The Copperhead Club`);
  }
}

export function ron() {
  if (questStep('questL11Ron') >= 2) {
    retrieveItem(5, $item`glark cable`);
    retrieveItem(1, $item`Red Zeppelin ticket`);
  }
  while (questStep('questL11Ron') < 5) {
    adventureMacro(
      $location`The Red Zeppelin`,
      Macro.if_('monstername Red Snapper', Macro.item('divine champagne popper'))
        .if_('monstername Red Herring', Macro.item('Louder Than Bomb'))
        .externalIf(getPropertyInt('_glarkCableUses') < 5, Macro.item('glark cable'))
        .kill()
    );
  }
}

export function lordspooks() {
  print('lordspooks');
  if (questStep('questM21Dance') == 999 && questStep('questL11Manor') == 0) {
    print('lordspooks2');
    while (questStep('questL11Manor') == 0) {
      Macro.kill().save();
      adventureRunUnlessFree($location`The Haunted Ballroom`);
    }
  }
  if (questStep('questL11Manor') == 1) {
    visitUrl('place.php?whichplace=manor4&action=manor4_chamberwall');
    equip($item`Lord Spookyraven's spectacles`);
    use($item`recipe: mortar-dissolving solution`);
    if (getProperty('spookyravenRecipeUsed') != 'with_glasses') {
      abort();
    }
  }
  if (questStep('questL11Manor') == 2) {
    useFamiliar($familiar`Trick-or-Treating Tot`);
    maximize('item', false);
    tryEnsureSong($skill`Fat Leon's Phat Loot Lyric`);
    tryEnsureSkill($skill`Singer's Faithful Ocelot`);
    tryEnsureSkill($skill`The Spirit of Taking`);
    ensureAsdonEffect($effect`Driving Observantly`);
    if (getPropertyBoolean('_legendaryBeat') == false) {
      ensureEffect($effect`Clyde's Blessing`);
    }
    ensureEffect($effect`items.enh`);
    if (getPropertyBoolean('_steelyEyedSquintUsed') == false) {
      ensureEffect($effect`Steely-Eyed Squint`);
    }
    while (
      itemAmount($item`Chateau de Vinegar`) == 0 &&
      itemAmount($item`wine bomb`) == 0 &&
      itemAmount($item`unstable fulminate`) == 0
    ) {
      adventureMacro(
        $location`The Haunted Wine Cellar`,
        Macro.if_('monstername skeletal sommelier', Macro.item('Louder Than Bomb'))
          .if_('monstername mad wino', Macro.item('divine champagne popper'))
          .if_('monstername possessed wine rack', Macro.skill('Shattering Punch'))
          .if_('monstername The ghost of Jim Unfortunato', Macro.kill())
      );
    }
    while (
      itemAmount($item`blasting soda`) == 0 &&
      itemAmount($item`wine bomb`) == 0 &&
      itemAmount($item`unstable fulminate`) == 0
    ) {
      adventureMacro(
        $location`The Haunted Laundry Room`,
        Macro.if_('monstername possessed laundry press', Macro.item('Louder Than Bomb'))
          .if_('monstername plaid ghost', Macro.item('divine champagne popper'))
          .if_('monstername cabinet of Dr. Limpieza', Macro.kill())
      );
    }
    maximizeCached('ml');
    if (itemAmount($item`wine bomb`) == 0 && questStep('questL11Manor') == 2) {
      retrieveItem(1, $item`unstable fulminate`);
      equip($item`unstable fulminate`);
      while (itemAmount($item`wine bomb`) == 0) {
        adventureMacro(
          $location`The Haunted Boiler Room`,
          Macro.if_(
            'monstername coaltergeist',
            Macro.externalIf(getPropertyInt('_macrometeoriteUses') < 10, Macro.skill($skill`Macrometeorite`)).kill()
          )
            .if_(
              'monstername steam elemental',
              Macro.externalIf(getPropertyInt('_macrometeoriteUses') < 10, Macro.skill($skill`Macrometeorite`)).kill()
            )
            .if_('monstername monstrous boiler', Macro.kill())
        );
      }
    }
    if (itemAmount($item`wine bomb`) == 1 && questStep('questL11Manor') == 2) {
      visitUrl('place.php?whichplace=manor4&action=manor4_chamberwall');
    }
  }
  if (questStep('questL11Manor') == 3) {
    adventureMacro($location`Summoning Chamber`, Macro.kill());
  }
}

export function oilpeak() {
  if (getPropertyInt('oilPeakProgress') > 0) {
    maximizeCached('ml');
    while (getPropertyInt('oilPeakProgress') > 0) {
      adventureMacro($location`Oil Peak`, Macro.kill());
    }
  }
  while (getPropertyBoolean('oilPeakLit') == false) {
    adv1($location`Oil Peak`, -1, '');
  }
  if (
    getPropertyBoolean('oilPeakLit') == true &&
    getPropertyBoolean('booPeakLit') == true &&
    getPropertyInt('twinPeakProgress') == 15 &&
    questStep('questL09Topping') == 1
  ) {
    visitUrl('place.php?whichplace=highlands&action=highlands_dude');
    visitUrl('place.php?whichplace=highlands&action=highlands_dude');
  }
}

export function cranny() {
  if (getPropertyInt('cyrptCrannyEvilness') > 0) {
    maximizeCached('ml');
    moodNoncombat();
    setChoice(523, 4);
    ensureEffect($effect`Invisible Avatar`);
    while (getPropertyInt('cyrptCrannyEvilness') > 0) {
      adventureMacro($location`The Defiled Cranny`, Macro.kill());
    }
  }
  if (getPropertyInt('cyrptTotalEvilness') == 0 && questStep('questL07Cyrptic') < 999) {
    adventureMacro($location`Haert of the Cyrpt`, Macro.kill());
  }
}

export function rats() {
  if (questStep('questL03Rat') < 999) {
    maximizeCached('ml');
    moodNoncombat();
    ensureEffect($effect`Invisible Avatar`);
    //what should I do different here? just do a gain for each element?
    cliExecute('gain 20 cold damage 100 maxmeatspent');
    cliExecute('gain 20 hot damage 100 maxmeatspent');
    cliExecute('gain 20 stench damage 100 maxmeatspent');
    cliExecute('gain 20 sleaze damage 100 maxmeatspent');
    cliExecute('gain 20 spooky damage 100 maxmeatspent');
    tryEnsureSong($skill`Ur-Kel's Aria of Annoyance`);
    equip($item`Yuleviathan necklace`, $slot`acc3`);
    //set a ccs here
    cliExecute('ccs hobo');
    cliExecute('gain 300 monster level 1000 maxmeatspent');
    cliExecute('tavern quest faucet');
    //take it off here
    cliExecute('ccs bean-casual');
  }
}

export function palindrome() {
  if (itemAmount($item`Talisman o' Namsilat`) > 0 && questStep('questL11Palindome') < 1) {
    useFamiliar($familiar`Red-Nosed Snapper`);
    visitUrl('familiar.php?action=guideme&pwd');
    visitUrl(`choice.php?pwd&whichchoice=1396&option=1&cat=dude`);
    maximizeCached('-combat');
    moodNoncombat();
    cliExecute('uneffect On the Trail');
    equip($item`Talisman o' Namsilat`);
    retrieveItem($item`disposable instant camera`);
    while (
      itemAmount($item`photograph of God`) +
        itemAmount($item`photograph of a red nugget`) +
        itemAmount($item`photograph of a dog`) +
        itemAmount($item`photograph of an ostrich egg`) +
        itemAmount($item`"I Love Me, Vol. I"`) <
        5 &&
      questStep('questL11Palindome') < 1
    ) {
      adventureMacro(
        $location`Inside the Palindome`,
        Macro.if_(
          'monstername Bob Racecar',
          Macro.externalIf(haveEffect($effect`On the trail`) == 0, Macro.skill('Transcendent Olfaction'))
            .externalIf(itemAmount($item`photograph of a dog`) < 1, Macro.item($item`disposable instant camera`))
            .kill()
        )
          .if_(
            'monstername Racecar Bob',
            Macro.externalIf(haveEffect($effect`On the trail`) > 1, Macro.skill('Transcendent Olfaction'))
              .externalIf(itemAmount($item`photograph of a dog`) < 1, Macro.item($item`disposable instant camera`))
              .kill()
          )
          .if_('monstername Taco Cat', Macro.item('divine champagne popper'))
          .if_('monstername Tan Gnat', Macro.skill('Shattering Punch'))
          .if_(
            'monstername Flock of Stab-bats',
            Macro.externalIf(getPropertyInt('_macrometeoriteUses') < 10, Macro.skill($skill`Macrometeorite`)).kill()
          )
          .kill()
      );
    }
    use(1, $item`"I Love Me, Vol. I"`);
    visitUrl('place.php?whichplace=palindome&action=pal_drlabel');
    visitUrl('choice.php?pwd&whichchoice=872&option=1&photo1=2259&photo2=7264&photo3=7263&photo4=7265');
  }
  if (questStep('questL11Palindome') == 1) {
    use(1, $item`"2 Love Me, Vol. 2"`);
  }
  if (questStep('questL11Palindome') == 2) {
    visitUrl('place.php?whichplace=palindome&action=pal_mrlabel');
    retrieveItem($item`wet stunt nut stew`);
    visitUrl('place.php?whichplace=palindome&action=pal_mroffice');
  }
  if (questStep('questL11Palindome') == 5) {
    equip($item`Talisman o' Namsilat`, $slot`acc2`);
    equip($item`Mega Gem`, $slot`acc3`);
    useSkill($skill`Tongue of the Walrus`);
    cliExecute('restore HP');
    setChoice(131, 3);
    visitUrl('place.php?whichplace=palindome&action=pal_drlabel');
    runChoice(3);
    runCombat();
  }
}
export function desert() {
  if (getPropertyInt('desertExploration') < 100) {
    useFamiliar($familiar`Melodramedary`);
    equip($item`dromedary drinking helmet`);
    equip($item`Lil' Doctor™ bag`, $slot`acc1`);
    while (itemAmount($item`Worm-riding manual page`) < 15) {
      adventureMacro(
        $location`The Arid, Extra-Dry Desert`,
        Macro.externalIf(getPropertyInt('_chestXRayUsed') < 3, Macro.skill($skill`Chest X-Ray`))
          .externalIf(
            getPropertyBoolean('_gingerbreadMobHitUsed') == false,
            Macro.skill($skill`Gingerbread Mob Hit`).kill()
          )
          .kill()
      );
      cliExecute('refresh inv');
    }
    retrieveItem($item`killing jar`);
    retrieveItem($item`can of black paint`);
    retrieveItem($item`drum machine`);
    visitUrl('place.php?whichplace=desertbeach&action=db_gnasir');
    visitUrl('choice.php?whichchoice=805&option=1&pwd=');
    visitUrl('choice.php?whichchoice=805&option=2&pwd=');
    visitUrl('choice.php?whichchoice=805&option=2&pwd=');
    visitUrl('choice.php?whichchoice=805&option=2&pwd=');
    visitUrl('choice.php?whichchoice=805&option=1&pwd=');
    use($item`desert sightseeing pamphlet`, 2);
    use($item`drum machine`, 1);
    if (getPropertyInt('desertExploration') < 100) {
      abort('failed to finish the desert after using the drum machine?');
    }
  }
}

export function pyramid() {
  if (itemAmount($item`[2325]Staff Of Ed`) == 0) {
    cliExecute('make [2325]Staff Of Ed');
  }
  if (itemAmount($item`[2325]Staff Of Ed`) == 1) {
    visitUrl('place.php?whichplace=desertbeach&action=db_pyramid1');
  }
  moodNoncombat();
  maximizeCached('-combat, +equip Greatest American Pants');
  Macro.kill().save();
  while (questStep('questL11Pyramid') < 1) {
    adventureRunUnlessFree($location`The Upper Chamber`);
  }
  while (questStep('questL11Pyramid') < 3) {
    maximizeCached('item, -equip champagne');
    adventureMacro(
      $location`The Middle Chamber`,
      Macro.if_('monstername tomb servant', Macro.item('Louder Than Bomb'))
        .if_('monstername tomb asp', Macro.item('divine champagne popper'))
        .if_('monstername tomb rat', Macro.item('tangle of rat tails'))
        .if_('monstername rat king', Macro.kill())
    );
    retrieveItem($item`tangle of rat tails`);
  }
  if (getPropertyBoolean('pyramidBombUsed') == false) {
    var wheel: number = 10 - itemAmount($item`Crumbling Wooden Wheel`);
    retrieveItem($item`tomb ratchet`, wheel);
    var total: number = itemAmount($item`Crumbling Wooden Wheel`) + itemAmount($item`tomb ratchet`);
    if (total >= 10 && myAdventures() >= 4 && getPropertyBoolean('controlRoomUnlock') == true) {
      visitUrl('place.php?whichplace=pyramid&action=pyramid_control');
      var x: number = 0;
      while (x < 10) {
        if (itemAmount($item`Crumbling Wooden Wheel`) > 0) {
          visitUrl('choice.php?pwd&whichchoice=929&option=1&choiceform1=Use+a+wheel+on+the+peg&pwd=' + myHash());
        } else {
          visitUrl('choice.php?whichchoice=929&option=2&pwd');
        }
        x = x + 1;
        if (x == 3 || x == 7 || x == 10) {
          visitUrl(
            'choice.php?pwd&whichchoice=929&option=5&choiceform5=Head+down+to+the+Lower+Chambers+%281%29&pwd=' +
              myHash()
          );
        }
        if (x == 3 || x == 7) {
          visitUrl('place.php?whichplace=pyramid&action=pyramid_control');
        }
      }
    }
  }
  while (questStep('questL11Pyramid') < 99) {
    adventureMacro($location`The Lower Chamber`, Macro.kill());
  }
}

export function sorceressTowerTest() {
  council();
  if (getPropertyInt('nsContestants1') == -1) {
    maximizeCached('init, -equip Helps-You-Sleep');
    visitUrl('place.php?whichplace=nstower&action=ns_01_contestbooth');
    visitUrl('choice.php?pwd=&whichchoice=1003&option=1', true);
  }
  if (getPropertyInt('nsContestants2') == -1) {
    var statGoal: string = getProperty('nsChallenge1');
    maximizeCached(statGoal);
    cliExecute('gain 600 ' + statGoal + ' 5000 maxmeatspent');
    visitUrl('place.php?whichplace=nstower&action=ns_01_contestbooth');
    visitUrl('choice.php?pwd=&whichchoice=1003&option=2', true);
  }
  if (getPropertyInt('nsContestants3') == -1) {
    var elemGoal: string = getProperty('nsChallenge2');
    maximizeCached(elemGoal + ' damage, ' + elemGoal + ' spell damage');
    visitUrl('place.php?whichplace=nstower&action=ns_01_contestbooth');
    visitUrl('choice.php?pwd=&whichchoice=1003&option=3', true);
  }
  while (getPropertyInt('nsContestants1') > 0) {
    adventureMacro($location`Fastest Adventurer Contest`, Macro.kill());
  }
  var statComp: Location = $location`none`;
  switch (getProperty('nsChallenge1')) {
    case 'Mysticality':
      statComp = $location`Smartest Adventurer Contest`;
      break;
    case 'Moxie':
      statComp = $location`Smoothest Adventurer Contest`;
      break;
    case 'Muscle':
      statComp = $location`Strongest Adventurer Contest`;
      break;
  }
  while (getPropertyInt('nsContestants2') > 0) {
    adventureMacro(statComp, Macro.kill());
  }
  var elemComp: Location = $location`none`;
  switch (getProperty('nsChallenge2')) {
    case 'cold':
      elemComp = $location`Coldest Adventurer Contest`;
      break;
    case 'hot':
      elemComp = $location`Hottest Adventurer Contest`;
      break;
    case 'sleaze':
      elemComp = $location`Sleaziest Adventurer Contest`;
      break;
    case 'spooky':
      elemComp = $location`Spookiest Adventurer Contest`;
      break;
    case 'stench':
      elemComp = $location`Stinkiest Adventurer Contest`;
      break;
  }
  while (getPropertyInt('nsContestants3') > 0) {
    adventureMacro(elemComp, Macro.kill());
  }
  if (questStep('questL13Final') == 2) {
    visitUrl('place.php?whichplace=nstower&action=ns_01_contestbooth');
    visitUrl('choice.php?pwd=&whichchoice=1003&option=4', true);
  }
  if (questStep('questL13Final') == 3) {
    maximizeCached('all res');
    cliExecute('restore hp');
    if (containsText(visitUrl('place.php?whichplace=nstower'), 'ns_02_coronation')) {
      setChoice(1020, 1);
      setChoice(1021, 1);
      setChoice(1022, 1);
      visitUrl('place.php?whichplace=nstower&action=ns_02_coronation');
      visitUrl('choice.php?pwd=&whichchoice=1020&option=1', true);
      visitUrl('choice.php?pwd=&whichchoice=1021&option=1', true);
      visitUrl('choice.php?pwd=&whichchoice=1022&option=1', true);
    }
    visitUrl('place.php?whichplace=nstower&action=ns_03_hedgemaze');
    visitUrl('choice.php?pwd=&whichchoice=1005&option=2', true);
    visitUrl('choice.php?pwd=&whichchoice=1008&option=2', true);
    visitUrl('choice.php?pwd=&whichchoice=1011&option=2', true);
    visitUrl('choice.php?pwd=&whichchoice=1013&option=1', true);
    cliExecute('refresh quests');
  }
  if (questStep('questL13Final') == 5) {
    retrieveItem($item`Richard's Star Key`, 1);
    retrieveItem($item`Digital Key`, 1);
    retrieveItem($item`skeleton key`, 1);
    if (itemAmount($item`Boris's Key`) == 0) {
      setChoice(1414, 1);
    } else if (itemAmount($item`Jarlsberg's Key`) == 0) {
      setChoice(1414, 2);
    } else if (itemAmount($item`Sneaky Pete's Key`) == 0) {
      setChoice(1414, 3);
    }
    if (getPropertyBoolean('lockPicked') == false) {
      useSkill(1, $skill`Lock Picking`);
    }
    retrieveItem($item`Boris's Key`, 1);
    retrieveItem($item`Jarlsberg's Key`, 1);
    retrieveItem($item`Sneaky Pete's Key`, 1);
    visitUrl('place.php?whichplace=nstower_door&action=ns_lock1');
    visitUrl('place.php?whichplace=nstower_door&action=ns_lock2');
    visitUrl('place.php?whichplace=nstower_door&action=ns_lock3');
    visitUrl('place.php?whichplace=nstower_door&action=ns_lock4');
    visitUrl('place.php?whichplace=nstower_door&action=ns_lock5');
    visitUrl('place.php?whichplace=nstower_door&action=ns_lock6');
    visitUrl('place.php?whichplace=nstower_door&action=ns_doorknob');
  }
}
