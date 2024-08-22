import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const App = () => {
  // Refs for DOM elements
  const iframeRef = useRef(null);
  const threeContainerRef = useRef(null);

  // State for avatar URL and debug information
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Refs for Three.js objects
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const animationRef = useRef(null);
  const audioRef = useRef(null);

  // State for lip-sync data and playback status
  const [lipsyncData, setLipsyncData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Ref for current viseme values
  const currentVisemeRef = useRef({});

  // Ref for meshes with morph targets
  const morphTargetMeshes = useRef([]);

  // Function to add debug information
  const addDebugInfo = useCallback((info) => {
    console.log(info);
    setDebugInfo(prev => prev + '\n' + info);
  }, []);

  // Effect for handling messages from the Ready Player Me iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleMessage = (event) => {
        let json;
        try {
          json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (error) {
          console.error('Error parsing message data:', error);
          return;
        }

        if (json?.source === 'readyplayerme') {
          if (json.eventName === 'v1.frame.ready') {
            // Subscribe to all events from Ready Player Me
            iframe.contentWindow.postMessage(
              JSON.stringify({
                target: 'readyplayerme',
                type: 'subscribe',
                eventName: 'v1.**'
              }),
              '*'
            );
          }

          if (json.eventName === 'v1.avatar.exported') {
            // Set the avatar URL with morph targets
            const modifiedUrl = `${json.data.url}?morphTargets=ARKit,Oculus Visemes`;
            setAvatarUrl(modifiedUrl);
            addDebugInfo(`Avatar URL received: ${modifiedUrl}`);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [addDebugInfo]);

  // Effect for loading lip-sync data and audio
  useEffect(() => {
    // Load lip-sync data
    fetch('/viseme/output.json')
      .then(response => response.json())
      .then(data => {
        setLipsyncData(data);
        addDebugInfo('Lipsync data loaded successfully');
      })
      .catch(error => addDebugInfo(`Error loading lipsync data: ${error.message}`));

    // Load audio
    audioRef.current = new Audio('/audio/TestAudio.mp3');
    audioRef.current.addEventListener('ended', () => setIsPlaying(false));
  }, [addDebugInfo]);

  // Effect for setting up the Three.js scene
  useEffect(() => {
    if (!avatarUrl || !threeContainerRef.current) return;

    const container = threeContainerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x87CEEB);  // Sky blue background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 1.6, 3);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 20;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // Soft white light
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8d6e63, 0.6);
    scene.add(hemisphereLight);

    // Colored point lights for added depth
    const redLight = new THREE.PointLight(0xff0000, 0.5, 10);
    redLight.position.set(5, 2, 0);
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x0000ff, 0.5, 10);
    blueLight.position.set(-5, 2, 0);
    scene.add(blueLight);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8d6e63,
      roughness: 0.8,
      metalness: 0.2
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    scene.add(plane);

    // Load avatar
    const loader = new GLTFLoader();
    loader.load(
      avatarUrl,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        scene.add(model);

        morphTargetMeshes.current = [];
        const targetMeshNames = ['Wolf3D_Avatar', 'Wolf3D_Head', 'Wolf3D_Teeth', 'Wolf3D_Beard'];

        // Traverse the model to find meshes with morph targets
        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.material.envMapIntensity = 1;
            
            if (targetMeshNames.includes(node.name) && node.morphTargetDictionary && node.morphTargetInfluences) {
              morphTargetMeshes.current.push(node);
              addDebugInfo(`Morph target mesh found: ${node.name}`);
              addDebugInfo(`Morph targets for ${node.name}: ${JSON.stringify(node.morphTargetDictionary)}`);
            }
          }
        });

        addDebugInfo(`Total morph target meshes found: ${morphTargetMeshes.current.length}`);
        
        // Log if any target meshes were not found
        targetMeshNames.forEach(name => {
          if (!morphTargetMeshes.current.some(mesh => mesh.name === name)) {
            addDebugInfo(`Warning: ${name} mesh not found or does not have morph targets`);
          }
        });

        // Adjust model position
        model.position.set(0, 0, 0);

        addDebugInfo('Avatar loaded successfully');

        // Load and play idle animation
        loader.load('/animations/F_Standing_Idle_001.glb', (gltf) => {
          const animation = gltf.animations[0];
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          const action = mixer.clipAction(animation);
          action.play();
          addDebugInfo('Idle animation loaded and playing');
        });
      },
      (progress) => {
        const percentComplete = (progress.loaded / progress.total) * 100;
        addDebugInfo(`Loading: ${percentComplete.toFixed(2)}%`);
      },
      (error) => {
        addDebugInfo(`Error loading avatar: ${error.message}`);
      }
    );

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.target.set(0, 1.6, 0);
    controls.update();

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Clean up
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [avatarUrl, addDebugInfo]);

  // Mapping of visemes to blend shapes
  const visemeToBlendShape = {
    'X': ['viseme_sil', 'viseme_sil'],
    'A': ['viseme_PP', 'viseme_PP'],
    'B': ['viseme_kk', 'viseme_kk'],
    'C': ['viseme_I', 'viseme_I'],
    'D': ['viseme_AA', 'viseme_AA'],
    'E': ['viseme_O', 'viseme_O'],
    'F': ['viseme_U', 'viseme_U'],
    'G': ['viseme_FF', 'viseme_FF'],
    'H': ['viseme_TH', 'viseme_TH'],
  };

  // Linear interpolation function
  const lerp = (a, b, t) => a + (b - a) * t;

  // Function to set blend shapes on all morph target meshes
  const setBlendShapes = useCallback((shapes, values) => {
    morphTargetMeshes.current.forEach((mesh) => {
      shapes.forEach((shape, index) => {
        const morphIndex = mesh.morphTargetDictionary[shape];
        if (morphIndex !== undefined) {
          mesh.morphTargetInfluences[morphIndex] = values[index];
        }
      });
    });
  }, []);

  // Function to animate lip-sync
  const animateLipsync = useCallback(() => {
    if (!lipsyncData || !audioRef.current) return;

    const startTime = Date.now();
    let lastCue = null;
    const transitionDuration = 0.05; // 50ms transition
    let currentValues = {};

    const animate = () => {
      const currentTime = (Date.now() - startTime) / 1000;
      const currentCue = lipsyncData.mouthCues.find(cue => 
        currentTime >= cue.start && currentTime < cue.end
      );

      if (currentCue && currentCue !== lastCue) {
        const blendShapes = visemeToBlendShape[currentCue.value];
        if (blendShapes) {
          const targetValues = {};
          Object.values(visemeToBlendShape).flat().forEach(shape => {
            targetValues[shape] = blendShapes.includes(shape) ? 1 : 0;
          });

          const startValues = { ...currentValues };
          const startTime = Date.now();

          const transition = () => {
            const t = Math.min((Date.now() - startTime) / (transitionDuration * 1000), 1);
            
            Object.entries(targetValues).forEach(([shape, targetValue]) => {
              const startValue = startValues[shape] || 0;
              currentValues[shape] = lerp(startValue, targetValue, t);
            });

            const shapes = Object.keys(currentValues);
            const values = Object.values(currentValues);
            setBlendShapes(shapes, values);

            if (t < 1) {
              requestAnimationFrame(transition);
            }
          };

          transition();
        }
        lastCue = currentCue;
      } else if (!currentCue && lastCue) {
        // Transition to neutral expression when there's no active cue
        const targetValues = {};
        Object.values(visemeToBlendShape).flat().forEach(shape => {
          targetValues[shape] = 0;
        });

        const startValues = { ...currentValues };
        const startTime = Date.now();

        const transition = () => {
          const t = Math.min((Date.now() - startTime) / (transitionDuration * 1000), 1);
          
          Object.entries(targetValues).forEach(([shape, targetValue]) => {
            const startValue = startValues[shape] || 0;
            currentValues[shape] = lerp(startValue, targetValue, t);
          });

          const shapes = Object.keys(currentValues);
          const values = Object.values(currentValues);
          setBlendShapes(shapes, values);

          if (t < 1) {
            requestAnimationFrame(transition);
          }
        };

        transition();
        lastCue = null;
      }

      if (currentTime < lipsyncData.metadata.duration) {
        requestAnimationFrame(animate);
      } else {
        // Reset to neutral expression at the end
        const shapes = Object.values(visemeToBlendShape).flat();
        const values = new Array(shapes.length).fill(0);
        setBlendShapes(shapes, values);
        currentValues = {};
      }
    };

    animate();
  }, [lipsyncData, setBlendShapes]);

  // Function to handle play/pause of audio and lip-sync animation
  const handlePlayAudio = () => {
    if (audioRef.current && lipsyncData) {
      if (!isPlaying) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        animateLipsync();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Ready Player Me iframe for avatar creation */}
        <div style={{ flex: 1 }}>
          <iframe
            ref={iframeRef}
            src="https://demo.readyplayer.me/avatar?frameApi"
            style={{ width: '100%', height: '100%' }}
            title="Ready Player Me"
          />
        </div>
        {/* Container for Three.js scene */}
        <div ref={threeContainerRef} style={{ flex: 1, height: '100%' }} />
      </div>
      {/* Controls and debug info */}
      <div style={{ padding: '20px' }}>
        {/* Play/Pause button for audio and lip-sync */}
        <button onClick={handlePlayAudio} style={{ padding: '10px' }}>
          {isPlaying ? 'Pause Audio' : 'Play Audio'}
        </button>
        {/* Debug information display */}
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
          {debugInfo}
        </pre>
      </div>
    </div>
  );
};

export default App;


/**
 * Avatar Lip-Sync Animation
 * 
 * This script implements lip-sync animation for a 3D avatar using Ready Player Me, Three.js, and React.
 * 
 * Current Functionality:
 * - Loads and animates an avatar from Ready Player Me
 * - Applies lip-sync animation based on pre-loaded viseme data
 * - Supports multiple meshes (head, teeth, beard) when available
 * - Implements smooth transitions between visemes
 * 
 * Known Limitations:
 * - When using the Ready Player Me demo subsite, only the 'Wolf3D_Avatar' mesh may be available
 * - Full functionality (separate head, teeth, and beard meshes) requires a Ready Player Me development subsite
 * 
 * Future Improvements:
 * - Implement fallback for unavailable meshes
 * - Fine-tune transition timing for optimal animation
 * - Enhance audio synchronization precision
 * - Add error handling for missing morph targets
 * 
 * Note: For optimal results, use with a Ready Player Me development subsite to access all separate meshes.
 */