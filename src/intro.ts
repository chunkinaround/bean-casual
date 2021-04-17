import { cliExecute, visitUrl, availableAmount, runChoice, getProperty, setProperty, use } from 'kolmafia';
import { $item } from 'libram';
import { setClan, tryUse, getCapped } from './lib';

export function intro() {
  setClan('Bonus Adventures from Hell');

  // Chateau juice bar
  visitUrl('place.php?whichplace=chateau&action=chateauDesk2');

  // Sell pork gems
  visitUrl('tutorial.php?action=toot');
  tryUse(1, $item`letter from King Ralph XI`);
  tryUse(1, $item`pork elf goodies sack`);

  tryUse(1, $item`astral six-pack`);

  // Buy antique accordion
  getCapped(1, $item`antique accordion`, 2500);

  // Initialize council.
  visitUrl('council.php');

  // All combat handled by our consult script (bcasCombat.ash).
  cliExecute('ccs bean-casual');

  // Mood handled in ASH.
  cliExecute('mood apathetic');

  // Upgrade saber for fam wt
  if (availableAmount($item`Fourth of May Cosplay Saber`) > 0) {
    visitUrl('main.php?action=may4');
    runChoice(4);
  }

  if (getProperty('boomBoxSong') !== 'Food Vibrations') {
    cliExecute('boombox food');
  }

  setProperty('cloverProtectActive', 'true');
  use(availableAmount($item`ten-leaf clover`), $item`ten-leaf clover`);

  setProperty('hpAutoRecovery', '0.8');
  setProperty('hpAutoRecovery', '0.3');
  setProperty('autoSatisfyWithNPCs', 'true');
  if (getProperty('_bittycar') == '') {
    use($item`BittyCar SoulCar`);
  }
}
