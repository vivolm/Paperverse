const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Shared directory and file paths
const sharedDir = "shared/";
const flagFile = path.join(sharedDir, "ready_for_svg.txt");
const greenFilteredImagePath = "../output/green_filtered.png";
const processedImagePath = "../output/processed.png";
const outputSvg = "../output/output.svg";

// Function to extract green parts of the image
async function extractGreenParts(inputImage, outputImage) {
    console.log("Extracting green parts of the image...");

    const image = sharp(inputImage);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;

    if (channels < 3) {
        throw new Error("Input image must have at least 3 color channels (RGB).");
    }

    const greenMask = Buffer.alloc(width * height * channels);

    for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Detect green pixels
        if (g > 10 && g > r  && g > b ) {
            // Turn green pixels to black
            greenMask[i] = 0;       // Red
            greenMask[i + 1] = 0;   // Green
            greenMask[i + 2] = 0;   // Blue
            if (channels === 4) {
                greenMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
            }
        } else {
            // Turn non-green pixels to white
            greenMask[i] = 255;     // Red
            greenMask[i + 1] = 255; // Green
            greenMask[i + 2] = 255; // Blue
            if (channels === 4) {
                greenMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
            }
        }
    }

    await sharp(greenMask, { raw: { width, height, channels } })
        .toFile(outputImage);

    console.log(`Green parts extracted and saved to ${outputImage}`);
}

// Preprocess the red-filtered image (e.g., flip, grayscale, etc.)
async function preprocessImage(inputImage, outputImage) {
    console.log("Preprocessing the image...");

    await sharp(inputImage)
        .greyscale()
        .toFile(outputImage);

    console.log(`Image preprocessing complete. Saved to ${outputImage}`);
}

// Convert the processed image to SVG
function convertToSvg() {
    const { Potrace } = require('potrace');
    const trace = new Potrace();

    trace.loadImage(processedImagePath, function (err) {
        if (err) throw err;
        fs.writeFileSync(outputSvg, trace.getSVG());
        console.log(`SVG saved as ${outputSvg}`);
        copyJsonFile();
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
            console.log("New drawing detected! Starting processing...");

            const content = fs.readFileSync(flagFile, 'utf8').trim();
            const [inputImage, color] = content.split(',');

            if (!inputImage || !color) {
                console.error("Invalid flag file format. Expected: 'path, color'");
                return;
            }

            console.log(`Processing file: ${inputImage}, Color: ${color}`);

            fs.unlinkSync(flagFile);

            // Process the image
            extractGreenParts(inputImage, greenFilteredImagePath)
                .then(() => preprocessImage(greenFilteredImagePath, processedImagePath))
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

// Start watching for the flag file
watchForDrawing();