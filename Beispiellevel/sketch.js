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

// global variables for tracking bodies & assets
let drawBodies = [];
let svgShapes = [];
let drawableSVG;
let drawnSVG;
let backgroundImgs = [];
let characterBody;
let spikeBall;
let rotationSpeed = 0.0001;
let isRotating = true;

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
let currentLevel = 1;
let finalLevel = 5;

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
  angryAnim = loadAni("./Assets/Sprite_Angry.png", {
    width: 175,
    height: 248,
    frames: 11,
  });
  idleAnim = loadAni("./Assets/Sprite_Idle.png", {
    width: 175,
    height: 248,
    frames: 18,
  });
  loseAnim = loadAni("./Assets/Sprite_Lose.png", {
    width: 175,
    height: 248,
    frames: 17,
  });
  noteAnim = loadAni("./Assets/Sprite_Note.png", {
    width: 175,
    height: 248,
    frames: 14,
  });
  thinkAnim = loadAni("./Assets/Sprite_Think.png", {
    width: 175,
    height: 248,
    frames: 11,
  });
  waitAnim = loadAni("./Assets/Sprite_Wait.png", {
    width: 175,
    height: 248,
    frames: 10,
  });
  winAnim = loadAni("./Assets/Sprite_Win.png", {
    width: 175,
    height: 248,
    frames: 13,
  });

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

  // set fps for animations
  Object.keys(animations).forEach((i) => {
    animations[i].frameDelay = 9;
  });

  // load the SVG and then simplify it
  loadSVG("./SVG/output.svg")
    .then((simplifiedSVG) => {
      drawableSVG = simplifiedSVG;
    })
    .catch((error) => {
      console.error(error);
    });

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
  if (gameState === "runGame") {
    if (svgShapes.length > 0) {
      svgShapes.forEach((x) => {
        x.removeBody(); // limit SVG bodies to just one to tighten gameplay and prevent level workarounds
      });
    }
    svgShapes = []; // remove old SVG bodies from drawing logic
    drawnSVG = new PolygonFromSVG(
      world,
      {
        x: mouseX,
        y: mouseY,
        fromPath: drawableSVG[0],
        scale: 0.7,
        color: "white",
        stroke: "black",
        weight: 2,
      },
      { label: "drawnBody" }
    );
    svgShapes.push(drawnSVG);
  }

  /*getDrawPosition().then((pos) => {
    let testBlock;
    let levelBodies = Composite.allBodies(world);
    console.log(levelBodies);
    pos.x = map(pos.x, 0, 1, 0, width);
    pos.y = map(pos.y, 0, 1, 0, height);
    if (pos.color === "yellow") {
      testBlock = new Block(world, { x: mouseX, y: mouseY, w: 100, h: 100, color: "white", stroke: "black", weight: 2 }, { isStatic: false, mass: 100, label: "test" });
    } else if (pos.color === "blue") {
      testBlock = new Block(world, { x: mouseX, y: mouseY, w: 100, h: 100, color: "white", stroke: "black", weight: 2 }, { isStatic: true, mass: 100, label: "test" });
    }
    if (Query.collides(testBlock.body, levelBodies).length > 0) {
      console.log("collision of drawn body with level geometry");
      testBlock.removeBody(world, testBlock);
    } else {
      drawBodies.push(testBlock);
    }
  });*/
}

/*async function getDrawPosition() {
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

    position_color.x = data.relative_position.x;
    position_color.y = data.relative_position.y;
    position_color.color = data.color;
    return position_color; // Return the position/color object
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}*/

