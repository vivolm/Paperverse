// matter.js module aliases
const Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
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

// global game logic
let gameState = "runGame";
let currentLevel = 0;

// let canvasMouse;

function preload() {
  let level1BG = loadImage("./Assets/game_background_1.png", function (img) {
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
    });

    svgShapes.forEach((x) => {
      x.draw();
    });

    characterBody.draw();

    animation(angryAnim, characterBody.body.position.x, characterBody.body.position.y, degrees(characterBody.body.angle));
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
  if (gameState === "runGame") {
    if (svgShapes.length > 0) {
      svgShapes.forEach((x) => {
        x.removeBody(); // limit SVG bodies to just one to tighten gameplay and prevent level workarounds
      });
    }
    svgShapes = []; // remove old SVG bodies from drawing logic
    drawnSVG = new PolygonFromSVG(world, { x: mouseX, y: mouseY, fromPath: drawableSVG[0], scale: 0.7, color: "white" }, { label: "drawnBody" });
    svgShapes.push(drawnSVG);
  }
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
  // set responsive dimensions of bodies seperately, so they can be accessed in level data
  let levelDims = [
    {
      dimensions: [
        { w: width / 2, h: height / 1 / 3 },
        { w: width / 2.5, h: height / 1 / 3 },
        { w: 100, h: 50 },
      ],
      character: { scale: 0.5 },
    },
  ];

  // set up data for each level (position, etc.), each array item corresponds to a level
  let levels = [
    {
      background: backgroundImgs[0],
      geometry: [
        { x: levelDims[0].dimensions[0].w / 2, y: height - levelDims[0].dimensions[0].h / 2, w: levelDims[0].dimensions[0].w, h: levelDims[0].dimensions[0].h },
        { x: width - levelDims[0].dimensions[1].w / 2, y: height - levelDims[0].dimensions[1].h / 2, w: levelDims[0].dimensions[1].w, h: levelDims[0].dimensions[1].h },
      ],
      sensors: [
        { x: levelDims[0].dimensions[0].w / 2 + levelDims[0].dimensions[0].w / 2, y: height - 20, w: width - (levelDims[0].dimensions[0].w + levelDims[0].dimensions[1].w), h: 100, type: "fail" },
        {
          x: levelDims[0].dimensions[0].w / 2 + levelDims[0].dimensions[0].w / 2 - levelDims[0].dimensions[2].w,
          y: height - levelDims[0].dimensions[0].h / 2 - levelDims[0].dimensions[0].h / 2 - levelDims[0].dimensions[2].h,
          w: levelDims[0].dimensions[2].w,
          h: levelDims[0].dimensions[2].h,
          type: "win",
        },
        {
          x: width - levelDims[0].dimensions[1].w / 2 - levelDims[0].dimensions[1].w / 2,
          y: height - levelDims[0].dimensions[1].h / 2 - levelDims[0].dimensions[1].h / 2 - levelDims[0].dimensions[2].h,
          w: levelDims[0].dimensions[2].w,
          h: levelDims[0].dimensions[2].h,
          type: "win",
        },
      ],
      char: { x: levelDims[0].dimensions[0].w / 2, y: height / 2, w: angryAnim.width * levelDims[0].character.scale, h: angryAnim.height * levelDims[0].character.scale },
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
  level.geometry.forEach((geo) => {
    let levelGeo = new Block(world, { x: geo.x, y: geo.y, w: geo.w, h: geo.h, color: "white" }, { isStatic: true });
    drawBodies.push(levelGeo);
  });

  // create sensors (e.g. for collision detection)
  level.sensors.forEach((sensor) => {
    let levelSensor;
    if (sensor.type === "fail") {
      levelSensor = new Block(world, { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h, color: "red" }, { isStatic: true, isSensor: true, label: "failSensor" }, "CORNER");
    } else if (sensor.type === "win") {
      levelSensor = new Block(world, { x: sensor.x, y: sensor.y, w: sensor.w, h: sensor.h, color: "red" }, { isStatic: true, isSensor: true, label: "winSensor" }, "CORNER");
    }
    drawBodies.push(levelSensor);
  });

  // create character
  const char = level.char;
  characterBody = new Block(world, { x: char.x, y: char.y, w: char.w, h: char.h }, { restitution: 0.5, friction: 0.5 });
}

// check for win/lose conditions by detecting collisions
Events.on(engine, "collisionStart", function () {
  if (drawnSVG && gameState === "runGame") {
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

    // check win/lose conditions for respective level
    if (currentLevel == 0) {
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
    }
  }
});
