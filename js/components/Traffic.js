import * as THREE from 'three';

export class Traffic {
    constructor(scene, roadNetwork) {
        this.scene = scene;
        this.roadNetwork = roadNetwork;
        this.vehicles = [];
        this.vehicleSpeed = 15; // Units per second
        this.vehicleCount = 15; // Reduced from 50 to 15 vehicles
        
        // Colors for vehicles
        this.carColors = [
            0xFF0000, // Red
            0x0000FF, // Blue
            0x00FF00, // Green
            0xFFFF00, // Yellow
            0xFFFFFF, // White
            0x000000, // Black
            0x888888, // Gray
            0xFF8800, // Orange
        ];
        
        // Create traffic light system
        this.trafficLightState = {};
        this.trafficLightTimer = 0;
        
        // Add a debug flag
        this.debugMode = true;
    }
    
    async initialize() {
        // Initialize traffic light states for each intersection
        this.initializeTrafficLights();
        
        // Create the vehicles
        this.createVehicles();
        
        return Promise.resolve();
    }
    
    initializeTrafficLights() {
        // Group intersections and assign initial states
        const intersections = {};
        
        this.roadNetwork.forEach(road => {
            // Find road end points that are intersections
            const endKey = `${Math.round(road.end.x)},${Math.round(road.end.z)}`;
            
            if (!intersections[endKey]) {
                intersections[endKey] = {
                    x: road.end.x,
                    z: road.end.z,
                    roads: [],
                    state: Math.random() < 0.5 ? 'east-west' : 'north-south', // Random initial state
                    timer: Math.random() * 10, // Random offset for traffic light changes
                };
            }
            
            intersections[endKey].roads.push(road);
        });
        
        this.intersections = Object.values(intersections);
    }
    
    createVehicles() {
        // Create various types of vehicles
        for (let i = 0; i < this.vehicleCount; i++) {
            // Choose a random road segment to place the vehicle
            if (this.roadNetwork.length === 0) return;
            
            const roadIndex = Math.floor(Math.random() * this.roadNetwork.length);
            const road = this.roadNetwork[roadIndex];
            
            // Choose a random position along the road
            const progress = Math.random();
            const vehicleType = Math.random() < 0.85 ? 'car' : 'truck';
            
            // Create and add the vehicle
            const vehicle = this.createVehicle(vehicleType, road, progress);
            this.vehicles.push(vehicle);
        }
    }
    
    createVehicle(type, road, progress) {
        let vehicleMesh;
        
        // Choose a random color for the vehicle
        const colorIndex = Math.floor(Math.random() * this.carColors.length);
        const vehicleColor = this.carColors[colorIndex];
        
        if (type === 'car') {
            // Create a car
            vehicleMesh = this.createCar(vehicleColor);
        } else {
            // Create a truck
            vehicleMesh = this.createTruck(vehicleColor);
        }
        
        // Calculate position along the road
        const position = this.calculatePositionOnRoad(road, progress);
        vehicleMesh.position.copy(position);
        
        // Rotate vehicle based on road direction
        if (road.direction === 'east-west') {
            vehicleMesh.rotation.y = position.x > road.start.x ? 0 : Math.PI;
        } else { // north-south
            vehicleMesh.rotation.y = position.z > road.start.z ? Math.PI / 2 : -Math.PI / 2;
        }
        
        this.scene.add(vehicleMesh);
        
        // Return vehicle object
        return {
            mesh: vehicleMesh,
            road: road,
            progress: progress,
            speed: this.vehicleSpeed * (0.8 + Math.random() * 0.4), // Random speed variation
            type: type,
        };
    }
    
