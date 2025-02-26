import * as THREE from 'three';

export class Pedestrians {
    constructor(scene, sidewalks, crosswalks) {
        this.scene = scene;
        this.sidewalks = sidewalks;
        this.crosswalks = crosswalks;
        this.pedestrians = [];
        this.pedestrianCount = 100; // Number of pedestrians to create
        this.walkSpeed = 3; // Units per second
        
        // Colors for pedestrians
        this.pedestrianColors = [
            0x8B4513, // Brown
            0xFFD700, // Gold
            0x4682B4, // Steel Blue
            0x00BFFF, // Deep Sky Blue
            0xFF6347, // Tomato
            0x32CD32, // Lime Green
            0x9370DB, // Medium Purple
            0xF08080, // Light Coral
        ];
    }
    
    async initialize() {
        this.createPedestrians();
        return Promise.resolve();
    }
    
    createPedestrians() {
        // Create pedestrians and place them on sidewalks
        for (let i = 0; i < this.pedestrianCount; i++) {
            // Choose a random sidewalk to place the pedestrian
            if (this.sidewalks.length === 0) return;
            
            const sidewalkIndex = Math.floor(Math.random() * this.sidewalks.length);
            const sidewalk = this.sidewalks[sidewalkIndex];
            
            // Create a random pedestrian
            const gender = Math.random() < 0.5 ? 'male' : 'female';
            const pedestrian = this.createPedestrian(gender, sidewalk);
            this.pedestrians.push(pedestrian);
        }
    }
    
    createPedestrian(gender, sidewalk) {
        // Choose a random color for the pedestrian
        const colorIndex = Math.floor(Math.random() * this.pedestrianColors.length);
        const clothingColor = this.pedestrianColors[colorIndex];
        
        // Create pedestrian mesh
        const pedestrianMesh = this.createPedestrianMesh(gender, clothingColor);
        
        // Calculate random position on the sidewalk
        const position = this.calculateRandomPositionOnSidewalk(sidewalk);
        pedestrianMesh.position.copy(position);
        
        // Random rotation
        pedestrianMesh.rotation.y = Math.random() * Math.PI * 2;
        
        this.scene.add(pedestrianMesh);
        
        // Set up pedestrian data object
        const pedestrian = {
            mesh: pedestrianMesh,
            currentSidewalk: sidewalk,
            targetSidewalk: null,
            currentCrosswalk: null,
            position: new THREE.Vector3().copy(position),
            targetPosition: null,
            speed: this.walkSpeed * (0.7 + Math.random() * 0.6), // Random speed variation
            gender: gender,
            state: 'idle', // idle, walking, waiting, crossing
            waitTime: 0,
            path: [],
        };
        
        // Start with idle behavior
        this.setIdleBehavior(pedestrian);
        
        return pedestrian;
    }
    
