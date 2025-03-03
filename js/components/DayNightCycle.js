import * as THREE from 'three';

export class DayNightCycle {
    constructor(scene, city) {
        this.scene = scene;
        this.city = city; // Store reference to the city for controlling building lights
        this.time = 12; // Start at noon (24-hour format)
        
        // Create hemisphere light (sky and ground)
        this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.5);
        this.scene.add(this.hemisphereLight);
        
        // Create directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        
        // Configure shadow properties
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 1500;
        
        // Adjust shadow camera size to fit the entire city
        const d = 600;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        
        this.scene.add(this.sunLight);
        
        // Create ambient light (for night time)
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(this.ambientLight);
        
        // Create moon light
        this.moonLight = new THREE.DirectionalLight(0xA0C0FF, 0.3);
        this.moonLight.position.set(-50, 100, -50);
        this.scene.add(this.moonLight);
        
        // Street lamps group - will be filled by the City class
        this.streetLamps = [];
        
        // Create sky
        this.createSky();
        
        // Update lighting based on starting time
        this.updateLighting();
        
        // Add debug flag
        this.debugMode = true;
        
        // Add automatic time progression
        this.timeProgressionSpeed = 0.1; // Controls how fast time passes
        this.automaticProgression = false; // Disabled by default
    }
    
    createSky() {
        // Create sky dome using a large sphere with material facing inward
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
        this.skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB, // Sky blue
            side: THREE.BackSide, // Render inside of sphere
        });
        this.sky = new THREE.Mesh(skyGeometry, this.skyMaterial);
        this.scene.add(this.sky);
        
        // Create a sun sphere
        const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF80 });
        this.sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sunSphere);
        
        // Create a moon sphere
        const moonGeometry = new THREE.SphereGeometry(15, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xF0F0FF });
        this.moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
        this.scene.add(this.moonSphere);
        
        // Create stars (initially invisible)
        this.createStars();
    }
    
    createStars() {
        // Create stars using particles
        const starCount = 1000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        
        // Randomly position stars around the sky sphere
        for (let i = 0; i < starCount; i++) {
            const radius = 950; // Slightly inside the sky sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = radius * Math.cos(phi);
            starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Vary star sizes
            starSizes[i] = 0.5 + Math.random() * 1.5;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        // Star material with point sprite
        const starMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1,
            transparent: true,
            opacity: 0, // Start invisible
            sizeAttenuation: false,
            blending: THREE.AdditiveBlending
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }
    
    updateStars(isNight, nightProgress) {
        if (!this.stars) return;
        
        // Stars are only visible at night
        this.stars.material.opacity = isNight ? nightProgress * 0.7 : 0;
    }
    
    setTime(time) {
        this.time = time % 24;
        this.updateLighting();
    }
    
    update(deltaTime) {
        // Auto-advance time if enabled
        if (this.automaticProgression) {
            this.time = (this.time + deltaTime * this.timeProgressionSpeed) % 24;
            this.updateLighting();
        }
        
        // Call debug method if in debug mode
        if (this.debugMode && !this.debugReported) {
            // Only report once
            this.debugLightCount();
            this.debugReported = true;
        }
    }
    
    updateLighting() {
        // Calculate sun position based on time
        // Angle in radians, with noon (12) at the highest point
        const sunAngle = (this.time / 24) * Math.PI * 2 - Math.PI / 2;
        
        // Update sun position
        const sunDistance = 800;
        const sunHeight = Math.sin(sunAngle) * sunDistance;
        const sunHorizontal = Math.cos(sunAngle) * sunDistance;
        
        this.sunLight.position.set(sunHorizontal, sunHeight, 0);
        this.sunSphere.position.copy(this.sunLight.position);
        
        // Update moon position (opposite to sun)
        const moonDistance = 750;
        const moonHeight = Math.sin(sunAngle + Math.PI) * moonDistance;
        const moonHorizontal = Math.cos(sunAngle + Math.PI) * moonDistance;
        
        this.moonLight.position.set(moonHorizontal, moonHeight, 0);
        this.moonSphere.position.copy(this.moonLight.position);
        
        // Sun below horizon = night time
        const isDaytime = sunHeight > 0;
        const sunIntensity = isDaytime ? Math.max(0.1, Math.sin(sunAngle)) : 0;
        const moonIntensity = !isDaytime ? 0.3 : 0;
        
        // Update light intensities
        this.sunLight.intensity = sunIntensity;
        this.moonLight.intensity = moonIntensity;
        
        // Adjust hemisphere light for time of day
        if (isDaytime) {
            this.hemisphereLight.color.set(0x87CEEB); // Sky blue for day
            this.hemisphereLight.groundColor.set(0x444444); // Gray ground for day
            this.hemisphereLight.intensity = 0.5 * sunIntensity;
        } else {
            this.hemisphereLight.color.set(0x0A0E2C); // Dark blue for night sky
            this.hemisphereLight.groundColor.set(0x222222); // Dark ground for night
            this.hemisphereLight.intensity = 0.1;
        }
        
        this.ambientLight.intensity = isDaytime ? 0.2 : 0.1;
        
        // Calculate night progress (needed for stars and sky color)
        const nightProgress = isDaytime ? 0 : Math.abs(sunHeight) / sunDistance; // 0 to 1
        
        // Update sky color based on time
        if (isDaytime) {
            // Day: Blue sky
            const blueIntensity = 0.3 + 0.7 * sunIntensity;
            this.skyMaterial.color.setRGB(0.5 * blueIntensity, 0.7 * blueIntensity, 1.0 * blueIntensity);
        } else {
            // Night: Dark blue/black sky
            const r = 0.05 + (1 - nightProgress) * 0.1;
            const g = 0.05 + (1 - nightProgress) * 0.1;
            const b = 0.15 + (1 - nightProgress) * 0.1;
            this.skyMaterial.color.setRGB(r, g, b);
        }
        
        // Add stars at night
        this.updateStars(!isDaytime, nightProgress);
        
        // Turn on street lamps during night time
        this.updateStreetLamps(!isDaytime);
        
        // Update building window lights if city reference exists
        if (this.city && this.city.updateDayNightCycle) {
            this.city.updateDayNightCycle(isDaytime);
        }
    }
    
    updateStreetLamps(isNight) {
        this.streetLamps.forEach(lamp => {
            if (lamp.light) {
                lamp.light.intensity = isNight ? 1.5 : 0;
            }
            
            // If there's no light (due to our optimization), update the emissive intensity of the bulb instead
            if (lamp.bulb) {
                // Update the emissive intensity of the bulb material
                if (lamp.bulb.material && lamp.bulb.material.emissiveIntensity !== undefined) {
                    lamp.bulb.material.emissiveIntensity = isNight ? 1.0 : 0.1;
                    // Make sure to tell Three.js that the material needs an update
                    lamp.bulb.material.needsUpdate = true;
                }
            }
        });
    }
    
    addStreetLamp(lamp) {
        this.streetLamps.push(lamp);
    }
    
    debugLightCount() {
        if (!this.debugMode) return;
        
        let streetLampLights = 0;
        let environmentLights = 0;
        
        // Count street lamp lights
        this.streetLamps.forEach(lamp => {
            if (lamp.light && (lamp.light.isPointLight || lamp.light.isSpotLight)) {
                streetLampLights++;
            }
        });
        
        // Count environment lights (sun, moon, etc.)
        if (this.sunLight) environmentLights++;
        if (this.moonLight) environmentLights++;
        if (this.hemisphereLight) environmentLights++;
        if (this.ambientLight) environmentLights++;
        
        console.log(`[DAY/NIGHT DEBUG] Lights:
        - Street lamp lights: ${streetLampLights}
        - Environment lights: ${environmentLights}
        - Total day/night component lights: ${streetLampLights + environmentLights}`);
        
        return streetLampLights + environmentLights;
    }
    
    // Method to toggle automatic time progression
    toggleTimeProgression() {
        this.automaticProgression = !this.automaticProgression;
        return this.automaticProgression;
    }
    
    // Method to set time progression speed
    setTimeProgressionSpeed(speed) {
        this.timeProgressionSpeed = Math.max(0.01, Math.min(1.0, speed));
        return this.timeProgressionSpeed;
    }
} 