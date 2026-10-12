import React, { useRef, useMemo, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Grid, Environment, Stars, useAnimations, useProgress, Trail } from '@react-three/drei';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';
import { EffectComposer, Pixelation, Vignette, Bloom } from '@react-three/postprocessing';
import './index.css';

// Remap legacy absolute texture paths embedded in FBX models to web-safe asset URLs
THREE.DefaultLoadingManager.setURLModifier((url) => {
  if (url.includes('brown_eye.png')) {
    return '/textures/brown_eye.png';
  }
  return url;
});

// Transition Handlers
const BackgroundTransition = ({ isMuted }) => {
  useFrame((state, delta) => {
    const targetColor = isMuted ? new THREE.Color('#e0e5ec') : new THREE.Color('#020202');
    if (!state.scene.background) state.scene.background = new THREE.Color('#e0e5ec');
    state.scene.background.lerp(targetColor, delta * 3);
  });
  return null;
};

const NightElements = ({ isMuted }) => {
  const groupRef = useRef();
  useFrame((state, delta) => {
    // Smoothly drop the grid and stars out of sight below the floor when muted
    const targetY = isMuted ? -50 : 0;
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 3);
    }
  });
  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
      <Grid
        renderOrder={-1}
        position={[0, 0, 0]}
        infiniteGrid
        fadeDistance={30}
        cellColor="#ff0055"
        sectionColor="#00ffff"
        cellSize={1}
        sectionSize={4}
        cellThickness={0.5}
        sectionThickness={1}
      />
    </group>
  );
};

// Dance Animation Files
const danceFiles = [
  '/animations/A_1.fbx',
  '/animations/A_2.fbx',
  '/animations/A_3.fbx',

];

// The Dancer
const Dancer = ({ isMuted }) => {
  const fbxList = useLoader(FBXLoader, danceFiles);
  const baseModel = fbxList[0];
  const groupRef = useRef();
  const currentActionIndex = useRef(0);

  // Extract animation clips from all loaded dance files and assign unique names
  const animations = useMemo(() => {
    return fbxList.map((item, idx) => {
      const clip = item.animations[0].clone();
      clip.name = `dance_${idx}`;
      return clip;
    });
  }, [fbxList]);

  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    baseModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          // Ensure it picks up some disco lighting
          child.material.metalness = 0.3;
          child.material.roughness = 0.5;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [baseModel]);

  // Randomly cycle through dance moves with smooth crossfading
  useEffect(() => {
    const clipNames = Object.keys(actions);
    if (clipNames.length === 0) return;

    // Start with the initial move
    actions[clipNames[0]]?.reset().play();

    let timeoutId;
    const triggerNextMove = () => {
      // Pick a random dance move that differs from the current one
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * clipNames.length);
      } while (nextIndex === currentActionIndex.current && clipNames.length > 1);

      const prevAction = actions[clipNames[currentActionIndex.current]];
      const nextAction = actions[clipNames[nextIndex]];
      currentActionIndex.current = nextIndex;

      if (prevAction && nextAction) {
        // Smooth crossfade between the dance moves over 0.8 seconds
        prevAction.fadeOut(0.8);
        nextAction.reset().fadeIn(0.8).play();
      } else if (nextAction) {
        nextAction.reset().play();
      }

      // Schedule the next random dance move (every 6 to 9 seconds)
      const nextDuration = 6000 + Math.random() * 3000;
      timeoutId = setTimeout(triggerNextMove, nextDuration);
    };

    // First transition after 7 seconds
    timeoutId = setTimeout(triggerNextMove, 7000);

    return () => clearTimeout(timeoutId);
  }, [actions]);

  // Adjust scale and position so the dancer stands on the floor
  return (
    <group ref={groupRef}>
      <primitive object={baseModel} scale={0.015} position={[0, 0, 0]} />
    </group>
  );
};

