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
        
        // Vehicle dimensions for collision detection
        this.width = 2.2;  // Match the car body width
        this.length = 5;   // Match the car body length
        this.collisionRadius = Math.max(this.width, this.length) / 2;
        
        // Collision debug mode
        this.debugMode = false;
        this.debugMarkers = [];
        
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
                case 'KeyC':
                    // Toggle debug mode
                    this.debugMode = !this.debugMode;
                    this.clearDebugMarkers();
                    console.log("Collision debug mode: " + (this.debugMode ? "ON" : "OFF"));
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
        // Store previous position for collision resolution
        const previousPosition = this.position.clone();
        
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
        
        // Clear previous debug markers
        if (this.debugMode) {
            this.clearDebugMarkers();
        }
        
        // Check for collisions with ALL collidable objects in the scene
        let collision = false;
        
        // All collections of objects to check for collisions
        let collidableObjects = [];
        
        // Add buildings to collidable objects
        if (this.scene.buildings) {
            collidableObjects = collidableObjects.concat(this.scene.buildings);
        }
        
        // Add street elements (lamp posts, benches, etc.) if available
        if (this.scene.streetElements) {
            collidableObjects = collidableObjects.concat(this.scene.streetElements);
        }
        
        // Add other vehicles if available
        if (this.scene.vehicles) {
            collidableObjects = collidableObjects.concat(this.scene.vehicles);
        }
        
        // Process all collidable objects
        for (const object of collidableObjects) {
            // Skip if object doesn't have a position
            if (!object.position) continue;
            
            let objectSize;
            
            // Get object dimensions from its geometry
            if (object.geometry) {
                objectSize = new THREE.Vector3();
                object.geometry.computeBoundingBox();
                object.geometry.boundingBox.getSize(objectSize);
                
                // Scale by the object's scale
                objectSize.x *= object.scale.x || 1;
                objectSize.y *= object.scale.y || 1;
                objectSize.z *= object.scale.z || 1;
            } else {
                // Fallback for objects without explicit geometry
                // Provide a default collision size based on object type or role
                objectSize = this.getDefaultObjectSize(object);
                
                // Skip if we couldn't determine a size
                if (!objectSize) continue;
            }
            
            // Calculate distance between car and object center
            const distance = this.position.distanceTo(object.position);
            
            // Quick radius check first (optimization)
            const combinedRadius = this.collisionRadius + 
                Math.sqrt(Math.pow(objectSize.x/2, 2) + Math.pow(objectSize.z/2, 2));
            
            if (distance < combinedRadius) {
                // More precise box collision check
                if (this.checkBoxCollision(object, objectSize)) {
                    collision = true;
                    
                    if (this.debugMode) {
                        // Highlight object that caused collision
                        this.addDebugMarker(object.position, 0xFF0000, Math.max(objectSize.x, objectSize.z) + 1);
                    }
                    
                    break;
                } else if (this.debugMode) {
                    // Show objects that are checked but not colliding
                    this.addDebugMarker(object.position, 0x00FF00, Math.max(objectSize.x, objectSize.z) + 1);
                }
            }
        }
        
        // If collision detected, revert to previous position
        if (collision) {
            this.position.copy(previousPosition);
            this.speed = 0; // Stop the car
        }
        
        // Update vehicle mesh
        this.vehicle.position.copy(this.position);
        this.vehicle.rotation.y = this.rotation;
        
        // Draw car corners in debug mode
        if (this.debugMode) {
            const corners = this.getCarCorners();
            corners.forEach(corner => {
                this.addDebugMarker(new THREE.Vector3(corner.x, 1, corner.y), 0x0000FF, 0.5);
            });
        }
    }
    
    checkBoxCollision(object, objectSize) {
        // Get car corners in world space
        const carCorners = this.getCarCorners();
        
        // Account for object rotation
        const objectRotation = object.rotation ? object.rotation.y : 0;
        
        // Object bounds (considering rotation)
        if (Math.abs(objectRotation) < 0.01) {
            // Simple case: object not rotated
            const halfWidth = objectSize.x / 2;
            const halfDepth = objectSize.z / 2;
            const objectMin = new THREE.Vector2(
                object.position.x - halfWidth,
                object.position.z - halfDepth
            );
            const objectMax = new THREE.Vector2(
                object.position.x + halfWidth,
                object.position.z + halfDepth
            );
            
            // Check if any corner of the car is inside the object bounds
            for (const corner of carCorners) {
                if (corner.x >= objectMin.x && corner.x <= objectMax.x &&
                    corner.y >= objectMin.y && corner.y <= objectMax.y) {
                    return true;
                }
            }
        } else {
            // Complex case: object is rotated
            // Get object corners
            const objectCorners = this.getObjectCorners(object, objectSize);
            
            // Check for Separating Axis Theorem (SAT)
            return this.checkPolygonCollision(carCorners, objectCorners);
        }
        
        return false;
    }
    
    getObjectCorners(object, objectSize) {
        const corners = [];
        const halfWidth = objectSize.x / 2;
        const halfDepth = objectSize.z / 2;
        const objectRotation = object.rotation ? object.rotation.y : 0;
        
        // Corner offsets relative to object center (before rotation)
        const cornerOffsets = [
            new THREE.Vector2(-halfWidth, -halfDepth),
            new THREE.Vector2(halfWidth, -halfDepth),
            new THREE.Vector2(halfWidth, halfDepth),
            new THREE.Vector2(-halfWidth, halfDepth)
        ];
        
        // Apply rotation and position to get world-space corners
        for (const offset of cornerOffsets) {
            // Rotate corner
            const rotatedX = offset.x * Math.cos(objectRotation) - offset.y * Math.sin(objectRotation);
            const rotatedZ = offset.x * Math.sin(objectRotation) + offset.y * Math.cos(objectRotation);
            
            // Add object position
            corners.push(new THREE.Vector2(
                object.position.x + rotatedX,
                object.position.z + rotatedZ
            ));
        }
        
        return corners;
    }
    
    checkPolygonCollision(polygonA, polygonB) {
        // Separating Axis Theorem (SAT) for convex polygons
        
        // Check axes from polygon A
        for (let i = 0; i < polygonA.length; i++) {
            const j = (i + 1) % polygonA.length;
            const edge = new THREE.Vector2(
                polygonA[j].x - polygonA[i].x,
                polygonA[j].y - polygonA[i].y
            );
            const axis = new THREE.Vector2(-edge.y, edge.x).normalize();
            
            if (this.isSeparatingAxis(axis, polygonA, polygonB)) {
                return false;
            }
        }
        
        // Check axes from polygon B
        for (let i = 0; i < polygonB.length; i++) {
            const j = (i + 1) % polygonB.length;
            const edge = new THREE.Vector2(
                polygonB[j].x - polygonB[i].x,
                polygonB[j].y - polygonB[i].y
            );
            const axis = new THREE.Vector2(-edge.y, edge.x).normalize();
            
            if (this.isSeparatingAxis(axis, polygonA, polygonB)) {
                return false;
            }
        }
        
        // No separating axis found, collision detected
        return true;
    }
    
    isSeparatingAxis(axis, polygonA, polygonB) {
        // Project polygons onto axis
        let minA = Infinity, maxA = -Infinity;
        let minB = Infinity, maxB = -Infinity;
        
        // Project polygon A
        for (const vertex of polygonA) {
            const projection = vertex.x * axis.x + vertex.y * axis.y;
            minA = Math.min(minA, projection);
            maxA = Math.max(maxA, projection);
        }
        
        // Project polygon B
        for (const vertex of polygonB) {
            const projection = vertex.x * axis.x + vertex.y * axis.y;
            minB = Math.min(minB, projection);
            maxB = Math.max(maxB, projection);
        }
        
        // Check for gap between projections
        return maxA < minB || maxB < minA;
    }
    
    getCarCorners() {
        // Calculate car corners based on position, rotation, and dimensions
        const corners = [];
        const halfWidth = this.width / 2;
        const halfLength = this.length / 2;
        
        // Corner offsets relative to car center (before rotation)
        const cornerOffsets = [
            new THREE.Vector2(-halfWidth, -halfLength),
            new THREE.Vector2(halfWidth, -halfLength),
            new THREE.Vector2(halfWidth, halfLength),
            new THREE.Vector2(-halfWidth, halfLength)
        ];
        
        // Rotate and translate corners to world space
        for (const offset of cornerOffsets) {
            // Rotate offset by car's rotation
            const rotatedX = offset.x * Math.cos(this.rotation) - offset.y * Math.sin(this.rotation);
            const rotatedY = offset.x * Math.sin(this.rotation) + offset.y * Math.cos(this.rotation);
            
            // Add car's position to get world space coordinates
            corners.push(new THREE.Vector2(
                this.position.x + rotatedX,
                this.position.z + rotatedY
            ));
        }
        
        return corners;
    }
    
    // Debug visualization methods
    addDebugMarker(position, color, size = 1) {
        const geometry = new THREE.SphereGeometry(size / 2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        this.scene.add(marker);
        this.debugMarkers.push(marker);
    }
    
    clearDebugMarkers() {
        for (const marker of this.debugMarkers) {
            this.scene.remove(marker);
        }
        this.debugMarkers = [];
    }
    
    // Helper method to provide default sizes for objects without explicit geometry
    getDefaultObjectSize(object) {
        // Check object properties to identify its type
        if (object.userData) {
            if (object.userData.type === 'lampPost') {
                return new THREE.Vector3(1, 8, 1);
            }
            if (object.userData.type === 'bench') {
                return new THREE.Vector3(2, 1, 1);
            }
            if (object.userData.type === 'trafficLight') {
                return new THREE.Vector3(1, 5, 1);
            }
        }
        
        // Check if it's part of a group that has a specific name
        if (object.name) {
            if (object.name.includes('lamp')) {
                return new THREE.Vector3(1, 8, 1);
            }
            if (object.name.includes('bench')) {
                return new THREE.Vector3(2, 1, 1);
            }
            if (object.name.includes('tree')) {
                return new THREE.Vector3(3, 6, 3);
            }
        }
        
        // Basic fallback using object's bounding sphere if available
        if (object.geometry && object.geometry.boundingSphere) {
            const radius = object.geometry.boundingSphere.radius;
            return new THREE.Vector3(radius * 2, radius * 2, radius * 2);
        }
        
        // Generic fallback - assume small object
        return new THREE.Vector3(1, 1, 1);
    }
} 