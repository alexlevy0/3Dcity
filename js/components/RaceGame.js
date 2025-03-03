import * as THREE from 'three';
import { PlayerVehicle } from './PlayerVehicle.js';

export class RaceGame {
    constructor(scene, city) {
        this.scene = scene;
        this.city = city;
        this.player = null;
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        this.raceStarted = false;
        this.raceFinished = false;
        this.startTime = 0;
        this.bestTime = localStorage.getItem('bestTime') || Infinity;
        
        // Create UI elements
        this.createUI();
        
        // Initialize game elements
        this.initialize();
    }
    
    createUI() {
        // Create race UI container
        const uiContainer = document.createElement('div');
        uiContainer.id = 'race-ui';
        uiContainer.style.position = 'absolute';
        uiContainer.style.top = '10px';
        uiContainer.style.left = '50%';
        uiContainer.style.transform = 'translateX(-50%)';
        uiContainer.style.color = 'white';
        uiContainer.style.fontFamily = 'Arial, sans-serif';
        uiContainer.style.fontSize = '24px';
        uiContainer.style.textAlign = 'center';
        uiContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        document.body.appendChild(uiContainer);
        
        // Create timer display
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.id = 'timer';
        this.timerDisplay.style.marginBottom = '10px';
        uiContainer.appendChild(this.timerDisplay);
        
        // Create checkpoint counter
        this.checkpointDisplay = document.createElement('div');
        this.checkpointDisplay.id = 'checkpoints';
        this.checkpointDisplay.style.fontSize = '20px';
        uiContainer.appendChild(this.checkpointDisplay);
        
        // Create best time display
        this.bestTimeDisplay = document.createElement('div');
        this.bestTimeDisplay.id = 'best-time';
        this.bestTimeDisplay.style.fontSize = '16px';
        this.bestTimeDisplay.style.marginTop = '10px';
        if (this.bestTime !== Infinity) {
            this.bestTimeDisplay.textContent = `Best Time: ${(this.bestTime / 1000).toFixed(2)}s`;
        }
        uiContainer.appendChild(this.bestTimeDisplay);
        
        // Create start instruction
        this.startInstruction = document.createElement('div');
        this.startInstruction.id = 'start-instruction';
        this.startInstruction.style.fontSize = '20px';
        this.startInstruction.style.marginTop = '20px';
        this.startInstruction.textContent = 'Press ENTER to start race';
        uiContainer.appendChild(this.startInstruction);
        
        // Add keyboard listener for race start
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' && !this.raceStarted) {
                this.startRace();
            }
        });
    }
    
    initialize() {
        // Create player vehicle
        this.player = new PlayerVehicle(this.scene);
        
        // Pass all city elements for collision detection
        this.scene.buildings = this.city.buildings;
        this.scene.streetElements = this.city.streetElements;
        this.scene.vehicles = this.scene.vehicles || []; // If there are other vehicles in the scene
        
        // Create checkpoints around the city
        this.createCheckpoints();
        
        // Update UI
        this.updateUI();
    }
    
    createCheckpoints() {
        // Create checkpoint markers at strategic points around the city
        const checkpointPositions = [
            { x: 0, z: 0 },        // Start/Finish
            { x: 100, z: 100 },    // Checkpoint 1
            { x: -100, z: 100 },   // Checkpoint 2
            { x: -100, z: -100 },  // Checkpoint 3
            { x: 100, z: -100 }    // Checkpoint 4
        ];
        
        checkpointPositions.forEach((pos, index) => {
            const checkpoint = this.createCheckpointMarker(pos.x, pos.z, index === 0);
            this.checkpoints.push({
                position: new THREE.Vector3(pos.x, 0, pos.z),
                marker: checkpoint,
                radius: 10 // Activation radius
            });
        });
    }
    
    createCheckpointMarker(x, z, isStart) {
        // Create a visual marker for the checkpoint
        const geometry = new THREE.CylinderGeometry(10, 10, 20, 32, 1, true);
        const material = new THREE.MeshBasicMaterial({
            color: isStart ? 0x00FF00 : 0xFFFF00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(x, 10, z);
        
        // Add particle effect
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            const angle = (i / particleCount) * Math.PI * 2;
            positions[i] = Math.cos(angle) * 10;
            positions[i + 1] = Math.random() * 20;
            positions[i + 2] = Math.sin(angle) * 10;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: isStart ? 0x00FF00 : 0xFFFF00,
            size: 0.5,
            transparent: true,
            opacity: 0.5
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        marker.add(particles);
        
        this.scene.add(marker);
        return marker;
    }
    
    startRace() {
        this.raceStarted = true;
        this.raceFinished = false;
        this.currentCheckpoint = 0;
        this.startTime = Date.now();
        this.startInstruction.style.display = 'none';
        
        // Reset player position to start
        this.player.position.set(0, 0.5, 0);
        this.player.rotation = 0;
        this.player.speed = 0;
        
        // Update UI
        this.updateUI();
    }
    
    finishRace() {
        this.raceFinished = true;
        const finishTime = Date.now() - this.startTime;
        
        if (finishTime < this.bestTime) {
            this.bestTime = finishTime;
            localStorage.setItem('bestTime', finishTime);
            this.bestTimeDisplay.textContent = `New Best Time: ${(finishTime / 1000).toFixed(2)}s`;
        }
        
        this.startInstruction.textContent = 'Press ENTER to restart';
        this.startInstruction.style.display = 'block';
        this.raceStarted = false;
    }
    
    updateUI() {
        if (this.raceStarted && !this.raceFinished) {
            const currentTime = Date.now() - this.startTime;
            this.timerDisplay.textContent = `Time: ${(currentTime / 1000).toFixed(2)}s`;
        }
        
        this.checkpointDisplay.textContent = 
            `Checkpoint: ${this.currentCheckpoint + 1}/${this.checkpoints.length}`;
    }
    
    update(delta) {
        // Update player vehicle
        if (this.player) {
            this.player.update(delta);
        }
        
        // Check for checkpoint collisions if race is active
        if (this.raceStarted && !this.raceFinished) {
            this.checkCheckpointCollision();
            this.updateUI();
        }
        
        // Animate checkpoint markers
        this.checkpoints.forEach(checkpoint => {
            checkpoint.marker.rotation.y += delta;
            checkpoint.marker.children[0].rotation.y -= delta * 2;
        });
    }
    
    checkCheckpointCollision() {
        const checkpoint = this.checkpoints[this.currentCheckpoint];
        const distance = this.player.position.distanceTo(checkpoint.position);
        
        if (distance < checkpoint.radius) {
            // Checkpoint reached
            this.currentCheckpoint++;
            
            if (this.currentCheckpoint >= this.checkpoints.length) {
                // Race finished
                this.finishRace();
            }
        }
    }
} 