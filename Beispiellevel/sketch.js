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
let leftBall;
let rightBall;
let leftRotating = true;
let rightRotating = true;

// global game logic
let gameState = "runGame";
let currentLevel = "tutorial";
let levelCount = 4;

function preload() {
  // load each background and push it to the backgrounds array
  loadImage("./Assets/level_1_background.jpg", function (img) {
    backgroundImgs.push(img);
  });

  // load each animation
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

  // load the SVG and then simplify it
  loadSVG("./SVG/Round.svg")
    .then((simplifiedSVG) => {
      drawableSVG = simplifiedSVG;
      console.log(drawableSVG);
    })
    .catch((error) => {
      console.error(error);
    });

  // scale down the animation asset
  angryAnim.scale = 0.5;

  createLevel(currentLevel);

  // run the physics engine
  Runner.run(runner, engine);
}

function draw() {
  // draw all background images NOTE: replace this code as soon as different levels use different background
  backgroundImgs.forEach((x) => {
    image(x, 0, 0, width, height);
  });

  if (gameState == "runGame") {
    // draw all bodies and perform special functions (like rotation)
    drawBodies.forEach((x) => {
      x.draw();
    });

    if (leftBall && rightBall) {
      if (leftRotating) {
        Body.rotate(leftBall.body, radians(-0.5));
      }
      if (rightRotating) {
        Body.rotate(rightBall.body, radians(0.5));
      }
    }
  }

  // draw the handdrawn svg shape
  svgShapes.forEach((x) => {
    x.draw();
  });

  // draw and animate the character NOTE: Expand this logic as soon as multiple char anims are present
  if (characterBody) {
    characterBody.draw();
    animation(
      angryAnim,
      characterBody.body.position.x,
      characterBody.body.position.y,
      degrees(characterBody.body.angle)
    );
  }

  // draw post-it placement hint NOTE: Add svg body condition
  if (currentLevel === "tutorial") {
    push();
    rectMode(CENTER);
    stroke(247, 54, 0);
    strokeWeight(3);
    noFill();
    drawingContext.setLineDash([5, 5]);
    rect(width / 2, height / 4, 200, 200);
    pop();
  }
  if (gameState === "failure") {
    // play disappointed char anim here
  }

  if (gameState === "win") {
    // play happy char anim here
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
          const simplifyStrength = 5;

          // Process the loaded SVG item
          item.children.forEach((child) => {
            // simplify logic for different labels of paper.js objects (path, compound, shape)
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
    getDrawPosition().then((pos) => {
      let drawnSVG;
      let levelBodies = Composite.allBodies(world);
      pos.x = map(pos.x, 0, 1, 0, width);
      pos.y = map(pos.y, 0, 1, 0, height);

      if (pos.color === "yellow") {
        if (svgShapes.length > 0) {
          svgShapes.forEach((x) => {
            x.removeBody(); // limit SVG bodies to just one to tighten gameplay and prevent level workarounds
          });
        }
        svgShapes = []; // remove old SVG bodies from drawing logic

        drawnSVG = new PolygonFromSVG(
          world,
          {
            x: pos.x,
            y: pos.y,
            fromPath: drawableSVG[0],
            color: "white",
            stroke: "black",
            weight: 2,
          },
          { isStatic: false, mass: 100, label: "drawnBody" }
        );
      }

      if (Query.collides(drawnSVG.body, levelBodies).length > 0) {
        console.log("collision of drawn body with level geometry");
        drawnSVG.removeBody(world, drawnSVG);
      } else {
        svgShapes.push(drawnSVG);
      }
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

function createLevel(levelIndex, clear) {
  // delete all previously created and drawn bodies (e.g. on window resize, level change)
  if (clear) {
    Matter.Composite.clear(world);
    drawBodies = [];
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
          y:
            height -
            dim.tutorial.floor.h -
            dim.tutorial.base.h -
            dim.tutorial.top.h / 2,
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
          bodyA.label === "button"
            ? bodyA
            : bodyB.label === "button"
            ? bodyB
            : null;
        const collidingBody = buttonBody === bodyA ? bodyB : bodyA;

        // Check if the colliding body has the required mass and velocity
        if (buttonBody && collidingBody) {
          const collidingMass = collidingBody.mass;
          const collidingVelocity = Matter.Vector.magnitude(
            collidingBody.velocity
          );
          // console.log(collidingVelocity);

          if (
            collidingMass >= massThreshold &&
            collidingVelocity >= velocityThreshold
          ) {
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
        const snakeBody =
          bodyA.label === "snake"
            ? bodyA
            : bodyB.label === "snake"
            ? bodyB
            : null;
        const collidingBody = snakeBody === bodyA ? bodyB : bodyA;

        // Check if the colliding body has the required mass and velocity
        if (snakeBody && collidingBody) {
          const collidingMass = collidingBody.mass;
          const collidingVelocity = Matter.Vector.magnitude(
            collidingBody.velocity
          );
          // console.log(collidingVelocity);

          if (
            collidingMass >= massThreshold &&
            collidingVelocity >= velocityThreshold
          ) {
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

  // Move it back up after a short delay
  setTimeout(() => {
    Body.translate(button, { x: 0, y: -10 });
  }, 500); // Adjust the delay as needed
}
