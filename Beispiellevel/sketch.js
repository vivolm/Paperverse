// module aliases
var Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events,
  Common = Matter.Common;

Matter.use("matter-wrap");

let balls = [];
let ground = [];
let customShapes = [];
let svgShapes = [];
let complexSVG;
const engine = Engine.create();
const world = engine.world;
const runner = Runner.create();
let drawnVertices = [];
let isDrawing = false;

let gameState = "runGame";

let backgroundImgs = [];

function preload() {
  let mainBG = loadImage("./game_background_1.png", function (img) {
    backgroundImgs.push(img);
  });
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight + 10);
  canvas.parent("sketch-holder");
  canvas.id("myCanvas");
  paper.setup("myCanvas");

  resizeCanvas(windowWidth, windowHeight + 10);

  loadSVG("../output/output.svg") // Replace with the path to your SVG file
    .then((simplifiedSvg) => {
      console.log("Simplified SVG Path:", simplifiedSvg);
      complexSVG = simplifiedSvg;
      // You can now use the simplified SVG path as needed
    })
    .catch((error) => {
      console.error(error);
    });

  // create left and right cliffs
  createCliffs();

  // run the engine
  Runner.run(runner, engine);
}

function draw() {
  background("skyblue");

  backgroundImgs.forEach((x) => {
    image(x, 0, 0, width, height);
  });

  if (gameState == "runGame") {
    // Draw the shape being created
    if (isDrawing && drawnVertices.length > 0) {
      beginShape();
      for (let v of drawnVertices) {
        vertex(v.x, v.y);
      }
      endShape(); // Do not close the shape while drawing
    }

    balls.forEach((x) => {
      x.draw();
    });

    ground.forEach((x) => {
      x.draw();
    });

    svgShapes.forEach((x) => {
      x.draw();
    });

    // customShapes.forEach((body) => {
    //   beginShape();
    //   for (let v of body.vertices) {
    //     vertex(v.x, v.y);
    //   }
    //   endShape(CLOSE);
    // });
  }

  if (gameState == "gameOver") {
    text("Game Over", width / 2, height / 2);
    // const bodies = Composite.allBodies(world);
    // bodies.forEach((body) => {
    //   Composite.remove(world, body);
    //   ground = [];
    // });
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
          console.log(svgString);

          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
          const paths = svgDoc.getElementsByTagName("path");
          console.log(paths);

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
  // isDrawing = true;
  // noFill();
  // drawnVertices = []; // Reset the vertices for a new shape
  if (gameState === "runGame") {
    drawnSVG = new PolygonFromSVG(world, { x: mouseX, y: mouseY, fromPath: complexSVG[0], scale: 0.7, color: "white" });
    svgShapes.push(drawnSVG);
  }
}

function mouseDragged() {
  // if (isDrawing) {
  //   drawnVertices.push(createVector(mouseX, mouseY));
  // }
}

// function mouseReleased() {
//   isDrawing = false;
//   fill(100, 100, 250, 150);
//   // Create a Matter.js body from the drawn shape
//   if (drawnVertices.length > 2) {
//     // Close the shape by adding the first vertex to the end
//     drawnVertices.push(drawnVertices[0]); // Close the shape
//     // Create vertices for Matter.js
//     const vertices = drawnVertices.map((v) => ({ x: v.x, y: v.y }));
//     // Create a body from the drawn shape
//     const newBody = Matter.Bodies.fromVertices(
//       mouseX, // Use the mouseX for the center point
//       mouseY, // Use the mouseY for the center point
//       vertices,
//       { isStatic: false }
//     );
//     customShapes.push(newBody);
//     // Add the new body to the world
//     Matter.World.add(world, newBody);
//   }
// }

function windowResized() {
  resizeCanvas();
  createCliffs(true);
}

// Creates the cliffs and makes sure that they are relative to the screen size
function createCliffs(clear) {
  let cliffLeftDim = {
    w: width / 2,
    h: height / 1 / 3,
  };

  let cliffRightDim = {
    w: width / 2.5,
    h: height * 0.45,
  };

  if (clear) {
    const bodies = Composite.allBodies(world);
    for (let body of bodies) {
      if (body.label === "cliff" || body.label === "sensor") {
        Composite.remove(world, body);
        ground = [];
      }
    }
  }

  cliffLeft = new Block(world, { x: cliffLeftDim.w / 2, y: height - cliffLeftDim.h / 2, w: cliffLeftDim.w, h: cliffLeftDim.h, color: "white" }, { isStatic: true, label: "cliff" });
  cliffRight = new Block(world, { x: width - cliffRightDim.w / 2, y: height - cliffRightDim.h / 2, w: cliffRightDim.w, h: cliffRightDim.h, color: "white" }, { isStatic: true, label: "cliff" });
  cliffSensor = new Block(
    world,
    { x: (cliffLeft.attributes.x + cliffRight.attributes.x) / 2, y: height, w: width - (cliffLeft.attributes.w + cliffRight.attributes.w), h: 100 },
    { isStatic: true, isSensor: true, label: "sensor" }
  );
  ground.push(cliffLeft, cliffRight, cliffSensor);
}

// detect the collisoin between any physics object and the sensor
Events.on(engine, "collisionStart", function (event) {
  let pairs = event.pairs;

  pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;

    if (bodyA.label === "sensor" || bodyB.label === "sensor") {
      console.log("collision with sensor!");
      gameState = "gameOver";
    }
  });
});

// reset the game to be running
function keyPressed() {
  if (key === "r") {
    gameState = "runGame";
  }
}
