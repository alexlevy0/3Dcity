# 3D City Scene with Three.js

This project creates an immersive 3D city scene using Three.js that simulates a bustling urban environment with various interactive elements.

## Features

- **Urban Environment**: Skyscrapers, apartment buildings, shops, and parks populate the cityscape
- **Road Network**: A grid of roads with moving vehicles and traffic signals
- **Pedestrians**: People walking on sidewalks and crossing streets at designated crosswalks
- **Street Elements**: Lampposts, benches, trees, and other urban furniture enhance realism
- **Dynamic Lighting**: Day and night cycle that affects lighting, shadows, and ambiance
- **Interactive Camera Controls**: Multiple modes for exploring the city from different perspectives

## Getting Started

1. Clone this repository or download the files
2. Open the project directory in your terminal

### Running Locally

The simplest way to run the project is to use a local server. You can use any of these methods:

#### Using Python (Python 3):
```bash
python -m http.server
```

#### Using Node.js:
```bash
npx serve
```

Then open your browser and navigate to `http://localhost:8000` (or whichever port your server is using).

## Controls

- **Mouse**: Look around (orbit mode), control direction (first-person mode)
- **WASD**: Move camera in first-person mode
- **Space/Shift**: Move camera up/down in first-person mode
- **Mouse Wheel**: Zoom in/out in orbit mode
- **Double Click**: Switch between orbit and first-person camera modes
- **Time Slider**: Control the time of day (top right corner)

## Project Structure

- **index.html**: Main entry point and basic UI elements
- **js/main.js**: Core application setup and initialization
- **js/components/**: Modular components for city elements
  - **City.js**: Generates buildings, roads, and street elements
  - **Traffic.js**: Manages vehicles and traffic system
  - **Pedestrians.js**: Controls pedestrian behaviors and animations
  - **DayNightCycle.js**: Handles lighting changes and sky appearance
  - **CameraControls.js**: Implements camera movement and interaction

## Customization

You can customize the city by modifying the parameters in the respective component files:

- Adjust city size, density, and building types in `City.js`
- Change the number of vehicles and their behaviors in `Traffic.js`
- Modify pedestrian count and walking patterns in `Pedestrians.js`
- Tweak lighting conditions and day/night cycle speed in `DayNightCycle.js`

## Technical Details

This project uses:
- **Three.js**: 3D rendering library
- **JavaScript ES6+**: Modern JavaScript features
- **HTML5/CSS3**: Basic structure and styling

No additional dependencies are required as Three.js is loaded via CDN.

## License

This project is available under the MIT License. 