const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
// Shared directory and file paths
const sharedDir = "shared/";
const flagFile = path.join(sharedDir, "ready_for_svg.txt");
const redFilteredImagePath = "../output/red_filtered.png";
const simplifiedImagePath = "../output/simplified.png";
const processedImagePath = "../output/processed.png";
const outputSvg = "../output/output.svg";
const ws = new WebSocket("ws://localhost:8080");



ws.on("open", () => {
    console.log("Connected to WebSocket server");
    ws.send(JSON.stringify({ type: "node" })); // Identify as Node client
});

/* ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("got message.")
    if (data.type === "position") {
        const position = data.position;
        console.log("New position data received:", position);

        inputImage = "./shared/detected_postit.png"
        color = "yellow"

        console.log(`Processing file: ${inputImage}, Color: ${color}`);

        

        // Process the image and trigger SVG conversion
        extractRedParts(inputImage, redFilteredImagePath)
            .then(() => simplifyImage(redFilteredImagePath, simplifiedImagePath))
            .then(() => preprocessImage(simplifiedImagePath, processedImagePath))
            .then(() => {
                convertToSvg(position); // Pass the position to SVG conversion
            })
            .catch(console.error);
    }
});
 */


// Function to extract red parts of the image
// Function to extract red parts of the image
async function extractRedParts(inputImage, outputImage) {
  console.log("Extracting red parts of the image...");

  // Increase saturation before processing
  const image = sharp(inputImage).modulate({
    saturation: 2.5,
    brightness: 1.0 // Adjust this value to control the saturation level
  });

  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  if (channels < 3) {
    throw new Error("Input image must have at least 3 color channels (RGB).");
  }

  const redMask = Buffer.alloc(width * height * channels);

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Detect red pixels
    if (r > 8 && r > g * 1.3 && r > b * 1.3) {
      // Turn red pixels to black
      redMask[i] = 0; // Red
      redMask[i + 1] = 0; // Green
      redMask[i + 2] = 0; // Blue
      if (channels === 4) {
        redMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
      }
    } else {
      // Turn non-red pixels to white
      redMask[i] = 255; // Red
      redMask[i + 1] = 255; // Green
      redMask[i + 2] = 255; // Blue
      if (channels === 4) {
        redMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
      }
    }
  }

  await sharp(redMask, { raw: { width, height, channels } }).toFile(
    outputImage
  );

  console.log(`Red parts extracted and saved to ${outputImage}`);
}

// Function to simplify the image after red masking
async function simplifyImage(inputImage, outputImage) {
  console.log("Simplifying the image to ensure closed forms...");

  const image = sharp(inputImage);

  // Convert to grayscale (if not already)
  const grayImage = await image
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = grayImage;
  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const simplifiedMask = Buffer.alloc(width * height * channels);

  // Simplify the image using basic morphological operations
  for (let i = 0; i < data.length; i += channels) {
    const pixel = data[i];

    // Apply binary thresholding
    simplifiedMask[i] = pixel < 128 ? 0 : 255; // Black for low intensity, white for high
    if (channels === 4) {
      simplifiedMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
    }
  }

  // Save the simplified image
  await sharp(simplifiedMask, { raw: { width, height, channels } }).toFile(
    outputImage
  );

  console.log(`Image simplified and saved to ${outputImage}`);
}

// Preprocess the red-filtered image (e.g., flip, grayscale, etc.)
async function preprocessImage(inputImage, outputImage) {
  console.log("Preprocessing the image...");

  await sharp(inputImage).greyscale().modulate({ brightness: 1.0 }).toFile(outputImage);

  console.log(`Image preprocessing complete. Saved to ${outputImage}`);
}

// Convert the processed image to SVG
function convertToSvg() {
  const { Potrace } = require("potrace");
  const trace = new Potrace();

  trace.loadImage(processedImagePath, function (err) {
    if (err) throw err;

    const svgData = trace.getSVG();
    const dataSvg = {
        type: "node",
        data: {
            svg: svgData
        }
    };
    copyJsonFile();
    console.log("copied Json");
    ws.send(JSON.stringify(dataSvg));
    console.log("sent svg to browser.");
    //fs.writeFileSync(outputSvg, trace.getSVG());
   
    
  });
}

function copyJsonFile() {
  let source = "./shared/position_color.json";
  let destination = "../output/position_color.json";

  try {
    fs.copyFileSync(source, destination);
    console.log(`File copied from ${source} to ${destination}`);
  } catch (error) {
    console.error("Error copying file:", error);
  }
}

// Watch for the flag file
function watchForDrawing() {
  console.log("Watching for new drawing...");

  const interval = setInterval(() => {
    if (fs.existsSync(flagFile)) {
      console.log("New drawing detected! Starting processing...");

      const content = fs.readFileSync(flagFile, "utf8").trim();
      const [inputImage, color] = content.split(",");

      if (!inputImage || !color) {
        console.error("Invalid flag file format. Expected: 'path, color'");
        return;
      }

      console.log(`Processing file: ${inputImage}, Color: ${color}`);

      fs.unlinkSync(flagFile);

      // Process the image
      extractRedParts(inputImage, redFilteredImagePath)
        .then(() => simplifyImage(redFilteredImagePath, simplifiedImagePath))
        .then(() => preprocessImage(simplifiedImagePath, processedImagePath))
        .then(convertToSvg)
        .catch(console.error);
    }
  }, 1000); // Check every second

  process.on("SIGINT", () => {
    clearInterval(interval);
    console.log("\nStopping watcher.");
    process.exit();
  });
}

//Start watching for the flag file
watchForDrawing();
