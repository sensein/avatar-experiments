import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const AnimationPreview: React.FC<{
  avatarUrl: string;
  animationUrl: string;
  onSelect: (animationUrl: string) => void;
}> = ({ avatarUrl, animationUrl, onSelect }) => {
  const [avatar, setAvatar] = useState<THREE.Group | null>(null);
  const [animation, setAnimation] = useState<THREE.AnimationClip | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(avatarUrl, (gltf) => {
      setAvatar(gltf.scene);
      
      loader.load(animationUrl, (animGltf) => {
        setAnimation(animGltf.animations[0]);
      });
    });
  }, [avatarUrl, animationUrl]);

  useEffect(() => {
    if (avatar && animation) {
      mixerRef.current = new THREE.AnimationMixer(avatar);
      const action = mixerRef.current.clipAction(animation);
      action.play();
      action.loop = THREE.LoopRepeat;
    }
  }, [avatar, animation]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <>
      {avatar && <primitive object={avatar} scale={1.5} position={[0, -0.9, 0]} />}
      <spotLight
        position={[3, 3, 3]}
        angle={0.6}
        penumbra={1}
        intensity={0.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        color="#faf0e6"
      />
      <pointLight position={[-3, 2, 0]} intensity={0.3} color="#e6f0fa" />
      <pointLight position={[0, 2, -3]} intensity={0.2} color="#f0fae6" />
      <ambientLight intensity={0.4} />
    </>
  );
};

export default AnimationPreview;