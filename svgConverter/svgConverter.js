const sharp = require('sharp');
const { Potrace } = require('potrace');
const fs = require('fs');

// Input and output file paths
const inputImage = 'input/detected_postit.png'; // Replace with your image file
const processedImage = 'output/processedtest0.png';
const outputSvg = 'output/outputtest0.svg';

// Preprocess the image: max brightness, max contrast, and 0 saturation
async function preprocessImage() {
    await sharp(inputImage)
        .greyscale() // Convert to greyscale (remove color saturation)
        .modulate({ brightness: 1.7 }) // Increase brightness (factor of 2 means double)
        .normalise() // Enhance contrast
        .toFile(processedImage);
    console.log('Image preprocessing complete.');
}

// Convert the processed image to SVG using Potrace
function convertToSvg() {
    const trace = new Potrace();
    trace.loadImage(processedImage, function (err) {
        if (err) throw err;
        fs.writeFileSync(outputSvg, trace.getSVG());
        console.log(`SVG saved as ${outputSvg}`);
    });
}

// Run the pipeline
preprocessImage().then(convertToSvg).catch(console.error);