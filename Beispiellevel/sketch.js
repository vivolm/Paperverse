// matter.js module aliases
const Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Composite = Matter.Composite,
  Events = Matter.Events,
  Common = Matter.Common,
  Collision = Matter.Collision,
  MouseConstraint = Matter.MouseConstraint,
  Query = Matter.Query;

Matter.use("matter-wrap");

// global matter.js variables
const engine = Engine.create();
const world = engine.world;
const runner = Runner.create();
const socket = new WebSocket("ws://localhost:8080");

// global variables for tracking bodies & assets
let drawBodies = [];
let svgShapes = [];
let matterSVG;
let characterBody;
let snakeSensor;
let leftBall;
let rightBall;
let leftRotating = true;
let rightRotating = true;
let exampleSVG = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" version="1.1">/n/t<path d="M 102.814 69.078 C 86.592 71.458, 81.106 74.105, 70.316 84.761 C 64.992 90.019, 62.310 94.894, 59.180 105 C 54.772 119.235, 53.730 126.031, 54.919 132.778 C 55.474 135.925, 56.183 140.548, 56.496 143.052 C 57.629 152.142, 67.764 168.535, 79.708 180.595 C 84.970 185.909, 99.013 188.493, 108.500 185.893 C 112.628 184.761, 126.614 175.865, 128.650 173.076 C 129.282 172.209, 131.679 169.475, 133.976 167.001 C 138.531 162.094, 145.833 150.556, 147.900 145 C 148.616 143.075, 149.719 140.419, 150.351 139.097 C 152.235 135.157, 151.845 109.280, 149.837 105 C 145.853 96.505, 143 90.085, 143 89.612 C 143 89.331, 141.688 87.156, 140.085 84.780 C 136.557 79.553, 130.412 74.999, 121.482 70.992 C 114.577 67.894, 112.405 67.671, 102.814 69.078 M 97.641 78.059 C 92.877 78.613, 90.109 79.489, 88.577 80.928 C 87.364 82.068, 86.063 83, 85.686 83 C 85.308 83, 84.208 83.787, 83.239 84.750 C 82.271 85.713, 80.359 87.400, 78.989 88.500 C 73.130 93.207, 68 102.809, 68 109.067 C 68 110.615, 67.626 112.113, 67.169 112.395 C 64.071 114.310, 63.394 134.720, 66.084 145.155 C 66.993 148.682, 70.656 157, 73.434 161.844 C 75.654 165.716, 82.210 171.992, 87 174.832 C 90.687 177.018, 92.674 177.488, 98, 177.433 C 106.312 177.347, 110.076 175.522, 118.427 167.533 C 122.065 164.053, 126.572 160.039, 128.442 158.612 C 135.149 153.496, 143.006 135.387, 142.992 125.076 C 142.972 110.344, 137.374 93.096, 130.415, 86.326 C 126.462 82.482, 124.552 81.341, 116.703 78.141 C 113.610 76.879, 108.008 76.855, 97.641 78.059" stroke="none" fill="black" fill-rule="evenodd"/>/n</svg>',
};

// global variable for data tracking
let lastPositionColor = {
  x: null,
  y: null,
  color: null,
};

let positionData;
let svgString;

//Anim Var
let angryAnim;
let idleAnim;
let loseAnim;
let noteAnim;
let thinkAnim;
let waitAnim;
let winAnim;
let font;

//Snake Anim
let snakeIdleAni;
let snakeDeathAni;

//Framerate
let fps = 9;

let endFrame;

//Hintergründe
let bg = {
  tutorial: null,
  bridge: null,
  snake: null,
  balls: null,
};

//Sound
let angrySound;

// global game logic
let gameState = "runGame";
let currentLevel = "tutorial";

let startGame = false;

//make sure function for default animation sequence is called once
let defaultLock = false;

let lastVelocity = { x: 0, y: 0 }; // Variable to store the last velocity

//Stickman
let stevie;
let snake;

let outro;

