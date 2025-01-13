const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Shared directory and file paths
const sharedDir = "shared/";
const flagFile = path.join(sharedDir, "ready_for_svg.txt");
const redFilteredImagePath = "../output/red_filtered.png";
const processedImagePath = "../output/processed.png";
const outputSvg = "../output/output.svg";


// Helper function to convert RGB to HSV
function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0, s = 0, v = max;

    if (delta > 0) {
        if (max === r) {
            h = ((g - b) / delta + (g < b ? 6 : 0)) % 6;
        } else if (max === g) {
            h = (b - r) / delta + 2;
        } else {
            h = (r - g) / delta + 4;
        }
        h *= 60;
        s = delta / max;
    }

    return [h, s, v];
}

// Function to extract red parts of the image
async function extractRedParts(inputImage, outputImage) {
    console.log("Extracting red parts of the image...");

    const image = sharp(inputImage);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

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
        if (r > 15 && r > g * 1.3 && r > b * 1.3) {
            // Turn red pixels to black
            redMask[i] = 0;       // Red
            redMask[i + 1] = 0;   // Green
            redMask[i + 2] = 0;   // Blue
            if (channels === 4) {
                redMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
            }
        }
        else {
            const [h, s, v] = rgbToHsv(r, g, b);
        
            // Purple hue range: ~260° to 300°
            if (h >= 260 && h <= 300 && s > 0.4 && v > 0.2) {
                // Turn purple pixels to black
                redMask[i] = 0;       // Red
                redMask[i + 1] = 0;   // Green
                redMask[i + 2] = 0;   // Blue
                if (channels === 4) {
                    redMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
                }
            } else {
                // Non-purple pixels to white
                redMask[i] = 255;     // Red
                redMask[i + 1] = 255; // Green
                redMask[i + 2] = 255; // Blue
                if (channels === 4) {
                    redMask[i + 3] = data[i + 3]; // Preserve alpha channel if present
                }
            }
        }
    }

    await sharp(redMask, { raw: { width, height, channels } })
        .toFile(outputImage);

    console.log(`Red parts extracted and saved to ${outputImage}`);
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
            extractRedParts(inputImage, redFilteredImagePath)
                .then(() => preprocessImage(redFilteredImagePath, processedImagePath))
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