// Disco Lights
const DiscoLights = ({ isMuted }) => {
  const lightRef1 = useRef();
  const lightRef2 = useRef();
  const lightRef3 = useRef();
  const lightRef4 = useRef();

  const dayAmbientRef = useRef();
  const daySunRef = useRef();
  const nightAmbientRef = useRef();
  const nightHemisphereRef = useRef();

  // Targets for the spotlights to point at
  const target1 = useMemo(() => new THREE.Object3D(), []);
  const target2 = useMemo(() => new THREE.Object3D(), []);
  const target3 = useMemo(() => new THREE.Object3D(), []);
  const target4 = useMemo(() => new THREE.Object3D(), []);

  // Vibrant disco club colors
  const colors = useMemo(() => [
    new THREE.Color('#ff0055'), // Neon Pink
    new THREE.Color('#00ffff'), // Cyan
    new THREE.Color('#ffaa00'), // Orange
    new THREE.Color('#00ff55'), // Lime Green
    new THREE.Color('#aa00ff'), // Purple
    new THREE.Color('#ff0000'), // Red
    new THREE.Color('#0055ff'), // Blue
  ], []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const transSpeed = delta * 3;

    // Smooth transitions for lighting
    const dayTarget = isMuted ? 1.5 : 0;
    if (dayAmbientRef.current) dayAmbientRef.current.intensity = THREE.MathUtils.lerp(dayAmbientRef.current.intensity, dayTarget, transSpeed);
    if (daySunRef.current) daySunRef.current.intensity = THREE.MathUtils.lerp(daySunRef.current.intensity, dayTarget, transSpeed);

    const nightAmbTarget = isMuted ? 0 : 0.4;
    if (nightAmbientRef.current) nightAmbientRef.current.intensity = THREE.MathUtils.lerp(nightAmbientRef.current.intensity, nightAmbTarget, transSpeed);
    if (nightHemisphereRef.current) nightHemisphereRef.current.intensity = THREE.MathUtils.lerp(nightHemisphereRef.current.intensity, nightAmbTarget, transSpeed);

    const spotTarget = isMuted ? 0 : 600;
    [lightRef1, lightRef2, lightRef3, lightRef4].forEach(ref => {
      if (ref.current) ref.current.intensity = THREE.MathUtils.lerp(ref.current.intensity, spotTarget, transSpeed);
    });

    if (isMuted) return; // Freeze spot movement when muted

    // Change colors based on time (strobe/flicker effect)
    const speed = 8; // high speed for flickering
    const colorIndex1 = Math.floor(t * speed) % colors.length;
    const colorIndex2 = Math.floor(t * speed * 0.9 + 1) % colors.length;
    const colorIndex3 = Math.floor(t * speed * 1.1 + 2) % colors.length;
    const colorIndex4 = Math.floor(t * speed * 1.2 + 3) % colors.length;

    // Use modulo and lerp for smooth but fast transitions
    if (lightRef1.current) lightRef1.current.color.lerp(colors[colorIndex1], 0.3);
    if (lightRef2.current) lightRef2.current.color.lerp(colors[colorIndex2], 0.3);
    if (lightRef3.current) lightRef3.current.color.lerp(colors[colorIndex3], 0.3);
    if (lightRef4.current) lightRef4.current.color.lerp(colors[colorIndex4], 0.3);

    // Swinging spotlights by animating their targets in wide arcs
    target1.position.set(Math.sin(t * 2.1) * 8, 0, Math.cos(t * 1.3) * 8);
    target2.position.set(Math.cos(t * 1.8) * 8, 0, Math.sin(t * 2.5) * 8);
    target3.position.set(Math.sin(t * 1.5) * 8, 0, Math.cos(t * 2.9) * 8);
    target4.position.set(Math.cos(t * 2.2) * 8, 0, Math.sin(t * 1.7) * 8);

    // Move lights dynamically like moving heads in a club
    if (lightRef1.current) {
      lightRef1.current.position.x = Math.sin(t * 1.5) * 6;
      lightRef1.current.position.z = Math.cos(t * 1.2) * 6;
    }
    if (lightRef2.current) {
      lightRef2.current.position.x = Math.cos(t * 1.3) * 6;
      lightRef2.current.position.z = Math.sin(t * 1.5) * 6;
    }
  });

  return (
    <>
      {/* Calm daytime environment lighting */}
      <ambientLight ref={dayAmbientRef} intensity={1.5} />
      <directionalLight ref={daySunRef} position={[10, 10, 5]} intensity={1.5} />

      {/* Night Club Lighting */}
      <ambientLight ref={nightAmbientRef} intensity={0} />
      <hemisphereLight ref={nightHemisphereRef} skyColor="#222244" groundColor="#050505" intensity={0} />

      <primitive object={target1} />
      <primitive object={target2} />
      <primitive object={target3} />
      <primitive object={target4} />

      {/* Spotlights hanging from above and swinging around, made stronger and sharper */}
      <spotLight ref={lightRef1} position={[5, 6, 5]} target={target1} intensity={600} distance={30} angle={0.5} penumbra={0.2} castShadow />
      <spotLight ref={lightRef2} position={[-5, 6, 5]} target={target2} intensity={600} distance={30} angle={0.5} penumbra={0.2} castShadow />
      <spotLight ref={lightRef3} position={[5, 6, -5]} target={target3} intensity={600} distance={30} angle={0.5} penumbra={0.2} castShadow />
      <spotLight ref={lightRef4} position={[-5, 6, -5]} target={target4} intensity={600} distance={30} angle={0.5} penumbra={0.2} castShadow />
    </>
  );
};