    createPedestrianMesh(gender, clothingColor) {
        // Create a simple humanoid figure using primitive shapes
        const group = new THREE.Group();
        
        // Height variation based on gender
        const height = gender === 'male' ? 1.8 : 1.65;
        const scale = height / 1.8; // Scale all parts proportionally
        
        // Skin tone - vary slightly for diversity
        const skinTone = 0xEFCFAF + Math.floor(Math.random() * 0x101010);
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: skinTone,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Clothing material
        const clothingMaterial = new THREE.MeshStandardMaterial({
            color: clothingColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.15 * scale, 16, 16);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = height - 0.15 * scale;
        head.castShadow = true;
        group.add(head);
        
        // Torso
        const torsoGeometry = new THREE.CylinderGeometry(
            0.15 * scale, 0.2 * scale, 0.6 * scale, 8
        );
        const torso = new THREE.Mesh(torsoGeometry, clothingMaterial);
        torso.position.y = height - 0.45 * scale;
        torso.castShadow = true;
        group.add(torso);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(
            0.07 * scale, 0.05 * scale, 0.8 * scale, 8
        );
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, clothingMaterial);
        leftLeg.position.set(0.08 * scale, height - 0.85 * scale - 0.4 * scale, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, clothingMaterial);
        rightLeg.position.set(-0.08 * scale, height - 0.85 * scale - 0.4 * scale, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(
            0.05 * scale, 0.05 * scale, 0.6 * scale, 8
        );
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(0.22 * scale, height - 0.45 * scale, 0);
        leftArm.rotation.z = -0.15;
        leftArm.castShadow = true;
        group.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
        rightArm.position.set(-0.22 * scale, height - 0.45 * scale, 0);
        rightArm.rotation.z = 0.15;
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Position the group so bottom of feet is at y=0
        group.position.y = 0;
        
        return group;
    }
    
    calculateRandomPositionOnSidewalk(sidewalk) {
        // Calculate a position somewhere on the sidewalk perimeter
        const perimeter = Math.random();
        let x, z;
        
        // For safety, keep pedestrians slightly inside the sidewalk bounds
        const margin = 1;
        
        if (perimeter < 0.25) {
            // Top edge
            x = sidewalk.x - sidewalk.width / 2 + margin + Math.random() * (sidewalk.width - margin * 2);
            z = sidewalk.z - sidewalk.depth / 2 + margin;
        } else if (perimeter < 0.5) {
            // Right edge
            x = sidewalk.x + sidewalk.width / 2 - margin;
            z = sidewalk.z - sidewalk.depth / 2 + margin + Math.random() * (sidewalk.depth - margin * 2);
        } else if (perimeter < 0.75) {
            // Bottom edge
            x = sidewalk.x - sidewalk.width / 2 + margin + Math.random() * (sidewalk.width - margin * 2);
            z = sidewalk.z + sidewalk.depth / 2 - margin;
        } else {
            // Left edge
            x = sidewalk.x - sidewalk.width / 2 + margin;
            z = sidewalk.z - sidewalk.depth / 2 + margin + Math.random() * (sidewalk.depth - margin * 2);
        }
        
        return new THREE.Vector3(x, 0, z);
    }
    
    setIdleBehavior(pedestrian) {
        pedestrian.state = 'idle';
        pedestrian.waitTime = 1 + Math.random() * 4; // Wait 1-5 seconds
    }
    
    setWalkingBehavior(pedestrian) {
        // Set pedestrian to walk around the current sidewalk
        pedestrian.state = 'walking';
        
        // Choose a random position on the sidewalk to walk to
        const targetPosition = this.calculateRandomPositionOnSidewalk(pedestrian.currentSidewalk);
        pedestrian.targetPosition = targetPosition;
        
        // Calculate direction to target
        const direction = new THREE.Vector3().subVectors(targetPosition, pedestrian.position).normalize();
        
        // Set rotation to face target
        pedestrian.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }
    
    setCrossingBehavior(pedestrian) {
        // Find a nearby crosswalk
        const nearestCrosswalk = this.findNearestCrosswalk(pedestrian.position);
        
        if (!nearestCrosswalk) {
            // No crosswalk nearby, continue walking on sidewalk
            this.setWalkingBehavior(pedestrian);
            return;
        }
        
        // Set pedestrian to cross the street
        pedestrian.state = 'crossing';
        pedestrian.currentCrosswalk = nearestCrosswalk;
        
        // Find opposite sidewalk to cross to
        const targetSidewalk = this.findOppositeSidewalk(pedestrian.currentSidewalk, nearestCrosswalk);
        
        if (!targetSidewalk) {
            // No target sidewalk found, continue walking on current sidewalk
            this.setWalkingBehavior(pedestrian);
            return;
        }
        
        pedestrian.targetSidewalk = targetSidewalk;
        
        // Calculate path across the crosswalk
        const crosswalkStart = {
            x: nearestCrosswalk.x - (nearestCrosswalk.direction === 'east-west' ? 0 : nearestCrosswalk.width / 2),
            z: nearestCrosswalk.z - (nearestCrosswalk.direction === 'north-south' ? 0 : nearestCrosswalk.depth / 2)
        };
        
        const crosswalkEnd = {
            x: nearestCrosswalk.x + (nearestCrosswalk.direction === 'east-west' ? 0 : nearestCrosswalk.width / 2),
            z: nearestCrosswalk.z + (nearestCrosswalk.direction === 'north-south' ? 0 : nearestCrosswalk.depth / 2)
        };
        
        // Set up the path: first to crosswalk, then across, then to a position on the target sidewalk
        pedestrian.path = [
            new THREE.Vector3(crosswalkStart.x, 0, crosswalkStart.z),
            new THREE.Vector3(crosswalkEnd.x, 0, crosswalkEnd.z),
            this.calculateRandomPositionOnSidewalk(targetSidewalk)
        ];
        
        // Set initial target as first point in path
        pedestrian.targetPosition = pedestrian.path[0];
        
        // Calculate direction to target
        const direction = new THREE.Vector3().subVectors(pedestrian.targetPosition, pedestrian.position).normalize();
        
        // Set rotation to face target
        pedestrian.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }
    
    findNearestCrosswalk(position) {
        if (this.crosswalks.length === 0) return null;
        
        let nearestCrosswalk = null;
        let minDistance = Number.MAX_VALUE;
        
        this.crosswalks.forEach(crosswalk => {
            const distance = new THREE.Vector3(crosswalk.x, 0, crosswalk.z).distanceTo(position);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestCrosswalk = crosswalk;
            }
        });
        
        // Only return crosswalk if it's reasonably close
        return minDistance < 30 ? nearestCrosswalk : null;
    }
    
