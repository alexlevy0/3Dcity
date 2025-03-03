import * as THREE from 'three';

export class PlayerVehicle {
    constructor(scene) {
        this.scene = scene;
        this.vehicle = null;
        this.speed = 0;
        this.maxSpeed = 50;
        this.acceleration = 20;
        this.deceleration = 15;
        this.brakingForce = 30;
        this.turnSpeed = Math.PI * 0.8; // Radians per second
        this.position = new THREE.Vector3(0, 0.5, 0);
        this.rotation = 0;
        
        // Control state
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false
        };
        
        this.createVehicle();
        this.setupEventListeners();
    }
    
    createVehicle() {
        // Create a sports car using the existing car creation code but with modifications
        const group = new THREE.Group();
        
        // Car body - make it more sporty
        const bodyGeometry = new THREE.BoxGeometry(2.2, 1, 5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 }); // Red color
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.7;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Car cabin - sleeker design
        const cabinGeometry = new THREE.BoxGeometry(2, 0.8, 2);
        const cabinMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 1.3, 0.5);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Spoiler
        const spoilerGeometry = new THREE.BoxGeometry(2.4, 0.5, 0.5);
        const spoiler = new THREE.Mesh(spoilerGeometry, bodyMaterial);
        spoiler.position.set(0, 1.2, -2.2);
        spoiler.castShadow = true;
        group.add(spoiler);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-1.2, 0, 1.5],  // front left
            [-1.2, 0, -1.5],   // rear left
            [1.2, 0, 1.5],   // front right
            [1.2, 0, -1.5]     // rear right
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(position[0], position[1], position[2]);
            wheel.rotation.x = Math.PI / 2;
            wheel.castShadow = true;
            group.add(wheel);
        });
        
        // Add headlights
        const headlightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 1.0
        });
        
        const headlightPositions = [
            [-0.7, 0.7, 2.4],  // front left
            [0.7, 0.7, 2.4]    // front right
        ];
        
        headlightPositions.forEach(position => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(position[0], position[1], position[2]);
            group.add(headlight);
        });
        
        // Add taillights
        const taillightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 1.0
        });
        
        const taillightPositions = [
            [-0.7, 0.7, -2.4],  // rear left
            [0.7, 0.7, -2.4]    // rear right
        ];
        
        taillightPositions.forEach(position => {
            const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
            taillight.position.set(position[0], position[1], position[2]);
            group.add(taillight);
        });
        
        this.vehicle = group;
        this.scene.add(this.vehicle);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.controls.forward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.controls.backward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.controls.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.controls.right = true;
                    break;
                case 'Space':
                    this.controls.brake = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.controls.forward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.controls.backward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.controls.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.controls.right = false;
                    break;
                case 'Space':
                    this.controls.brake = false;
                    break;
            }
        });
    }
    
    update(delta) {
        // Update speed based on controls
        if (this.controls.forward) {
            this.speed = Math.min(this.speed + this.acceleration * delta, this.maxSpeed);
        } else if (this.controls.backward) {
            this.speed = Math.max(this.speed - this.acceleration * delta, -this.maxSpeed / 2);
        } else {
            // Natural deceleration
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - this.deceleration * delta);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + this.deceleration * delta);
            }
        }
        
        // Apply braking
        if (this.controls.brake) {
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - this.brakingForce * delta);
            } else {
                this.speed = Math.min(0, this.speed + this.brakingForce * delta);
            }
        }
        
        // Update rotation based on turning controls
        if (this.speed !== 0) {
            const turnMultiplier = this.speed > 0 ? 1 : -1;
            if (this.controls.left) {
                this.rotation += this.turnSpeed * delta * turnMultiplier;
            }
            if (this.controls.right) {
                this.rotation -= this.turnSpeed * delta * turnMultiplier;
            }
        }
        
        // Update position based on speed and rotation
        const movement = new THREE.Vector3(
            Math.sin(this.rotation) * this.speed * delta,
            0,
            Math.cos(this.rotation) * this.speed * delta
        );
        
        this.position.add(movement);
        
        // Update vehicle mesh
        this.vehicle.position.copy(this.position);
        this.vehicle.rotation.y = this.rotation;
    }
} 