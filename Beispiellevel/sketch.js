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
let drawableSVG;
let drawnSVG;
let backgroundImgs = [];
let characterBody;
let leftBall;
let rightBall;
let leftRotating = true;
let rightRotating = true;
let exampleSVG = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" version="1.1">\n\t<path d="M 102.814 69.078 C 86.592 71.458, 81.106 74.105, 70.316 84.761 C 64.992 90.019, 62.310 94.894, 59.180 105 C 54.772 119.235, 53.730 126.031, 54.919 132.778 C 55.474 135.925, 56.183 140.548, 56.496 143.052 C 57.629 152.142, 67.764 168.535, 79.708 180.595 C 84.970 185.909, 99.013 188.493, 108.500 185.893 C 112.628 184.761, 126.614 175.865, 128.650 173.076 C 129.282 172.209, 131.679 169.475, 133.976 167.001 C 138.531 162.094, 145.833 150.556, 147.900 145 C 148.616 143.075, 149.719 140.419, 150.351 139.097 C 152.235 135.157, 151.845 109.280, 149.837 105 C 145.853 96.505, 143 90.085, 143 89.612 C 143 89.331, 141.688 87.156, 140.085 84.780 C 136.557 79.553, 130.412 74.999, 121.482 70.992 C 114.577 67.894, 112.405 67.671, 102.814 69.078 M 97.641 78.059 C 92.877 78.613, 90.109 79.489, 88.577 80.928 C 87.364 82.068, 86.063 83, 85.686 83 C 85.308 83, 84.208 83.787, 83.239 84.750 C 82.271 85.713, 80.359 87.400, 78.989 88.500 C 73.130 93.207, 68 102.809, 68 109.067 C 68 110.615, 67.626 112.113, 67.169 112.395 C 64.071 114.310, 63.394 134.720, 66.084 145.155 C 66.993 148.682, 70.656 157, 73.434 161.844 C 75.654 165.716, 82.210 171.992, 87 174.832 C 90.687 177.018, 92.674 177.488, 98, 177.433 C 106.312 177.347, 110.076 175.522, 118.427 167.533 C 122.065 164.053, 126.572 160.039, 128.442 158.612 C 135.149 153.496, 143.006 135.387, 142.992 125.076 C 142.972 110.344, 137.374 93.096, 130.415, 86.326 C 126.462 82.482, 124.552 81.341, 116.703 78.141 C 113.610 76.879, 108.008 76.855, 97.641 78.059" stroke="none" fill="black" fill-rule="evenodd"/>/n</svg>',
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

//Framerate
let fps = 9;
let currentFrame = 0;
let endFrame;

//Hintergründe
let hgOne;
let hgTwo;
let hgThree;
let hgFour;

//Sound
let angrySound;

// global game logic
let gameState = "runGame";
let currentLevel = "tutorial";
let levelCount = 4;

//make sure function for default animation sequence is called once
let defaLock = false;

//Stickman
let stevie;

function preload() {
  //load each background image and store it in a variable
  hgOne = loadImage("./Assets/BG_01.png");
  hgTwo = loadImage("./Assets/BG_02.png");
  hgThree = loadImage("./Assets/BG_03.png");
  hgFour = loadImage("./Assets/BG_04.png");

  // load each animation and set frameDelay to 9 with fps variale
  angryAnim = loadAni("./Assets/Sprite_Angry.png", { width: 175, height: 248, frames: 11 });
  idleAnim = loadAni("./Assets/Sprite_Idle.png", { width: 175, height: 248, frames: 18 });
  loseAnim = loadAni("./Assets/Sprite_Lose.png", { width: 175, height: 248, frames: 17 });
  noteAnim = loadAni("./Assets/Sprite_Note.png", { width: 175, height: 248, frames: 14 });
  thinkAnim = loadAni("./Assets/Sprite_Think.png", { width: 175, height: 248, frames: 11 });
  waitAnim = loadAni("./Assets/Sprite_Wait.png", { width: 175, height: 248, frames: 10 });
  winAnim = loadAni("./Assets/Sprite_Win.png", { width: 175, height: 248, frames: 13 });

  //Create Character Sprite with animation size
  stevie = new Sprite(175, 248);
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
  canvas.parent("sketch-holder");

  // set paper.js working space to p5.js canvas
  canvas.id("myCanvas");
  paper.setup("myCanvas");

  resizeCanvas(windowWidth, windowHeight + 10);

  // scale down the animation asset
  angryAnim.scale = 0.5;

  createLevel(currentLevel);

  // run the physics engine
  Runner.run(runner, engine);
}

