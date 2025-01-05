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
let angryAnim;
let characterBody;
let spikeBall;
let angle = 0;
let rotationSpeed = 0.0001;

// global game logic
let gameState = "runGame";
let currentLevel = 3;
let isRotating = true;

// let canvasMouse;

function preload() {
  loadImage("./Assets/level_1_background.jpg", function (img) {
    backgroundImgs.push(img);
  });

  angryAnim = loadAni("./Assets/Spritesheet.png", {
    width: 375,
    height: 500,
    frames: 11,
  });
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight + 10);
  canvas.parent("sketch-holder");

  // set paper.js working space to p5.js canvas
  canvas.id("myCanvas");
  paper.setup("myCanvas");

  resizeCanvas(windowWidth, windowHeight + 10);

  // setup mouse control for debugging purposes
  // canvasMouse = Matter.Mouse.create(canvas.elt);
  // canvasMouse.pixelRatio = pixelDensity();
  // mConstraint = MouseConstraint.create(engine, { mouse: canvasMouse, stiffness: 0.2 });
  // Composite.add(world, mConstraint);

  // load the SVG and then simplify it
  loadSVG("./SVG/output.svg")
    .then((simplifiedSVG) => {
      console.log("Simplified SVG Path:", simplifiedSVG);
      drawableSVG = simplifiedSVG;
    })
    .catch((error) => {
      console.error(error);
    });

  angryAnim.scale = 0.5;

  createLevel(currentLevel);
  // spikeBall = new SpikedBall(world, { x: 1200, y: 300, r: 100, color: "white", stroke: "black", weight: 2 }, { isStatic: true }, "CENTER");

  // run the engine
  Runner.run(runner, engine);
}

function draw() {
  backgroundImgs.forEach((x) => {
    image(x, 0, 0, width, height);
  });

  if (gameState == "runGame") {
    drawBodies.forEach((x) => {
      x.draw();
      if (x.options.label === "spikeBall") {
        if (isRotating) {
          console.log("Ball is rotating");
          Body.rotate(x.body, radians(0.5));
        } else {
          console.log("Ball is stopped");
        }
      }
    });

    svgShapes.forEach((x) => {
      x.draw();
    });

    if (characterBody) {
      characterBody.draw();

      animation(angryAnim, characterBody.body.position.x, characterBody.body.position.y, degrees(characterBody.body.angle));
    }

    // spikeBall.draw();
  }

  if (gameState === "gameOver") {
    text("GAME OVER", width / 2, height / 2);
  }

  if (gameState === "win") {
    text("WIN", width / 2, height / 2);
  }
}

