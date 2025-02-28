import * as THREE from 'three';

/**
 * Advanced building generation system that creates more detailed
 * and diverse building types for the city scene.
 */
export class AdvancedBuildings {
    constructor(scene, materials) {
        this.scene = scene;
        this.baseMaterials = materials;
        
        // Create additional materials for building details
        this.createExtendedMaterials();
        
        // Building registry for reference by other systems
        this.buildings = [];
        
        // Window lighting state
        this.windowLights = [];
    }
    
    /**
     * Create additional materials for building details beyond the base materials
     */
    createExtendedMaterials() {
        this.materials = {
            // Base materials passed from City class
            ...this.baseMaterials,
            
            // Additional materials for specific buildings
            glass: new THREE.MeshStandardMaterial({
                color: 0x88CCEE,
                transparent: true,
                opacity: 0.7,
                metalness: 0.9,
                roughness: 0.1
            }),
            
            marblePillars: new THREE.MeshStandardMaterial({
                color: 0xF0F0F0,
                metalness: 0.1,
                roughness: 0.2
            }),
            
            roofTiles: new THREE.MeshStandardMaterial({
                color: 0x883322,
                roughness: 0.8
            }),
            
            modernPanels: new THREE.MeshStandardMaterial({
                color: 0x334455,
                metalness: 0.6,
                roughness: 0.2
            }),
            
            concreteModern: new THREE.MeshStandardMaterial({
                color: 0xCCCCCC,
                roughness: 0.7
            }),
            
            glassWindow: new THREE.MeshStandardMaterial({
                color: 0x88BBEE,
                transparent: true,
                opacity: 0.5,
                metalness: 0.5,
                roughness: 0.1
            }),
            
            windowLit: new THREE.MeshStandardMaterial({
                color: 0xFFEE88,
                emissive: 0xFFEE88,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.9
            }),
            
            stationRoof: new THREE.MeshStandardMaterial({
                color: 0x334455,
                metalness: 0.7,
                roughness: 0.3
            }),
            
            stationDetails: new THREE.MeshStandardMaterial({
                color: 0x88AACC,
                metalness: 0.5,
                roughness: 0.4
            }),
            
            museumWalls: new THREE.MeshStandardMaterial({
                color: 0xEEEEE0,
                roughness: 0.6
            }),
            
            cityHallTrim: new THREE.MeshStandardMaterial({
                color: 0xCCAA66,
                metalness: 0.7,
                roughness: 0.3
            }),
        };
    }
    
    /**
     * Create a cityHall building
     */
    createCityHall(baseX, baseZ) {
        const cityHallGroup = new THREE.Group();
        
        // Main building - neoclassical style
        const mainWidth = 30;
        const mainDepth = 20;
        const mainHeight = 18;
        
        const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
        const mainBuilding = new THREE.Mesh(mainGeometry, this.materials.concreteModern);
        mainBuilding.position.set(0, mainHeight/2, 0);
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        cityHallGroup.add(mainBuilding);
        
        // Create dome on top
        const domeRadius = 7;
        const domeGeometry = new THREE.SphereGeometry(domeRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeometry, this.materials.cityHallTrim);
        dome.position.set(0, mainHeight, 0);
        dome.castShadow = true;
        cityHallGroup.add(dome);
        
        // Create columns in front
        const columnCount = 8;
        const columnRadius = 1;
        const columnHeight = 14;
        const columnSpacing = mainWidth / (columnCount + 1);
        
        for (let i = 0; i < columnCount; i++) {
            const posX = (i + 1) * columnSpacing - mainWidth / 2;
            const columnGeometry = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 16);
            const column = new THREE.Mesh(columnGeometry, this.materials.marblePillars);
            column.position.set(posX, columnHeight / 2, mainDepth / 2 - 1);
            column.castShadow = true;
            cityHallGroup.add(column);
        }
        
        // Create steps leading to entrance
        const stepsWidth = mainWidth - 10;
        const stepsDepth = 8;
        const stepCount = 5;
        const stepHeight = 0.8;
        
