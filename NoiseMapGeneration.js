// PREFACE
//
// This file handles the generation and display of a 2D Perlin noise map 
// using the Perlin noise algorithm. 
// 
// It is important to note that this code can be confusing and hard to 
// understand, not because of the way it is written but because of the 
// mathematical concepts used in the Perlin noise algorithm. The article 
// linked in the page can help you out if you are interested and examples
// of noise maps are in the examples folder (generated with the code below)
//
// Another important note is that this project is split into multiple
// files each with their own purpose. When reading the multiple files, 
// know that each file acts independant of each other and in no way are 
// related. So read without burden. 

// stores two intergers as a 2D vector and has vector functions built in

class Vector {
  
  constructor(x, y) {
    
    this.x = x;
    this.y = y;
    
  }

  multiplyBy(factor) {
    
    return new Vector(this.x * factor, this.y * factor);
    
  }

  plus(other) {
    
    return new Vector(this.x + other.x, this.y + other.y);
    
  }

  minus(other) {
    
    return new Vector(this.x - other.x,this.y - other.y);
    
  }

  multiplyByVector(otherVector) {
    
    return (this.x * otherVector.x) + (this.y * otherVector.y);
    
  }
  
}

// initialize canvas variables

const canvas = document.getElementById('noise-canvas');
const canvasContext = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// These variables are the settings of the noise map generation and 
// affect how the noise map is generated, you will be seeing these
// variables in many different functions so be aware as they are called quite a bit

let gridSize = 12; // grid size correlates to amount of grids within the noise map, the more grids the bigger the blobs and smoothness
let fadedness = 6; // fadedness correlates to the smoothing equation built by ken perlin, the higher the fadeness the more destructive and imperfect the noise map is
let randomness = 0; // randomness correlates to the differing options of gradient vectors, the more randomness the more the noise map fluctuates and rough it gets
let isInverted = false;

// starting and ending gradient colors that will act as our "alpha" colors for each pixel
// follows the rgb color style

let startingGradientColor = [0, 0, 0];
let endingGradientColor = [255, 255, 255];

// The next few functions are heavily math related and play a
// critical role in our app.

// this function generates a random number within a min and max
// used for the generatePossibleGradientVectors() to generate random vectors

function generateRandomNumber(min, max) {

  return Math.floor( Math.random() * (max - min) + min );
  
}

// fade function
// this function serves to smooth out numbers between each other when coloring in the noise map.

function fade(number) {

  return fadedness * Math.pow(number, 5) - 15 * Math.pow(number, 4) + 10 * Math.pow(number, 3);
  
}

// lerp function
// this function gives a percentage value between two numbers
// so if I wanted to know what 25% from 20 to 40 was, lerp does the job.
// this function is important in generating the noise map as we want to
// smooth out color values between pixels and their neighbours.

function lerp(numberOne, numberTwo, percentage) {

  const max = Math.max(numberOne, numberTwo);
  const min = Math.min(numberOne, numberTwo);

  // if number two is bigger than number one, we reverse the percentage and using the 
  // example above, we would find 25% from 40 to 20
  if (numberOne > numberTwo) {

    percentage = 1 - percentage;
    
  }

  return (max - min) * percentage + min;
  
}

// color interpolating function
// this functions interpolates between two colors and returns a new color
// basically the lerp of rgb colors. 
// say the parameters were (red, green, 0.6)
// the function would return 60% from red to green
//
// taken from less.js
function interpolateColors(weight) {
  
  const w = weight * 2 - 1;
  const w1 = (w/1+1) / 2;
  const w2 = 1 - w1;

  var rgb = [
    Math.round(startingGradientColor[0] * w1 + endingGradientColor[0] * w2),
    Math.round(startingGradientColor[1] * w1 + endingGradientColor[1] * w2),
    Math.round(startingGradientColor[2] * w1 + endingGradientColor[2] * w2)
  ];

  return rgb;
  
}

// this function generates a set of possible gradient vectors while
// incorporating randomness.

function generatePossibleGradientVectors() {

  // initialize default set of vectors
  
  let possibleGradientVectors = [
    new Vector(1, 1),
    new Vector(-1, 1),
    new Vector(1, -1),
    new Vector(-1, -1),
  ]

  for (let i = 0; i < randomness; i++) {

    const newRandomVector = new Vector(generateRandomNumber(-1,1),generateRandomNumber(-1,1));
    possibleGradientVectors.push(newRandomVector);
    
  }

  return possibleGradientVectors;
  
}

// function that generates random gradients at every grid intersection.
// The gradients are used to generate color values between the pixels.

function getRandomGradientVectors()  {
  
  const possibleGradientVectors = generatePossibleGradientVectors();

  // finds amount of grid cells given the grid size in pixels
  // + 1 because we need two vectors per grid cell.
  
  const gridCellsX = Math.ceil(width / gridSize) + 1;
  const gridCellsY = Math.ceil(height / gridSize) + 1;

  const gridCells = [];

  // generate two dimensional array with the first layer being the y level
  // and the next level being the x values of that y level.
  
  for (let y = 0; y < gridCellsY; y++) {
    
    gridCells[y] = [];
    
    for (let x = 0; x < gridCellsX; x++) {

      const randomVectorIndex = Math.floor(Math.random() * possibleGradientVectors.length);
      const gradientVector = possibleGradientVectors[randomVectorIndex];
      gridCells[y].push(gradientVector);
      
    }
    
  }

  return gridCells;
  
}

