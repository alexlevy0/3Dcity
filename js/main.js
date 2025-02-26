import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { City } from './components/City.js';
import { Traffic } from './components/Traffic.js';
import { Pedestrians } from './components/Pedestrians.js';
import { DayNightCycle } from './components/DayNightCycle.js';
import { CameraControls } from './components/CameraControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 30, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.physicallyCorrectLights = false;
document.body.appendChild(renderer.domElement);

// Controls initialization
const controls = new CameraControls(camera, renderer.domElement);

// Light initialization
const dayNightCycle = new DayNightCycle(scene);

// Create city
const city = new City(scene);

// Create traffic system
const traffic = new Traffic(scene, city.roadNetwork);

// Create pedestrian system
const pedestrians = new Pedestrians(scene, city.sidewalks, city.crosswalks);

// Loading indicator
const loadingDiv = document.getElementById('info');

// Initialize and load all assets
async function init() {
    try {
        await Promise.all([
            city.initialize(),
            traffic.initialize(),
            pedestrians.initialize()
        ]);
        
        loadingDiv.innerHTML = '3D City Scene<br>Loaded successfully!';
        setTimeout(() => {
            loadingDiv.style.opacity = '0';
            setTimeout(() => loadingDiv.style.display = 'none', 1000);
        }, 2000);
        
    } catch (error) {
        console.error('Error initializing city:', error);
        loadingDiv.innerHTML = 'Error loading scene. Check console for details.';
    }
}

init();

// Time control
const timeSlider = document.getElementById('time-slider');
const timeDisplay = document.getElementById('time-display');

timeSlider.addEventListener('input', (event) => {
    const time = parseFloat(event.target.value);
    dayNightCycle.setTime(time);
    
    // Update time display
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add this debug function before your animate function
function debugUniformCount() {
    console.log('======= UNIFORM DEBUG INFO =======');
    
    // Count lights in the scene
    let pointLights = 0;
    let spotLights = 0;
    let directionalLights = 0;
    let hemisphereLights = 0;
    
    scene.traverse(object => {
        if (object.isPointLight) pointLights++;
        if (object.isSpotLight) spotLights++;
        if (object.isDirectionalLight) directionalLights++;
        if (object.isHemisphereLight) hemisphereLights++;
    });
    
    console.log(`Lights in scene:
    - Point lights: ${pointLights}
    - Spot lights: ${spotLights}
    - Directional lights: ${directionalLights}
    - Hemisphere lights: ${hemisphereLights}
    - Total: ${pointLights + spotLights + directionalLights + hemisphereLights}`);
    
    // Log the maximum uniforms supported by this device
    const gl = renderer.getContext();
    const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    const maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    
    console.log(`WebGL Capabilities:
    - Max vertex uniforms: ${maxVertexUniforms}
    - Max fragment uniforms: ${maxFragmentUniforms}
    - Vendor: ${gl.getParameter(gl.VENDOR)}
    - Renderer: ${gl.getParameter(gl.RENDERER)}`);
    
    // Check shadow settings
    console.log(`Shadow Settings:
    - Shadow map enabled: ${renderer.shadowMap.enabled}
    - Shadow map type: ${renderer.shadowMap.type}`);
    
    // Log material counts by type
    let materials = {
        MeshStandardMaterial: 0,
        MeshPhongMaterial: 0,
        MeshBasicMaterial: 0,
        MeshLambertMaterial: 0,
        Other: 0
    };
    
    scene.traverse(object => {
        if (object.material) {
            if (object.material.constructor) {
                const type = object.material.constructor.name;
                if (materials[type] !== undefined) {
                    materials[type]++;
                } else {
                    materials.Other++;
                }
            }
        }
    });
    
    console.log('Material usage:', materials);
    
    // Force compilation of a problematic material to see uniform count
    const dummyCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const dummyScene = new THREE.Scene();
    const dummyLight = new THREE.PointLight(0xffffff);
    dummyScene.add(dummyLight);
    
    // Test material with different number of lights to find the breaking point
    function testMaterialWithLights(numLights) {
        console.log(`Testing standard material with ${numLights} point lights...`);
        
        // Clear the scene
        while(dummyScene.children.length > 0) { 
            dummyScene.remove(dummyScene.children[0]); 
        }
        
        // Add a test mesh
        const testMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const testMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), testMaterial);
        dummyScene.add(testMesh);
        
        // Add the specified number of lights
        for (let i = 0; i < numLights; i++) {
            const light = new THREE.PointLight(0xffffff, 1);
            light.position.set(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );
            dummyScene.add(light);
        }
        
        try {
            // Try to render the scene
            renderer.compile(dummyScene, dummyCamera);
            return true;
        } catch (e) {
            console.error(`Failed with ${numLights} lights:`, e.message);
            return false;
        }
    }
    
    // Binary search to find maximum supported lights
    let min = 0;
    let max = 100;
    let result = 0;
    
    while (min <= max) {
        let mid = Math.floor((min + max) / 2);
        if (testMaterialWithLights(mid)) {
            result = mid;
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }
    
    console.log(`Maximum point lights supported: approximately ${result}`);
    
    // Debug message about what to do
    console.log(`
    RECOMMENDED FIXES:
    1. Reduce the number of lights in your scene (currently ${pointLights + spotLights + directionalLights + hemisphereLights})
    2. Disable shadows (${renderer.shadowMap.enabled ? 'currently enabled' : 'already disabled'})
    3. Use simpler materials like MeshBasicMaterial or MeshLambertMaterial
    4. Consider implementing a custom lighting solution using fewer uniforms
    5. Break your scene into multiple scenes if possible
    `);
    
    console.log('======= END DEBUG INFO =======');
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update stats if available
    if (typeof stats !== 'undefined') {
        stats.update();
    }
    
    // Call debug function once
    if (!window.debugRan) {
        debugUniformCount();
        window.debugRan = true;
    }
    
    const delta = clock.getDelta();
    controls.update(delta);
    
    // Update components
    traffic.update(delta);
    pedestrians.update(delta);
    dayNightCycle.update(delta);
    
    renderer.render(scene, camera);
}

const clock = new THREE.Clock();
animate(); 