function preload() {
  font = loadFont("./Assets/lazy_dog.ttf");

  //load each background image and store it in a variable
  bg.tutorial = loadImage("./Assets/BG_01.png");
  bg.bridge = loadImage("./Assets/BG_02.png");
  bg.snake = loadImage("./Assets/BG_03.png");
  bg.balls = loadImage("./Assets/BG_04.png");
  ladder = loadImage("./Assets/Leiter.png");

  // load each animation and set frameDelay to 9 with fps variale
  angryAnim = loadAni("./Assets/Sprite_Angry.png", { width: 175, height: 248, frames: 11 });
  idleAnim = loadAni("./Assets/Sprite_Idle.png", { width: 175, height: 248, frames: 18 });
  loseAnim = loadAni("./Assets/Sprite_Lose.png", { width: 175, height: 248, frames: 17 });
  noteAnim = loadAni("./Assets/Sprite_Note.png", { width: 175, height: 248, frames: 14 });
  thinkAnim = loadAni("./Assets/Sprite_Think_v2.png", { width: 175, height: 248, frames: 17 });
  waitAnim = loadAni("./Assets/Sprite_Wait_v2.png", { width: 175, height: 248, frames: 15 });
  winAnim = loadAni("./Assets/Sprite_Win.png", { width: 175, height: 248, frames: 13 });

  //load snake States
  snakeIdleAni = loadAni("./Assets/SnakeIdle.png", { width: 350, height: 496, frames: 13 });
  snakeDeathAni = loadAni("./Assets/SnakeDeath.png", { width: 350, height: 496, frames: 10 });

  //Create Character Sprite with animation size
  stevie = new Sprite(175, 248);
  snake = new Sprite(350, 496);

  //Add every Snake Animation to Snake Sprite
  snake.addAni("deathSnake", snakeDeathAni);
  snake.addAni("idleSnake", snakeIdleAni);
  snake.anis.frameDelay = fps;
  //make sure snake Sprite is only visible in level 3
  snake.visible = false;
  snake.scale = 0.75;

  //Add every Animation to the Stevie Sprite
  stevie.addAni("angry", angryAnim, 11);
  stevie.addAni("note", noteAnim, 14);
  stevie.addAni("think", thinkAnim, 11);
  stevie.addAni("wait", waitAnim, 10);
  //special animations and default state
  stevie.addAni("idle", idleAnim);
  stevie.addAni("win", winAnim);
  stevie.addAni("lose", loseAnim);
  //Set fps for every animation in Stevie Sprite
  stevie.anis.frameDelay = fps;

  //Gate still and in motion for instance of winning
  gateHold = loadAni("./Assets/Sprite_Gate.png", { width: 175, height: 950, frames: [0] });
  gateAnim = loadAni("./Assets/Sprite_Gate.png", { width: 175, height: 950, frames: 8 });
  //Set fps Gate Motion animation
  gateAnim.frameDelay = fps;
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight + 10);
  outro = createVideo("./Assets/PaperverseOutro.mp4");
  outro.parent("sketchHolder");
  // outro.hide();
  canvas.parent("sketchHolder");

  outro.size(width, height);
  outro.loop();

  // set paper.js working space to p5.js canvas
  canvas.id("myCanvas");
  paper.setup("myCanvas");

  resizeCanvas(windowWidth, windowHeight + 10);

  createLevel(currentLevel);

  // run the physics engine
  Runner.run(runner, engine);
}

