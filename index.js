const CELL_SIZE = 9;
const BACKGROUND_COLOR = "#444"

class Game {
  constructor(canvasId, cellSize) {
    this.canvas = document.getElementById("myCanvas").getContext("2d");
    document.onkeydown = this.handleKeyboardEvent.bind(this);

    this.cellSize = cellSize;
    this.width = document.getElementById("myCanvas").width;
    this.height = document.getElementById("myCanvas").height;

    this.lightCycles = [];
    this.recordedPositions = [];
  }

  addLightCycle(lightCycle) {
    this.lightCycles.push(Object.assign({}, lightCycle));
  }

  handleKeyboardEvent(e) {
    for (let i = 0; i < this.lightCycles.length; i++) {
      const lightCycle = this.lightCycles[i];

      if (!lightCycle.active) {
        continuea;
      }

      let newDirection;
      if (e.keyCode === lightCycle.keyBindings.up) {
        newDirection = { x: 0, y: -1 };
      } else if (e.keyCode === lightCycle.keyBindings.down) {
        newDirection = { x: 0, y: 1 };
      } else if (e.keyCode === lightCycle.keyBindings.left) {
        newDirection = { x: -1, y: 0 };
      } else if (e.keyCode === lightCycle.keyBindings.right) {
        newDirection = { x: 1, y: 0 };
      } else {
        continue;
      }

      // If we want to go on the direction we come from, do nothing.
      if (
        (newDirection.x === lightCycle.direction.x &&
          newDirection.y !== lightCycle.direction.y) ||
        (newDirection.y === lightCycle.direction.y &&
          newDirection.x !== lightCycle.direction.x)
      ) {
        continue;
      }

      lightCycle.direction = newDirection;
    }
  }

  playerShouldDie(lightCycle) {
    if (
      lightCycle.position.x < 0 ||
      lightCycle.position.y < 0 ||
      lightCycle.position.x >= this.width ||
      lightCycle.position.y >= this.height
    ) {
      return true;
    }

    for (let i = 0; i < this.recordedPositions.length; i++) {
      const position = this.recordedPositions[i].point;

      if (
        lightCycle.position.x - (this.cellSize - 1) / 2 <= position.x &&
        position.x <= lightCycle.position.x + (this.cellSize - 1) / 2 + 1 &&
        lightCycle.position.y - (this.cellSize - 1) / 2 <= position.y &&
        position.y <= lightCycle.position.y + (this.cellSize - 1) / 2 + 1
      ) {
        return true;
      }
    }

    return false;
  }

  updateCell(newPosition, newColor) {
    for (let i = 0; i < this.recordedPositions.length; i++) {
      const position = this.recordedPositions[i];

      if (position.point === newPosition) {
        position.color = newColor;
        return;
      }
    }

    // There was no position recorded for this point, let's create a new one
    this.recordedPositions.push({
      point: newPosition,
      color: newColor
    });
  }

  finished() {
    const activePlayers = this.lightCycles.reduce(
      (a, v) => a + (v.active ? 1 : 0),
      0
    );
    return activePlayers <= 1;
  }

  getWinner() {
    if (!this.finished()) {
      return null;
    }

    return this.lightCycles.find(e => e.active);
  }

  update() {
    for (let i = 0; i < this.lightCycles.length; i++) {
      const lightCycle = this.lightCycles[i];

      if (!lightCycle.active) {
        continue;
      }

      const previousPosition = lightCycle.position;

      // First we update the positions of the light cycles
      // along side with the records of the cells.
      lightCycle.position = {
        x: Math.min(
          lightCycle.position.x + lightCycle.direction.x * this.cellSize,
          this.width - this.cellSize / 2
        ),
        y: Math.min(
          lightCycle.position.y + lightCycle.direction.y * this.cellSize,
          this.height - this.cellSize / 2
        )
      };

      // Then we check if the player is dead and draw the cell
      // in consequence.
      if (!this.playerShouldDie(lightCycle)) {
        this.updateCell(lightCycle.position, lightCycle.color);
        this.updateCell(previousPosition, lightCycle.traceColor);
      } else {
        lightCycle.position = previousPosition;
        lightCycle.active = false;
        this.updateCell(lightCycle.position, "#fff");
      }
    }

    // Finally, we draw the canvas with the update model.
    this.draw();
  }

  draw() {
    // We draw all the canvas with a color
    this.canvas.fillStyle = BACKGROUND_COLOR;
    this.canvas.fillRect(0, 0, this.width, this.height);

    // Now we draw all the position recorded.
    for (let i = 0; i < this.recordedPositions.length; i++) {
      const { point: position, color } = this.recordedPositions[i];

      this.canvas.fillStyle = color;
      this.canvas.fillRect(
        position.x - (this.cellSize - 1) / 2,
        position.y - (this.cellSize - 1) / 2,
        this.cellSize,
        this.cellSize
      );
    }
  }
}

players = [
  {
    name: "Mario",
    position: {
      x: document.getElementById("myCanvas").width / 2,
      y: document.getElementById("myCanvas").height - 2
    },
    direction: { x: 0, y: -1 },
    color: "#f00",
    traceColor: "#00ffff",
    keyBindings: {
      up: 38,
      down: 40,
      left: 37,
      right: 39
    },
    active: true,
    score: 0
  },
  {
    name: "Luigi",
    position: {
      x: document.getElementById("myCanvas").width / 2,
      y: 2
    },
    direction: { x: 0, y: 1 },
    color: "#00f",
    traceColor: "#ffff00",
    keyBindings: {
      up: 87,
      down: 83,
      left: 65,
      right: 68
    },
    active: true,
    score: 0
  }
];

function load() {
  const game = new Game("myCanvas", CELL_SIZE);

  for (let i = 0; i < players.length; i++) {
    game.addLightCycle(players[i]);
  }

  const scoreItems = players.map(e => {
    return `
<li class="nav-item active">
  <a class="nav-link" href="#">${e.name} :: ${e.score}
    <span class="sr-only">(current)</span>
  </a>
</li>
  `;
  });

  document.getElementById("score-list").innerHTML = scoreItems;

  return game;
}

let game = load();
let beginningDate = performance.now();

function main() {
  game.update();
  if (game.finished()) {
    const winner = game.getWinner();
    if (winner !== null) {
      for (let i = 0; i < players.length; i++) {
        if (players[i].name === winner.name) {
          players[i].score += 1;
        }
      }
    }
    game = load();
    beginningDate = performance.now();
  }

  // Decrease the timeout every 2 seconds
  const elapsedTime = performance.now() - beginningDate;
  const decreasedTimeout = 200 - CELL_SIZE * Math.floor(elapsedTime / 750);
  setTimeout(function() {
    main();
  }, decreasedTimeout);
}

main();
