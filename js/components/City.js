import * as THREE from 'three';
import { MeshStandardMaterial } from 'three';

export class City {
    constructor(scene) {
        this.scene = scene;
        
        // City parameters
        this.citySize = 300; // Reduced from 500 to 300
        this.blockSize = 50; // Size of a city block
        this.sidewalkWidth = 5; // Width of sidewalks
        this.roadWidth = 10; // Width of roads
        
        // Collections for other systems to use
        this.roadNetwork = []; // Will store road segments
        this.sidewalks = []; // Will store sidewalk segments
        this.crosswalks = []; // Will store crosswalk areas
        this.buildings = []; // Will store building meshes
        this.streetElements = []; // Will store street elements
        this.trafficLights = []; // Will store traffic light positions
        
        // Materials
        this.materials = {
            ground: new THREE.MeshLambertMaterial({ color: 0x555555 }),
            sidewalk: new THREE.MeshLambertMaterial({ color: 0x999999 }),
            road: new THREE.MeshLambertMaterial({ color: 0x333333 }),
            crosswalk: new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF
            }),
            building: [
                new THREE.MeshLambertMaterial({ color: 0x8899AA }), // Glass skyscraper
                new THREE.MeshLambertMaterial({ color: 0xCC8866 }), // Brick building
                new THREE.MeshLambertMaterial({ color: 0xDDDDDD }), // Concrete building
                new THREE.MeshLambertMaterial({ color: 0x99AACC }), // Modern office
                new THREE.MeshLambertMaterial({ color: 0x777788 }), // Old industrial
            ],
            grass: new THREE.MeshLambertMaterial({ color: 0x33AA44 }),
            lamp: new THREE.MeshLambertMaterial({ color: 0x111111 }),
            lampLight: new THREE.MeshStandardMaterial({ // Keep emissive material as MeshStandardMaterial
                color: 0xFFFF99, 
                emissive: 0xFFFF99,
                emissiveIntensity: 1
            }),
            bench: new THREE.MeshLambertMaterial({ color: 0x553311 }),
        };
        
        // Add debug flag
        this.debugMode = true;
    }
    
    async initialize() {
        this.createGround();
        this.createGridSystem();
        this.createBuildings();
        this.createStreetElements();
        
        // Call debug method if in debug mode
        if (this.debugMode) {
            // Call after initialization is complete
            setTimeout(() => this.debugCityStats(), 100);
        }
        
        return Promise.resolve();  // This would be used for async loading if needed
    }
    
    createGround() {
        // Create a large ground plane
        const groundGeometry = new THREE.PlaneGeometry(this.citySize * 2, this.citySize * 2);
        const ground = new THREE.Mesh(groundGeometry, this.materials.ground);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01; // Slightly below road level to prevent z-fighting
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    createGridSystem() {
        // Calculate the number of blocks that fit in the city
        const blockCount = Math.floor(this.citySize / (this.blockSize + this.roadWidth));
        
        // Create grid of roads and blocks
        for (let x = -blockCount / 2; x < blockCount / 2; x++) {
            for (let z = -blockCount / 2; z < blockCount / 2; z++) {
                this.createCityBlock(x, z);
            }
        }
    }
    
    createCityBlock(blockX, blockZ) {
        const baseX = blockX * (this.blockSize + this.roadWidth);
        const baseZ = blockZ * (this.blockSize + this.roadWidth);
        
        // Create the block itself (pavement/sidewalk area)
        const blockGeometry = new THREE.BoxGeometry(
            this.blockSize, 
            0.1, 
            this.blockSize
        );
        const block = new THREE.Mesh(blockGeometry, this.materials.sidewalk);
        block.position.set(baseX, 0.05, baseZ);
        block.receiveShadow = true;
        this.scene.add(block);
        
        // Create roads around the block
        this.createRoad(baseX, baseZ, true); // East-West road
        this.createRoad(baseX, baseZ, false); // North-South road
        
        // Add potential crosswalks at intersections
        if (Math.random() < 0.7) { // 70% chance for a crosswalk
            this.createCrosswalk(
                baseX + this.blockSize / 2 + this.roadWidth / 2,
                baseZ,
                true
            );
            
            this.createCrosswalk(
                baseX,
                baseZ + this.blockSize / 2 + this.roadWidth / 2,
                false
            );
        }
        
        // Register this sidewalk area for pedestrian system
        const sidewalkArea = {
            x: baseX,
            z: baseZ,
            width: this.blockSize,
            depth: this.blockSize,
            innerWidth: this.blockSize - this.sidewalkWidth * 2,
            innerDepth: this.blockSize - this.sidewalkWidth * 2
        };
        this.sidewalks.push(sidewalkArea);
    }
    
    createRoad(baseX, baseZ, isEastWest) {
        let roadGeometry;
        let road;
        
        if (isEastWest) {
            // East-West road
            roadGeometry = new THREE.BoxGeometry(
                this.blockSize + this.roadWidth * 2, 
                0.05, 
                this.roadWidth
            );
            road = new THREE.Mesh(roadGeometry, this.materials.road);
            road.position.set(
                baseX, 
                0, 
                baseZ + this.blockSize / 2 + this.roadWidth / 2
            );
            
            // Register this road segment for traffic system
            this.roadNetwork.push({
                start: { x: baseX - this.blockSize / 2 - this.roadWidth, z: baseZ + this.blockSize / 2 + this.roadWidth / 2 },
                end: { x: baseX + this.blockSize / 2 + this.roadWidth, z: baseZ + this.blockSize / 2 + this.roadWidth / 2 },
                direction: 'east-west'
            });
            
            // Add traffic light at the end of the road segment (intersection)
            if (Math.random() < 0.5) {
                this.createTrafficLight(
                    baseX + this.blockSize / 2 + this.roadWidth / 2,
                    baseZ + this.blockSize / 2 + this.roadWidth / 2,
                    0 // Rotation for east-west road
                );
            }
        } else {
            // North-South road
            roadGeometry = new THREE.BoxGeometry(
                this.roadWidth, 
                0.05, 
                this.blockSize + this.roadWidth * 2
            );
            road = new THREE.Mesh(roadGeometry, this.materials.road);
            road.position.set(
                baseX + this.blockSize / 2 + this.roadWidth / 2, 
                0, 
                baseZ
            );
            
            // Register this road segment for traffic system
            this.roadNetwork.push({
                start: { x: baseX + this.blockSize / 2 + this.roadWidth / 2, z: baseZ - this.blockSize / 2 - this.roadWidth },
                end: { x: baseX + this.blockSize / 2 + this.roadWidth / 2, z: baseZ + this.blockSize / 2 + this.roadWidth },
                direction: 'north-south'
            });
            
            // Add traffic light at the end of the road segment (intersection)
            if (Math.random() < 0.5) {
                this.createTrafficLight(
                    baseX + this.blockSize / 2 + this.roadWidth / 2,
                    baseZ + this.blockSize / 2 + this.roadWidth / 2,
                    Math.PI / 2 // Rotation for north-south road
                );
            }
        }
        
        road.receiveShadow = true;
        this.scene.add(road);
    }
    
    createCrosswalk(x, z, isEastWest) {
        const width = isEastWest ? this.roadWidth - 1 : 5;
        const length = isEastWest ? 5 : this.roadWidth - 1;
        
        const crosswalkGeometry = new THREE.BoxGeometry(width, 0.06, length);
        const crosswalk = new THREE.Mesh(crosswalkGeometry, this.materials.crosswalk);
        crosswalk.position.set(x, 0.025, z);
        crosswalk.receiveShadow = true;
        this.scene.add(crosswalk);
        
        // Register this crosswalk for pedestrian system
        this.crosswalks.push({
            x: x,
            z: z,
            width: width,
            depth: length,
            direction: isEastWest ? 'east-west' : 'north-south'
        });
    }
    
    createTrafficLight(x, z, rotation) {
        // Create the pole
        const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 7, 8);
        const pole = new THREE.Mesh(poleGeometry, this.materials.lamp);
        pole.position.set(x, 3.5, z);
        pole.castShadow = true;
        this.scene.add(pole);
        
        // Create the traffic light housing
        const housingGeometry = new THREE.BoxGeometry(1, 3, 1);
        const housing = new THREE.Mesh(housingGeometry, this.materials.lamp);
        housing.position.set(x, 6, z);
        housing.castShadow = true;
        this.scene.add(housing);
        
        // Create the traffic lights (red, yellow, green)
        const lightColors = [0xFF0000, 0xFFFF00, 0x00FF00];
        const lightPositions = [1, 0, -1];
        
        lightColors.forEach((color, i) => {
            const lightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const lightMaterial = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.8
            });
            
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(x, 6 + lightPositions[i] * 0.8, z + 0.6);
            this.scene.add(light);
        });
        
        // Register this traffic light
        this.trafficLights.push({
            x: x,
            z: z,
            rotation: rotation
        });
    }
    
    createBuildings() {
        // Calculate where buildings can be placed on each block
        const blockCount = Math.floor(this.citySize / (this.blockSize + this.roadWidth));
        
        for (let x = -blockCount / 2; x < blockCount / 2; x++) {
            for (let z = -blockCount / 2; z < blockCount / 2; z++) {
                this.createBuildingsOnBlock(x, z);
            }
        }
    }
    
    createBuildingsOnBlock(blockX, blockZ) {
        const baseX = blockX * (this.blockSize + this.roadWidth);
        const baseZ = blockZ * (this.blockSize + this.roadWidth);
        
        // Determine block type (random)
        const blockType = Math.random();
        
        if (blockType < 0.2) {
            // Skyscraper district (one large building)
            this.createSkyscraper(baseX, baseZ);
        } else if (blockType < 0.5) {
            // Commercial district (medium buildings)
            this.createCommercialBuildings(baseX, baseZ);
        } else if (blockType < 0.8) {
            // Residential district (small buildings)
            this.createResidentialBuildings(baseX, baseZ);
        } else {
            // Park or plaza
            this.createPark(baseX, baseZ);
        }
    }
    
    createSkyscraper(baseX, baseZ) {
        // Create a tall skyscraper
        const width = this.blockSize - this.sidewalkWidth * 2 - Math.random() * 5;
        const depth = this.blockSize - this.sidewalkWidth * 2 - Math.random() * 5;
        const height = 50 + Math.random() * 100;
        
        // Basic skyscraper shape
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const materialIndex = 0; // Glass material
        const building = new THREE.Mesh(buildingGeometry, this.materials.building[materialIndex]);
        
        // Position at center of block, with bottom at ground level
        building.position.set(
            baseX,
            height / 2,
            baseZ
        );
        
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.buildings.push(building);
        
        // Add details like setbacks or antennas
        if (Math.random() < 0.5) {
            // Add a smaller section on top
            const topWidth = width * 0.7;
            const topDepth = depth * 0.7;
            const topHeight = height * 0.2;
            
            const topGeometry = new THREE.BoxGeometry(topWidth, topHeight, topDepth);
            const top = new THREE.Mesh(topGeometry, this.materials.building[materialIndex]);
            top.position.set(
                baseX,
                height + topHeight / 2,
                baseZ
            );
            
            top.castShadow = true;
            this.scene.add(top);
            this.buildings.push(top);
            
            // Add an antenna
            const antennaGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
            const antenna = new THREE.Mesh(antennaGeometry, new THREE.MeshStandardMaterial({ color: 0x888888 }));
            antenna.position.set(
                baseX,
                height + topHeight + 15/2,
                baseZ
            );
            
            antenna.castShadow = true;
            this.scene.add(antenna);
        }
    }
    
    createCommercialBuildings(baseX, baseZ) {
        // Create 2-4 medium-sized commercial buildings
        const buildingCount = 2 + Math.floor(Math.random() * 3);
        const blockArea = (this.blockSize - this.sidewalkWidth * 2) * (this.blockSize - this.sidewalkWidth * 2);
        const buildingArea = blockArea / buildingCount;
        
        // Calculate approximate dimensions for each building
        const dimension = Math.sqrt(buildingArea);
        
        // Place buildings in a grid pattern
        const gridSize = Math.ceil(Math.sqrt(buildingCount));
        const gridCellSize = (this.blockSize - this.sidewalkWidth * 2) / gridSize;
        
        let buildingIndex = 0;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (buildingIndex >= buildingCount) break;
                
                // Vary the building size slightly
                const width = dimension * (0.7 + Math.random() * 0.3);
                const depth = dimension * (0.7 + Math.random() * 0.3);
                const height = 15 + Math.random() * 25;
                
                // Calculate position within the grid cell
                const offsetX = (i - (gridSize - 1) / 2) * gridCellSize;
                const offsetZ = (j - (gridSize - 1) / 2) * gridCellSize;
                
                const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                const materialIndex = 3 + Math.floor(Math.random() * 2); // Office or industrial
                const building = new THREE.Mesh(buildingGeometry, this.materials.building[materialIndex]);
                
                building.position.set(
                    baseX + offsetX,
                    height / 2,
                    baseZ + offsetZ
                );
                
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);
                this.buildings.push(building);
                
                buildingIndex++;
            }
        }
    }
    
    createResidentialBuildings(baseX, baseZ) {
        // Create 4-8 small residential buildings
        const buildingCount = 4 + Math.floor(Math.random() * 5);
        const blockArea = (this.blockSize - this.sidewalkWidth * 2) * (this.blockSize - this.sidewalkWidth * 2);
        const buildingArea = blockArea / buildingCount;
        
        // Calculate approximate dimensions for each building
        const dimension = Math.sqrt(buildingArea);
        
        // Place buildings in a grid pattern
        const gridSize = Math.ceil(Math.sqrt(buildingCount));
        const gridCellSize = (this.blockSize - this.sidewalkWidth * 2) / gridSize;
        
        let buildingIndex = 0;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (buildingIndex >= buildingCount) break;
                
                // Skip some positions randomly to create variety
                if (Math.random() < 0.2) {
                    buildingIndex++;
                    continue;
                }
                
                // Vary the building size slightly
                const width = dimension * (0.6 + Math.random() * 0.3);
                const depth = dimension * (0.6 + Math.random() * 0.3);
                const height = 8 + Math.random() * 12;
                
                // Calculate position within the grid cell
                const offsetX = (i - (gridSize - 1) / 2) * gridCellSize;
                const offsetZ = (j - (gridSize - 1) / 2) * gridCellSize;
                
                const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                const materialIndex = 1 + Math.floor(Math.random() * 2); // Brick or concrete
                const building = new THREE.Mesh(buildingGeometry, this.materials.building[materialIndex]);
                
                building.position.set(
                    baseX + offsetX,
                    height / 2,
                    baseZ + offsetZ
                );
                
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);
                this.buildings.push(building);
                
                buildingIndex++;
            }
        }
    }
    
    createPark(baseX, baseZ) {
        // Create a grassy park area
        const parkGeometry = new THREE.BoxGeometry(
            this.blockSize - this.sidewalkWidth * 2, 
            0.1, 
            this.blockSize - this.sidewalkWidth * 2
        );
        const park = new THREE.Mesh(parkGeometry, this.materials.grass);
        park.position.set(baseX, 0.06, baseZ);
        park.receiveShadow = true;
        this.scene.add(park);
        
        // Add trees
        const treeCount = 5 + Math.floor(Math.random() * 10);
        for (let i = 0; i < treeCount; i++) {
            const offsetX = (Math.random() - 0.5) * (this.blockSize - this.sidewalkWidth * 2 - 5);
            const offsetZ = (Math.random() - 0.5) * (this.blockSize - this.sidewalkWidth * 2 - 5);
            
            this.createTree(baseX + offsetX, baseZ + offsetZ);
        }
        
        // Add some benches
        const benchCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < benchCount; i++) {
            const offsetX = (Math.random() - 0.5) * (this.blockSize - this.sidewalkWidth * 2 - 3);
            const offsetZ = (Math.random() - 0.5) * (this.blockSize - this.sidewalkWidth * 2 - 3);
            
            this.createBench(
                baseX + offsetX, 
                baseZ + offsetZ, 
                Math.random() * Math.PI * 2
            );
        }
    }
    
    createTree(x, z) {
        // Create tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.6, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Create tree foliage
        const foliageGeometry = new THREE.SphereGeometry(2.5, 16, 16);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228822 }); // Green
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, 5, z);
        foliage.castShadow = true;
        this.scene.add(foliage);
        
        this.streetElements.push(trunk, foliage);
    }
    
    createStreetElements() {
        // Create street elements like lamps, benches, etc. on the sidewalks
        const blockCount = Math.floor(this.citySize / (this.blockSize + this.roadWidth));
        
        for (let x = -blockCount / 2; x < blockCount / 2; x++) {
            for (let z = -blockCount / 2; z < blockCount / 2; z++) {
                this.createStreetElementsOnBlock(x, z);
            }
        }
    }
    
    createStreetElementsOnBlock(blockX, blockZ) {
        const baseX = blockX * (this.blockSize + this.roadWidth);
        const baseZ = blockZ * (this.blockSize + this.roadWidth);
        
        // Create lamps at corners
        this.createLampPost(
            baseX + this.blockSize / 2 - this.sidewalkWidth / 2,
            baseZ + this.blockSize / 2 - this.sidewalkWidth / 2
        );
        
        this.createLampPost(
            baseX - this.blockSize / 2 + this.sidewalkWidth / 2,
            baseZ + this.blockSize / 2 - this.sidewalkWidth / 2
        );
        
        this.createLampPost(
            baseX + this.blockSize / 2 - this.sidewalkWidth / 2,
            baseZ - this.blockSize / 2 + this.sidewalkWidth / 2
        );
        
        this.createLampPost(
            baseX - this.blockSize / 2 + this.sidewalkWidth / 2,
            baseZ - this.blockSize / 2 + this.sidewalkWidth / 2
        );
        
        // Create benches randomly
        if (Math.random() < 0.3) {
            this.createBench(
                baseX + this.blockSize / 2 - this.sidewalkWidth / 2 - 1,
                baseZ,
                Math.PI / 2
            );
        }
        
        if (Math.random() < 0.3) {
            this.createBench(
                baseX - this.blockSize / 2 + this.sidewalkWidth / 2 + 1,
                baseZ,
                -Math.PI / 2
            );
        }
    }
    
    createLampPost(x, z) {
        // Create lamp post base
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 8);
        const base = new THREE.Mesh(baseGeometry, this.materials.lamp);
        base.position.set(x, 0.15, z);
        base.castShadow = true;
        this.scene.add(base);
        
        // Create lamp post pole
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
        const pole = new THREE.Mesh(poleGeometry, this.materials.lamp);
        pole.position.set(x, 4, z);
        pole.castShadow = true;
        this.scene.add(pole);
        
        // Create lamp head
        const headGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.8, 8);
        const head = new THREE.Mesh(headGeometry, this.materials.lamp);
        head.position.set(x, 8, z);
        head.castShadow = true;
        this.scene.add(head);
        
        // Create light bulb - ONLY EMISSIVE MATERIAL, NO ACTUAL LIGHT
        const bulbGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const bulb = new THREE.Mesh(bulbGeometry, this.materials.lampLight);
        bulb.position.set(x, 7.7, z);
        this.scene.add(bulb);
        
        // Store the lamp for the day/night cycle - with null light
        const lamp = { base, pole, head, bulb, light: null };
        
        // Add to scene elements
        this.streetElements.push(base, pole, head, bulb);
        
        // Return the lamp so it can be added to the day/night cycle
        return lamp;
    }
    
    createBench(x, z, rotation) {
        // Create bench seat
        const seatGeometry = new THREE.BoxGeometry(5, 0.3, 1.5);
        const seat = new THREE.Mesh(seatGeometry, this.materials.bench);
        seat.position.set(x, 1, z);
        seat.rotation.y = rotation;
        seat.castShadow = true;
        this.scene.add(seat);
        
        // Create bench legs
        const positions = [-2, 0, 2];
        positions.forEach(pos => {
            const legGeometry = new THREE.BoxGeometry(0.3, 1, 1.5);
            const leg = new THREE.Mesh(legGeometry, this.materials.bench);
            
            // Calculate leg position based on bench rotation
            const legX = x + Math.cos(rotation) * pos;
            const legZ = z + Math.sin(rotation) * pos;
            
            leg.position.set(legX, 0.5, legZ);
            leg.rotation.y = rotation;
            leg.castShadow = true;
            this.scene.add(leg);
            
            this.streetElements.push(leg);
        });
        
        // Create bench backrest
        const backrestGeometry = new THREE.BoxGeometry(5, 1.5, 0.3);
        const backrest = new THREE.Mesh(backrestGeometry, this.materials.bench);
        
        // Calculate backrest position based on bench rotation
        const backX = x - Math.sin(rotation) * 0.6;
        const backZ = z + Math.cos(rotation) * 0.6;
        
        backrest.position.set(backX, 1.9, backZ);
        backrest.rotation.y = rotation;
        backrest.castShadow = true;
        this.scene.add(backrest);
        
        this.streetElements.push(seat, backrest);
    }
    
    debugCityStats() {
        if (!this.debugMode) return;
        
        // Count various types of objects
        let buildingCount = 0;
        let lampPostCount = 0;
        let lampLights = 0;
        let trafficLightCount = 0;
        let trafficLightLamps = 0;
        let trees = 0;
        let benches = 0;
        let totalObjects = 0;
        
        // Count objects in streetElements array
        this.streetElements.forEach(element => {
            totalObjects++;
            
            // Try to classify based on userData or other properties
            if (element.userData) {
                if (element.userData.type === 'building') buildingCount++;
                if (element.userData.type === 'lampPost') lampPostCount++;
                if (element.userData.type === 'trafficLight') trafficLightCount++;
                if (element.userData.type === 'tree') trees++;
                if (element.userData.type === 'bench') benches++;
            }
            
            // Count lights
            if (element.isPointLight || element.isSpotLight) {
                if (element.userData && element.userData.type === 'lampPost') {
                    lampLights++;
                }
                if (element.userData && element.userData.type === 'trafficLight') {
                    trafficLightLamps++;
                }
            }
        });
        
        // Count buildings specifically
        const buildings = this.buildings.length;
        
        console.log(`[CITY DEBUG] Objects:
        - Buildings: ${buildingCount + buildings}
        - Lamp posts: ${lampPostCount}
        - Lamp lights: ${lampLights}
        - Traffic lights: ${trafficLightCount}
        - Traffic light lamps: ${trafficLightLamps}
        - Trees: ${trees}
        - Benches: ${benches}
        - Total city objects: ${totalObjects + buildings}
        - Traffic lights: ${this.trafficLights.length}`);
        
        return {
            objects: totalObjects + buildings,
            lights: lampLights + trafficLightLamps
        };
    }
} 