        for (let i = 0; i < stepCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(
                stepsWidth, 
                stepHeight, 
                stepsDepth / stepCount
            );
            const step = new THREE.Mesh(stepGeometry, this.materials.marblePillars);
            step.position.set(
                0,
                stepHeight * (i + 0.5),
                mainDepth / 2 + stepsDepth / 2 - (i + 0.5) * (stepsDepth / stepCount)
            );
            step.castShadow = true;
            step.receiveShadow = true;
            cityHallGroup.add(step);
        }
        
        // Create windows
        this.createWindowGrid(
            cityHallGroup, 
            mainWidth, 
            mainHeight, 
            mainDepth, 
            4, // rows
            7, // columns
            0.3, // window proportion of wall
            0, // x offset
            mainHeight / 2, // y offset
            0, // z offset
            true, // front windows
            true, // back windows
            true, // side windows
            true  // random lighting
        );
        
        // Position the entire city hall at the block coordinates
        cityHallGroup.position.set(baseX, 0, baseZ);
        this.scene.add(cityHallGroup);
        
        // Register building
        this.buildings.push({
            type: 'cityHall',
            mesh: cityHallGroup,
            position: new THREE.Vector3(baseX, 0, baseZ),
            dimensions: new THREE.Vector3(mainWidth, mainHeight, mainDepth)
        });
        
