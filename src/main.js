import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

/**
 * @description Initializes the webcam
 * @param {string} elementId
 * @returns {Promise<HTMLElement>}
 */
const initWebcam = (elementId) =>
  new Promise(async (resolve, reject) => {
    try {
      const webcam = document.getElementById(elementId);
      if (navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        webcam.srcObject = stream;
        resolve(webcam);
      } else {
        reject("The web browser is not supported");
      }
    } catch (error) {
      reject(error);
    }
  });

/**
 * @description
 * @param {HTMLElement} webcam
 * @param {HTMLElement} overlay
 * @param {TensorflowModel} model
 * @param {Number} threshold
 * @returns {Promise<Array>} Returns an array of predictions
 */

//TODO: move this out of global scope
let children = [];

const predict = async (webcam, model) => {

  const overlay = document.getElementById("webcam-overlay");
  const threshold = 0.6;

  if (!webcam) {
    throw new Error("Webcam not provided");
  }

  if (!model) {
    throw new Error("Model not provided");
  }

  const predictions = await model.detect(webcam);

  // TODO: Fix this.. it can cause a memory leak
  overlay.innerHTML = ""

  // Iterate through the new predictions
  predictions.forEach((prediction) => {
    if (!prediction > threshold) {
      return;
    }

    // Create the description paragraph
    const p = document.createElement("p");
    p.setAttribute("class", "prediction-text")
    p.innerText = `${prediction.class} - ${Math.round(
      parseFloat(prediction.score) * 100
    )}%`;
    p.style = `margin-left: ${prediction.bbox[0]}px; margin-top: ${
      prediction.bbox[1]
    }px; width: ${prediction.bbox[2]}px; top: 0; left: 0;`;

    // Create the highlighted box
    const hl = document.createElement("div");
    hl.setAttribute("class", "highlighter");
    hl.style = `left: ${prediction.bbox[0]}px; top: ${prediction.bbox[1]}px; width: ${prediction.bbox[2]}px; height: ${prediction.bbox[3]}px;`;

    // Append the prediction dom elements to the overlay
    overlay.appendChild(p);
    overlay.appendChild(hl);
    children.push(p);
    children.push(hl);
  });

  window.requestAnimationFrame(() => predict(webcam, model));
};

/**
 * @description Runs the program
 */
const main = async () => {
  const state = {
    isLoading: true,
  };

  const loaderImg = document.getElementById("loaderImg");
  const model = await cocoSsd.load();

  const webcam = await initWebcam("webcam");

  webcam.addEventListener("loadeddata", () => {
    state.isLoading = false;
    loaderImg.style.display = "none";
    predict(webcam, model);
  });
};

main();