    findOppositeSidewalk(currentSidewalk, crosswalk) {
        if (this.sidewalks.length <= 1) return null;
        
        // Find a sidewalk on the opposite side of the crosswalk
        const candidateSidewalks = this.sidewalks.filter(sidewalk => {
            // Don't return the current sidewalk
            if (sidewalk === currentSidewalk) return false;
            
            // Check if the sidewalk is on the opposite side of the crosswalk
            const dx = Math.abs(sidewalk.x - currentSidewalk.x);
            const dz = Math.abs(sidewalk.z - currentSidewalk.z);
            
            if (crosswalk.direction === 'east-west') {
                // For east-west crosswalks, look for sidewalks with similar x but different z
                return dx < 30 && dz > 5 && dz < 100;
            } else {
                // For north-south crosswalks, look for sidewalks with similar z but different x
                return dz < 30 && dx > 5 && dx < 100;
            }
        });
        
        if (candidateSidewalks.length === 0) return null;
        
        // Choose a random candidate
        const randomIndex = Math.floor(Math.random() * candidateSidewalks.length);
        return candidateSidewalks[randomIndex];
    }
    
    update(delta) {
        // Update all pedestrians
        this.pedestrians.forEach(pedestrian => {
            this.updatePedestrian(pedestrian, delta);
        });
    }
    
    updatePedestrian(pedestrian, delta) {
        switch (pedestrian.state) {
            case 'idle':
                this.updateIdlePedestrian(pedestrian, delta);
                break;
            case 'walking':
                this.updateWalkingPedestrian(pedestrian, delta);
                break;
            case 'crossing':
                this.updateCrossingPedestrian(pedestrian, delta);
                break;
            case 'waiting':
                this.updateWaitingPedestrian(pedestrian, delta);
                break;
        }
    }
    
    updateIdlePedestrian(pedestrian, delta) {
        // Count down wait time
        pedestrian.waitTime -= delta;
        
        if (pedestrian.waitTime <= 0) {
            // After waiting, either walk around or cross the street
            if (Math.random() < 0.8) {
                this.setWalkingBehavior(pedestrian);
            } else {
                this.setCrossingBehavior(pedestrian);
            }
        }
    }
    
    updateWalkingPedestrian(pedestrian, delta) {
        // Move towards target position
        const direction = new THREE.Vector3().subVectors(pedestrian.targetPosition, pedestrian.position).normalize();
        const distanceToMove = pedestrian.speed * delta;
        const distanceToTarget = pedestrian.position.distanceTo(pedestrian.targetPosition);
        
        if (distanceToMove >= distanceToTarget) {
            // Reached the target, set to idle
            pedestrian.position.copy(pedestrian.targetPosition);
            this.setIdleBehavior(pedestrian);
        } else {
            // Move towards target
            pedestrian.position.add(direction.multiplyScalar(distanceToMove));
            
            // Animate legs by rotating the mesh slightly
            const walkCycle = (Date.now() % 1000) / 1000;
            const wobble = Math.sin(walkCycle * Math.PI * 2) * 0.05;
            pedestrian.mesh.rotation.x = wobble;
        }
        
        // Update mesh position
        pedestrian.mesh.position.copy(pedestrian.position);
    }
    
    updateCrossingPedestrian(pedestrian, delta) {
        // Move along the path
        if (!pedestrian.targetPosition || pedestrian.path.length === 0) {
            // Something went wrong, reset to idle
            this.setIdleBehavior(pedestrian);
            return;
        }
        
        // Move towards current target in path
        const direction = new THREE.Vector3().subVectors(pedestrian.targetPosition, pedestrian.position).normalize();
        const distanceToMove = pedestrian.speed * delta;
        const distanceToTarget = pedestrian.position.distanceTo(pedestrian.targetPosition);
        
        if (distanceToMove >= distanceToTarget) {
            // Reached current target in path
            pedestrian.position.copy(pedestrian.targetPosition);
            
            // Move to next point in path or finish crossing
            pedestrian.path.shift();
            
            if (pedestrian.path.length === 0) {
                // Reached the end of the path, switch to new sidewalk
                pedestrian.currentSidewalk = pedestrian.targetSidewalk;
                pedestrian.targetSidewalk = null;
                pedestrian.currentCrosswalk = null;
                this.setIdleBehavior(pedestrian);
            } else {
                // Move to next point in path
                pedestrian.targetPosition = pedestrian.path[0];
                
                // Update direction and rotation
                const newDirection = new THREE.Vector3().subVectors(pedestrian.targetPosition, pedestrian.position).normalize();
                pedestrian.mesh.rotation.y = Math.atan2(newDirection.x, newDirection.z);
            }
        } else {
            // Move towards target
            pedestrian.position.add(direction.multiplyScalar(distanceToMove));
            
            // Animate legs by rotating the mesh slightly
            const walkCycle = (Date.now() % 1000) / 1000;
            const wobble = Math.sin(walkCycle * Math.PI * 2) * 0.05;
            pedestrian.mesh.rotation.x = wobble;
        }
        
        // Update mesh position
        pedestrian.mesh.position.copy(pedestrian.position);
    }
    
    updateWaitingPedestrian(pedestrian, delta) {
        // Count down wait time
        pedestrian.waitTime -= delta;
        
        if (pedestrian.waitTime <= 0) {
            // After waiting, continue crossing
            pedestrian.state = 'crossing';
        }
    }
} 