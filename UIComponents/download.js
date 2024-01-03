// This function is for the downloading feature of the project

// function for downloading 
// is a string function using base64

function downloadNoiseMap(button) {

  // convert current canvas data to image/jpg
  const imgData = canvas.toDataURL("image/png");

  // now set the href for the download

  button.href = imgData;
  
}