// Moving Camera
const CameraController = ({ isMuted }) => {
  const currentRadius = useRef(null);
  const currentHeight = useRef(null);
  const angleRef = useRef(null);

  useFrame((state, delta) => {
    // Initialize smoothly from camera's current position if first frame
    if (angleRef.current === null) {
      const x = state.camera.position.x;
      const z = state.camera.position.z;
      const dist = Math.sqrt(x * x + z * z);
      angleRef.current = Math.atan2(x, z);
      currentRadius.current = dist > 0.1 ? dist : (isMuted ? 58 : 8);
      currentHeight.current = state.camera.position.y || (isMuted ? 10 : 3);
    }

    // Target parameters based on state:
    // When muted: zoom out to radius 58, height 10 to fit the wider 20-radius globe
    // When unmuted: zoom in to radius 8, energetic party orbit
    const targetRadius = isMuted ? 58 : 8;
    const targetSpeed = isMuted ? 0.2 : 0.35;
    const targetY = isMuted ? 10 : 3 + Math.sin(state.clock.getElapsedTime() * 0.5) * 1.5;

    // Smoothly transition the orbit distance & height from wherever the camera currently is
    currentRadius.current = THREE.MathUtils.lerp(currentRadius.current, targetRadius, delta * 2);
    currentHeight.current = THREE.MathUtils.lerp(currentHeight.current, targetY, delta * 2);

    // Keep spinning continuously
    angleRef.current += delta * targetSpeed;

    const targetX = Math.sin(angleRef.current) * currentRadius.current;
    const targetZ = Math.cos(angleRef.current) * currentRadius.current;

    state.camera.position.set(targetX, currentHeight.current, targetZ);
    // Always look at the dancer / center of the scene
    state.camera.lookAt(0, 1.5, 0);
  });
  return null;
};