function draw() {
  // draw the character at the set position
  if (characterBody) {
    stevie.x = characterBody.body.position.x;
    stevie.y = characterBody.body.position.y;
  }

  // draw the right assets for each level
  if (currentLevel === "tutorial") {
    image(bg.tutorial, 0, 0, width, height);
    snake.visible = false;

    //added level change else gate is drawn when gameState changes back to runGame
    if (gameState === "runGame" || gameState === "levelChange") {
      animation(gateHold, width / 2 + width / 4, height / 2 - height / 9);
    }
    if (gameState === "win") {
      animation(gateAnim, width / 2 + width / 4, height / 2 - height / 9);
      gateAnim.noLoop();
    }
  } else if (currentLevel === "bridge") {
    snake.visible = false;
    image(bg.bridge, 0, 0, width, height);
  } else if (currentLevel === "snake") {
    image(bg.snake, 0, 0, width, height);
    if (snakeSensor) {
      snake.x = snakeSensor.body.position.x;
      snake.y = snakeSensor.body.position.y + 30;
    }
  } else if (currentLevel === "balls") {
    snake.visible = false;
    image(bg.balls, 0, 0, width, height);
    tint(255, 90);
    image(ladder, width / 2 - 50, -50);
    noTint();
  }

  if (leftBall && rightBall) {
    if (leftRotating) {
      Body.rotate(leftBall.body, radians(-0.5));
    }
    if (rightRotating) {
      Body.rotate(rightBall.body, radians(0.5));
    }
  } else {
    // image(outro, width / 2, height / 2, width, height);
  }

  // draw all bodies
  drawBodies.forEach((x) => {
    x.draw();
  });

  // draw the handdrawn svg shape
  svgShapes.forEach((x) => {
    x.draw();
  });

  // Play animations according to gameState
  switch (gameState) {
    case "runGame":
      if (startGame && currentLevel === "tutorial") {
        //Infotext to signal when player can start safely
        textFont(font);
        textSize(36);
        textAlign(CENTER);
        noStroke();
        fill(0);
        text("place post-it & draw =>", width / 4, height / 4);
      }

      if (currentLevel === "snake") {
        snake.visible = true;
        snake.changeAni("idleSnake");
        snake.ani.loop();
      }

      if (!defaultLock) {
        defaultSequence();
        defaultLock = true;
      }
      break;

    case "failure":
      startGame = false;
      failSequence();
      break;

    case "win":
      startGame = false;
      winSequence();

      break;
  }
}

//Different animation sequences for the game
async function defaultSequence() {
  await stevie.changeAni("note");
  startGame = true;
  await stevie.changeAni(["idle", "think", "idle", "think", "idle", "wait", "**"]);
}

function winSequence() {
  defaultLock = false;

  stevie.changeAni("win");

  if (currentLevel === "snake") {
    snake.changeAni("deathSnake");
    snake.ani.noLoop();
  }

  textAlign(CENTER);
  textSize(250);
  textStyle(BOLD);
  fill(0);
  text("YOU RULE", width / 2, height / 3);

  if (stevie.ani.frame - stevie.ani.lastFrame == 0) {
    stevie.ani.frame = 0;

    gameState = "runGame";

    switchLevel(currentLevel); // Pass the current level to switchLevel
  }
}

function failSequence() {
  defaultLock = false;
  stevie.changeAni("lose");

  textAlign(CENTER);
  textSize(250);
  textStyle(BOLD);
  fill(0);
  text("TRY AGAIN", width / 2, height / 3);

  if (stevie.ani.frame - stevie.ani.lastFrame == 0) {
    stevie.ani.frame = 0;
    console.log("lose Ani is complete " + defaultLock);
    gameState = "runGame";
  }
}

function mousePressed() {
  createSVG(exampleSVG.svg, true);
}

function switchLevel(input) {
  // Create a mapping of level names to their next levels
  const levelMapping = {
    tutorial: "bridge",
    bridge: "snake",
    snake: "balls",
    balls: null, // No next level after "balls"
  };

  let nextLevelName;

  // Check if the input is a string (key) or a string (current level)
  if (!isNaN(input)) {
    // Convert the string input to a number
    const key = parseInt(input, 10);

    // Map the key to the corresponding level name
    const keyMapping = {
      1: "tutorial",
      2: "bridge",
      3: "snake",
      4: "balls",
    };
    nextLevelName = keyMapping[key];
  } else if (typeof input === "string") {
    // Get the next level name based on the current level
    nextLevelName = levelMapping[input];
  }

  // Check if the next level name exists in the mapping
  if (nextLevelName) {
    createLevel(nextLevelName, true); // Pass the next level name
    currentLevel = nextLevelName; // Update the current level
  } else {
    outro.play();
  }
}

