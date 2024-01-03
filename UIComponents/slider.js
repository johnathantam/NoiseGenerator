// UI javascript functions
// this file exclusively holds javascript event listeners for sliders

function updateSliderValueByColor(slider) {
  
  const sliderValueInPercentage = (slider.value/slider.max)*100;
  const color = "linear-gradient(90deg, red " + sliderValueInPercentage + "%, black " + sliderValueInPercentage + "%";

  slider.style.background = color;
  
}

function updateSliderValueByText(slider, sliderTextId) {

  const sliderTextValue = document.getElementById(sliderTextId);

  sliderTextValue.innerText = slider.value;
  
}