import * as THREE from 'three';
import { MeshStandardMaterial } from 'three';
import { AdvancedBuildings } from './AdvancedBuildings.js';

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
            // Matériaux pour les fenêtres
            glassWindow: new THREE.MeshLambertMaterial({ 
                color: 0x88CCFF, 
                transparent: true, 
                opacity: 0.7 
            }),
            windowLit: new THREE.MeshStandardMaterial({
                color: 0xFFEE88,
                emissive: 0xFFEE88,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.9
            })
        };
        
        // Create advanced buildings system
        this.advancedBuildings = new AdvancedBuildings(scene, this.materials);
        
        // Add debug flag
        this.debugMode = true;
        
        // Landmark buildings for special placement
        this.landmarkBuildings = {
            cityHall: null,
            museum: null,
            trainStation: null,
            artDecoSkyscraper: null,
            modernSkyscraper: null
        };
        
        // Track special landmark positions to avoid placing other buildings there
        this.landmarkPositions = [];
        
        // Fenêtres éclairées pour le cycle jour/nuit
        this.windowLights = [];
    }
    
    async initialize() {
        this.createGround();
        this.createGridSystem();
        
        // Create landmark buildings in specific locations
        this.createLandmarkBuildings();
        
        // Create other regular buildings
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
        
        // Check if this position is reserved for a landmark building
        const isLandmarkPosition = this.landmarkPositions.some(pos => 
            Math.abs(pos.x - baseX) < 1 && Math.abs(pos.z - baseZ) < 1
        );
        
        if (isLandmarkPosition) {
            // Skip this block, as it's used for landmarks
            return;
        }
        
        // Determine city zones based on distance from center
        const distanceFromCenter = Math.sqrt(blockX * blockX + blockZ * blockZ);
        
        // Determine block type based on location and random factors
        let blockType;
        
        if (distanceFromCenter < 3) {
            // Downtown / central business district - more skyscrapers
            blockType = Math.random() < 0.7 ? 'skyscraper' : 
                       (Math.random() < 0.5 ? 'commercial' : 'park');
        } else if (distanceFromCenter < 5) {
            // Midtown area - mix of commercial and residential
            blockType = Math.random() < 0.3 ? 'skyscraper' : 
                       (Math.random() < 0.6 ? 'commercial' : 'residential');
        } else {
            // Outer areas - mostly residential with some commercial
            blockType = Math.random() < 0.1 ? 'skyscraper' : 
                       (Math.random() < 0.3 ? 'commercial' : 
                       (Math.random() < 0.8 ? 'residential' : 'park'));
        }
        
        // Create buildings based on block type
        switch (blockType) {
            case 'skyscraper':
                // Mix of classic and advanced skyscrapers
                if (Math.random() < 0.3) {
                    // Use one of the advanced skyscrapers
                    if (Math.random() < 0.5) {
                        this.advancedBuildings.createArtDecoSkyscraper(baseX, baseZ);
                    } else {
                        this.advancedBuildings.createModernSkyscraper(baseX, baseZ);
                    }
                } else {
                    // Use the original skyscraper
                    this.createSkyscraper(baseX, baseZ);
                }
                break;
            case 'commercial':
                this.createCommercialBuildings(baseX, baseZ);
                break;
            case 'residential':
                this.createResidentialBuildings(baseX, baseZ);
                break;
            case 'park':
                this.createPark(baseX, baseZ);
                break;
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
        
        // Ajouter des fenêtres au gratte-ciel
        const floorCount = Math.floor(height / 4); // Environ 4 mètres par étage
        this.createWindowGrid(
            building,
            width,
            height,
            depth,
            floorCount, // rangées basées sur le nombre d'étages
            Math.ceil(width / 5), // colonnes basées sur la largeur (environ 5m par fenêtre)
            baseX,
            height / 2,
            baseZ
        );
        
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
            
            // Ajouter des fenêtres à la section supérieure
            const topFloorCount = Math.floor(topHeight / 4);
            if (topFloorCount > 0) {
                this.createWindowGrid(
                    top,
                    topWidth,
                    topHeight,
                    topDepth,
                    topFloorCount,
                    Math.ceil(topWidth / 5),
                    baseX,
                    height + topHeight / 2,
                    baseZ
                );
            }
            
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
                
                // Ajouter des fenêtres au bâtiment commercial
                const floorCount = Math.floor(height / 3.5); // Environ 3.5 mètres par étage pour les commerciaux
                if (floorCount > 0) {
                    this.createWindowGrid(
                        building,
                        width,
                        height,
                        depth,
                        floorCount,
                        Math.ceil(width / 4),
                        baseX + offsetX,
                        height / 2,
                        baseZ + offsetZ
                    );
                }
                
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
                
                // Ajouter des fenêtres au bâtiment résidentiel
                const floorCount = Math.floor(height / 3); // Environ 3 mètres par étage pour les résidentiels
                if (floorCount > 0) {
                    this.createWindowGrid(
                        building,
                        width,
                        height,
                        depth,
                        floorCount,
                        Math.ceil(width / 3), // Fenêtres plus larges pour les bâtiments résidentiels
                        baseX + offsetX,
                        height / 2,
                        baseZ + offsetZ
                    );
                }
                
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
    
    createLandmarkBuildings() {
        // Calculate the number of blocks that fit in the city
        const blockCount = Math.floor(this.citySize / (this.blockSize + this.roadWidth));
        
        // Place City Hall near the center
        const cityHallX = 0;
        const cityHallZ = 0;
        this.landmarkBuildings.cityHall = this.advancedBuildings.createCityHall(cityHallX, cityHallZ);
        this.landmarkPositions.push({x: cityHallX, z: cityHallZ});
        
        // Place Museum a bit to the east
        const museumX = 2 * (this.blockSize + this.roadWidth);
        const museumZ = -1 * (this.blockSize + this.roadWidth);
        this.landmarkBuildings.museum = this.advancedBuildings.createMuseum(museumX, museumZ);
        this.landmarkPositions.push({x: museumX, z: museumZ});
        
        // Place Train Station to the north
        const stationX = -2 * (this.blockSize + this.roadWidth);
        const stationZ = 3 * (this.blockSize + this.roadWidth);
        this.landmarkBuildings.trainStation = this.advancedBuildings.createTrainStation(stationX, stationZ);
        this.landmarkPositions.push({x: stationX, z: stationZ});
        
        // Place Art Deco Skyscraper in business district
        const artDecoX = 3 * (this.blockSize + this.roadWidth);
        const artDecoZ = 2 * (this.blockSize + this.roadWidth);
        this.landmarkBuildings.artDecoSkyscraper = this.advancedBuildings.createArtDecoSkyscraper(artDecoX, artDecoZ);
        this.landmarkPositions.push({x: artDecoX, z: artDecoZ});
        
        // Place Modern Skyscraper in business district
        const modernX = 2 * (this.blockSize + this.roadWidth);
        const modernZ = 3 * (this.blockSize + this.roadWidth);
        this.landmarkBuildings.modernSkyscraper = this.advancedBuildings.createModernSkyscraper(modernX, modernZ);
        this.landmarkPositions.push({x: modernX, z: modernZ});
    }
    
    updateDayNightCycle(isDaytime) {
        // Update advanced building window lights based on time of day
        this.advancedBuildings.updateWindowLights(isDaytime);
        
        // Mettre à jour les fenêtres des bâtiments standards
        this.updateWindowLights(isDaytime);
    }
    
    // Méthode pour créer une grille de fenêtres sur un bâtiment
    createWindowGrid(
        building,
        buildingWidth, 
        buildingHeight, 
        buildingDepth, 
        rows,
        columns,
        xOffset,
        yOffset,
        zOffset
    ) {
        const windowWidth = (buildingWidth / columns) * 0.6; // Proportion de 60%
        const windowHeight = (buildingHeight / rows) * 0.6; // Proportion de 60%
        const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
        
        // Léger décalage pour éviter le z-fighting
        const offset = 0.05;
        
        // Fonction pour créer les fenêtres sur une face
        const createWindowsOnFace = (isXFace, sign) => {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    // Décider aléatoirement si la fenêtre est allumée ou éteinte
                    const isLit = Math.random() < 0.3;
                    const windowMaterial = isLit ? 
                        this.materials.windowLit : 
                        this.materials.glassWindow;
                    
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    // Calculs de position
                    const colOffset = (col - (columns - 1) / 2) * (buildingWidth / columns);
                    const rowOffset = (row - (rows - 1) / 2) * (buildingHeight / rows);
                    
                    if (isXFace) {
                        // Face avant ou arrière
                        window.position.set(
                            colOffset + xOffset,
                            rowOffset + yOffset,
                            (sign * buildingDepth / 2) + (sign * offset) + zOffset
                        );
                        // Les faces avant/arrière n'ont pas besoin de rotation
                    } else {
                        // Faces latérales
                        window.position.set(
                            (sign * buildingWidth / 2) + (sign * offset) + xOffset,
                            rowOffset + yOffset,
                            colOffset + zOffset
                        );
                        window.rotation.y = Math.PI / 2; // Rotation pour faire face vers l'extérieur
                    }
                    
                    this.scene.add(window);
                    
                    // Tracker les fenêtres éclairées pour les changements jour/nuit
                    if (isLit) {
                        this.windowLights.push({
                            mesh: window,
                            intensity: 0.4 + Math.random() * 0.6  // Intensité aléatoire
                        });
                    }
                }
            }
        };
        
        // Créer des fenêtres sur chaque face
        createWindowsOnFace(true, 1);  // Face avant (Z positif)
        createWindowsOnFace(true, -1); // Face arrière (Z négatif)
        createWindowsOnFace(false, 1); // Face droite (X positif)
        createWindowsOnFace(false, -1); // Face gauche (X négatif)
    }
    
    // Méthode pour mettre à jour les fenêtres selon le cycle jour/nuit
    updateWindowLights(isDaytime) {
        this.windowLights.forEach(windowLight => {
            // Fenêtres allumées la nuit, éteintes le jour
            windowLight.mesh.material.emissiveIntensity = 
                isDaytime ? 0 : windowLight.intensity;
        });
    }
} 