function keyPressed() {
  switchLevel(key); // Pass the key pressed to switchLevel
}

function windowResized() {
  resizeCanvas();
  createLevel(currentLevel, clear);
  svgShapes = [];
  if (svgShapes.length > 0) {
    svgShapes.forEach((x) => {
      x.removeBody();
    });
  }
}

async function getDrawPosition() {
  let position_color = {
    x: 0,
    y: 0,
    color: "",
  };

  // get the json file and return the positional and color values
  try {
    const response = await fetch("../output/position_color.json");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    position_color.x = data.position.x;
    position_color.y = data.position.y;
    position_color.color = data.color;
    return position_color; // Return the position/color object
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

function createLevel(levelIndex, clear) {
  // delete all previously created and drawn bodies (e.g. on window resize, level change)
  if (clear) {
    Matter.Composite.clear(world);
    drawBodies = [];
    svgShapes = [];
  }
  // set responsive dimensions of bodies seperately, so they can be accessed for calculations in level object
  let dim = {
    char: { x: 0 + width / 6, y: height - height / 1 / 5 },
    tutorial: {
      floor: { w: width, h: height / 1 / 5 },
      base: { w: width / 6, h: height / 12 },
      top: { w: width / 10, h: height / 14 },
    },
    bridge: {
      leftCliff: { w: width / 3.5, h: height / 1 / 5 },
      rightCliff: { w: width / 1.65, h: height / 1 / 5 },
      sensor: { w: 100, h: 50 },
    },
    snake: {
      floor: { w: width, h: height / 1 / 5 },
      snake: {
        x: width - width / 3,
        y: height - height / 1 / 5,
        w: snakeIdleAni.width,
        h: snakeIdleAni.height,
      },
    },
    balls: {
      leftWall: { w: width / 2.9, h: height / 3 },
      rightWall: { w: width / 3.5 },
      floor: { w: width, h: height / 1 / 12 },
      radius: width / 14,
    },
  };

  let levels = {
    tutorial: {
      // tutorial level
      terrain: {
        floor: {
          x: dim.tutorial.floor.w / 2,
          y: height - dim.tutorial.floor.h / 2,
          w: dim.tutorial.floor.w,
          h: dim.tutorial.floor.h,
        },
      },
      button: {
        base: {
          x: dim.tutorial.floor.w / 2,
          y: height - dim.tutorial.floor.h - dim.tutorial.base.h / 2,
          w: dim.tutorial.base.w,
          h: dim.tutorial.base.h,
          label: "base",
        },
        top: {
          x: dim.tutorial.floor.w / 2,
          y: height - dim.tutorial.floor.h - dim.tutorial.base.h - dim.tutorial.top.h / 2,
          w: dim.tutorial.top.w,
          h: dim.tutorial.top.h,
          label: "top",
        },
      },
      char: {
        x: dim.char.x,
        y: dim.char.y,
        w: angryAnim.width,
        h: angryAnim.height,
      },
    },
    bridge: {
      // bridge level
      terrain: {
        leftCliff: {
          x: dim.bridge.leftCliff.w - dim.bridge.leftCliff.w / 2,
          y: height - dim.bridge.leftCliff.h / 2,
          w: dim.bridge.leftCliff.w,
          h: dim.bridge.leftCliff.h,
        },
        rightCliff: {
          x: width - dim.bridge.rightCliff.w / 2,
          y: height - dim.bridge.rightCliff.h / 2,
          w: dim.bridge.rightCliff.w,
          h: dim.bridge.rightCliff.h,
        },
      },
      sensors: {
        fail: {
          x: dim.bridge.leftCliff.w,
          y: height - 20,
          w: width - (dim.bridge.leftCliff.w + dim.bridge.rightCliff.w),
          h: 100,
          label: "fail",
        },
        winLeft: {
          x: dim.bridge.leftCliff.w - dim.bridge.sensor.w,
          y: height - dim.bridge.leftCliff.h - dim.bridge.sensor.h,
          w: dim.bridge.sensor.w,
          h: dim.bridge.sensor.h,
          label: "win",
        },
        winRight: {
          x: width - dim.bridge.rightCliff.w,
          y: height - dim.bridge.rightCliff.h - dim.bridge.sensor.h,
          w: dim.bridge.sensor.w,
          h: dim.bridge.sensor.h,
          label: "win",
        },
      },
      char: {
        x: dim.char.x,
        y: dim.char.y,
        w: angryAnim.width,
        h: angryAnim.height,
      },
    },
    snake: {
      // snake level
      terrain: {
        floor: {
          x: dim.snake.floor.w / 2,
          y: height - dim.snake.floor.h / 2,
          w: dim.snake.floor.w,
          h: dim.snake.floor.h,
        },
      },
      sensors: {
        snake: {
          x: dim.snake.snake.x,
          y: dim.snake.snake.y - snakeIdleAni.height + 140,
          w: snakeIdleAni.width - 100,
          h: snakeIdleAni.height - 170,
          label: "snake",
        },
      },
      char: {
        x: dim.char.x,
        y: dim.char.y,
        w: angryAnim.width,
        h: angryAnim.height,
      },
    },
    balls: {
      // balls level

      terrain: {
        leftWall: {
          x: dim.balls.leftWall.w / 2,
          y: height / 4 + dim.balls.leftWall.h / 2,
          w: dim.balls.leftWall.w,
          h: dim.balls.leftWall.h,
        },
        rightWall: {
          x: width - dim.balls.rightWall.w / 2,
          y: (height - dim.balls.floor.h) / 2 + height / 2.5,
          w: dim.balls.rightWall.w,
          h: height - dim.balls.floor.h,
        },
        floor: {
          x: width / 2,
          y: height - dim.balls.floor.h / 2,
          w: dim.balls.floor.w,
          h: dim.balls.floor.h,
        },
      },
      spikeBall: {
        left: {
          x: dim.balls.leftWall.w + dim.balls.radius,
          y: height / 4 + dim.balls.leftWall.h / 1.5,
          r: dim.balls.radius,
          label: "leftBall",
        },
        right: {
          x: width - dim.balls.rightWall.w - dim.balls.radius,
          y: height - dim.balls.floor.h - dim.balls.radius,
          r: dim.balls.radius,
          label: "rightBall",
        },
      },
      char: {
        x: dim.char.x,
        y: dim.char.y,
        w: angryAnim.width,
        h: angryAnim.height,
      },
    },
  };

  // access the correct level data
  level = levels[levelIndex];

  // create bodies (e.g. static/dynamic geo, sensors, characters)
  if (level.terrain) {
    // Access terrain properties directly
    Object.values(level.terrain).forEach((geo) => {
      let levelGeo = new Block(
        world,
        {
          x: geo.x,
          y: geo.y,
          w: geo.w,
          h: geo.h,
          color: "white",
          stroke: "black",
          weight: 6,
        },
        { isStatic: true, label: "terrain" }
      );
      drawBodies.push(levelGeo);
    });
  }

  // Create sensors (e.g., for collision detection)
  if (level.sensors) {
    Object.values(level.sensors).forEach((sensor) => {
      if (sensor.label === "snake") {
        snakeSensor = new Block(
          world,
          { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h, color: "red" },
          { isStatic: true, isSensor: true, label: sensor.label },
          "CORNER"
        );
        // drawBodies.push(snakeSensor);
      } else {
        let levelSensor;
        levelSensor = new Block(
          world,
          { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h, color: "red" },
          { isStatic: true, isSensor: true, label: sensor.label },
          "CORNER"
        );
        // drawBodies.push(levelSensor);
      }
    });
  }

  // Create spikey ball (e.g. for obstacles)
  if (level.spikeBall) {
    Object.values(level.spikeBall).forEach((spikey) => {
      if (spikey.label === "leftBall") {
        leftBall = new SpikedBall(
          world,
          {
            x: spikey.x,
            y: spikey.y,
            r: spikey.r,
            color: "white",
            stroke: "black",
            weight: 6,
          },
          { isStatic: true, label: "leftBall" }
        );
        drawBodies.push(leftBall);
      } else if (spikey.label === "rightBall") {
        rightBall = new SpikedBall(
          world,
          {
            x: spikey.x,
            y: spikey.y,
            r: spikey.r,
            color: "white",
            stroke: "black",
            weight: 6,
          },
          { isStatic: true, label: "rightBall" }
        );
        drawBodies.push(rightBall);
      }
    });
  }

  // Create button
  if (level.button) {
    Object.values(level.button).forEach((button) => {
      let buttonBlock;
      if (button.label === "base") {
        buttonBlock = new Block(
          world,
          {
            x: button.x,
            y: button.y,
            w: button.w,
            h: button.h,
            color: "black",
          },
          { isStatic: true, label: "buttonBase" }
        );
      } else if (button.label === "top") {
        buttonBlock = new Block(
          world,
          {
            x: button.x,
            y: button.y,
            w: button.w,
            h: button.h,
            stroke: "black",
            weight: 6,
          },
          { isStatic: true, label: "buttonTop" }
        );
      }
      drawBodies.push(buttonBlock);
    });
  }

  // Create character
  if (level.char) {
    const char = level.char;
    characterBody = new Block(
      world,
      { x: char.x, y: char.y, w: char.w, h: char.h, color: "black" },
      { restitution: 0.5, friction: 0.5 }
    );
    // show char collision box for debugging purposes
    // drawBodies.push(characterBody);
  }
}

// Check velocity of the svg body right before the collision with button
Matter.Events.on(engine, "beforeUpdate", function () {
  if (currentLevel === "tutorial") {
    Matter.Composite.allBodies(world).forEach((body) => {
      if (body.label === "drawnBody") {
        lastVelocity = body.velocity; // Store the current velocity
      }
    });
  }
});

// check for win/lose conditions by detecting collisions
Events.on(engine, "collisionStart", function (event) {
  if (gameState === "runGame" && matterSVG) {
    const pairs = event.pairs;
    // check win/lose conditions for bridge level
    if (currentLevel === "bridge") {
      let winSensors = [];
      let failSensors = [];

      const bodies = Composite.allBodies(world);
      bodies.forEach((body) => {
        if (body.label === "win") {
          winSensors.push(body);
        } else if (body.label === "fail") {
          failSensors.push(body);
        }
      });

      // check if the drawn object spans across the gap
      if (Query.collides(matterSVG.body, winSensors).length == 2) {
        gameState = "win";
      }

      // check if the drawn object is too small for the gap
      if (Query.collides(matterSVG.body, failSensors).length > 0) {
        gameState = "failure";
      }
    } else if (currentLevel === "balls") {
      // ball level
      let query = [];
      let svg;
      const bodies = Composite.allBodies(world);
      bodies.forEach((body) => {
        if (body.label.includes("Ball")) {
          query.push(body);
        } else if (body.label === "terrain") {
          query.push(body);
        } else if (body.label === "drawnBody") {
          svg = body;
        }
      });

      if (svg) {
        let collisionRecord = Query.collides(svg, query);
        if (collisionRecord.length >= 2) {
          let depth = Query.collides(svg, query)[0].depth;
          if (Math.abs(depth) > 10) {
            console.log(collisionRecord[1].bodyA.label);
            console.log(collisionRecord[1].bodyB.label);
            if (
              collisionRecord[1].bodyA.label === "leftBall" ||
              collisionRecord[1].bodyB.label === "leftBall"
            ) {
              leftRotating = false;
            } else if (
              collisionRecord[1].bodyA.label === "rightBall" ||
              collisionRecord[1].bodyB.label === "rightBall"
            )
              rightRotating = false;
          }
        }
      }
    } else if (currentLevel === "tutorial") {
      // tutorial and puzzle button level
      const massThreshold = 13;
      const velocityThreshold = 9;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Determine which body is the button and which is the colliding body
        const buttonBody =
          bodyA.label === "buttonTop" ? bodyA : bodyB.label === "buttonTop" ? bodyB : null;
        const collidingBody = buttonBody === bodyA ? bodyB : bodyA;

        // Check if the colliding body has the required mass and velocity
        if (buttonBody && collidingBody) {
          const collidingMass = collidingBody.mass;
          const collidingVelocity = Matter.Vector.magnitude(lastVelocity);
          console.log(collidingMass);

          if (collidingMass >= massThreshold && collidingVelocity >= velocityThreshold) {
            // Press the button down
            pressButton(buttonBody);
          }
        }
      });
    } else if (currentLevel === "snake") {
      // tutorial and puzzle button level
      const massThreshold = 5;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Determine which body is the button and which is the colliding body
        const snakeBody = bodyA.label === "snake" ? bodyA : bodyB.label === "snake" ? bodyB : null;
        const collidingBody = snakeBody === bodyA ? bodyB : bodyA;

        // Check if the colliding body has the required mass and velocity
        if (snakeBody && collidingBody) {
          const collidingMass = collidingBody.mass;

          if (collidingMass >= massThreshold) {
            // Squash the snake and win level
            gameState = "win";
          }
        }
      });
    }
  }
});

