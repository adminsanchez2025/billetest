import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// DOM elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const confidenceDisplay = document.getElementById("confidence");

let detector;
let lastDetectionTime = -1;
let bestDetection = null;

async function initializeDetector() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        detector = await ObjectDetector.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath: "billetest 2.0.tflite",
                    delegate: "GPU"
                },
                maxResults: 5,
                scoreThreshold: 0.4,
                runningMode: "VIDEO"
            }
        );
        
        console.log("Detector initialized");
        setupCamera();
    } catch (error) {
        console.error("Failed to initialize detector:", error);
    }
}

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: "user" }
        });
        video.srcObject = stream;
        video.addEventListener("loadeddata", predict);
    } catch (error) {
        console.error("Camera access denied:", error);
        alert("Could not access the camera. Please allow camera permissions.");
    }
}

function predict() {
    // Don't block the main thread
    requestAnimationFrame(predict);
    
    if (video.currentTime === lastDetectionTime || !detector) {
        return;
    }
    
    lastDetectionTime = video.currentTime;
    
    // Perform detection
    const detections = detector.detectForVideo(video, performance.now()).detections;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (detections.length > 0) {
        // Find the best detection
        bestDetection = detections.reduce((prev, current) => 
            (prev.categories[0].score > current.categories[0].score) ? prev : current
        );
        
        const bbox = bestDetection.boundingBox;
        const category = bestDetection.categories[0];
        const score = category.score * 100;
        let categoryName = category.categoryName;
        
        if (score < 5) {
            categoryName = "Solo se que es un billete";
        }
        
        // Update confidence display
        confidenceDisplay.textContent = score.toFixed(2);
        
        // Draw bounding box
        ctx.strokeStyle = "#64ff00";
        ctx.lineWidth = 4;
        ctx.strokeRect(bbox.originX, bbox.originY, bbox.width, bbox.height);
        
        // Draw label background
        ctx.fillStyle = "rgba(100, 255, 0, 0.7)";
        ctx.fillRect(bbox.originX, bbox.originY - 30, bbox.width, 30);
        
        // Draw text
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.fillText(
            `${categoryName}: ${score.toFixed(2)}%`,
            bbox.originX + 5,
            bbox.originY - 10
        );
    }
}

// Start the application
initializeDetector();