// Mystery Sphere (Snow Globe)
const MysterySphere = ({ isMuted, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Fade out when unmuted to reveal the inside party scene
      const targetOpacity = isMuted ? 1 : 0;
      meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, targetOpacity, delta * 3);
      meshRef.current.visible = meshRef.current.material.opacity > 0.01;

      // Pulse scale when hovered
      const baseScale = 1;
      const targetScale = (hovered && isMuted) ? baseScale * 1.02 : baseScale;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onClick={isMuted ? onClick : undefined}
      onPointerOver={() => {
        setHovered(true);
        if (isMuted) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Radius 20 half-sphere (Dome) - wide enough to encase the equalizer sound bars */}
      <sphereGeometry args={[20, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial
        color="#ffffff"
        metalness={0.1}
        roughness={0}
        clearcoat={1}
        transmission={0.9}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Spaceship Drones flying behind the sound bars with glowing trails
const FLEET_CONFIG = [
  { baseR: 16.8, rAmp: 0.6, rFreq: 0.8, speed: 0.70, phase: 0.0, yBase: 3.5, yAmp: 1.8, yFreq: 1.2, bankFactor: 0.45, color: '#00f0ff' }, // Cyan
  { baseR: 17.5, rAmp: 0.5, rFreq: 0.6, speed: -0.58, phase: 1.3, yBase: 5.6, yAmp: 1.5, yFreq: 0.9, bankFactor: 0.40, color: '#ff007f' }, // Hot Pink
  { baseR: 16.5, rAmp: 0.7, rFreq: 1.0, speed: 0.82, phase: 2.7, yBase: 2.2, yAmp: 1.2, yFreq: 1.4, bankFactor: 0.50, color: '#00ff88' }, // Mint
  { baseR: 17.2, rAmp: 0.6, rFreq: 0.7, speed: -0.65, phase: 3.9, yBase: 4.8, yAmp: 1.8, yFreq: 1.0, bankFactor: 0.42, color: '#ffaa00' }, // Cyber Orange
  { baseR: 16.9, rAmp: 0.5, rFreq: 0.9, speed: 0.60, phase: 4.8, yBase: 6.2, yAmp: 1.4, yFreq: 0.8, bankFactor: 0.38, color: '#b500ff' }, // Purple
  { baseR: 17.6, rAmp: 0.6, rFreq: 0.8, speed: -0.75, phase: 5.6, yBase: 3.0, yAmp: 1.6, yFreq: 1.3, bankFactor: 0.48, color: '#38bdf8' }, // Ice Blue
  { baseR: 16.6, rAmp: 0.7, rFreq: 1.1, speed: 0.68, phase: 1.9, yBase: 4.2, yAmp: 1.5, yFreq: 1.1, bankFactor: 0.44, color: '#ff3366' }, // Coral
  { baseR: 17.3, rAmp: 0.5, rFreq: 0.5, speed: -0.50, phase: 3.2, yBase: 6.8, yAmp: 1.2, yFreq: 0.7, bankFactor: 0.35, color: '#ffd700' }, // Gold
  { baseR: 16.7, rAmp: 0.6, rFreq: 0.9, speed: 0.76, phase: 0.7, yBase: 2.6, yAmp: 1.4, yFreq: 1.5, bankFactor: 0.52, color: '#a855f7' }, // Lavender
  { baseR: 17.4, rAmp: 0.5, rFreq: 0.7, speed: -0.62, phase: 2.4, yBase: 5.0, yAmp: 1.7, yFreq: 1.0, bankFactor: 0.40, color: '#06b6d4' }, // Teal
];

const SpaceshipUnit = ({ config, isMuted }) => {
  const groupRef = useRef();
  const innerRef = useRef();
  const thrusterRef = useRef();

  const posVec = useMemo(() => new THREE.Vector3(), []);
  const nextPosVec = useMemo(() => new THREE.Vector3(), []);

  const getPositionAtTime = (t, out) => {
    const r = config.baseR + config.rAmp * Math.sin(t * config.rFreq);
    const y = config.yBase + config.yAmp * Math.sin(t * config.yFreq);
    const theta = t * config.speed + config.phase;
    out.set(
      r * Math.cos(theta),
      y,
      r * Math.sin(theta)
    );
    return out;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const timeScale = isMuted ? 0.85 : 1.3;
    const t = state.clock.getElapsedTime() * timeScale;

    // Orient towards future path tangent
    getPositionAtTime(t, posVec);
    getPositionAtTime(t + 0.03, nextPosVec);

    groupRef.current.position.copy(posVec);
    groupRef.current.lookAt(nextPosVec);

    // Dynamic banking roll in curves
    if (innerRef.current) {
      const bank = Math.sin(t * config.yFreq * 1.5) * config.bankFactor;
      innerRef.current.rotation.z = THREE.MathUtils.lerp(innerRef.current.rotation.z, bank, delta * 6);
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={innerRef}>
        {/* Sleek Smaller Cube Spaceship Fuselage */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.16, 0.24]} />
          <meshStandardMaterial
            color="#0c0e18"
            emissive={config.color}
            emissiveIntensity={isMuted ? 1.4 : 3.0}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        {/* Cockpit Gem Canopy */}
        <mesh position={[0, 0.08, 0.03]}>
          <boxGeometry args={[0.09, 0.04, 0.11]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Angled Side Stabilizer Fins */}
        <mesh position={[0.12, 0, -0.03]} rotation={[0, 0, Math.PI / 7]}>
          <boxGeometry args={[0.1, 0.02, 0.15]} />
          <meshStandardMaterial color="#0c0e18" emissive={config.color} emissiveIntensity={1.0} />
        </mesh>
        <mesh position={[-0.12, 0, -0.03]} rotation={[0, 0, -Math.PI / 7]}>
          <boxGeometry args={[0.1, 0.02, 0.15]} />
          <meshStandardMaterial color="#0c0e18" emissive={config.color} emissiveIntensity={1.0} />
        </mesh>

        {/* Rear Engine Thruster with Delicate Glowing Neon Trail */}
        <Trail
          width={0.14}
          length={6}
          color={config.color}
          attenuation={(w) => w * w}
        >
          <mesh ref={thrusterRef} position={[0, 0, -0.12]}>
            <boxGeometry args={[0.08, 0.08, 0.04]} />
            <meshBasicMaterial color={config.color} />
          </mesh>
        </Trail>
      </group>
    </group>
  );
};

const SpaceshipFleet = ({ isMuted }) => {
  return (
    <group name="spaceship-fleet">
      {FLEET_CONFIG.map((config, index) => (
        <SpaceshipUnit key={index} config={config} isMuted={isMuted} />
      ))}
    </group>
  );
};

// Dance Floor - Grounded solid base
const DanceFloor = ({ isMuted }) => {
  const materialRef = useRef();

  useFrame((state, delta) => {
    const targetColor = isMuted ? new THREE.Color('#ffffff') : new THREE.Color('#1a1a2e');
    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, delta * 3);
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Grounded solid base disc sitting flush with the dome perimeter */}
      <mesh receiveShadow={false}>
        <cylinderGeometry args={[20.2, 20.2, 1, 64]} />
        <meshStandardMaterial ref={materialRef} color="#ffffff" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Inner dance floor neon ring */}
      <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[11.5, 12, 8]} />
        <meshBasicMaterial color="#ff0055" wireframe />
      </mesh>
    </group>
  );
};

// Soft circular drop shadow under the globe
const GlobeShadow = ({ isMuted }) => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
    gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[52, 52]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={isMuted ? 0.35 : 0.6}
        depthWrite={false}
      />
    </mesh>
  );
};

