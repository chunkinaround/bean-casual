import {
  myMp,
  eat,
  cliExecute,
  myPrimestat,
  myLevel,
  availableAmount,
  haveEffect,
  visitUrl,
  use,
  buy,
  totalFreeRests,
  haveFamiliar,
  useFamiliar,
  haveSkill,
  mallPrice,
  restoreHp,
  myMaxhp,
  retrieveItem,
  runCombat,
  handlingChoice,
  runChoice,
  print,
  myBasestat,
} from 'kolmafia';
import { $effect, $familiar, $item, $location, $monster, $skill, $stat, get } from 'libram';
import { MODE_MACRO, MODE_NULL, adventureCopy, setMode, Macro, adventureMacro } from './combat';
import { intro } from './intro';
import {
  tryEnsureSong,
  tryEnsureSkill,
  ensureEffect,
  tryEnsureEffect,
  getPropertyBoolean,
  trySynthesize,
  getPropertyInt,
  maximizeCached,
  setChoice,
} from './lib';

function levelMood() {
  if (myMp() < 200) {
    eat(1, $item`magical sausage`);
  }

  // Stats.
  tryEnsureSkill($skill`Song of Bravado`);
  tryEnsureSkill($skill`Get Big`);
  ensureEffect($effect`Having a Ball!`);
  ensureEffect($effect`Tomato Power`);
  ensureEffect($effect`Trivia Master`);
  ensureEffect($effect`Gr8ness`);
  tryEnsureEffect($effect`Favored by Lyle`);
  tryEnsureEffect($effect`Starry-Eyed`);
  tryEnsureSkill($skill`CHEAT CODE: Triple Size`);
  tryEnsureEffect($effect`You Learned Something Maybe!`);
  if ((get('daycareOpen') || get('_daycareToday')) && !get('_daycareSpa')) cliExecute(`daycare ${myPrimestat()}`);

  if (myMp() < 200) {
    eat(1, $item`magical sausage`);
  }
  if (myPrimestat() === $stat`Muscle`) {
    tryEnsureEffect($effect`Lack of Body-Building`);
    ensureEffect($effect`"Go Get 'Em, Tiger!"`);
    ensureEffect($effect`Phorcefullness`);
    ensureEffect($effect`Incredibly Hulking`);
  } else if (myPrimestat() === $stat`Mysticality`) {
    tryEnsureEffect($effect`"We're All Made of Starfish"`);
    tryEnsureSkill($skill`Inscrutable Gaze`);
    ensureEffect($effect`Glittering Eyelashes`);
    ensureEffect($effect`Mystically Oiled`);
    ensureEffect($effect`On The Shoulders Of Giants`);
  } else if (myPrimestat() === $stat`Moxie`) {
    tryEnsureEffect($effect`Pomp & Circumsands`);
    ensureEffect($effect`Butt-Rock Hair`);
    ensureEffect($effect`Superhuman Sarcasm`);
    ensureEffect($effect`Cock of the Walk`);
  }

  if (myMp() < 200) {
    eat(1, $item`magical sausage`);
  }

  // ML.
  tryEnsureSong($skill`"Ur-Kel's Aria of Annoyance"`);
  tryEnsureSkill($skill`Pride of the Puffin`);
  tryEnsureSkill($skill`"Drescher's Annoying Noise"`);

  // Combat.
  tryEnsureSkill($skill`Carol of the Hells`);
  ensureEffect($effect`Pisces in the Skyces`);

  // Misc.
  tryEnsureSong($skill`The Polka of Plenty`);
  tryEnsureSong($skill`"Singer's Faithful Ocelot"`);
  tryEnsureSkill($skill`Blood Bond`);
  tryEnsureSkill($skill`Empathy of the Newt`);
  tryEnsureSkill($skill`Leash of Linguini`);
  tryEnsureSkill($skill`Carol of the Thrills`);
  tryEnsureSkill($skill`Elemental Saucesphere`);
  tryEnsureSkill($skill`Astral Shell`);
}

