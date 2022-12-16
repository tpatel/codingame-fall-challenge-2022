const ME = 1;
const OPP = 0;
const NONE = -1;

var inputs = readline().split(" ");
const width = parseInt(inputs[0]);
const height = parseInt(inputs[1]);
let turn = 0;
const endOfEarlyGame = 6;

// game loop
while (true) {
  const tiles = [];
  const myUnits = [];
  const oppUnits = [];
  const myRecyclers = [];
  const oppRecyclers = [];
  const oppTiles = [];
  const myTiles = [];
  const neutralTiles = [];

  var inputs = readline().split(" ");
  let myMatter = parseInt(inputs[0]);
  const oppMatter = parseInt(inputs[1]);
  const map = new Array(height);
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      var inputs = readline().split(" ");
      const scrapAmount = parseInt(inputs[0]);
      const owner = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
      const units = parseInt(inputs[2]);
      const recycler = inputs[3] == "1";
      const canBuild = inputs[4] == "1";
      const canSpawn = inputs[5] == "1";
      const inRangeOfRecycler = inputs[6] == "1";

      const tile = {
        x,
        y,
        scrapAmount,
        owner,
        units,
        recycler,
        canBuild,
        canSpawn,
        inRangeOfRecycler,
      };

      tiles.push(tile);
      map[y].push(tile);

      if (tile.owner == ME) {
        myTiles.push(tile);
        if (tile.units > 0) {
          myUnits.push(tile);
        } else if (tile.recycler) {
          myRecyclers.push(tile);
        }
      } else if (tile.owner == OPP) {
        oppTiles.push(tile);
        if (tile.units > 0) {
          oppUnits.push(tile);
        } else if (tile.recycler) {
          oppRecyclers.push(tile);
        }
      } else {
        neutralTiles.push(tile);
      }
    }
  }

  const actions = [];

  if (turn < endOfEarlyGame && myMatter >= 10) {
    const recyclerTiles = myTiles.map((tile) => {
      tile.recyclerScore = 0;
      if (tile.canBuild) {
        let totalScrap = 0;
        const maxRecycler = tile.scrapAmount;
        totalScrap += maxRecycler;
        if (tile.y > 0) {
          totalScrap += Math.min(
            map[tile.y - 1][tile.x].scrapAmount,
            maxRecycler
          );
          if (map[tile.y - 1][tile.x].recycler) {
            totalScrap -= 100;
          }
        }
        if (tile.y < map.length - 1) {
          totalScrap += Math.min(
            map[tile.y + 1][tile.x].scrapAmount,
            maxRecycler
          );
          if (map[tile.y + 1][tile.x].recycler) {
            totalScrap -= 100;
          }
        }
        if (tile.x > 0) {
          totalScrap += Math.min(
            map[tile.y][tile.x - 1].scrapAmount,
            maxRecycler
          );
          if (map[tile.y][tile.x - 1].recycler) {
            totalScrap -= 100;
          }
        }
        if (tile.x < map[tile.y].length - 1) {
          totalScrap += Math.min(
            map[tile.y][tile.x + 1].scrapAmount,
            maxRecycler
          );
          if (map[tile.y][tile.x + 1].recycler) {
            totalScrap -= 100;
          }
        }
        tile.recyclerScore = totalScrap;
      }
      return tile;
    });
    recyclerTiles.sort((a, b) => b.recyclerScore - a.recyclerScore);
    if (recyclerTiles[0].recyclerScore >= 1) {
      myMatter -= 10;
      actions.push(`BUILD ${recyclerTiles[0].x} ${recyclerTiles[0].y}`);
    }
  }

  const targetTiles = [
    ...oppTiles.filter((tile) => !tile.recycler),
    ...neutralTiles.filter((tile) => tile.scrapAmount > 0),
  ];
  const canSpawnTiles = myTiles.filter((tile) => tile.canSpawn);

  canSpawnTiles.map((tile) => {
    const distances = oppUnits.map((target) => distance(tile, target));
    tile.spawnScore = distances.reduce((a, b) => a + b, 0) / distances.length;
    return tile;
  });
  canSpawnTiles.sort((a, b) => a.spawnScore - b.spawnScore);

  const target = canSpawnTiles.shift();
  if (target && myMatter >= 10) {
    actions.push(`SPAWN ${1} ${target.x} ${target.y}`);
    myMatter -= 10;
  }
  while (turn >= endOfEarlyGame && canSpawnTiles.length > 0 && myMatter >= 10) {
    const target = canSpawnTiles.shift();
    actions.push(`SPAWN ${1} ${target.x} ${target.y}`);
    myMatter -= 10;
  }

  function distance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  for (const tile of myUnits) {
    targetTiles.sort((a, b) => distance(tile, a) - distance(tile, b));
    const target = targetTiles.shift();
    if (target) {
      const amount = tile.units > 1 ? tile.units - 1 : 1;
      actions.push(
        `MOVE ${amount} ${tile.x} ${tile.y} ${target.x} ${target.y}`
      );
    }
  }

  console.log(actions.length > 0 ? actions.join(";") : "WAIT");
  turn++;
}