    createCar(color) {
        // Create a car using primitive shapes
        const group = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(4, 1.2, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: color
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.7;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Car cabin
        const cabinGeometry = new THREE.BoxGeometry(2, 1, 1.8);
        const cabinMaterial = new THREE.MeshLambertMaterial({
            color: 0x222222
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 1.3, 0);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Wheels
        const wheelPositions = [
            [-1.2, 0, -1],  // front left
            [1.2, 0, -1],   // rear left
            [-1.2, 0, 1],   // front right
            [1.2, 0, 1]     // rear right
        ];
        
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({
            color: 0x111111
        });
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(position[0], position[1], position[2]);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            group.add(wheel);
        });
        
        // Create headlights - USING ONLY EMISSIVE MATERIALS, NO ACTUAL LIGHTS
        const headlightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 1.0
        });
        
        const headlightPositions = [
            [-2, 0.7, -0.6],  // front left
            [-2, 0.7, 0.6]    // front right
        ];
        
        headlightPositions.forEach(position => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(position[0], position[1], position[2]);
            group.add(headlight);
            
            // REMOVE LIGHT CREATION
            // const light = new THREE.PointLight(0xFFFFFF, 0.5, 10);
            // light.position.set(position[0], position[1], position[2]);
            // group.add(light);
        });
        
        // Create taillights
        const taillightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 1.0
        });
        
        const taillightPositions = [
            [2, 0.7, -0.6],  // rear left
            [2, 0.7, 0.6]    // rear right
        ];
        
        taillightPositions.forEach(position => {
            const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
            taillight.position.set(position[0], position[1], position[2]);
            group.add(taillight);
        });
        
        return group;
    }
    
    createTruck(color) {
        // Create a truck using primitive shapes
        const group = new THREE.Group();
        
        // Truck cabin
        const cabinGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.2);
        const cabinMaterial = new THREE.MeshLambertMaterial({
            color: color
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(-2, 1.5, 0);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Truck cargo area
        const cargoGeometry = new THREE.BoxGeometry(5, 2.8, 2.4);
        const cargoMaterial = new THREE.MeshLambertMaterial({
            color: 0x888888
        });
        const cargo = new THREE.Mesh(cargoGeometry, cargoMaterial);
        cargo.position.set(1, 1.6, 0);
        cargo.castShadow = true;
        cargo.receiveShadow = true;
        group.add(cargo);
        
        // Wheels
        const wheelPositions = [
            [-2.5, 0, -1.1],  // cabin front left
            [-1, 0, -1.1],    // cabin rear left
            [2, 0, -1.1],     // cargo front left
            [3.5, 0, -1.1],   // cargo rear left
            [-2.5, 0, 1.1],   // cabin front right
            [-1, 0, 1.1],     // cabin rear right
            [2, 0, 1.1],      // cargo front right
            [3.5, 0, 1.1]     // cargo rear right
        ];
        
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({
            color: 0x111111
        });
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(position[0], position[1], position[2]);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            group.add(wheel);
        });
        
        // Create headlights - USING ONLY EMISSIVE MATERIALS, NO ACTUAL LIGHTS
        const headlightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 1.0
        });
        
        const headlightPositions = [
            [-3.3, 1.3, -0.8],  // front left
            [-3.3, 1.3, 0.8]    // front right
        ];
        
        headlightPositions.forEach(position => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(position[0], position[1], position[2]);
            group.add(headlight);
            
            // REMOVE LIGHT CREATION
            // const light = new THREE.PointLight(0xFFFFFF, 0.5, 10);
            // light.position.set(position[0], position[1], position[2]);
            // group.add(light);
        });
        
        // Create taillights
        const taillightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 1.0
        });
        
        const taillightPositions = [
            [3.8, 1, -1],  // rear left
            [3.8, 1, 1]    // rear right
        ];
        
        taillightPositions.forEach(position => {
            const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
            taillight.position.set(position[0], position[1], position[2]);
            group.add(taillight);
        });
        
        return group;
    }
    
    calculatePositionOnRoad(road, progress) {
        // Calculate position along the road based on progress (0-1)
        const x = road.start.x + (road.end.x - road.start.x) * progress;
        const z = road.start.z + (road.end.z - road.start.z) * progress;
        
        return new THREE.Vector3(x, 0.5, z);
    }
    
    update(delta) {
        // Update traffic light states
        this.updateTrafficLights(delta);
        
        // Update all vehicles
        this.vehicles.forEach(vehicle => {
            this.updateVehicle(vehicle, delta);
        });
        
        // Call debug method if in debug mode
        if (this.debugMode && !this.debugReported) {
            // Only report once
            this.debugLightCount();
            this.debugReported = true;
        }
    }
    
    updateTrafficLights(delta) {
        // Update traffic light timers and states
        this.intersections.forEach(intersection => {
            intersection.timer -= delta;
            
            if (intersection.timer <= 0) {
                // Toggle traffic light state
                intersection.state = (intersection.state === 'east-west') ? 'north-south' : 'east-west';
                intersection.timer = 10 + Math.random() * 5; // Random time between 10-15 seconds
            }
        });
    }
    
    updateVehicle(vehicle, delta) {
        // Calculate new progress along the road
        let newProgress = vehicle.progress + (delta * vehicle.speed / this.calculateRoadLength(vehicle.road));
        
        // Check if vehicle has reached the end of the road
        if (newProgress >= 1) {
            // Find the next road to follow
            const nextRoad = this.findNextRoad(vehicle.road);
            
            if (nextRoad) {
                // Check traffic light at the intersection
                const canProceed = this.checkTrafficLight(vehicle.road, nextRoad);
                
                if (canProceed) {
                    // Move to the next road
                    vehicle.road = nextRoad;
                    vehicle.progress = 0;
                    
                    // Update vehicle rotation based on new road direction
                    if (nextRoad.direction === 'east-west') {
                        vehicle.mesh.rotation.y = nextRoad.end.x > nextRoad.start.x ? 0 : Math.PI;
                    } else { // north-south
                        vehicle.mesh.rotation.y = nextRoad.end.z > nextRoad.start.z ? Math.PI / 2 : -Math.PI / 2;
                    }
                } else {
                    // Stop at traffic light
                    newProgress = 0.98; // Just before the intersection
                }
            } else {
                // Loop back to the start of a random road
                const randomRoadIndex = Math.floor(Math.random() * this.roadNetwork.length);
                vehicle.road = this.roadNetwork[randomRoadIndex];
                vehicle.progress = 0;
                
                // Update vehicle rotation based on new road direction
                if (vehicle.road.direction === 'east-west') {
                    vehicle.mesh.rotation.y = vehicle.road.end.x > vehicle.road.start.x ? 0 : Math.PI;
                } else { // north-south
                    vehicle.mesh.rotation.y = vehicle.road.end.z > vehicle.road.start.z ? Math.PI / 2 : -Math.PI / 2;
                }
            }
        } else {
            vehicle.progress = newProgress;
        }
        
        // Update vehicle position
        const newPosition = this.calculatePositionOnRoad(vehicle.road, vehicle.progress);
        vehicle.mesh.position.copy(newPosition);
    }
    
    calculateRoadLength(road) {
        // Calculate the length of a road segment
        const dx = road.end.x - road.start.x;
        const dz = road.end.z - road.start.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    findNextRoad(currentRoad) {
        // Get all roads that start at the end of the current road
        const possibleRoads = this.roadNetwork.filter(road => {
            return this.isClosePoints(road.start, currentRoad.end);
        });
        
        if (possibleRoads.length === 0) {
            return null;
        }
        
        // Prefer roads that continue in the same direction
        const sameDirectionRoads = possibleRoads.filter(road => {
            return road.direction === currentRoad.direction;
        });
        
        if (sameDirectionRoads.length > 0) {
            const randomIndex = Math.floor(Math.random() * sameDirectionRoads.length);
            return sameDirectionRoads[randomIndex];
        }
        
        // If no roads continue in the same direction, choose a random turn
        const randomIndex = Math.floor(Math.random() * possibleRoads.length);
        return possibleRoads[randomIndex];
    }
    
    checkTrafficLight(currentRoad, nextRoad) {
        // Find the intersection where these roads meet
        const intersection = this.intersections.find(intersection => {
            return this.isClosePoints({ x: intersection.x, z: intersection.z }, currentRoad.end);
        });
        
        if (!intersection) {
            return true; // No intersection, can proceed
        }
        
        // Check if the traffic light allows movement in the nextRoad's direction
        return (
            (nextRoad.direction === 'east-west' && intersection.state === 'east-west') ||
            (nextRoad.direction === 'north-south' && intersection.state === 'north-south')
        );
    }
    
    isClosePoints(point1, point2) {
        // Check if two points are close enough to be considered the same
        const dx = point1.x - point2.x;
        const dz = point1.z - point2.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance < 0.5;
    }
    
    debugLightCount() {
        if (!this.debugMode) return;
        
        let vehicleLights = 0;
        let totalLights = 0;
        
        // Count lights in vehicles
        this.vehicles.forEach(vehicle => {
            vehicle.mesh.traverse(child => {
                if (child.isPointLight || child.isSpotLight) {
                    vehicleLights++;
                    totalLights++;
                }
            });
        });
        
        // Count traffic lights
        let trafficLightCount = 0;
        this.scene.traverse(object => {
            // Check if this is a traffic light (if they have a specific property or name)
            if (object.userData && object.userData.isTrafficLight) {
                if (object.isPointLight || object.isSpotLight) {
                    trafficLightCount++;
                    totalLights++;
                }
            }
        });
        
        console.log(`[TRAFFIC DEBUG] Lights:
        - Vehicle lights: ${vehicleLights}
        - Traffic signal lights: ${trafficLightCount}
        - Total traffic component lights: ${totalLights}`);
        
        return totalLights;
    }
} 