        return cityHallGroup;
    }
    
    /**
     * Create a museum building
     */
    createMuseum(baseX, baseZ) {
        const museumGroup = new THREE.Group();
        
        // Main building - modern museum style
        const mainWidth = 35;
        const mainDepth = 25;
        const mainHeight = 15;
        
        const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
        const mainBuilding = new THREE.Mesh(mainGeometry, this.materials.museumWalls);
        mainBuilding.position.set(0, mainHeight/2, 0);
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        museumGroup.add(mainBuilding);
        
        // Create a cantilevered section
        const cantileverWidth = 20;
        const cantileverDepth = 10;
        const cantileverHeight = 8;
        
        const cantileverGeometry = new THREE.BoxGeometry(cantileverWidth, cantileverHeight, cantileverDepth);
        const cantilever = new THREE.Mesh(cantileverGeometry, this.materials.modernPanels);
        cantilever.position.set(-5, mainHeight + cantileverHeight/2, -5);
        cantilever.castShadow = true;
        museumGroup.add(cantilever);
        
        // Glass entrance
        const entranceWidth = 15;
        const entranceDepth = 5;
        const entranceHeight = 10;
        
        const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
        const entrance = new THREE.Mesh(entranceGeometry, this.materials.glass);
        entrance.position.set(0, entranceHeight/2, mainDepth/2 + entranceDepth/2);
        entrance.castShadow = true;
        museumGroup.add(entrance);
        
        // Create scattered windows on main building
        const windowPositions = [
            { x: mainWidth/4, y: mainHeight/2, z: mainDepth/2 + 0.1, width: 5, height: 7 },
            { x: -mainWidth/4, y: mainHeight/2, z: mainDepth/2 + 0.1, width: 5, height: 7 },
            { x: -mainWidth/2 - 0.1, y: mainHeight/2, z: mainDepth/4, width: 7, height: 6, rotateY: Math.PI/2 },
            { x: -mainWidth/2 - 0.1, y: mainHeight/2, z: -mainDepth/4, width: 7, height: 6, rotateY: Math.PI/2 },
            { x: mainWidth/2 + 0.1, y: mainHeight/2, z: 0, width: 10, height: 8, rotateY: Math.PI/2 }
        ];
        
        windowPositions.forEach(pos => {
            const windowGeometry = new THREE.PlaneGeometry(pos.width, pos.height);
            const window = new THREE.Mesh(
                windowGeometry, 
                Math.random() < 0.7 ? this.materials.glassWindow : this.materials.windowLit
            );
            window.position.set(pos.x, pos.y, pos.z);
            if (pos.rotateY) window.rotation.y = pos.rotateY;
            museumGroup.add(window);
            
            // Track lit windows for day/night changes
            if (window.material === this.materials.windowLit) {
                this.windowLights.push({
                    mesh: window,
                    intensity: 0.4 + Math.random() * 0.6  // Random intensity
                });
            }
        });
        
        // Add decorative elements - large sculpture outside
        const sculptureBase = new THREE.CylinderGeometry(3, 3, 1, 16);
        const base = new THREE.Mesh(sculptureBase, this.materials.marblePillars);
        base.position.set(12, 0.5, 10);
        base.castShadow = true;
        base.receiveShadow = true;
        museumGroup.add(base);
        
        // Abstract sculpture
        const sculptureHeight = 7;
        const curvePoints = [];
        for (let i = 0; i < 10; i++) {
            const t = i / 9;
            curvePoints.push(
                new THREE.Vector3(
                    Math.sin(t * Math.PI * 2) * 2,
                    t * sculptureHeight,
                    Math.cos(t * Math.PI * 2) * 2
                )
            );
        }
        
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const sculptureGeometry = new THREE.TubeGeometry(curve, 64, 0.5, 16, false);
        const sculpture = new THREE.Mesh(sculptureGeometry, this.materials.stationDetails);
        sculpture.position.set(12, 1, 10);
        sculpture.castShadow = true;
        museumGroup.add(sculpture);
        
        // Position the entire museum at the block coordinates
        museumGroup.position.set(baseX, 0, baseZ);
        this.scene.add(museumGroup);
        
        // Register building
        this.buildings.push({
            type: 'museum',
            mesh: museumGroup,
            position: new THREE.Vector3(baseX, 0, baseZ),
            dimensions: new THREE.Vector3(mainWidth, mainHeight + cantileverHeight, mainDepth)
        });
        
        return museumGroup;
    }
    
    /**
     * Create a train station building
     */
    createTrainStation(baseX, baseZ) {
        const stationGroup = new THREE.Group();
        
        // Main terminal building
        const terminalWidth = 40;
        const terminalDepth = 20;
        const terminalHeight = 16;
        
        const terminalGeometry = new THREE.BoxGeometry(terminalWidth, terminalHeight, terminalDepth);
        const terminal = new THREE.Mesh(terminalGeometry, this.materials.building[3]); // Use modern office material
        terminal.position.set(0, terminalHeight/2, 0);
        terminal.castShadow = true;
        terminal.receiveShadow = true;
        stationGroup.add(terminal);
        
        // Large arched glass front
        const archHeight = 12;
        const archWidth = 25;
        
        // Create arched entrance using shape and extrusion
        const archShape = new THREE.Shape();
        archShape.moveTo(-archWidth/2, 0);
        archShape.lineTo(-archWidth/2, archHeight * 0.7);
        archShape.quadraticCurveTo(0, archHeight * 1.3, archWidth/2, archHeight * 0.7);
        archShape.lineTo(archWidth/2, 0);
        archShape.lineTo(-archWidth/2, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: 1,
            bevelEnabled: false
        };
        
        const archGeometry = new THREE.ExtrudeGeometry(archShape, extrudeSettings);
        const arch = new THREE.Mesh(archGeometry, this.materials.glass);
        arch.position.set(0, 0, terminalDepth/2 + 0.1);
        arch.castShadow = true;
        stationGroup.add(arch);
        
        // Create train platforms with canopies
        const platformCount = 3;
        const platformWidth = 6;
        const platformDepth = 50;
        const platformHeight = 1;
        const platformSpacing = 10;
        
        for (let i = 0; i < platformCount; i++) {
            // Platform
            const platformGeometry = new THREE.BoxGeometry(platformWidth, platformHeight, platformDepth);
            const platform = new THREE.Mesh(platformGeometry, this.materials.concreteModern);
            platform.position.set(
                (i - (platformCount-1)/2) * platformSpacing,
                platformHeight/2,
                -terminalDepth/2 - platformDepth/2
            );
            platform.receiveShadow = true;
            stationGroup.add(platform);
            
            // Platform canopy - lower height towards back for drainage
            const canopyGeometry = new THREE.BoxGeometry(
                platformWidth + 2,
                0.5,
                platformDepth - 5
            );
            const canopy = new THREE.Mesh(canopyGeometry, this.materials.stationRoof);
            canopy.position.set(
                (i - (platformCount-1)/2) * platformSpacing,
                7,
                -terminalDepth/2 - platformDepth/2 + 2.5
            );
            
            // Tilt the canopy
            canopy.rotation.x = Math.PI * 0.02;
            canopy.castShadow = true;
            stationGroup.add(canopy);
            
            // Canopy supports
            const supportsPerSide = 5;
            const supportSpacing = (platformDepth - 5) / (supportsPerSide - 1);
            
            for (let j = 0; j < supportsPerSide; j++) {
                // Left and right supports
                [-1, 1].forEach(side => {
                    const supportGeometry = new THREE.CylinderGeometry(0.2, 0.2, 7, 8);
                    const support = new THREE.Mesh(supportGeometry, this.materials.stationDetails);
                    support.position.set(
                        (i - (platformCount-1)/2) * platformSpacing + side * (platformWidth/2 + 0.5),
                        3.5,
                        -terminalDepth/2 - platformDepth + 5 + j * supportSpacing
                    );
                    support.castShadow = true;
                    stationGroup.add(support);
                });
            }
            
            // Add platform numbers
            const textShape = new THREE.Shape();
            // Simple shape for number (simplified)
            textShape.moveTo(-1, -1);
            textShape.lineTo(1, -1);
            textShape.lineTo(1, 1);
            textShape.lineTo(-1, 1);
            textShape.lineTo(-1, -1);
            
            const textGeometry = new THREE.ExtrudeGeometry(textShape, {
                depth: 0.2,
                bevelEnabled: false
            });
            
            const text = new THREE.Mesh(textGeometry, this.materials.stationDetails);
            text.position.set(
                (i - (platformCount-1)/2) * platformSpacing,
                3,
                -terminalDepth/2 - 10
            );
            text.rotation.x = -Math.PI / 2;
            text.castShadow = true;
            stationGroup.add(text);
        }
        
        // Add a clock tower
        const towerBaseWidth = 6;
        const towerBaseGeometry = new THREE.BoxGeometry(towerBaseWidth, 25, towerBaseWidth);
        const towerBase = new THREE.Mesh(towerBaseGeometry, this.materials.building[3]);
        towerBase.position.set(terminalWidth/2 - towerBaseWidth/2, 25/2, 0);
        towerBase.castShadow = true;
        stationGroup.add(towerBase);
        
        // Clock faces
        const clockFaces = 4;
        const clockRadius = 2.5;
        
        for (let i = 0; i < clockFaces; i++) {
            const angle = (i * Math.PI / 2);
            const clockGeometry = new THREE.CircleGeometry(clockRadius, 32);
            const clock = new THREE.Mesh(clockGeometry, new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                roughness: 0.3
            }));
            
            clock.position.set(
                terminalWidth/2 - towerBaseWidth/2 + Math.sin(angle) * (towerBaseWidth/2 + 0.1),
                20,
                Math.cos(angle) * (towerBaseWidth/2 + 0.1)
            );
            clock.rotation.y = Math.PI - angle;
            stationGroup.add(clock);
            
            // Hour and minute hands (simplified)
            const hourHandGeometry = new THREE.BoxGeometry(0.2, 0.2, 1.2);
            const hourHand = new THREE.Mesh(hourHandGeometry, new THREE.MeshStandardMaterial({
                color: 0x000000
            }));
            hourHand.position.copy(clock.position);
            hourHand.position.y += 0.1;
            hourHand.rotation.copy(clock.rotation);
            hourHand.rotation.z = Math.random() * Math.PI * 2; // Random time
            stationGroup.add(hourHand);
            
            const minuteHandGeometry = new THREE.BoxGeometry(0.1, 0.1, 1.8);
            const minuteHand = new THREE.Mesh(minuteHandGeometry, new THREE.MeshStandardMaterial({
                color: 0x000000
            }));
            minuteHand.position.copy(clock.position);
            minuteHand.position.y += 0.2;
            minuteHand.rotation.copy(clock.rotation);
            minuteHand.rotation.z = Math.random() * Math.PI * 2; // Random time
            stationGroup.add(minuteHand);
        }
        
        // Windows for the terminal
        this.createWindowGrid(
            stationGroup, 
            terminalWidth, 
            terminalHeight, 
            terminalDepth, 
            2, // rows
            8, // columns
            0.4, // window proportion of wall
            0, // x offset
            terminalHeight / 2, // y offset
            0, // z offset
            false, // front windows (no, we have the arch)
            true, // back windows
            true, // side windows
            true  // random lighting
        );
        
        // Position the entire station at the block coordinates
        stationGroup.position.set(baseX, 0, baseZ);
        this.scene.add(stationGroup);
        
        // Register building
        this.buildings.push({
            type: 'trainStation',
            mesh: stationGroup,
            position: new THREE.Vector3(baseX, 0, baseZ),
            dimensions: new THREE.Vector3(terminalWidth, terminalHeight, terminalDepth + platformDepth)
        });
        
        return stationGroup;
    }
    
    /**
     * Create an art deco skyscraper
     */
    createArtDecoSkyscraper(baseX, baseZ) {
        const skyscraperGroup = new THREE.Group();
        
        // Base properties
        const baseWidth = 26;
        const baseDepth = 26;
        const totalHeight = 100 + Math.random() * 40;
        
        // Create a stepped design characteristic of Art Deco
        const sections = 5;
        let currentHeight = 0;
        
        for (let i = 0; i < sections; i++) {
            const sectionProportion = 1 - (i / sections) * 0.6; // Each section gets smaller
            const sectionWidth = baseWidth * sectionProportion;
            const sectionDepth = baseDepth * sectionProportion;
            const sectionHeight = totalHeight / (sections - i * 0.4);
            
            const sectionGeometry = new THREE.BoxGeometry(
                sectionWidth, 
                sectionHeight, 
                sectionDepth
            );
            
            // Alternate materials for visual interest
            const materialIndex = i % 2 === 0 ? 0 : 3;
            const section = new THREE.Mesh(sectionGeometry, this.materials.building[materialIndex]);
            section.position.set(0, currentHeight + sectionHeight/2, 0);
            section.castShadow = true;
            section.receiveShadow = true;
            skyscraperGroup.add(section);
            
            // Add decorative elements at each setback
            if (i > 0) {
                // Art deco trim around the setback
                const trimGeometry = new THREE.BoxGeometry(
                    sectionWidth + 1,
                    0.8,
                    sectionDepth + 1
                );
                const trim = new THREE.Mesh(trimGeometry, this.materials.cityHallTrim);
                trim.position.set(0, currentHeight - 0.4, 0);
                trim.castShadow = true;
                skyscraperGroup.add(trim);
            }
            
            // Add windows to this section
            this.createWindowGrid(
                skyscraperGroup,
                sectionWidth,
                sectionHeight,
                sectionDepth,
                Math.floor(sectionHeight / 4), // rows based on height
                Math.ceil(sectionWidth / 4),   // columns based on width
                0.5,  // window proportion
                0,    // x offset
                currentHeight + sectionHeight/2, // y offset
                0,    // z offset
                true, // front windows
                true, // back windows
                true, // side windows
                true  // random lighting
            );
            
            currentHeight += sectionHeight;
        }
        
        // Add spire on top
        const spireHeight = totalHeight * 0.15;
        const spireBaseWidth = baseWidth * 0.15;
        
        const spireGeometry = new THREE.CylinderGeometry(
            0, // top radius (pointed)
            spireBaseWidth, // bottom radius
            spireHeight,
            8 // segments
        );
        const spire = new THREE.Mesh(spireGeometry, this.materials.cityHallTrim);
        spire.position.set(0, currentHeight + spireHeight/2, 0);
        spire.castShadow = true;
        skyscraperGroup.add(spire);
        
        // Position the entire skyscraper at the block coordinates
        skyscraperGroup.position.set(baseX, 0, baseZ);
        this.scene.add(skyscraperGroup);
        
        // Register building
        this.buildings.push({
            type: 'artDecoSkyscraper',
            mesh: skyscraperGroup,
            position: new THREE.Vector3(baseX, 0, baseZ),
            dimensions: new THREE.Vector3(baseWidth, totalHeight + spireHeight, baseDepth)
        });
        
        return skyscraperGroup;
    }
    
    /**
     * Create a modern glass skyscraper
     */
    createModernSkyscraper(baseX, baseZ) {
        const skyscraperGroup = new THREE.Group();
        
        // Base properties
        const baseWidth = 25;
        const baseDepth = 25;
        const totalHeight = 120 + Math.random() * 60;
        
        // Slightly twist the building for modern look
        const twistSegments = 20;
        const maxTwistAngle = Math.PI / 8; // 22.5 degrees
        
        for (let i = 0; i < twistSegments; i++) {
            const segmentHeight = totalHeight / twistSegments;
            const twistAngle = (i / twistSegments) * maxTwistAngle;
            
            // Create twisted segment
            const segmentGeometry = new THREE.BoxGeometry(baseWidth, segmentHeight, baseDepth);
            const segment = new THREE.Mesh(segmentGeometry, this.materials.glass);
            segment.position.set(0, i * segmentHeight + segmentHeight/2, 0);
            segment.rotation.y = twistAngle;
            segment.castShadow = true;
            skyscraperGroup.add(segment);
            
            // Add horizontal dividers between floors
            if (i > 0 && i < twistSegments) {
                const dividerGeometry = new THREE.BoxGeometry(baseWidth + 1, 0.5, baseDepth + 1);
                const divider = new THREE.Mesh(dividerGeometry, this.materials.modernPanels);
                divider.position.set(0, i * segmentHeight, 0);
                divider.rotation.y = twistAngle;
                divider.castShadow = true;
                skyscraperGroup.add(divider);
            }
        }
        
        // Add a helipad to the top
        const helipadRadius = 8;
        const helipadGeometry = new THREE.CylinderGeometry(helipadRadius, helipadRadius, 1, 32);
        const helipad = new THREE.Mesh(helipadGeometry, this.materials.road);
        helipad.position.set(0, totalHeight + 0.5, 0);
        helipad.receiveShadow = true;
        skyscraperGroup.add(helipad);
        
        // Add helipad markings
        const markingGeometry = new THREE.PlaneGeometry(helipadRadius * 1.2, helipadRadius * 1.2);
        const markingMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(0, totalHeight + 1.01, 0);
        skyscraperGroup.add(marking);
        
        // Add antennas and technical equipment on top
        for (let i = 0; i < 3; i++) {
            const antennaHeight = 5 + Math.random() * 10;
            const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, antennaHeight, 8);
            const antenna = new THREE.Mesh(antennaGeometry, this.materials.lamp);
            
            // Random position on the roof, but not on the helipad
            const distance = (helipadRadius + 2) * Math.sqrt(Math.random());
            const angle = Math.random() * Math.PI * 2;
            antenna.position.set(
                Math.cos(angle) * distance,
                totalHeight + antennaHeight/2,
                Math.sin(angle) * distance
            );
            antenna.castShadow = true;
            skyscraperGroup.add(antenna);
            
            // Add blinking aircraft warning light
            const warningLightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const warningLightMaterial = new THREE.MeshStandardMaterial({
                color: 0xFF0000,
                emissive: 0xFF0000,
                emissiveIntensity: 1
            });
            const warningLight = new THREE.Mesh(warningLightGeometry, warningLightMaterial);
            warningLight.position.set(
                Math.cos(angle) * distance,
                totalHeight + antennaHeight + 0.3,
                Math.sin(angle) * distance
            );
            skyscraperGroup.add(warningLight);
            
            // Track for blinking effect
            this.windowLights.push({
                mesh: warningLight,
                isBlinking: true,
                intensity: 1,
                type: 'warning'
            });
        }
        
        // Position the entire skyscraper at the block coordinates
        skyscraperGroup.position.set(baseX, 0, baseZ);
        this.scene.add(skyscraperGroup);
        
        // Register building
        this.buildings.push({
            type: 'modernSkyscraper',
            mesh: skyscraperGroup,
            position: new THREE.Vector3(baseX, 0, baseZ),
            dimensions: new THREE.Vector3(baseWidth, totalHeight, baseDepth)
        });
        
        return skyscraperGroup;
    }
    
    /**
     * Helper method to create a grid of windows on a building
     */
    createWindowGrid(
        parentGroup, 
        buildingWidth, 
        buildingHeight, 
        buildingDepth, 
        rows,
        columns,
        windowProportion,
        xOffset,
        yOffset,
        zOffset,
        frontWindows = true,
        backWindows = true,
        sideWindows = true,
        randomLighting = false
    ) {
        const windowWidth = (buildingWidth / columns) * windowProportion;
        const windowHeight = (buildingHeight / rows) * windowProportion;
        const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
        
        // Slight offset to prevent z-fighting
        const offset = 0.1;
        
        // Function to create windows on one face
        const createWindowsOnFace = (isXFace, sign) => {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    // Randomly decide if window is lit or dark
                    const isLit = randomLighting && Math.random() < 0.4;
                    const windowMaterial = isLit ? 
                        this.materials.windowLit : 
                        this.materials.glassWindow;
                    
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    // Position calculations
                    const colOffset = (col - (columns - 1) / 2) * (buildingWidth / columns);
                    const rowOffset = (row - (rows - 1) / 2) * (buildingHeight / rows);
                    
                    if (isXFace) {
                        // Front or back face
                        window.position.set(
                            colOffset + xOffset,
                            rowOffset + yOffset,
                            (sign * buildingDepth / 2) + (sign * offset) + zOffset
                        );
                        // Front/back faces don't need rotation
                    } else {
                        // Side faces
                        window.position.set(
                            (sign * buildingWidth / 2) + (sign * offset) + xOffset,
                            rowOffset + yOffset,
                            colOffset + zOffset
                        );
                        window.rotation.y = Math.PI / 2; // Rotate to face outward
                    }
                    
                    parentGroup.add(window);
                    
                    // Track lit windows for day/night changes
                    if (isLit) {
                        this.windowLights.push({
                            mesh: window,
                            intensity: 0.4 + Math.random() * 0.6  // Random intensity
                        });
                    }
                }
            }
        };
        
        // Create windows on each face as requested
        if (frontWindows) createWindowsOnFace(true, 1);  // Front face (positive Z)
        if (backWindows) createWindowsOnFace(true, -1);  // Back face (negative Z)
        if (sideWindows) {
            createWindowsOnFace(false, 1);  // Right face (positive X)
            createWindowsOnFace(false, -1); // Left face (negative X)
        }
    }
    
    /**
     * Update window lights based on time of day
     */
    updateWindowLights(isDaytime) {
        this.windowLights.forEach(windowLight => {
            if (windowLight.isBlinking) {
                // Handle blinking lights (like aircraft warning lights)
                windowLight.mesh.material.emissiveIntensity = 
                    Math.sin(Date.now() / 500) > 0 ? windowLight.intensity : 0;
            } else {
                // Regular windows - bright at night, off during day
                windowLight.mesh.material.emissiveIntensity = 
                    isDaytime ? 0 : windowLight.intensity;
            }
        });
    }
} 