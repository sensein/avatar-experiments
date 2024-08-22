import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const App = () => {
  const iframeRef = useRef(null);
  const threeContainerRef = useRef(null);
  const avatarUrlRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [isSceneReady, setIsSceneReady] = useState(false);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const glbAnimationsRef = useRef([]);
  const fbxAnimationsRef = useRef([]);
  const mixerRef = useRef(null);
  const glbActionsRef = useRef([]);
  const fbxActionsRef = useRef([]);
  const clockRef = useRef(new THREE.Clock());
  const requestRef = useRef();
  const currentGLBActionRef = useRef(null);
  const currentFBXActionRef = useRef(null);

  const addDebugInfo = useCallback((info) => {
    console.log(info);
    setDebugInfo(prev => prev + '\n' + info);
  }, []);

  const initializeThreeJS = useCallback(() => {
    if (!threeContainerRef.current || sceneRef.current) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x87CEEB);  // Sky blue background

    // Camera setup
    cameraRef.current = new THREE.PerspectiveCamera(75, threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight, 0.1, 1000);
    cameraRef.current.position.set(0, 1.6, 3);

    // Renderer setup
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current.toneMappingExposure = 1;
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;
    threeContainerRef.current.appendChild(rendererRef.current.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 20;
    directionalLight.shadow.bias = -0.001;
    sceneRef.current.add(directionalLight);

    // Soft white light
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8d6e63, 0.6);
    sceneRef.current.add(hemisphereLight);

    // Colored point lights for added depth
    const redLight = new THREE.PointLight(0xff0000, 0.5, 10);
    redLight.position.set(5, 2, 0);
    sceneRef.current.add(redLight);

    const blueLight = new THREE.PointLight(0x0000ff, 0.5, 10);
    blueLight.position.set(-5, 2, 0);
    sceneRef.current.add(blueLight);

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
    sceneRef.current.add(plane);

    // Controls setup
    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controls.target.set(0, 1.6, 0);
    controls.update();

    addDebugInfo('Three.js scene initialized with improved rendering');
  }, [addDebugInfo]);

  const loadGLBAnimations = useCallback((newModel) => {
    const danceAnimations = ['F_Dances_001', 'F_Dances_004', 'F_Dances_005'];
    const loader = new GLTFLoader();
    const loadedAnimations = [];

    const loadAnimation = (index) => {
      if (index >= danceAnimations.length) {
        if (loadedAnimations.length > 0) {
          glbAnimationsRef.current = loadedAnimations;
          mixerRef.current = new THREE.AnimationMixer(newModel);
          loadedAnimations.forEach((anim, idx) => {
            const action = mixerRef.current.clipAction(anim);
            action.setEffectiveWeight(0);
            action.play();
            action.setLoop(THREE.LoopRepeat);
            glbActionsRef.current[idx] = action;
          });
          addDebugInfo('All GLB animations loaded and prepared');
          loadFBXAnimations(newModel);
        } else {
          addDebugInfo("No GLB animations were successfully loaded.");
        }
        return;
      }

      const animName = danceAnimations[index];
      const filePath = `/models/animations/masculine/dance/${animName}.glb`;
      
      addDebugInfo(`Attempting to load GLB: ${filePath}`);

      loader.load(
        filePath,
        (gltf) => {
          if (gltf.animations.length > 0) {
            const animation = gltf.animations[0];
            animation.name = animName;
            loadedAnimations.push(animation);
            const durationInSeconds = animation.duration.toFixed(2);
            addDebugInfo(`Successfully loaded GLB animation: ${animName} (Duration: ${durationInSeconds}s)`);
          } else {
            addDebugInfo(`No animations found in GLB file: ${animName}`);
          }
          loadAnimation(index + 1);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(2);
          addDebugInfo(`Loading GLB ${animName}: ${percent}%`);
        },
        (error) => {
          addDebugInfo(`Error loading GLB ${animName}: ${error.message}`);
          loadAnimation(index + 1);
        }
      );
    };

    loadAnimation(0);
  }, [addDebugInfo]);
  const loadFBXAnimations = useCallback((newModel) => {
    const fbxAnimations = ['Snatch', 'Start Plank'];
    const loader = new FBXLoader();
    const loadedAnimations = [];

    const loadAnimation = (index) => {
      if (index >= fbxAnimations.length) {
        if (loadedAnimations.length > 0) {
          fbxAnimationsRef.current = loadedAnimations;
          loadedAnimations.forEach((anim, idx) => {
            const action = mixerRef.current.clipAction(anim);
            action.setEffectiveWeight(0);
            action.play();
            action.setLoop(THREE.LoopRepeat);
            fbxActionsRef.current[idx] = action;
          });
          addDebugInfo('All FBX animations loaded and prepared');
          setIsSceneReady(true);
        } else {
          addDebugInfo("No FBX animations were successfully loaded.");
        }
        return;
      }

      const animName = fbxAnimations[index];
      const filePath = `/models/animations/Mixamo/${animName}.fbx`;
      
      addDebugInfo(`Attempting to load FBX: ${filePath}`);

      loader.load(
        filePath,
        (fbx) => {
          if (fbx.animations.length > 0) {
            const animation = fbx.animations[0];
            animation.name = animName;
            loadedAnimations.push(animation);
            const durationInSeconds = animation.duration.toFixed(2);
            addDebugInfo(`Successfully loaded FBX animation: ${animName} (Duration: ${durationInSeconds}s)`);
          } else {
            addDebugInfo(`No animations found in FBX file: ${animName}`);
          }
          loadAnimation(index + 1);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(2);
          addDebugInfo(`Loading FBX ${animName}: ${percent}%`);
        },
        (error) => {
          addDebugInfo(`Error loading FBX ${animName}: ${error.message}`);
          loadAnimation(index + 1);
        }
      );
    };

    loadAnimation(0);
  }, [addDebugInfo]);

  const loadAvatar = useCallback(() => {
    if (!avatarUrlRef.current) return;

    initializeThreeJS();

    addDebugInfo('Loading avatar from URL: ' + avatarUrlRef.current);
    const loader = new GLTFLoader();
    loader.load(
      avatarUrlRef.current,
      (gltf) => {
        if (modelRef.current) sceneRef.current.remove(modelRef.current);
        const newModel = gltf.scene;
        new THREE.Box3().setFromObject(newModel).getCenter(newModel.position).multiplyScalar(-1);
        newModel.position.y = 0;
        sceneRef.current.add(newModel);
        modelRef.current = newModel;
        addDebugInfo('Avatar loaded successfully');

        loadGLBAnimations(newModel);
      },
      (progress) => addDebugInfo(`Loading avatar: ${(progress.loaded / progress.total * 100).toFixed(2)}%`),
      (error) => addDebugInfo('Error loading avatar: ' + error.message)
    );
  }, [addDebugInfo, loadGLBAnimations, initializeThreeJS]);

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (json?.source === 'readyplayerme') {
          if (json.eventName === 'v1.frame.ready') {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
              target: 'readyplayerme',
              type: 'subscribe',
              eventName: 'v1.**'
            }), '*');
          }
          if (json.eventName === 'v1.avatar.exported') {
            avatarUrlRef.current = `${json.data.url}?morphTargets=ARKit,Oculus Visemes`;
            loadAvatar();
          }
        }
      } catch (error) {
        addDebugInfo('Error parsing message: ' + error.message);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [loadAvatar, addDebugInfo]);

  const animate = useCallback(() => {
    if (mixerRef.current) {
      mixerRef.current.update(clockRef.current.getDelta());
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isSceneReady) {
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current);
    }
  }, [isSceneReady, animate]);

  const fadeToAction = useCallback((newAction, duration = 0.5) => {
    if (currentGLBActionRef.current) {
      currentGLBActionRef.current.fadeOut(duration);
    }
    if (currentFBXActionRef.current) {
      currentFBXActionRef.current.fadeOut(duration);
    }

    newAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();

    if (glbActionsRef.current.includes(newAction)) {
      currentGLBActionRef.current = newAction;
      currentFBXActionRef.current = null;
    } else if (fbxActionsRef.current.includes(newAction)) {
      currentFBXActionRef.current = newAction;
      currentGLBActionRef.current = null;
    }
  }, []);

  const blendGLBAnimations = useCallback(() => {
    if (glbActionsRef.current.length === 0) {
      addDebugInfo('No GLB animations available to blend');
      return;
    }

    let currentIndex = 0;
    const blendToNextAnimation = () => {
      fadeToAction(glbActionsRef.current[currentIndex]);
      addDebugInfo(`Blending to GLB animation: ${glbAnimationsRef.current[currentIndex].name}`);
      currentIndex = (currentIndex + 1) % glbActionsRef.current.length;
      setTimeout(blendToNextAnimation, 5000); // Change animation every 5 seconds
    };

    blendToNextAnimation();
  }, [addDebugInfo, fadeToAction]);

  const blendFBXAnimations = useCallback(() => {
    if (fbxActionsRef.current.length === 0) {
      addDebugInfo('No FBX animations available to blend');
      return;
    }

    let currentIndex = 0;
    const blendToNextAnimation = () => {
      fadeToAction(fbxActionsRef.current[currentIndex]);
      addDebugInfo(`Blending to FBX animation: ${fbxAnimationsRef.current[currentIndex].name}`);
      currentIndex = (currentIndex + 1) % fbxActionsRef.current.length;
      setTimeout(blendToNextAnimation, 5000); // Change animation every 5 seconds
    };

    blendToNextAnimation();
  }, [addDebugInfo, fadeToAction]);

  const resetAnimations = useCallback(() => {
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      currentGLBActionRef.current = null;
      currentFBXActionRef.current = null;
      addDebugInfo('All animations reset');
    } else {
      addDebugInfo('No animations to reset');
    }
  }, [addDebugInfo]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 1 }}>
          <iframe
            ref={iframeRef}
            src="https://demo.readyplayer.me/avatar?frameApi"
            style={{ width: '100%', height: '100%' }}
            title="Ready Player Me"
          />
        </div>
        <div ref={threeContainerRef} style={{ flex: 1, height: '100%' }} />
      </div>
      <div style={{ padding: '20px' }}>
        <button onClick={blendGLBAnimations} disabled={!isSceneReady} style={{ marginRight: '10px', marginBottom: '10px' }}>
          {isSceneReady ? 'Blend GLB Animations' : 'Loading GLB...'}
        </button>
        <button onClick={blendFBXAnimations} disabled={!isSceneReady} style={{ marginRight: '10px', marginBottom: '10px' }}>
          {isSceneReady ? 'Blend FBX Animations' : 'Loading FBX...'}
        </button>
        <button onClick={resetAnimations} disabled={!isSceneReady} style={{ marginBottom: '10px' }}>
          Reset Animations
        </button>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          {debugInfo}
        </pre>
      </div>
    </div>
  );
};

export default App;