// This function generates the perlin noise value (alpha value of the pixel position)
// 
// We're now at the point where we're going to bring everything 
// together. Using all the functions above we're going to follow the ken perlin noise
// process of generating noise. Here's the simplified process
//
// 1. Seperate canvas into grids
// 2. Draw gradients at every grid intersection
// 3. Get relative position of pixel according to grid that it resides
// 4. Draw vectors from the corner of its grid to the pixel position
// 5. Multiply the vectors at each corner of the grid
// 6. lerp and fade the corners together 
// 7. We now have the alpha value for the current pixel

function getPerlinValue(pixelX, pixelY, gradientVectors) {

  // Determine grid cell of pixel
  
  const gridCellX = Math.floor(pixelX / gridSize);
  const gridCellY = Math.floor(pixelY / gridSize);

  // Figure out gradient vectors of that grid cell
  
  const usedGradientVectors = {
    topLeft: gradientVectors[gridCellY][gridCellX],
    topRight: gradientVectors[gridCellY][gridCellX + 1],
    bottomLeft: gradientVectors[gridCellY + 1][gridCellX],
    bottomRight: gradientVectors[gridCellY + 1][gridCellX + 1],
  }

  // Vectors for the corners - we need these to determine
  // the distance vectors to the pixel from the corners.
  
  const unitCornerVectors = {
    topLeft: new Vector(0, 0),
    topRight: new Vector(1, 0),
    bottomLeft: new Vector(0, 1),
    bottomRight: new Vector(1, 1)
  }

  // The relative position of the pixel within the grid cell
  // don't even know how this math works, found it online and it just works 
  
  const relativePos = new Vector(
    (pixelX % gridSize) / gridSize,
    (pixelY % gridSize) / gridSize,
  );

  // The distances of the corners to the pixel
  
  const distanceVectors = {
    topLeft: relativePos.minus(unitCornerVectors.topLeft),
    topRight: relativePos.minus(unitCornerVectors.topRight),
    bottomLeft: relativePos.minus(unitCornerVectors.bottomLeft),
    bottomRight: relativePos.minus(unitCornerVectors.bottomRight),
  }

  // The influence values we can later on lerp
  
  const influenceValues = {
    topLeft: usedGradientVectors.topLeft.multiplyByVector(distanceVectors.topLeft),
    topRight: usedGradientVectors.topRight.multiplyByVector(distanceVectors.topRight),
    bottomLeft: usedGradientVectors.bottomLeft.multiplyByVector(distanceVectors.bottomLeft),
    bottomRight: usedGradientVectors.bottomRight.multiplyByVector(distanceVectors.bottomRight),
  }

  // Fade and lerp
  
  const fadedX = fade(relativePos.x);
  const fadedY = fade(relativePos.y);

  const lerpedValue = lerp(
    lerp(influenceValues.topLeft, influenceValues.topRight, fadedX),
    lerp(influenceValues.bottomLeft, influenceValues.bottomRight, fadedX),
    fadedY
  );
  
  return (1 + lerpedValue) / 2;
  
}

function paintPixel(x, y, pixelColor) {
  
  canvasContext.fillStyle = pixelColor;
  canvasContext.fillRect(x, y, 1, 1);
  
}

// now we are at the part of the code where we put everything together including the front end
// we have all the seperate functions, now we must link them to the web page for things like
// settings, downloads, and generation.
// Here are the functions doing that:

function paintCanvasWithNoise() {

  // generate set of gradient vectors for new noise map
  
  const gradientVectors = getRandomGradientVectors();

  // paint the noise map pixel by pixel
  
  for (let x = 0; x < width; x++) {
    
    for (let y = 0; y < height; y++) {

      // get color of pixel based on its position
      
      const gradientWeight = getPerlinValue(x, y, gradientVectors);
      const pixelColorScale = interpolateColors(gradientWeight);
      
      let red = pixelColorScale[0];
      let green = pixelColorScale[1];
      let blue = pixelColorScale[2];

      // invert the colors by inverting the alpha values
      
      if (isInverted) {

        red = 255 - red;
        green = 255 - green;
        blue = 255 - blue;
        
      }
      
      paintPixel(x, y, `rgb(${red}, ${green}, ${blue})`);
      
    }
    
  }
  
}

// the next few functions are for setting changes
// string function, converts string values to colors

function changeColors() {

  const colorOne = document.getElementById("color-1").value;
  const colorTwo = document.getElementById("color-2").value;

  // the color value is in hex, and we must have rgb, so lets convert real quick

  const colorOneRed = parseInt(colorOne.slice(1,3), 16);
  const colorOneGreen = parseInt(colorOne.slice(3, 5), 16);
  const colorOneBlue = parseInt(colorOne.slice(5, 7), 16);

  const colorTwoRed = parseInt(colorTwo.slice(1,3), 16);
  const colorTwoGreen = parseInt(colorTwo.slice(3, 5), 16);
  const colorTwoBlue = parseInt(colorTwo.slice(5, 7), 16);

  startingGradientColor = [colorOneRed, colorOneGreen, colorOneBlue];
  endingGradientColor =[colorTwoRed, colorTwoGreen, colorTwoBlue];
  
}

function changeIntensity(input) {

  gridSize = input.value;
  
}

function changeFadedness(input) {

  fadedness = input.value;
  
}

function changeRandomness(input) {

  randomness = input.value;
  
}

function changeInvertedColorStatus(input) {

  isInverted = input.checked;
  
}

// paint the first noise map so the user doesn't see an empty canvas :
paintCanvasWithNoise();