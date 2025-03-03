import * as THREE from 'three';

export class LevelOfDetail {
    constructor(scene, city, camera) {
        this.scene = scene;
        this.city = city;
        this.camera = camera;
        
        // Parameters for LOD system
        this.viewDistance = 600; // Max distance to render buildings (in units)
        this.blockRegistryDistance = 1200; // Distance to keep block info in registry
        this.updateFrequency = 0.5; // How often to check visibility (in seconds)
        this.updateTimer = 0;
        
        // Track all blocks and their buildings
        this.blockRegistry = new Map(); // Map of blockKey -> blockInfo
        this.activeBlocks = new Set(); // Set of blockKeys that are currently active
        
        // Stats for debugging
        this.stats = {
            totalBuildings: 0,
            activeBuildings: 0,
            totalBlocks: 0,
            activeBlocks: 0
        };
    }
    
    // Register a city block (called when city is initialized)
    registerBlock(blockX, blockZ, createBuildingsFn) {
        const blockKey = `${blockX},${blockZ}`;
        
        if (!this.blockRegistry.has(blockKey)) {
            this.blockRegistry.set(blockKey, {
                x: blockX,
                z: blockZ,
                createBuildingsFn: createBuildingsFn,
                buildings: [],
                isActive: false,
                baseX: blockX * (this.city.blockSize + this.city.roadWidth),
                baseZ: blockZ * (this.city.blockSize + this.city.roadWidth)
            });
            
            this.stats.totalBlocks++;
        }
        
        return blockKey;
    }
    
    // Activate a block by creating its buildings
    activateBlock(blockKey) {
        const block = this.blockRegistry.get(blockKey);
        
        if (block && !block.isActive) {
            // Call the function to create buildings on this block
            block.buildings = block.createBuildingsFn(block.x, block.z);
            block.isActive = true;
            this.activeBlocks.add(blockKey);
            
            if (!block.buildingsCounted) {
                this.stats.totalBuildings += block.buildings.length;
                block.buildingsCounted = true;
            }
            
            this.stats.activeBuildings += block.buildings.length;
            this.stats.activeBlocks++;
        }
    }
    
    // Deactivate a block by removing its buildings
    deactivateBlock(blockKey) {
        const block = this.blockRegistry.get(blockKey);
        
        if (block && block.isActive) {
            // Remove all buildings from the scene
            block.buildings.forEach(building => {
                this.scene.remove(building);
                
                // If the building has children, remove them too
                if (building.children && building.children.length > 0) {
                    building.children.forEach(child => {
                        this.scene.remove(child);
                    });
                }
            });
            
            this.stats.activeBuildings -= block.buildings.length;
            block.buildings = [];
            block.isActive = false;
            this.activeBlocks.delete(blockKey);
            this.stats.activeBlocks--;
        }
    }
    
    // Remove a block completely from registry (for very far away blocks)
    unregisterBlock(blockKey) {
        if (this.blockRegistry.has(blockKey)) {
            const block = this.blockRegistry.get(blockKey);
            
            if (block.isActive) {
                this.deactivateBlock(blockKey);
            }
            
            this.blockRegistry.delete(blockKey);
            this.stats.totalBlocks--;
        }
    }
    
    // Check if a block should be active based on camera distance
    shouldBlockBeActive(block) {
        const cameraPosition = this.camera.position;
        const distanceSquared = 
            Math.pow(block.baseX - cameraPosition.x, 2) + 
            Math.pow(block.baseZ - cameraPosition.z, 2);
        
        return distanceSquared <= Math.pow(this.viewDistance, 2);
    }
    
    // Check if a block should be removed from registry
    shouldBlockBeUnregistered(block) {
        const cameraPosition = this.camera.position;
        const distanceSquared = 
            Math.pow(block.baseX - cameraPosition.x, 2) + 
            Math.pow(block.baseZ - cameraPosition.z, 2);
        
        return distanceSquared > Math.pow(this.blockRegistryDistance, 2);
    }
    
    // Update LOD system (called in animation loop)
    update(deltaTime) {
        this.updateTimer += deltaTime;
        
        // Only update visibility check periodically to improve performance
        if (this.updateTimer >= this.updateFrequency) {
            this.updateTimer = 0;
            this.updateVisibility();
        }
    }
    
    // Check all blocks and update their visibility
    updateVisibility() {
        // Check all registered blocks
        for (const [blockKey, block] of this.blockRegistry.entries()) {
            if (this.shouldBlockBeUnregistered(block)) {
                // Block is too far away, remove it from registry
                this.unregisterBlock(blockKey);
            } else if (this.shouldBlockBeActive(block) && !block.isActive) {
                // Block should be active but isn't
                this.activateBlock(blockKey);
            } else if (!this.shouldBlockBeActive(block) && block.isActive) {
                // Block should not be active but is
                this.deactivateBlock(blockKey);
            }
        }
    }
    
    // Debug info
    debugStats() {
        console.log(`
LOD Stats:
- Total blocks registered: ${this.stats.totalBlocks}
- Active blocks: ${this.stats.activeBlocks} (${Math.round(this.stats.activeBlocks / this.stats.totalBlocks * 100)}%)
- Total buildings: ${this.stats.totalBuildings}
- Active buildings: ${this.stats.activeBuildings} (${Math.round(this.stats.activeBuildings / this.stats.totalBuildings * 100)}%)
- View distance: ${this.viewDistance} units
        `);
    }
} 