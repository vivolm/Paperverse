const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Potrace } = require('potrace');

// Shared directory and file paths
const sharedDir = "shared/";
const inputImage = path.join(sharedDir, "detected_postit.png");
const flagFile = path.join(sharedDir, "ready_for_svg.txt");
 const processedImage = "../output/processed.png";
const outputSvg = "../output/output.svg";

// Preprocess the image: max brightness, max contrast, and 0 saturation
async function preprocessImage() {
    await sharp(inputImage)
        .greyscale()
        .modulate({ brightness: 1.3 })
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

            // Remove the flag file to avoid duplicate processing
            fs.unlinkSync(flagFile);

            // Process the image and convert to SVG
            preprocessImage().then(convertToSvg).catch(console.error);
        }
    }, 1000); // Check every second

    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log("\nStopping watcher.");
        process.exit();
    });
}

watchForDrawing();