function draw() {
  //Set Sprite Position to Correct Position within frame
  stevie.x = characterBody.body.position.x;
  stevie.y = characterBody.body.position.y;

  //Drawing Background, post it placement and Gate Animation
  if (currentLevel == 1) {
    backgroundSetup(hgOne);

    push();
    rectMode(CENTER);
    stroke(247, 54, 0);
    strokeWeight(2);
    noFill();
    drawingContext.setLineDash([5, 5]);
    rect(width / 2, height / 4, 200, 200);
    pop();

    if (gameState === "runGame") {
      animation(gateHold, width / 2 + width / 4, height / 2 - height / 9);
    }
    if (gameState === "win") {
      animation(gateAnim, width / 2 + width / 4, height / 2 - height / 9);
      gateAnim.noLoop();
    }
  } else if (currentLevel == 2) {
    backgroundSetup(hgTwo);
  } else if (currentLevel == 3) {
    backgroundSetup(hgThree);
  } else if (currentLevel == 4) {
    backgroundSetup(hgFour);
  }

  if (leftBall && rightBall) {
    if (leftRotating) {
      Body.rotate(leftBall.body, radians(-0.5));
    }
    if (rightRotating) {
      Body.rotate(rightBall.body, radians(0.5));
    }
  }
  // draw all bodies
  drawBodies.forEach((x) => {
    x.draw();
  });
  // draw the handdrawn svg shape
  svgShapes.forEach((x) => {
    x.draw();
  });

  if (gameState == "runGame") {
    //set current frame to zero to replay win and lose anims
    currentFrame = 0;

    // draw and animate the character NOTE: Expand this logic as soon as multiple char anims are present
    if (characterBody) {
      characterBody.draw();
    }

    if (!defaLock) {
      defaultSequence();
      console.log("defa");
      defaLock = true;
    }
  }

  //Diese hier extra, da sie außerhalb des normalen Gameablaufes laufen
  if (gameState === "failure") {
    defaLock = false;
    failSequence();
  }

  if (gameState === "win") {
    defaLock = false;
    winSequence();
  }

  //Schwarzer Rahmen um Spielfeld
  strokeWeight(10);
  stroke(0);
  noFill();
  rect(5, 5, width - 10, height - 10);
}

//Different animation sequences for the game - hier audio play implementieren (falls möglich)
async function defaultSequence() {
  //Für Soundeffekte aufteilen - aber bis jetzt nicht möglich einzubauen
  //Beginnt mit der Überrascht Animation
  //await stevie.changeAni("idle");

  await stevie.changeAni("note");
  console.log("note ani complete");
  //"**" >>> TEST remove if contradicitons with code arise - if not implemented note ani will repeat
  //this is a continouus loop until gamestate chnages
  await stevie.changeAni(["think", "idle", "think", "idle", "wait", "idle", "**"]);
  console.log("Default animation sequence is complete");

  //needed when last aniChange Array isnt on loop!!! else recursive calling and crash!!!
  /*
  if(defaLock){
    console.log("return statement");
    return defaultSequence();
  }*/
}

function winSequence() {
  //Für Soundeffekte aufteilen
  stevie.changeAni("win");
  console.log("win animation sequence is active");

  textAlign(CENTER);
  textSize(250);
  textStyle(BOLD);
  fill(0);
  text("YOU RULE", width / 2, height / 3);

  if (stevie.ani.frame - stevie.ani.lastFrame == 0) {
    stevie.ani.frame = 0;
    gateAnim.frame = 0;
    gateAnim.loop();
    gameState = "runGame";

    levelChange();
  }
}

function failSequence() {
  stevie.changeAni("lose");
  console.log("Lose animation sequence is active");

  textAlign(CENTER);
  textSize(250);
  textStyle(BOLD);
  fill(0);
  text("YOU SUCK", width / 2, height / 3);

  if (stevie.ani.frame - stevie.ani.lastFrame == 0) {
    stevie.ani.frame = 0;
    console.log("lose Ani is complete " + defaLock);
    gameState = "runGame";
    levelSetBack();
  }
}

//Function for easy setup of Background (shorter in Main Code) - not essential
function backgroundSetup(imageTitle) {
  image(imageTitle, 0, 0, width, height);
}

//Level updates according to win ore lose condotion
function levelChange() {
  currentLevel++;
  createLevel(currentLevel, true);

  if (svgShapes.length > 0) {
    svgShapes.forEach((x) => {
      x.removeBody(); // limit SVG bodies to just one to tighten gameplay and prevent level workarounds
    });
  }
  svgShapes = []; // remove old SVG bodies from drawing logic
}

function levelSetBack() {
  currentLevel = 1;
  createLevel(currentLevel, true);

  if (svgShapes.length > 0) {
    svgShapes.forEach((x) => {
      x.removeBody(); // limit SVG bodies to just one to tighten gameplay and prevent level workarounds
    });
  }
  svgShapes = []; // remove old SVG bodies from drawing logic
}

