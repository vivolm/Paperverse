// module aliases
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

let levelGeometry = [];
let svgShapes = [];
let drawableSVG;
let debug = false;
const engine = Engine.create();
const world = engine.world;
const runner = Runner.create();

let winSensors = [];
let failSensor;
let drawnSVG;

let svgFile = "./SVG/Example.svg";

let gameState = "runGame";

let backgroundImgs = [];

let angryAnim;
let characterBody;
let animDim = {
  width: 375,
  height: 500,
  frames: 11,
};
let canvasMouse;

function preload() {
  let mainBG = loadImage("./Assets/game_background_1.png", function (img) {
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
  loadSVG(svgFile)
    .then((simplifiedSVG) => {
      console.log("Simplified SVG Path:", simplifiedSVG);
      drawableSVG = simplifiedSVG;
    })
    .catch((error) => {
      console.error(error);
    });

  angryAnim.scale = 0.5;

  // create left and right cliffs
  createLevelGeometry();
  createCharacter(angryAnim.scale);

  // run the engine
  Runner.run(runner, engine);
}

function draw() {
  backgroundImgs.forEach((x) => {
    image(x, 0, 0, width, height);
  });

  if (gameState == "runGame") {
    levelGeometry.forEach((x) => {
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
}

function windowResized() {
  resizeCanvas();
  createLevelGeometry(true);
}

// Creates the cliffs and makes sure that they are relative to the screen size
function createLevelGeometry(clear) {
  let winSensorW = 100;
  let winSensorH = 50;
  let cliffLeftDim = {
    w: width / 2,
    h: height / 1 / 3,
  };

  let cliffRightDim = {
    w: width / 2.5,
    h: height / 1 / 3,
  };

  if (clear) {
    const bodies = Composite.allBodies(world);
    for (let body of bodies) {
      if (body.label === "cliff" || body.label === "sensor") {
        Composite.remove(world, body);
        levelGeometry = [];
      }
    }
  }

  // create level geometry
  cliffLeft = new Block(world, { x: cliffLeftDim.w / 2, y: height - cliffLeftDim.h / 2, w: cliffLeftDim.w, h: cliffLeftDim.h, color: "white" }, { isStatic: true, label: "cliff" });
  cliffRight = new Block(world, { x: width - cliffRightDim.w / 2, y: height - cliffRightDim.h / 2, w: cliffRightDim.w, h: cliffRightDim.h, color: "white" }, { isStatic: true, label: "cliff" });

  // create sensors to detect win/lose conditions
  failSensor = new Block(
    world,
    { x: cliffLeft.attributes.x + cliffLeft.attributes.w / 2, y: height - 20, w: width - (cliffLeft.attributes.w + cliffRight.attributes.w), h: 50, color: "red" },
    { isStatic: true, isSensor: true, label: "failSensor" },
    "CORNER"
  );

  leftWinSensor = new Block(
    world,
    { x: cliffLeft.attributes.x + cliffLeft.attributes.w / 2 - winSensorW, y: cliffLeft.attributes.y - cliffLeft.attributes.h / 2 - winSensorH, w: winSensorW, h: winSensorH, color: "red" },
    { isStatic: true, isSensor: true, label: "leftWinSensor" },
    "CORNER"
  );

  rightWinSensor = new Block(
    world,
    { x: cliffRight.attributes.x - cliffRight.attributes.w / 2, y: cliffRight.attributes.y - cliffRight.attributes.h / 2 - winSensorH, w: winSensorW, h: winSensorH, color: "red" },
    { isStatic: true, isSensor: true, label: "rightWinSensor" },
    "CORNER"
  );

  winSensors.push(leftWinSensor.body, rightWinSensor.body);
  levelGeometry.push(cliffLeft, cliffRight, failSensor, leftWinSensor, rightWinSensor);
}

function createCharacter(scale) {
  characterBody = new Block(world, { x: cliffLeft.attributes.x, y: height / 2, w: angryAnim.width * scale, h: angryAnim.height * scale }, { restitution: 0.5, friction: 0.5 });
}

// check for win/lose conditions by detecting collisions
Events.on(engine, "collisionStart", function (event) {
  if (drawnSVG) {
    // check if the drawn object spans across the gap
    if (Query.collides(drawnSVG.body, winSensors).length == 2) {
      console.log("Bridge has been built");
      gameState = "win";
    }

    // check if the drawn object is too small for the gap
    if (Collision.collides(drawnSVG.body, failSensor.body)) {
      console.log("Object too small!");
      gameState = "gameOver";
    }
  }
});

// reset the game to be running
function keyPressed() {
  if (key === "r") {
    gameState = "runGame";
  }
}