// Global Audio variables for the Equalizer
let audioCtx;
let globalAnalyser;
let globalDataArray;

// Audio Player
const AudioPlayer = ({ isMuted }) => {
  const audioRef = useRef();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      // No loop or random currentTime needed for live radio streams
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isMuted) {
        // Setup Web Audio API only once
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          globalAnalyser = audioCtx.createAnalyser();
          globalAnalyser.fftSize = 1024; // gives 512 frequency bins for higher resolution
          globalDataArray = new Uint8Array(globalAnalyser.frequencyBinCount);

          const source = audioCtx.createMediaElementSource(audioRef.current);
          source.connect(globalAnalyser);
          globalAnalyser.connect(audioCtx.destination);
        }

        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        // The browser requires play() to be triggered by a user interaction.
        audioRef.current.play().catch(e => console.log('Play blocked:', e));
      } else {
        // Pause entirely if muted
        audioRef.current.pause();
      }
    }
  }, [isMuted]);

  // Live Internet Hip-Hop Radio Stream - Vibe Radio UK
  const streamUrl = "https://live.viberadio.org/listen/viberadio/radio.mp3";

  return <audio ref={audioRef} src={streamUrl} preload="none" crossOrigin="anonymous" />;
};

// Equalizer Component
const Equalizer = ({ isMuted }) => {
  const groupRef = useRef();
  const cubesCount = 64;

  const cubes = useMemo(() => {
    return new Array(cubesCount).fill(0).map((_, i) => {
      // Arrange in a closer circle around the dance floor
      const angle = (i / cubesCount) * Math.PI * 2;
      const r = 15; // Brought in closer to the camera
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;
      return { x, z, angle };
    });
  }, [cubesCount]);

  useFrame((state) => {
    if (groupRef.current) {
      if (globalAnalyser && globalDataArray && !isMuted) {
        globalAnalyser.getByteFrequencyData(globalDataArray);
      }

      const time = state.clock.getElapsedTime();

      groupRef.current.children.forEach((mesh, i) => {
        let normalized = 0;

        if (isMuted) {
          // When muted, move randomly (smooth noise-like movement)
          normalized = (Math.sin(time * 2 + i) * 0.5 + 0.5) * (Math.sin(time * 3.1 + i * 1.5) * 0.5 + 0.5);
        } else if (globalAnalyser && globalDataArray) {
          // Follow the song regularly: map each cube to a specific frequency bin
          // Multiply by 2 to cover a wider frequency range across the 64 cubes
          const binIndex = i * 2;
          const data = globalDataArray[binIndex] || 0;
          normalized = data / 255;
        }

        // Scale Y based on the frequency volume. Reduced overall max height.
        const targetScaleY = Math.max(0.1, normalized * 7.5);

        mesh.scale.y += (targetScaleY - mesh.scale.y) * 0.2;
        // Keep the bottom at y=0
        mesh.position.y = mesh.scale.y / 2;

        // Pulse the emissive brightness
        if (mesh.material) {
          mesh.material.emissiveIntensity = normalized * 4;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {cubes.map((pos, i) => {
        // Create a super neon gradient effect
        const color = new THREE.Color(`hsl(${(i * 360) / cubesCount}, 100%, 65%)`);
        return (
          <mesh key={i} position={[pos.x, 0, pos.z]} rotation={[0, pos.angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 1, 0.8]} />
            <meshStandardMaterial
              color={color}
              metalness={0.2}
              roughness={0.3}
              emissive={color}
              emissiveIntensity={0}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Loading Screen Overlay
const LoadingScreen = () => {
  const { active, progress } = useProgress();
  const [fadedOut, setFadedOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active && progress === 100) {
      const timeout = setTimeout(() => {
        setFadedOut(true);
        setTimeout(() => setVisible(false), 800);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#0a0a12',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        transition: 'opacity 0.8s ease',
        opacity: fadedOut ? 0 : 1,
        pointerEvents: fadedOut ? 'none' : 'auto',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '320px', width: '80%' }}>
        <h2
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '1rem',
            fontWeight: 400,
            letterSpacing: '6px',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '1.5rem',
          }}
        >
          Loading Stage
        </h2>

        {/* Progress Bar Container */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '1rem',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, progress))}%`,
              background: 'linear-gradient(90deg, #ff0055, #00ffff)',
              borderRadius: '4px',
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 8px #00ffff',
            }}
          />
        </div>

        <div
          style={{
            fontFamily: 'system-ui, monospace',
            fontSize: '0.8rem',
            letterSpacing: '2px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPS1, setIsPS1] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', background: isMuted ? '#e0e5ec' : '#020202', transition: 'background 1.5s ease' }}>
      <LoadingScreen />
      <AudioPlayer isMuted={isMuted} />
      <Canvas gl={{ antialias: !isPS1 }} shadows camera={{ position: [0, 3, 10], fov: 60 }}>
        <BackgroundTransition isMuted={isMuted} />
        <NightElements isMuted={isMuted} />

        <CameraController isMuted={isMuted} />
        <DiscoLights isMuted={isMuted} />

        <MysterySphere isMuted={isMuted} onClick={() => setIsMuted(false)} />

        {/* Flying Spaceship Cubes with Trails */}
        <SpaceshipFleet isMuted={isMuted} />

        {/* Core Elements */}
        <Suspense fallback={null}>
          <Dancer isMuted={isMuted} />
        </Suspense>
        <DanceFloor isMuted={isMuted} />

        {/* Equalizer naturally transitions itself based on the audio analyzer data */}
        <Equalizer isMuted={isMuted} />

        {/* Soft circular drop shadow under the globe */}
        <GlobeShadow isMuted={isMuted} />

        {/* PS1 Style Post-Processing */}
        <EffectComposer>
          {isPS1 && <Pixelation granularity={3} />}
          {!isMuted && <Vignette eskil={false} offset={0.1} darkness={1.1} />}
          <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.9} height={300} intensity={0.6} />
        </EffectComposer>
      </Canvas>

      {/* Overlay UI */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        boxSizing: 'border-box',
        padding: '2rem',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'column'
      }}>
        {/* PS1 Toggle Button */}
        <button
          onClick={() => setIsPS1(!isPS1)}
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            pointerEvents: 'auto',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.border = '1px solid rgba(255, 255, 255, 0.8)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.3)';
            e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          }}
        >
          PS1 FX: {isPS1 ? 'ON' : 'OFF'}
        </button>

        <h1 style={{
          margin: 0,
          fontSize: '2rem',
          fontWeight: 300,
          letterSpacing: '8px',
          color: '#1a1a2e',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          opacity: isMuted ? 1 : 0,
          transition: 'opacity 1s ease'
        }}>
          website under construction
        </h1>
        <p style={{
          color: 'rgba(0,0,0,0.7)',
          letterSpacing: '2px',
          marginTop: '1rem',
          fontFamily: 'system-ui, sans-serif',
          opacity: isMuted ? 1 : 0,
          transition: 'opacity 1s ease'
        }}>
          come back soon
        </p>

        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '1rem',
            letterSpacing: '2px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            opacity: isMuted ? 0 : 1,
            pointerEvents: isMuted ? 'none' : 'auto'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.border = '1px solid rgba(255, 255, 255, 0.8)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.5)';
            e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          }}
        >
          {isMuted ? '🔇 Unmute Music' : '🔊 Mute Music'}
        </button>
      </div>
    </div>
  );
}
