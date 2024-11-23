import React, { useRef, useState, useEffect, useTransition } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const socket = new WebSocket("wss://back-end-boat.onrender.com/8080");

socket.onopen = () => {
    console.log("Conectado al servidor WebSocket");
};

// Supongamos que tienes una función que detecta la rotación del objeto en Three.js
function sendRotationToWebSocket(angle) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(angle.toString());
    }
}


const RotatingModel = ({ model, scrollRotation }) => {
  const modelRef = useRef();
  let temp = 0;
  // Rotate the model based on scroll delta
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.z = scrollRotation; // Rotate around Z-axis based on scroll
      const rotationInDegrees = modelRef.current.rotation.z * (180 / Math.PI);
      if (temp != rotationInDegrees) {
      sendRotationToWebSocket(rotationInDegrees)
      console.log(rotationInDegrees)
    }
      temp = rotationInDegrees
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={model}
      scale={0.08}
      position={[0, -1.5, 0]} // Adjusted initial position (x, y, z)
      rotation={[1.7, 3.2, 0]} // Adjusted initial rotation (x, y, z in radians)
    />
  );
};



const ThreeScene = () => {
  const [isPending, startTransition] = useTransition(); // This hook tracks the loading state
  const [model, setModel] = useState(null);
  const [scrollRotation, setScrollRotation] = useState(0); // Tracks rotation based on scroll

  // Load the 3D model (GLTF format)
  const { scene, isLoading } = useGLTF('model.glb');

  // Set the loaded model when it's available
  useEffect(() => {
    if (scene) {
      startTransition(() => {
        setModel(scene); // Update model state inside startTransition
      });
    }
  }, [scene]);

  // Handle scroll event to rotate the model
  useEffect(() => {
    const handleScroll = (event) => {
      setScrollRotation((prev) => prev + event.deltaY * 0.001); // Adjust rotation speed
    };

    window.addEventListener('wheel', handleScroll);
    return () => {
      window.removeEventListener('wheel', handleScroll); // Cleanup on unmount
    };
  }, []);

  return (
    <Canvas
      style={{
        background: '#1a1a1a', // Dark background
        width: '100vw', // Full viewport width
        height: '100vh', // Full viewport height
        display: 'block', // Ensures the canvas fills the space without gaps
        position: 'absolute', // Ensures canvas is positioned relative to the viewport
        top: 0, // Align top to 0 for fullscreen effect
        left: 0, // Align left to 0 for fullscreen effect
      }}
    >
      {/* Set up lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {/* Render model only if it's loaded */}
      {model && <RotatingModel model={model} scrollRotation={scrollRotation} />}

      {/* Loading spinner while the model is loading */}
      {isLoading && (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      )}
    </Canvas>
  );
};

export default ThreeScene;
