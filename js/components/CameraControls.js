import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class CameraControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.moveSpeed = 150; // Increased from 50 to 150 units per second to navigate the larger city faster
        
        // Set up orbit controls for third-person view
        this.orbitControls = new OrbitControls(camera, domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.screenSpacePanning = false;
        this.orbitControls.minDistance = 10;
        this.orbitControls.maxDistance = 1500;
        this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
        
        // Set up pointer lock controls for first-person view
        this.pointerControls = new PointerLockControls(camera, document.body);
        this.pointerControls.enabled = false;
        
        // Key state tracking
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
        };
        
        // Current mode: 'orbit' or 'first-person'
        this.mode = 'orbit';
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Double click to toggle between orbit and first-person modes
        this.domElement.addEventListener('dblclick', () => this.toggleMode());
        
        // Re-enable orbit controls when exiting pointer lock
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement !== document.body && this.mode === 'first-person') {
                this.setMode('orbit');
            }
        });
    }
    
    toggleMode() {
        this.setMode(this.mode === 'orbit' ? 'first-person' : 'orbit');
    }
    
    setMode(mode) {
        if (mode === this.mode) return;
        
        this.mode = mode;
        
        if (mode === 'orbit') {
            this.pointerControls.unlock();
            this.pointerControls.enabled = false;
            this.orbitControls.enabled = true;
        } else if (mode === 'first-person') {
            this.orbitControls.enabled = false;
            this.pointerControls.enabled = true;
            this.pointerControls.lock();
        }
    }
    
    onKeyDown(event) {
        if (event.code === 'KeyW') this.keys.forward = true;
        if (event.code === 'KeyS') this.keys.backward = true;
        if (event.code === 'KeyA') this.keys.left = true;
        if (event.code === 'KeyD') this.keys.right = true;
        if (event.code === 'Space') this.keys.up = true;
        if (event.code === 'ShiftLeft') this.keys.down = true;
    }
    
    onKeyUp(event) {
        if (event.code === 'KeyW') this.keys.forward = false;
        if (event.code === 'KeyS') this.keys.backward = false;
        if (event.code === 'KeyA') this.keys.left = false;
        if (event.code === 'KeyD') this.keys.right = false;
        if (event.code === 'Space') this.keys.up = false;
        if (event.code === 'ShiftLeft') this.keys.down = false;
    }
    
    update(deltaTime) {
        if (this.mode === 'orbit') {
            this.orbitControls.update();
        } else if (this.mode === 'first-person') {
            // Handle movement in first-person mode
            const moveDistance = this.moveSpeed * deltaTime;
            
            if (this.keys.forward) {
                this.pointerControls.moveForward(moveDistance);
            }
            if (this.keys.backward) {
                this.pointerControls.moveForward(-moveDistance);
            }
            if (this.keys.left) {
                this.pointerControls.moveRight(-moveDistance);
            }
            if (this.keys.right) {
                this.pointerControls.moveRight(moveDistance);
            }
            if (this.keys.up) {
                this.camera.position.y += moveDistance;
            }
            if (this.keys.down) {
                this.camera.position.y -= moveDistance;
            }
        }
    }
} 