function windowResized() {
  resizeCanvas();
  createLevel(currentLevel, clear);
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
  let levelDims = [
    {
      character: { scale: 1 }, // character scale for all levels
    },
    {
      dimensions: [
        //tutorial 1
        { w: width, h: height / 1 / 5 },
      ],
    },
    {
      dimensions: [
        // tutorial 2
        { w: width, h: height / 5 },
        { w: width / 6, h: height / 12 },
        { w: width / 10, h: height / 14 },
      ],
    },
    {
      dimensions: [
        // level 1 bridge
        { w: width / 2, h: height / 3 },
        { w: width / 2.5, h: height / 3 },
        { w: 100, h: 50 },
      ],
    },
    {
      dimensions: [
        // level 2 ball
        { w: width / 2, h: height / 3 },
        { w: width / 3.5, h: height / 3 },
        { w: width, h: height / 5 },
      ],
    },
    {
      dimensions: [
        // level 3 button
        { w: width / 8, h: height },
        { w: width / 4, h: height / 1 / 5 },
      ],
    },
  ];

  // set up data for each level (position, etc.), each array item corresponds to a level
  let levels = [
    {
      // tutorial 2
      background: backgroundImgs[0],
      terrain: [
        {
          x: levelDims[2].dimensions[0].w / 2,
          y: height - levelDims[2].dimensions[0].h / 2,
          w: levelDims[2].dimensions[0].w,
          h: levelDims[2].dimensions[0].h,
        },
      ],
      button: [
        {
          x: levelDims[2].dimensions[0].w / 2,
          y: height - levelDims[2].dimensions[0].h - levelDims[2].dimensions[1].h / 2,
          w: levelDims[2].dimensions[1].w,
          h: levelDims[2].dimensions[1].h,
          type: "base",
        },
        {
          x: levelDims[2].dimensions[0].w / 2,
          y:
            height -
            levelDims[2].dimensions[0].h -
            levelDims[2].dimensions[1].h -
            levelDims[2].dimensions[2].h / 2,
          w: levelDims[2].dimensions[2].w,
          h: levelDims[2].dimensions[2].h,
          type: "button",
        },
      ],
      char: {
        x: levelDims[2].dimensions[0].w / 4,
        y: height / 2,
        w: idleAnim.width * levelDims[0].character.scale,
        h: idleAnim.height * levelDims[0].character.scale,
      },
    },
    {
      // level 1 bridge
      background: backgroundImgs[0],
      terrain: [
        {
          x: levelDims[3].dimensions[0].w / 2,
          y: height - levelDims[3].dimensions[0].h / 2,
          w: levelDims[3].dimensions[0].w,
          h: levelDims[3].dimensions[0].h,
        },
        {
          x: width - levelDims[3].dimensions[1].w / 2,
          y: height - levelDims[3].dimensions[1].h / 2,
          w: levelDims[3].dimensions[1].w,
          h: levelDims[3].dimensions[1].h,
        },
      ],
      sensors: [
        {
          x: levelDims[3].dimensions[0].w / 2 + levelDims[3].dimensions[0].w / 2,
          y: height - 20,
          w: width - (levelDims[3].dimensions[0].w + levelDims[3].dimensions[1].w),
          h: 100,
          type: "fail",
        },
        {
          x:
            levelDims[3].dimensions[0].w / 2 +
            levelDims[3].dimensions[0].w / 2 -
            levelDims[3].dimensions[2].w,
          y:
            height -
            levelDims[1].dimensions[0].h / 2 -
            levelDims[3].dimensions[0].h / 2 -
            levelDims[3].dimensions[2].h,
          w: levelDims[3].dimensions[2].w,
          h: levelDims[3].dimensions[2].h,
          type: "win",
        },
        {
          x: width - levelDims[3].dimensions[1].w / 2 - levelDims[3].dimensions[1].w / 2,
          y:
            height -
            levelDims[3].dimensions[1].h / 2 -
            levelDims[3].dimensions[1].h / 2 -
            levelDims[3].dimensions[2].h,
          w: levelDims[3].dimensions[2].w,
          h: levelDims[3].dimensions[2].h,
          type: "win",
        },
      ],
      char: {
        x: levelDims[3].dimensions[0].w / 2,
        y: height / 2,
        w: idleAnim.width * levelDims[0].character.scale,
        h: idleAnim.height * levelDims[0].character.scale,
      },
    },
    {
      // level 2 ball
      background: backgroundImgs[0],
      terrain: [
        {
          x: levelDims[4].dimensions[0].w / 2,
          y: levelDims[4].dimensions[0].h / 2,
          w: levelDims[4].dimensions[0].w,
          h: levelDims[4].dimensions[0].h,
        },
        {
          x: width - levelDims[4].dimensions[1].w / 2,
          y: levelDims[4].dimensions[1].h / 2,
          w: levelDims[4].dimensions[1].w,
          h: levelDims[4].dimensions[1].h,
        },
        {
          x: width / 2,
          y: height - levelDims[4].dimensions[2].h / 2,
          w: levelDims[4].dimensions[2].w,
          h: levelDims[4].dimensions[2].h,
        },
      ],
      spikeBall: [
        {
          x:
            levelDims[4].dimensions[0].w +
            (width - levelDims[4].dimensions[0].w - levelDims[4].dimensions[1].w) / 2,
          y: levelDims[4].dimensions[0].h,
          r: ((width - levelDims[4].dimensions[0].w - levelDims[4].dimensions[1].w) / 2) * 0.7,
        },
      ],
      char: {
        x: levelDims[4].dimensions[0].w / 2,
        y: height / 2,
        w: idleAnim.width * levelDims[0].character.scale,
        h: idleAnim.height * levelDims[0].character.scale,
      },
    },
    {
      // level 3 button
      background: backgroundImgs[0],
      terrain: [
        {
          x: width - levelDims[5].dimensions[0].w / 2,
          y: levelDims[5].dimensions[0].h / 2,
          w: levelDims[5].dimensions[0].w,
          h: levelDims[5].dimensions[0].h,
        },
        {
          x: levelDims[5].dimensions[1].w / 2,
          y: height - levelDims[5].dimensions[1].h / 2,
          w: levelDims[5].dimensions[1].w,
          h: levelDims[5].dimensions[1].h,
        },
      ],
      char: {
        x: levelDims[5].dimensions[0].w / 2,
        y: height / 2,
        w: idleAnim.width * levelDims[0].character.scale,
        h: idleAnim.height * levelDims[0].character.scale,
      },
    },
  ];

  // access the correct level data (-1 so key inputs start at 1 instead of 0)
  levelIndex = levelIndex - 1;
  level = levels[levelIndex];

  // create bodies (e.g. static/dynamic geo, sensors, characters)
  if (level.terrain) {
    level.terrain.forEach((geo) => {
      let levelGeo = new Block(
        world,
        {
          x: geo.x,
          y: geo.y,
          w: geo.w,
          h: geo.h,
          color: "white",
          stroke: "black",
          weight: 6.5,
        },
        { isStatic: true, label: "terrain" }
      );
      drawBodies.push(levelGeo);
    });
  }

  // create sensors (e.g. for collision detection)
  if (level.sensors) {
    level.sensors.forEach((sensor) => {
      let levelSensor;
      if (sensor.type === "fail") {
        levelSensor = new Block(
          world,
          { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h },
          { isStatic: true, isSensor: true, label: "failSensor" },
          "CORNER"
        );
      } else if (sensor.type === "win") {
        levelSensor = new Block(
          world,
          { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h },
          { isStatic: true, isSensor: true, label: "winSensor" },
          "CORNER"
        );
      }
      drawBodies.push(levelSensor);
    });
  }

  // create spikey ball (e.g. for obstacles)
  if (level.spikeBall) {
    level.spikeBall.forEach((spikey) => {
      let spikeBall = new SpikedBall(
        world,
        {
          x: spikey.x,
          y: spikey.y,
          r: spikey.r,
          color: "white",
          stroke: "black",
          weight: 2,
        },
        { isStatic: true, label: "spikeBall" }
      );
      drawBodies.push(spikeBall);
    });
  }

  // create button
  if (level.button) {
    level.button.forEach((button) => {
      let buttonBlock;
      if (button.type === "base") {
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
      } else if (button.type === "button") {
        buttonBlock = new Block(
          world,
          {
            x: button.x,
            y: button.y,
            w: button.w,
            h: button.h,
            color: "white",
            stroke: "black",
            weight: 6.5,
          },
          { isStatic: true, label: "button" }
        );
      }
      drawBodies.push(buttonBlock);
    });
  }

  // create character
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
    if (currentLevel == 2) {
      let winSensors = [];
      let failSensors = [];

      const bodies = Composite.allBodies(world);
      bodies.forEach((body) => {
        if (body.label === "winSensor") {
          winSensors.push(body);
        } else if (body.label === "failSensor") {
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
    } else if (currentLevel == 4) {
      // ball level
      let terrain = [];
      let testBlock;
      const bodies = Composite.allBodies(world);
      bodies.forEach((body) => {
        if (body.label === "terrain") {
          terrain.push(body);
        } else if (body.label === "test") {
          testBlock = body;
        }
      });

      if (testBlock) {
        terrain.forEach((ter) => {
          if (Collision.collides(testBlock, ter)) {
            console.log(Collision.collides(testBlock, ter));
            if (
              Collision.collides(testBlock, ter).penetration.x > 5 ||
              Collision.collides(testBlock, ter).penetration.y > 5
            ) {
              isRotating = false;
            }
          }
        });
      }
    } else if (currentLevel == 1 || currentLevel == 5) {
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
          console.log(collidingVelocity);

          if (collidingMass >= massThreshold && collidingVelocity >= velocityThreshold) {
            // Press the button down
            pressButton(buttonBody);
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
