import {
  setProperty,
  getProperty,
  myMeat,
  print,
  cliExecute,
  abort,
  visitUrl,
  myLevel,
  myAscensions,
  fileToBuffer,
  myInebriety,
  myFullness,
  council,
} from 'kolmafia';
import { get } from 'libram';
import { intro } from './intro';
import { level } from './level';
import {
  billiards,
  war,
  dailyDungeon,
  ores,
  bridge,
  aboo,
  blackForest,
  shen,
  airship,
  bossbat,
  prezeppelin,
  trapperpeak,
  friars,
  goblinking,
  twinpeak,
  UnlockTemple,
  spookyLevel2,
  steelmarg,
  mosquito,
  hiddencity,
  opencity,
  spookylibrary,
  wallofskin,
  wallofmeat,
  wallofbones,
  shadow,
  ns,
  crypt,
  giants,
  shen2,
  ron,
  lordspooks,
  oilpeak,
  cranny,
  rats,
  desert,
  palindrome,
  pyramid,
  sorceressTowerTest,
} from './quests';

export function main() {
  setProperty('bcas_objective', '');
  const dietScript = getProperty('bcas_diet');

  if (myMeat() > 5000000) {
    if (get('bcas_autoClosetMeat', false)) {
      const closetAmount = myMeat() - 5 * 1000 * 1000;
      print(`You have more than 5M liquid meat! Putting ${closetAmount} in the closet automatically.`, 'blue');
      cliExecute(`closet put ${closetAmount} meat`);
    } else {
      throw (
        'You have more than 5M liquid meat! ' +
        'Put it in the closet to avoid autoscend danger, or set bcas_autoClosetMeat to true and rerun.'
      );
    }
  }

  intro();
  level();
  council();
  print('Refreshing council quests...');
  visitUrl('council.php');

  if (myLevel() < 13) abort('Something went wrong in leveling!');

  if (parseInt(getProperty('bcas_lastStockedUp') || '0', 10) < myAscensions()) {
    print('Stocking up!');
    for (const line of fileToBuffer('data/bean-casual/pulls.txt').split('\n')) {
      print(`acquire ${line}`);
      if (line.length === 0) continue;
      cliExecute(`acquire ${line}`);
    }
    setProperty('bcas_lastStockedUp', `${myAscensions()}`);
  }

  airship();
  billiards();

  if (myInebriety() <= 5 && myFullness() <= 0) {
    if (dietScript === '') {
      abort('Set property "bcas_diet" with your diet script, or consume your diet and rerun.');
    }
    cliExecute(dietScript);
  }

  war();
  dailyDungeon();
  ores();
  bridge();
  aboo();
  blackForest();
  shen();
  spookylibrary();
  //spookyLevel2();
  bossbat();
  prezeppelin();
  trapperpeak();
  goblinking();
  friars();
  steelmarg();
  twinpeak();
  mosquito();
  giants();
  shen2();
  UnlockTemple();
  crypt();
  spookyLevel2();
  lordspooks();
  oilpeak();
  cranny();
  rats();
  opencity();
  hiddencity();
  ron();
  palindrome();
  desert();
  pyramid();
  sorceressTowerTest();
  wallofskin();
  wallofmeat();
  wallofbones();
  shadow();
  ns();

  setProperty('auto_abooclover', 'true');
  setProperty('auto_interrupt', 'false');
  //cliExecute('autoscend');
}