function loadSVG(url) {
  return new Promise((resolve, reject) => {
    // Ensure that the project is initialized before importing SVG
    if (paper.project) {
      paper.project.importSVG(url, (item) => {
        if (item) {
          // Create a new group to hold the simplified paths
          const simplifiedGroup = new paper.Group();
          const simplifyStrength = 5;

          // Process the loaded SVG item
          item.children.forEach((child) => {
            // simplify logic for different types of paper.js objects (path, compound, shape)
            if (child instanceof paper.Path) {
              child.simplify(simplifyStrength);
              simplifiedGroup.addChild(child);
            } else if (child instanceof paper.CompoundPath) {
              child.simplify(simplifyStrength);
              simplifiedGroup.addChild(child);
            } else if (child instanceof paper.Shape) {
              console.log("Shape object ignored");
            }
          });

          // Export the simplified group back to an SVG string
          const svgString = simplifiedGroup.exportSVG({ asString: true });

          // turn that string into a DOM element
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
          const paths = svgDoc.getElementsByTagName("path");

          // Resolve the promise with the simplified SVG path data
          resolve(paths);
        } else {
          reject("Failed to load SVG");
        }
      });
    } else {
      reject("Paper.js project is not initialized");
    }
  });
}

function mousePressed() {
  createSVG(exampleSVG.svg, true);
}

// Change the current level on key press
function keyPressed() {
  // Create a mapping of level keys to level names
  const levelMapping = {
    1: "tutorial",
    2: "bridge",
    3: "snake",
    4: "balls",
  };

  // Get the level name based on the key pressed
  const levelName = levelMapping[key];

  // Check if the level name exists in the mapping
  if (levelName) {
    createLevel(levelName, true); // Pass the level name instead of the key
    currentLevel = levelName; // Update the current level
  }
}

function windowResized() {
  resizeCanvas();
  createLevel(currentLevel, clear);
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
  console.log(clear);
  if (clear) {
    Matter.Composite.clear(world);
    drawBodies = [];
    console.log("cleared!");
  }
  // set responsive dimensions of bodies seperately, so they can be accessed for calculations in level data
  let dim = {
    char: {
      scale: 0.5,
    },
    tutorial: {
      floor: { w: width, h: height / 1 / 5 },
      base: { w: width / 6, h: height / 12 },
      top: { w: width / 10, h: height / 14 },
    },
    bridge: {
      leftCliff: { w: width / 2, h: height / 1 / 5 },
      rightCliff: { w: width / 2.5, h: height / 1 / 5 },
      sensor: { w: 100, h: 50 },
    },
    snake: {
      floor: { w: width, h: height / 1 / 5 },
      snake: { x: width - width / 4, y: height / 1 / 5 + 100 },
    },
    balls: {
      leftWall: { w: width / 3.5, h: height / 2 },
      rightWall: { w: width / 3.5 },
      floor: { w: width, h: height / 1 / 5 },
      radius: width / 12,
    },
  };

  let levels = {
    tutorial: {
      // tutorial level
      background: backgroundImgs[0],
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
    },
    bridge: {
      // bridge level
      background: backgroundImgs[0],
      terrain: {
        leftCliff: {
          x: dim.bridge.leftCliff.w / 2,
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
        x: dim.bridge.leftCliff.w / 2,
        y: height / 2,
        w: angryAnim.width * dim.char.scale,
        h: angryAnim.height * dim.char.scale,
      },
    },
    snake: {
      // snake level
      background: backgroundImgs[0],
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
          y: dim.snake.snake.y,
          // ADD: Dynamically link asset size
          w: 50,
          h: 50,
          label: "snake",
        },
      },
    },
    balls: {
      // balls level
      background: backgroundImgs[0],
      terrain: {
        leftWall: {
          x: dim.balls.leftWall.w / 2,
          y: 0 + dim.balls.leftWall.h / 2,
          w: dim.balls.leftWall.w,
          h: dim.balls.leftWall.h,
        },
        rightWall: {
          x: width - dim.balls.rightWall.w / 2,
          y: (height - dim.balls.floor.h) / 2,
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
          y: 0 + dim.balls.leftWall.h / 1.5,
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
          weight: 2,
        },
        { isStatic: true, label: "terrain" }
      );
      drawBodies.push(levelGeo);
    });
  }

  // Create sensors (e.g., for collision detection)
  if (level.sensors) {
    Object.values(level.sensors).forEach((sensor) => {
      let levelSensor;
      levelSensor = new Block(
        world,
        { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h },
        { isStatic: true, isSensor: true, label: sensor.label },
        "CORNER"
      );
      drawBodies.push(levelSensor);
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
            weight: 2,
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
            weight: 2,
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
            color: "red",
            stroke: "black",
            weight: 2,
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
      { x: char.x, y: char.y, w: char.w, h: char.h },
      { restitution: 0.5, friction: 0.5 }
    );
  }
}

