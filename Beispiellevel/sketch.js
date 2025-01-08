
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
let rotationSpeed = 0.0001;
let isRotating = true;
// global variable for data tracking
let lastPositionColor = {
  x: null,
  y: null,
  color: null,
};

// global game logic
let gameState = "runGame";
let currentLevel = 1;
let finalLevel = 5;

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
  loadSVG("./SVG/output.svg")
    .then((simplifiedSVG) => {
      drawableSVG = simplifiedSVG;
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
      if (x.options.label === "spikeBall") {
        if (isRotating) {
          Body.rotate(x.body, radians(0.5));
        }
      }
    });

    // draw the handdrawn svg shape
    svgShapes.forEach((x) => {
      x.draw();
    });

    // draw and animate the character NOTE: Expand this logic as soon as multiple char anims are present
    if (characterBody) {
      characterBody.draw();
      animation(angryAnim, characterBody.body.position.x, characterBody.body.position.y, degrees(characterBody.body.angle));
    }

    // draw post-it placement hint NOTE: Add svg body condition
    if (currentLevel == 1) {
      push();
      rectMode(CENTER);
      stroke(247, 54, 0);
      strokeWeight(3);
      noFill();
      drawingContext.setLineDash([5, 5]);
      rect(width / 2, height / 4, 200, 200);
      pop();
    }
  }

  if (gameState === "failure") {
    // play disappointed char anim here
  }

  if (gameState === "win") {
    // play happy char anim here
  }

  // RRRRRRRRRRRRRRRR Check for changes in position_color.json every 1000 milliseconds (1 second)
  // Check for changes in position_color.json every 60 frames (approximately every second at 60 FPS)
  if (frameCount % 60 === 0) {
    getDrawPosition().then((pos) => {
      // Compare with last fetched position
      if (
        pos.x !== lastPositionColor.x ||
        pos.y !== lastPositionColor.y ||
        pos.color !== lastPositionColor.color
      ) {
        // Log the changes to the console
        console.log('Position or color has changed:');
        console.log('New Position:', pos.x, pos.y);
        console.log('New Color:', pos.color);

        if (gameState === "runGame") {
             if (svgShapes.length > 0) {
             svgShapes.forEach((x) => {
                 x.removeBody(); // limit SVG bodies to just one to tighten gameplay and prevent level workarounds
               });
             }
             svgShapes = []; // remove old SVG bodies from drawing logic
             drawnSVG = new PolygonFromSVG(world, { x: pos.x, y: pos.y, fromPath: drawableSVG[0], scale: 0.7, color: "white", stroke: "black", weight: 2 }, { label: "drawnBody" });
             svgShapes.push(drawnSVG);
        }
        // Update the last position color
        lastPositionColor = pos;

        // Update the position of the relevant object (if necessary)
        if (characterBody) {
          Body.setPosition(characterBody.body, { x: pos.x, y: pos.y });
          // Optionally, update the color or do something else based on `pos.color`
          // For example, if your characterBody has a color property:
          // characterBody.color = pos.color; 
        }
      }
    });
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

  getDrawPosition().then((pos) => {
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
  });
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

    position_color.x = data.relative_position.x;
    position_color.y = data.relative_position.y;
    position_color.color = data.color;
    return position_color; // Return the position/color object
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

function keyPressed() {
  // change the current level on key press
  if (key >= 1 && key <= finalLevel) {
    createLevel(key, true);
    currentLevel = key;
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
  let levelDims = [
    {
      character: { scale: 0.5 }, // character scale for all levels
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
        { w: width, h: height / 1 / 5 },
        { w: width / 6, h: height / 12 },
        { w: width / 10, h: height / 14 },
      ],
    },
    {
      dimensions: [
        // level 1 bridge
        { w: width / 2, h: height / 1 / 3 },
        { w: width / 2.5, h: height / 1 / 3 },
        { w: 100, h: 50 },
      ],
    },
    {
      dimensions: [
        // level 2 ball
        { w: width / 2, h: height / 1 / 3 },
        { w: width / 3.5, h: height / 1 / 3 },
        { w: width, h: height / 1 / 5 },
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
      // tutorial 1
      background: backgroundImgs[0],
      terrain: [{ x: levelDims[1].dimensions[0].w / 2, y: height - levelDims[1].dimensions[0].h / 2, w: levelDims[1].dimensions[0].w, h: levelDims[1].dimensions[0].h }],
    },
    {
      // tutorial 2
      background: backgroundImgs[0],
      terrain: [{ x: levelDims[2].dimensions[0].w / 2, y: height - levelDims[2].dimensions[0].h / 2, w: levelDims[2].dimensions[0].w, h: levelDims[2].dimensions[0].h }],
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
          y: height - levelDims[2].dimensions[0].h - levelDims[2].dimensions[1].h - levelDims[2].dimensions[2].h / 2,
          w: levelDims[2].dimensions[2].w,
          h: levelDims[2].dimensions[2].h,
          type: "button",
        },
      ],
    },
    {
      // level 1 bridge
      background: backgroundImgs[0],
      terrain: [
        { x: levelDims[3].dimensions[0].w / 2, y: height - levelDims[3].dimensions[0].h / 2, w: levelDims[3].dimensions[0].w, h: levelDims[3].dimensions[0].h },
        { x: width - levelDims[3].dimensions[1].w / 2, y: height - levelDims[3].dimensions[1].h / 2, w: levelDims[3].dimensions[1].w, h: levelDims[3].dimensions[1].h },
      ],
      sensors: [
        { x: levelDims[3].dimensions[0].w / 2 + levelDims[3].dimensions[0].w / 2, y: height - 20, w: width - (levelDims[3].dimensions[0].w + levelDims[3].dimensions[1].w), h: 100, type: "fail" },
        {
          x: levelDims[3].dimensions[0].w / 2 + levelDims[3].dimensions[0].w / 2 - levelDims[3].dimensions[2].w,
          y: height - levelDims[1].dimensions[0].h / 2 - levelDims[3].dimensions[0].h / 2 - levelDims[3].dimensions[2].h,
          w: levelDims[3].dimensions[2].w,
          h: levelDims[3].dimensions[2].h,
          type: "win",
        },
        {
          x: width - levelDims[3].dimensions[1].w / 2 - levelDims[3].dimensions[1].w / 2,
          y: height - levelDims[3].dimensions[1].h / 2 - levelDims[3].dimensions[1].h / 2 - levelDims[3].dimensions[2].h,
          w: levelDims[3].dimensions[2].w,
          h: levelDims[3].dimensions[2].h,
          type: "win",
        },
      ],
      char: { x: levelDims[3].dimensions[0].w / 2, y: height / 2, w: angryAnim.width * levelDims[0].character.scale, h: angryAnim.height * levelDims[0].character.scale },
    },
    {
      // level 2 ball
      background: backgroundImgs[0],
      terrain: [
        { x: levelDims[4].dimensions[0].w / 2, y: levelDims[4].dimensions[0].h / 2, w: levelDims[4].dimensions[0].w, h: levelDims[4].dimensions[0].h },
        { x: width - levelDims[4].dimensions[1].w / 2, y: levelDims[4].dimensions[1].h / 2, w: levelDims[4].dimensions[1].w, h: levelDims[4].dimensions[1].h },
        { x: width / 2, y: height - levelDims[4].dimensions[2].h / 2, w: levelDims[4].dimensions[2].w, h: levelDims[4].dimensions[2].h },
      ],
      spikeBall: [
        {
          x: levelDims[4].dimensions[0].w + (width - levelDims[4].dimensions[0].w - levelDims[4].dimensions[1].w) / 2,
          y: levelDims[4].dimensions[0].h,
          r: ((width - levelDims[4].dimensions[0].w - levelDims[4].dimensions[1].w) / 2) * 0.7,
        },
      ],
      char: { x: levelDims[4].dimensions[0].w / 2, y: height / 2, w: angryAnim.width * levelDims[0].character.scale, h: angryAnim.height * levelDims[0].character.scale },
    },
    {
      // level 3 button
      background: backgroundImgs[0],
      terrain: [
        { x: width - levelDims[5].dimensions[0].w / 2, y: levelDims[5].dimensions[0].h / 2, w: levelDims[5].dimensions[0].w, h: levelDims[5].dimensions[0].h },
        { x: levelDims[5].dimensions[1].w / 2, y: height - levelDims[5].dimensions[1].h / 2, w: levelDims[5].dimensions[1].w, h: levelDims[5].dimensions[1].h },
      ],
    },
  ];

  // access the correct level data (-1 so key inputs start at 1 instead of 0)
  levelIndex = levelIndex - 1;
  level = levels[levelIndex];

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

  // create button
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

    // check win/lose conditions for bridge level
    if (currentLevel == 3) {
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
            if (Collision.collides(testBlock, ter).penetration.x > 5 || Collision.collides(testBlock, ter).penetration.y > 5) {
              isRotating = false;
            }
          }
        });
      }
    } else if (currentLevel == 2 || currentLevel == 5) {
      // tutorial and puzzle button level
      const massThreshold = 10;
      const velocityThreshold = 10;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Determine which body is the button and which is the colliding body
        const buttonBody = bodyA.label === "button" ? bodyA : bodyB.label === "button" ? bodyB : null;
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

  // Move it back up after a short delay
  setTimeout(() => {
    Body.translate(button, { x: 0, y: -10 });
  }, 500); // Adjust the delay as needed
}