function pressButton(button) {
  // Move the button down
  Body.translate(button, { x: 0, y: 10 });
  gameState = "win";

  // Move it back up after a short delay
  setTimeout(() => {
    Body.translate(button, { x: 0, y: -10 });
  }, 500); // Adjust the delay as needed
}

socket.addEventListener("open", () => {
  console.log("Connected to WebSocket Server");
  socket.send(JSON.stringify({ type: "browser" })); // Identify as Browser client
});

socket.onmessage = (ev) => {
  const message = JSON.parse(ev.data); // Parse the JSON string

  createSVG(message.svg, false);
};

function simplifySVG(svg) {
  let path = new Path(svg);
  // Create a new group to hold the simplified paths
  const simplifiedGroup = new paper.Group();
  const simplifyStrength = 5;

  // simplify logic for different labels of paper.js objects (path, compound, shape)
  if (path instanceof paper.Path) {
    path.simplify(simplifyStrength);
    simplifiedGroup.addChild(path);
  }

  // else if (child instanceof paper.CompoundPath) {
  //   child.simplify(simplifyStrength);
  //   simplifiedGroup.addChild(child);
  // } else if (child instanceof paper.Shape) {
  //   console.log("Shape object ignored");
  // }

  // Export the simplified group back to an SVG string
  const svgString = simplifiedGroup.exportSVG({ asString: true });

  // turn that string into a DOM element
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const paths = svgDoc.getElementsByTagName("path");
  return paths;
}