// check for win/lose conditions by detecting collisions
Events.on(engine, "collisionStart", function (event) {
  // ADD: drawnSVG condition back
  if (gameState === "runGame") {
    const pairs = event.pairs;

    // check win/lose conditions for bridge level
    if (currentLevel === "bridge" && drawnSVG) {
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
      if (Query.collides(drawnSVG.body, winSensors).length == 2) {
        console.log("Bridge has been built");
        gameState = "win";
      }

      // check if the drawn object is too small for the gap
      if (Query.collides(drawnSVG.body, failSensors).length > 0) {
        console.log("Object too small!");
        gameState = "failure";
      }
    } else if (currentLevel === "balls") {
      // ball level
      let query = [];
      let testBlock;
      const bodies = Composite.allBodies(world);
      bodies.forEach((body) => {
        if (body.label.includes("Ball")) {
          query.push(body);
        } else if (body.label === "terrain") {
          query.push(body);
        } else if (body.label === "test") {
          testBlock = body;
        }
      });

      if (testBlock) {
        let collisionRecord = Query.collides(testBlock, query);
        if (collisionRecord.length >= 2) {
          let depth = Query.collides(testBlock, query)[0].depth;
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
      const massThreshold = 10;
      const velocityThreshold = 10;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Determine which body is the button and which is the colliding body
        const buttonBody =
          bodyA.label === "button" ? bodyA : bodyB.label === "button" ? bodyB : null;
        const collidingBody = buttonBody === bodyA ? bodyB : bodyA;

        // Check if the colliding body has the required mass and velocity
        if (buttonBody && collidingBody) {
          const collidingMass = collidingBody.mass;
          const collidingVelocity = Matter.Vector.magnitude(collidingBody.velocity);
          // console.log(collidingVelocity);

          if (collidingMass >= massThreshold && collidingVelocity >= velocityThreshold) {
            // Press the button down
            pressButton(buttonBody);
          }
        }
      });
    } else if (currentLevel === "snake") {
      // tutorial and puzzle button level
      const massThreshold = 10;
      const velocityThreshold = 10;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Determine which body is the button and which is the colliding body
        const snakeBody = bodyA.label === "snake" ? bodyA : bodyB.label === "snake" ? bodyB : null;
        const collidingBody = snakeBody === bodyA ? bodyB : bodyA;

        // Check if the colliding body has the required mass and velocity
        if (snakeBody && collidingBody) {
          const collidingMass = collidingBody.mass;
          const collidingVelocity = Matter.Vector.magnitude(collidingBody.velocity);
          // console.log(collidingVelocity);

          if (collidingMass >= massThreshold && collidingVelocity >= velocityThreshold) {
            // Squash the snake and win level
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

// function simplifySVG(svg) {
//   let path = new Path(svg);
//   // Create a new group to hold the simplified paths
//   const simplifiedGroup = new paper.Group();
//   const simplifyStrength = 5;

//   // simplify logic for different labels of paper.js objects (path, compound, shape)
//   if (path instanceof paper.Path) {
//     path.simplify(simplifyStrength);
//     simplifiedGroup.addChild(path);
//   }

//   // else if (child instanceof paper.CompoundPath) {
//   //   child.simplify(simplifyStrength);
//   //   simplifiedGroup.addChild(child);
//   // } else if (child instanceof paper.Shape) {
//   //   console.log("Shape object ignored");
//   // }

//   // Export the simplified group back to an SVG string
//   const svgString = simplifiedGroup.exportSVG({ asString: true });

//   // turn that string into a DOM element
//   const parser = new DOMParser();
//   const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
//   const paths = svgDoc.getElementsByTagName("path");
//   return paths;
// }

function createSVG(svg, debug) {
  getDrawPosition().then((pos) => {
    if (gameState === "runGame" && svg) {
      console.log(pos);
      let drawnSVG;
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
      drawnSVG = new PolygonFromSVG(
        world,
        {
          x: pos.x,
          y: pos.y,
          fromPath: htmlPath,
          color: "white",
          stroke: "black",
          weight: 2,
        },
        { isStatic: false, mass: 100, label: "drawnBody" }
      );

      // remove svg body if it collides with other geometry on spawn
      if (Query.collides(drawnSVG.body, levelBodies).length > 0) {
        console.log("collision of svg body with level geometry");
        drawnSVG.removeBody(world, drawnSVG);
      } else {
        svgShapes.push(drawnSVG);
        console.log(drawnSVG);
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