function loadSVG(url) {
  return new Promise((resolve, reject) => {
    // Ensure that the project is initialized before importing SVG
    if (paper.project) {
      paper.project.importSVG(url, (item) => {
        if (item) {
          // Create a new group to hold the simplified paths
          const simplifiedGroup = new paper.Group();

          // Process the loaded SVG item
          item.children.forEach((child) => {
            if (child instanceof paper.Path) {
              console.log("Original Path:", child);
              child.simplify(5);
              console.log("Simplified Path:", child);
              simplifiedGroup.addChild(child);
            } else if (child instanceof paper.CompoundPath) {
              console.log("Original CompoundPath:", child);
              child.simplify(5);
              console.log("Simplified CompoundPath:", child);
              simplifiedGroup.addChild(child);
            } else if (child instanceof paper.Shape) {
              console.log("Shape object ignored");
            }
          });

          // Export the simplified group back to SVG
          const svgString = simplifiedGroup.exportSVG({ asString: true });

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
  // if (gameState === "runGame") {
  //   if (svgShapes.length > 0) {
  //     svgShapes.forEach((x) => {
  //       x.removeBody(); // limit SVG bodies to just one to tighten gameplay and prevent level workarounds
  //     });
  //   }
  //   svgShapes = []; // remove old SVG bodies from drawing logic
  //   drawnSVG = new PolygonFromSVG(world, { x: mouseX, y: mouseY, fromPath: drawableSVG[0], scale: 0.7, color: "white", stroke: "black", weight: 2 }, { label: "drawnBody" });
  //   svgShapes.push(drawnSVG);
  // }
  let testBlock = new Block(world, { x: mouseX, y: mouseY, w: 100, h: 100, color: "white", stroke: "black", weight: 2 }, { isStatic: false, mass: 100, label: "test" });
  drawBodies.push(testBlock);
}

function keyPressed() {
  if (key === "d") {
    debug = !debug;
  }

  if (key === "r") {
    gameState = "runGame";
  }
}

function windowResized() {
  resizeCanvas();
  createLevel(currentLevel, clear);
}

function createLevel(levelIndex, clear) {
  // set responsive dimensions of bodies seperately, so they can be accessed for calculations in level data
  let levelDims = [
    {
      character: { scale: 0.5 }, // character scale for all levels
    },
    {
      dimensions: [
        // level 1
        { w: width / 2, h: height / 1 / 3 },
        { w: width / 2.5, h: height / 1 / 3 },
        { w: 100, h: 50 },
      ],
    },
    {
      dimensions: [
        // level 2
        { w: width / 2, h: height / 1 / 3 },
        { w: width / 3.5, h: height / 1 / 3 },
        { w: width, h: height / 1 / 5 },
      ],
    },
    {
      dimensions: [
        // level 3
        { w: width / 8, h: height },
        { w: width / 4, h: height / 1 / 5 },
      ],
    },
    {
      dimensions: [
        // tutorial
        { w: width, h: height / 1 / 5 },
        { w: width / 6, h: height / 12 },
        { w: width / 10, h: height / 14 },
      ],
    },
  ];

  // set up data for each level (position, etc.), each array item corresponds to a level
  let levels = [
    {
      // bridge level 0
      background: backgroundImgs[0],
      terrain: [
        { x: levelDims[1].dimensions[0].w / 2, y: height - levelDims[1].dimensions[0].h / 2, w: levelDims[1].dimensions[0].w, h: levelDims[1].dimensions[0].h },
        { x: width - levelDims[1].dimensions[1].w / 2, y: height - levelDims[1].dimensions[1].h / 2, w: levelDims[1].dimensions[1].w, h: levelDims[1].dimensions[1].h },
      ],
      sensors: [
        { x: levelDims[1].dimensions[0].w / 2 + levelDims[1].dimensions[0].w / 2, y: height - 20, w: width - (levelDims[1].dimensions[0].w + levelDims[1].dimensions[1].w), h: 100, type: "fail" },
        {
          x: levelDims[1].dimensions[0].w / 2 + levelDims[1].dimensions[0].w / 2 - levelDims[1].dimensions[2].w,
          y: height - levelDims[1].dimensions[0].h / 2 - levelDims[1].dimensions[0].h / 2 - levelDims[1].dimensions[2].h,
          w: levelDims[1].dimensions[2].w,
          h: levelDims[1].dimensions[2].h,
          type: "win",
        },
        {
          x: width - levelDims[1].dimensions[1].w / 2 - levelDims[1].dimensions[1].w / 2,
          y: height - levelDims[1].dimensions[1].h / 2 - levelDims[1].dimensions[1].h / 2 - levelDims[1].dimensions[2].h,
          w: levelDims[1].dimensions[2].w,
          h: levelDims[1].dimensions[2].h,
          type: "win",
        },
      ],
      char: { x: levelDims[1].dimensions[0].w / 2, y: height / 2, w: angryAnim.width * levelDims[0].character.scale, h: angryAnim.height * levelDims[0].character.scale },
    },
    {
      // spike ball level 1
      background: backgroundImgs[0],
      terrain: [
        { x: levelDims[2].dimensions[0].w / 2, y: levelDims[2].dimensions[0].h / 2, w: levelDims[2].dimensions[0].w, h: levelDims[2].dimensions[0].h },
        { x: width - levelDims[2].dimensions[1].w / 2, y: levelDims[2].dimensions[1].h / 2, w: levelDims[2].dimensions[1].w, h: levelDims[2].dimensions[1].h },
        { x: width / 2, y: height - levelDims[2].dimensions[2].h / 2, w: levelDims[2].dimensions[2].w, h: levelDims[2].dimensions[2].h },
      ],
      spikeBall: [
        {
          x: levelDims[2].dimensions[0].w + (width - levelDims[2].dimensions[0].w - levelDims[2].dimensions[1].w) / 2,
          y: levelDims[2].dimensions[0].h,
          r: ((width - levelDims[2].dimensions[0].w - levelDims[2].dimensions[1].w) / 2) * 0.7,
        },
      ],
      char: { x: levelDims[1].dimensions[0].w / 2, y: height / 2, w: angryAnim.width * levelDims[0].character.scale, h: angryAnim.height * levelDims[0].character.scale },
    },
    {
      // trampoline level 2
      background: backgroundImgs[0],
      terrain: [
        { x: width - levelDims[3].dimensions[0].w / 2, y: levelDims[3].dimensions[0].h / 2, w: levelDims[3].dimensions[0].w, h: levelDims[3].dimensions[0].h },
        { x: levelDims[3].dimensions[1].w / 2, y: height - levelDims[3].dimensions[1].h / 2, w: levelDims[3].dimensions[1].w, h: levelDims[3].dimensions[1].h },
      ],
    },
    {
      // tutorial level 3
      background: backgroundImgs[0],
      terrain: [{ x: levelDims[4].dimensions[0].w / 2, y: height - levelDims[4].dimensions[0].h / 2, w: levelDims[4].dimensions[0].w, h: levelDims[4].dimensions[0].h }],
      button: [
        {
          x: levelDims[4].dimensions[0].w / 2,
          y: height - levelDims[4].dimensions[0].h - levelDims[4].dimensions[1].h / 2,
          w: levelDims[4].dimensions[1].w,
          h: levelDims[4].dimensions[1].h,
          type: "base",
        },
        {
          x: levelDims[4].dimensions[0].w / 2,
          y: height - levelDims[4].dimensions[0].h - levelDims[4].dimensions[1].h - levelDims[4].dimensions[2].h / 2,
          w: levelDims[4].dimensions[2].w,
          h: levelDims[4].dimensions[2].h,
          type: "button",
        },
      ],
    },
  ];

  // access the correct level data
  level = levels[levelIndex];

  // delete all previously created and drawn bodies (e.g. on window resize)
  if (clear) {
    const bodies = Composite.allBodies(world);
    bodies.forEach((body) => {
      Composite.remove(world, body);
      drawBodies = [];
    });
  }

  // create bodies (e.g. static/dynamic geo, sensors, characters)
  if (level.terrain) {
    level.terrain.forEach((geo) => {
      let levelGeo = new Block(world, { x: geo.x, y: geo.y, w: geo.w, h: geo.h, color: "white", stroke: "black", weight: 2 }, { isStatic: true, label: "terrain" });
      drawBodies.push(levelGeo);
    });
  }

  // create sensors (e.g. for collision detection)
  if (level.sensors) {
    level.sensors.forEach((sensor) => {
      let levelSensor;
      if (sensor.type === "fail") {
        levelSensor = new Block(world, { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h }, { isStatic: true, isSensor: true, label: "failSensor" }, "CORNER");
      } else if (sensor.type === "win") {
        levelSensor = new Block(world, { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h }, { isStatic: true, isSensor: true, label: "winSensor" }, "CORNER");
      }
      drawBodies.push(levelSensor);
    });
  }

  // create spikey ball (e.g. for obstacles)
  if (level.spikeBall) {
    level.spikeBall.forEach((spikey) => {
      let spikeBall = new SpikedBall(world, { x: spikey.x, y: spikey.y, r: spikey.r, color: "white", stroke: "black", weight: 2 }, { isStatic: true, label: "spikeBall" });
      drawBodies.push(spikeBall);
    });
  }

  if (level.button) {
    level.button.forEach((button) => {
      let buttonBlock;
      if (button.type === "base") {
        buttonBlock = new Block(world, { x: button.x, y: button.y, w: button.w, h: button.h, color: "black" }, { isStatic: true, label: "buttonBase" });
      } else if (button.type === "button") {
        buttonBlock = new Block(world, { x: button.x, y: button.y, w: button.w, h: button.h, color: "red", stroke: "black", weight: 2 }, { isStatic: true, label: "button" });
      }
      drawBodies.push(buttonBlock);
    });
  }

  // create character
  if (level.char) {
    const char = level.char;
    characterBody = new Block(world, { x: char.x, y: char.y, w: char.w, h: char.h }, { restitution: 0.5, friction: 0.5 });
  }
}

// check for win/lose conditions by detecting collisions
Events.on(engine, "collisionStart", function (event) {
  // ADD: drawnSVG condition back
  if (gameState === "runGame") {
    const pairs = event.pairs;

    // check win/lose conditions for respective level
    if (currentLevel == 0) {
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
        gameState = "gameOver";
      }
    } else if (currentLevel == 1) {
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
            if (Collision.collides(testBlock, ter).penetration.x > 5 || Collision.collides(testBlock, ter).penetration.y > 5) {
              isRotating = false;
            }
          }
        });
      }
    } else if (currentLevel == 3) {
      const massThreshold = 10;
      const velocityThreshold = 10;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Determine which body is the button and which is the colliding body
        const buttonBody = bodyA.label === "button" ? bodyA : bodyB.label === "button" ? bodyB : null;
        const collidingBody = buttonBody === bodyA ? bodyB : bodyA;

        console.log(collidingBody);

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

  // Move it back up after a short delay
  setTimeout(() => {
    Body.translate(button, { x: 0, y: -10 });
  }, 500); // Adjust the delay as needed
}
