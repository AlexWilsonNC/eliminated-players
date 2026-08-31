const fs = require('fs');
const path = require('path');

// ============================================================
// CHOOSE FILE HERE
// ============================================================

const INPUT_FILE = path.resolve(
  __dirname,
  './2026/worlds.json'
);

// ============================================================
// ALLOWED SETS
// ============================================================

const ALLOWED_SETS = new Set([
  'PBL',
  'CRI',
  'POR',
  'ASC',
  'PFL',
  'MEG',
  'MEP',
  'BLK',
  'WHT',
  'DRI',
  'JTG',
  'PRE',
  'SSP',
  'SCR',
  'SFA',
  'TWM',
  'TEF',
  'SVE',
  'PR-SV'
]);

// Only inspect these decklist sections.
// Energy intentionally ignored.
const CARD_TYPES = [
  'pokemon',
  'trainer'
];

const DIVISIONS = [
  'masters',
  'seniors',
  'juniors',
  'professors',
  'olderSeniors',
  'youngSeniors',
  'all'
];

function loadEventFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`Could not parse file: ${filePath}`);
    console.error(err.message);
    process.exit(1);
  }
}

function scanEvent(eventData) {
  const problems = [];

  DIVISIONS.forEach(division => {
    const players = eventData[division];

    if (!Array.isArray(players)) return;

    players.forEach((player, playerIndex) => {
      if (!player.decklist) return;

      CARD_TYPES.forEach(type => {
        const cards = player.decklist[type];

        if (!Array.isArray(cards)) return;

        cards.forEach(card => {
          const set = String(card.set || '').trim();

          if (!ALLOWED_SETS.has(set)) {
            problems.push({
              division,
              player: player.name || `Player ${playerIndex + 1}`,
              flag: player.flag || '',
              placing:
                player.placement ??
                player.placing ??
                playerIndex + 1,
              type,
              count: card.count ?? 1,
              name: card.name || 'Unknown Card',
              set: set || '(missing set)',
              number: card.number ?? ''
            });
          }
        });
      });
    });
  });

  return problems;
}

function printResults(eventData, problems) {
  console.log('');
  console.log('============================================================');
  console.log('UNKNOWN / DISALLOWED CARD SET SCAN');
  console.log('============================================================');

  if (eventData.name) {
    console.log(`Event: ${eventData.name}`);
  }

  if (eventData.id) {
    console.log(`ID: ${eventData.id}`);
  }

  console.log(`File: ${path.basename(INPUT_FILE)}`);

  if (!problems.length) {
    console.log('');
    console.log('✓ No Pokémon or Trainer cards found outside the allowed sets.');
    console.log('============================================================');
    return;
  }

  console.log('');
  console.log(`Found ${problems.length} card entries outside the allowed sets.`);
  console.log('');

  const byPlayer = {};

  problems.forEach(problem => {
    const key =
      `${problem.division}|${problem.player}|${problem.flag}|${problem.placing}`;

    if (!byPlayer[key]) {
      byPlayer[key] = {
        division: problem.division,
        player: problem.player,
        flag: problem.flag,
        placing: problem.placing,
        cards: []
      };
    }

    byPlayer[key].cards.push(problem);
  });

  Object.values(byPlayer).forEach(result => {
    console.log(
      `• ${result.placing}. ${result.player}` +
      `${result.flag ? ` [${result.flag}]` : ''}` +
      ` (${result.division})`
    );

    result.cards.forEach(card => {
      console.log(
        `    ${card.type.toUpperCase()}: ` +
        `${card.count} ${card.name} ` +
        `${card.set} ${card.number}`
      );
    });

    console.log('');
  });

  console.log('============================================================');

  const badSets = [
    ...new Set(problems.map(problem => problem.set))
  ].sort();

  console.log('');
  console.log('Unique unknown/disallowed sets:');
  console.log(badSets.join(', '));
}

const eventData = loadEventFile(INPUT_FILE);
const problems = scanEvent(eventData);

printResults(eventData, problems);