export function level(useResources = true) {
  if (myLevel() >= 13) return;

  // Put on some basic gear.
  maximizeCached('mp');
  if (myMp() < 200 && availableAmount($item`magical sausage`) + availableAmount($item`magical sausage casing`) > 0) {
    eat(1, $item`magical sausage`);
  }

  // Start buffing. XP buffs first.
  if (myPrimestat() === $stat`Muscle`) {
    ensureEffect($effect`Muscle Unbound`);
    ensureEffect($effect`Purpose`);
    trySynthesize($effect`Synthesis: Movement`);
  } else if (myPrimestat() === $stat`Mysticality`) {
    ensureEffect($effect`Thaumodynamic`);
    ensureEffect($effect`Category`);
    trySynthesize($effect`Synthesis: Learning`);
  } else if (myPrimestat() === $stat`Moxie`) {
    ensureEffect($effect`So Fresh and So Clean`);
    ensureEffect($effect`Perception`);
    trySynthesize($effect`Synthesis: Style`);
  }

  // Campsite
  if (haveEffect($effect`That's Just Cloud-Talk, Man`) === 0) {
    visitUrl('place.php?whichplace=campaway&action=campaway_sky');
  }

  // Daycare
  if (getPropertyInt('_daycareGymScavenges') === 0) {
    // Free scavenge.
    visitUrl('choice.php?whichchoice=1336&option=2');
  }

  // Bastille first.
  if (getPropertyInt('_bastilleGames') === 0) {
    if (availableAmount($item`Bastille Battalion control rig`) === 0) {
      use(1, $item`Bastille Battalion control rig loaner voucher`);
    }
    cliExecute(`bastille ${myPrimestat() === $stat`Mysticality` ? 'myst' : myPrimestat()}`);
  }

  // Chateau rests.
  if (getPropertyBoolean('chateauAvailable')) {
    buy(1, $item`ceiling fan`);
    if (myPrimestat() === $stat`Muscle`) {
      buy(1, $item`electric muscle stimulator`);
    } else if (myPrimestat() === $stat`Mysticality`) {
      buy(1, $item`foreign language tapes`);
    } else if (myPrimestat() === $stat`Moxie`) {
      buy(1, $item`bowl of potpourri`);
    }
    // Chateau rest
    while (getPropertyInt('timesRested') < totalFreeRests()) {
      visitUrl('place.php?whichplace=chateau&action=chateau_restbox');
    }
  }

  cliExecute('breakfast');

  // LOV Tunnel
  if (get('loveTunnelAvailable') && !getPropertyBoolean('_loveTunnelUsed') && useResources) {
    useFamiliar($familiar`Galloping Grill`);
    const macro = Macro.if_(
      'monstername LOV Enforcer',
      Macro.while_('!pastround 20 && !hpbelow 200', Macro.attack().repeat()).kill()
    )
      .if_('monstername LOV Engineer', Macro.skill($skill`Saucegeyser`).repeat())
      .kill();

    setChoice(1222, 1); // Entrance
    setChoice(1223, 1); // Fight LOV Enforcer
    setChoice(1225, 1); // Fight LOV Engineer
    setChoice(1226, 2); // Open Heart Surgery
    setChoice(1227, 1); // Fight LOV Equivocator
    setChoice(1228, 3); // Take chocolate

    if (myPrimestat() === $stat`Muscle`) {
      setChoice(1224, 1); // LOV Eardigan
    } else if (myPrimestat() === $stat`Mysticality`) {
      setChoice(1224, 2); // LOV Epaulettes
    } else if (myPrimestat() === $stat`Moxie`) {
      setChoice(1224, 3); // LOV Earrings
    }

    adventureMacro($location`The Tunnel of L.O.V.E.`, macro);
    if (handlingChoice()) throw 'Did not get all the way through LOV.';
    visitUrl('choice.php');
    if (handlingChoice()) throw 'Did not get all the way through LOV.';
  }

  if (haveFamiliar($familiar`God Lobster`) && getPropertyInt('_godLobsterFights') < 3) {
    useFamiliar($familiar`God Lobster`);
    const useGg = haveSkill($skill`Giant Growth`) && mallPrice($item`green mana`) < 8000;

    while (getPropertyInt('_godLobsterFights') < 3) {
      maximizeCached('mainstat, 4exp, equip makeshift garbage shirt');
      // Get stats from the fight.
      setChoice(1310, 3);
      levelMood();
      restoreHp(myMaxhp());
      if (useGg && haveEffect($effect`Giant Growth`) === 0) retrieveItem(1, $item`green mana`);
      visitUrl('main.php?fightgodlobster=1');
      setMode(MODE_MACRO);
      Macro.externalIf(useGg && haveEffect($effect`Giant Growth`) === 0, 'skill Giant Growth')
        .kill()
        .save();
      runCombat();
      visitUrl('choice.php');
      if (handlingChoice()) runChoice(3);
      setMode(MODE_NULL);
    }
  }

  if (
    getPropertyInt('_sausageFights') === 0 &&
    haveFamiliar($familiar`Pocket Professor`) &&
    availableAmount($item`Kramco Sausage-o-Matic&trade;`) > 0
  ) {
    useFamiliar($familiar`Pocket Professor`);
    maximizeCached(
      'mainstat, 4 exp, 30 mainstat experience percent, 30 familiar weight, equip makeshift garbage shirt, equip Pocket Professor memory chip, equip Kramco'
    );
    levelMood();
    restoreHp(myMaxhp());
    tryEnsureEffect($effect`Chorale of Companionship`);
    tryEnsureEffect($effect`Billiards Belligerence`);
    tryEnsureEffect($effect`Do I Know You From Somewhere?`);
    tryEnsureEffect($effect`Oiled, Slick`) || tryEnsureEffect($effect`Oiled Up`);
    adventureCopy($location`"The Outskirts of Cobb's Knob"`, $monster`sausage goblin`);
  }

  while (getPropertyInt('_neverendingPartyFreeTurns') < 10) {
    if (!getPropertyBoolean('leafletCompleted') && myLevel() >= 9) {
      visitUrl('council.php');
      cliExecute('leaflet');
    }
    useFamiliar($familiar`Galloping Grill`);
    maximizeCached('mainstat, 4exp, equip makeshift garbage shirt');
    setChoice(1324, 5);
    levelMood();
    adventureMacro($location`The Neverending Party`, Macro.kill());
  }

  visitUrl('council.php');

  print('');
  print('Done leveling.', 'blue');
  print(`Reached mainstat ${myBasestat(myPrimestat())}`);
}

export function main() {
  intro();
  level(false);
}
