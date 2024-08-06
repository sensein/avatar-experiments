import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const Avatar: React.FC<{
  avatarUrl: string;
  currentAnimation: string | null;
  currentLipsyncAudio: string | null;
  isLipsyncPlaying: boolean;
}> = ({ avatarUrl, currentAnimation, currentLipsyncAudio, isLipsyncPlaying }) => {
  const [avatar, setAvatar] = useState<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const morphTargetMeshesRef = useRef<{[key: string]: THREE.Mesh}>({});
  const lipsyncDataRef = useRef<any>(null);
  const currentCueRef = useRef<any>(null);
  const targetValuesRef = useRef<{ [key: string]: number }>({});
  const currentValuesRef = useRef<{ [key: string]: number }>({});
  const lerpFactorRef = useRef<number>(0);
  const lipsyncStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (avatarUrl) {
      const loader = new GLTFLoader();
      loader.load(avatarUrl, (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.morphTargetDictionary && child.morphTargetInfluences) {
              if (['Wolf3D_Avatar', 'Wolf3D_Head', 'Wolf3D_Teeth', 'Wolf3D_Beard'].includes(child.name)) {
                morphTargetMeshesRef.current[child.name] = child;
                console.log(`Morph targets found for ${child.name}:`, Object.keys(child.morphTargetDictionary));
              }
            }
          }
        });
        setAvatar(model);
        mixerRef.current = new THREE.AnimationMixer(model);

        // Load idle animation
        loader.load('/animations/idle/F_Standing_Idle_001.glb', (idleGltf) => {
          const idleAnimation = idleGltf.animations[0];
          idleActionRef.current = mixerRef.current!.clipAction(idleAnimation);
          idleActionRef.current.play();
          idleActionRef.current.loop = THREE.LoopRepeat;
          currentActionRef.current = idleActionRef.current;
        });

        console.log('Avatar loaded:', model);
        console.log('Morph target meshes:', Object.keys(morphTargetMeshesRef.current));
      });
    }
  }, [avatarUrl]);

  useEffect(() => {
    if (avatar && currentAnimation && mixerRef.current) {
      const loader = new GLTFLoader();
      loader.load(currentAnimation, (gltf) => {
        const animationClip = gltf.animations[0];
        const newAction = mixerRef.current!.clipAction(animationClip);

        if (currentActionRef.current && currentActionRef.current !== newAction) {
          newAction.reset();
          newAction.play();
          currentActionRef.current.crossFadeTo(newAction, 0.5, true);
          currentActionRef.current = newAction;
        }

        newAction.clampWhenFinished = true;
        newAction.loop = THREE.LoopOnce;

        const onLoopFinished = (e: any) => {
          if (e.action === newAction) {
            if (idleActionRef.current) {
              newAction.crossFadeTo(idleActionRef.current, 0.5, true);
              idleActionRef.current.play();
              currentActionRef.current = idleActionRef.current;
            }
            mixerRef.current!.removeEventListener('loop', onLoopFinished);
          }
        };

        mixerRef.current!.addEventListener('loop', onLoopFinished);

        return () => {
          mixerRef.current?.removeEventListener('loop', onLoopFinished);
        };
      });
    }
  }, [avatar, currentAnimation]);

  useEffect(() => {
    if (currentLipsyncAudio) {
      console.log('Loading lipsync data for:', currentLipsyncAudio);
      const audioNumber = currentLipsyncAudio.match(/TestAudio(\d+)\.mp3/)?.[1];
      const lipsyncDataFile = `/viseme/Viseme${audioNumber}.json`;
      
      fetch(lipsyncDataFile)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          lipsyncDataRef.current = data;
          console.log("Loaded lipsync data:", data);
        })
        .catch(error => console.error('Error loading lipsync data:', error));
    }
  }, [currentLipsyncAudio]);

  useEffect(() => {
    console.log('isLipsyncPlaying changed:', isLipsyncPlaying);
    if (isLipsyncPlaying) {
      lipsyncStartTimeRef.current = performance.now() / 1000;
      console.log("Starting lipsync playback");
    } else {
      console.log("Stopping lipsync playback");
      resetToNeutralExpression();
    }
  }, [isLipsyncPlaying]);

  const visemeToBlendShape: { [key: string]: string[] } = {
    'X': ['viseme_sil'],
    'A': ['viseme_PP'],
    'B': ['viseme_kk'],
    'C': ['viseme_I'],
    'D': ['viseme_aa'],
    'E': ['viseme_O'],
    'F': ['viseme_U'],
    'G': ['viseme_FF'],
    'H': ['viseme_TH'],
  };

  const resetToNeutralExpression = () => {
    const shapes = Object.values(visemeToBlendShape).flat();
    const values = new Array(shapes.length).fill(0);
    setBlendShapes(shapes, values);
    currentValuesRef.current = Object.fromEntries(shapes.map(shape => [shape, 0]));
    targetValuesRef.current = { ...currentValuesRef.current };
  };

  const setBlendShapes = (shapes: string[], values: number[]) => {
    Object.entries(morphTargetMeshesRef.current).forEach(([meshName, mesh]) => {
      shapes.forEach((shape, index) => {
        const morphIndex = mesh.morphTargetDictionary?.[shape];
        if (morphIndex !== undefined && mesh.morphTargetInfluences) {
          if (meshName === 'Wolf3D_Teeth') {
            // For teeth, only apply certain visemes and use a smaller multiplier
            if (['viseme_aa', 'viseme_E', 'viseme_O'].includes(shape)) {
              mesh.morphTargetInfluences[morphIndex] = values[index] * 0.6;
            } else {
              mesh.morphTargetInfluences[morphIndex] = 0;
            }
          } else {
            // For other meshes, apply all visemes normally
            mesh.morphTargetInfluences[morphIndex] = values[index] * 0.6;
          }
        }
      });
    });
  };

  const animateLipsync = (delta: number) => {
    if (!lipsyncDataRef.current || !isLipsyncPlaying || lipsyncStartTimeRef.current === null) {
      return;
    }

    const currentTime = performance.now() / 1000 - lipsyncStartTimeRef.current;
    const currentCue = lipsyncDataRef.current.mouthCues.find((cue: any) => 
      currentTime >= cue.start && currentTime < cue.end
    );

    if (currentCue && currentCue !== currentCueRef.current) {
      console.log("Current cue:", currentCue);
      const blendShapes = visemeToBlendShape[currentCue.value];
      if (blendShapes) {
        Object.values(visemeToBlendShape).flat().forEach(shape => {
          targetValuesRef.current[shape] = blendShapes.includes(shape) ? 1 : 0;
        });
      }
      currentCueRef.current = currentCue;
      lerpFactorRef.current = 0;
    }

    // Interpolate between current and target values
    lerpFactorRef.current = Math.min(lerpFactorRef.current + delta * 5, 1);  // Adjust this value for smoother or faster transitions, might add a delay to the animation so dont go too high or above 15
    const shapes = Object.keys(targetValuesRef.current);
    const values = shapes.map(shape => {
      const current = currentValuesRef.current[shape] || 0;
      const target = targetValuesRef.current[shape] || 0;
      const value = THREE.MathUtils.lerp(current, target, lerpFactorRef.current);
      currentValuesRef.current[shape] = value;
      return value;
    });

    setBlendShapes(shapes, values);
  };

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    if (isLipsyncPlaying) {
      animateLipsync(delta);
    }
  });

  return avatar ? <primitive object={avatar} scale={1.5} position={[0, -1, 0]} /> : null;
};

export default Avatar;