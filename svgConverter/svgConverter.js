const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Potrace } = require('potrace');

// Shared directory and file paths
const sharedDir = "shared/";
const flagFile = path.join(sharedDir, "ready_for_svg.txt");
const processedImage = "../output/processed.png";
const outputSvg = "../output/output.svg";

// Preprocess the image with different brightness based on color
async function preprocessImage(inputImage, color) {
    // Trim and normalize the color string
    const normalizedColor = color.trim().toLowerCase();

    let brightnessFactor = (normalizedColor === 'blue') ? 2.5 : 1.4;

    console.log(`Detected ${normalizedColor} Post-it. Applying brightness: ${brightnessFactor}x`);

    await sharp(inputImage)
        .greyscale()
        .modulate({ brightness: brightnessFactor })
        .normalise()
        .toFile(processedImage);

    console.log('Image preprocessing complete.');
}
// Convert the processed image to SVG using Potrace
function convertToSvg() {
    copyJsonFile();
    const trace = new Potrace();
    trace.loadImage(processedImage, function (err) {
        if (err) throw err;
        fs.writeFileSync(outputSvg, trace.getSVG());
        console.log(`SVG saved as ${outputSvg}`);
    });
}

function copyJsonFile() {

    let source = './shared/position_color.json';
    let destination = '../output/position_color.json';

    try {
      fs.copyFileSync(source, destination);
      console.log(`File copied from ${source} to ${destination}`);
    } catch (error) {
      console.error('Error copying file:', error);
    }
  }
  
  
  

// Watch for the flag file
function watchForDrawing() {
    console.log("Watching for new drawing...");

    const interval = setInterval(() => {
        if (fs.existsSync(flagFile)) {
            console.log("New drawing detected! Starting SVG conversion...");

            // Read the flag file content (image path and color)
            const content = fs.readFileSync(flagFile, 'utf8').trim();
            const [inputImage, color] = content.split(',');

            if (!inputImage || !color) {
                console.error("Invalid flag file format. Expected: 'path, color'");
                return;
            }

            console.log(`Processing file: ${inputImage}, Color: ${color}`);

            // Remove the flag file to avoid duplicate processing
            fs.unlinkSync(flagFile);

            // Process the image and convert to SVG
            preprocessImage(inputImage, color)
                .then(convertToSvg)
                .catch(console.error);
        }
    }, 1000); // Check every second

    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log("\nStopping watcher.");
        process.exit();
    });
}

watchForDrawing();