function createSVG(svg, debug) {
  getDrawPosition().then((pos) => {
    if (gameState === "runGame" && svg) {
      let levelBodies = Composite.allBodies(world);
      let htmlPath = parseSVG(svg)[0];

      if (!debug) {
        pos.x = map(pos.x, 0, 1, 0, width);
        pos.y = map(pos.y, 0, 1, 0, height);
      } else if (debug) {
        pos.x = mouseX;
        pos.y = mouseY;
      }

      // prevent multiple SVG bodies from existing
      if (svgShapes.length > 0) {
        svgShapes.forEach((x) => {
          x.removeBody();
        });
      }

      svgShapes = [];

      // create svg body from path data
      matterSVG = new PolygonFromSVG(
        world,
        {
          x: pos.x,
          y: pos.y,
          fromPath: htmlPath,
          color: "white",
          stroke: "black",
          weight: 2,
        },
        { isStatic: false, mass: 100, label: "drawnBody", friction: 0.5, restitution: 0.6 }
      );

      // remove svg body if it collides with other geometry on spawn
      if (Query.collides(matterSVG.body, levelBodies).length > 0) {
        console.log("collision of svg body with level geometry");
        matterSVG.removeBody(world, matterSVG);
      } else {
        svgShapes.push(matterSVG);
        // NOTE: mass difference between matterSVG and body in collision events
      }
    }
  });
}

function parseSVG(svg) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svg, "image/svg+xml");
  const paths = svgDoc.getElementsByTagName("path");
  return paths;
}
