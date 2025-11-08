import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Import local Earth textures - these will be resolved by Vite
import AlbedoTextureUrl from '../assets/Albedo.jpg';
import BumpTextureUrl from '../assets/Bump.jpg';
import CloudsTextureUrl from '../assets/Clouds.png';
import OceanTextureUrl from '../assets/Ocean.png';
import NightLightsTextureUrl from '../assets/night_lights_modified.png';
import GaiaSkyTextureUrl from '../assets/Gaia_EDR3_darkened.png';

// Import shaders
import vertexShaderSource from '../assets/shaders/vertex.glsl?raw';
import fragmentShaderSource from '../assets/shaders/fragment.glsl?raw';

// Brampton, ON coordinates
const BRAMPTON_LAT = 43.6843;
const BRAMPTON_LON = -79.7594;

// Convert lat/lon to 3D coordinates on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

// Using local textures - no need for URLs

// Earth component with all features from tutorial
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const speedFactor = 2.0;
  const uvXOffset = useRef(0);
  
  const [textures, setTextures] = useState<{
    albedo?: THREE.Texture;
    bump?: THREE.Texture;
    clouds?: THREE.Texture;
    ocean?: THREE.Texture;
    nightLights?: THREE.Texture;
  }>({});

  // Load textures using TextureLoader
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    // Load all textures with error handling
    loader.load(
      AlbedoTextureUrl, 
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        setTextures(prev => ({ ...prev, albedo: texture }));
        console.log('Albedo texture loaded successfully');
      },
      undefined,
      (error) => {
        console.error('Failed to load Albedo texture:', error);
      }
    );
    
    loader.load(
      BumpTextureUrl, 
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        setTextures(prev => ({ ...prev, bump: texture }));
      },
      undefined,
      (error) => {
        console.warn('Failed to load Bump texture:', error);
      }
    );
    
    loader.load(
      CloudsTextureUrl, 
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        setTextures(prev => ({ ...prev, clouds: texture }));
      },
      undefined,
      (error) => {
        console.warn('Failed to load Clouds texture:', error);
      }
    );
    
    loader.load(
      OceanTextureUrl, 
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        setTextures(prev => ({ ...prev, ocean: texture }));
      },
      undefined,
      (error) => {
        console.warn('Failed to load Ocean texture:', error);
      }
    );
    
    loader.load(
      NightLightsTextureUrl, 
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        setTextures(prev => ({ ...prev, nightLights: texture }));
      },
      undefined,
      (error) => {
        console.warn('Failed to load Night Lights texture:', error);
      }
    );
  }, []);

  // Setup shader modifications for cloud shadows
  useEffect(() => {
    if (!materialRef.current || !textures.clouds) return;

    const material = materialRef.current;
    const cloudsMap = textures.clouds;

    // Only set up once
    if (material.userData.shaderSetup) return;
    
    material.onBeforeCompile = function(shader) {
      shader.uniforms.tClouds = { value: cloudsMap };
      shader.uniforms.tClouds.value.wrapS = THREE.RepeatWrapping;
      shader.uniforms.uv_xOffset = { value: 0 };

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D tClouds;
        uniform float uv_xOffset;`
      );

      // Add ocean roughness modification
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
          texelRoughness = vec4(1.0) - texelRoughness;
          roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);
        #endif`
      );

      // Add night lights and cloud shadows
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#ifdef USE_EMISSIVEMAP
          vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
          // Use transformedNormal which is available in MeshStandardMaterial shader
          emissiveColor *= 1.0 - smoothstep(-0.02, 0.0, dot(transformedNormal, directionalLights[0].direction));
          totalEmissiveRadiance *= emissiveColor.rgb;
        #endif
        
        // Cloud shadow calculation
        float cloudsMapValue = texture2D(tClouds, vec2(vMapUv.x - uv_xOffset, vMapUv.y)).r;
        diffuseColor.rgb *= max(1.0 - cloudsMapValue, 0.2);
        
        // Atmospheric fresnel effect
        // Use transformedNormal which is available in MeshStandardMaterial shader
        float intensity = 1.4 - dot(transformedNormal, vec3( 0.0, 0.0, 1.0 ) );
        vec3 atmosphere = vec3( 0.3, 0.6, 1.0 ) * pow(intensity, 5.0);
        diffuseColor.rgb += atmosphere;`
      );

      material.userData.shader = shader;
      material.userData.shaderSetup = true;
    };
    
    // Force recompile
    material.needsUpdate = true;
  }, [textures.clouds]);

  // Animation loop
  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotateY(delta * 0.005 * speedFactor);
    }
    
    if (cloudsRef.current) {
      cloudsRef.current.rotateY(delta * 0.01 * speedFactor);
    }

    // Update cloud shadow offset
    if (materialRef.current?.userData.shader) {
      const shader = materialRef.current.userData.shader;
      const offset = (delta * 0.005 * speedFactor) / (2 * Math.PI);
      uvXOffset.current = (uvXOffset.current + offset) % 1;
      shader.uniforms.uv_xOffset.value = uvXOffset.current;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, (23.5 / 360) * 2 * Math.PI]}>
      {/* Earth mesh */}
      {textures.albedo && (
        <mesh ref={earthRef} rotation={[0, -0.3, 0]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            ref={materialRef}
            map={textures.albedo}
            bumpMap={textures.bump}
            bumpScale={0.03}
            roughnessMap={textures.ocean}
            metalness={0.1}
            metalnessMap={textures.ocean}
            emissiveMap={textures.nightLights}
            emissive={new THREE.Color(0xffff88)}
          />
        </mesh>
      )}

      {/* Clouds layer */}
      {textures.clouds && (
        <mesh ref={cloudsRef} rotation={[0, -0.3, 0]}>
          <sphereGeometry args={[1.005, 64, 64]} />
          <meshStandardMaterial
            alphaMap={textures.clouds}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// Atmosphere component with custom shader
function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = {
    atmOpacity: { value: 0.7 },
    atmPowFactor: { value: 4.1 },
    atmMultiplier: { value: 9.5 },
  };

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.25, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShaderSource}
        fragmentShader={fragmentShaderSource}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
      />
    </mesh>
  );
}

// Heatmap overlay component
function HeatmapOverlay() {
  const heatmapData = [
    { lat: 43.6843, lon: -79.7594, intensity: 0.2, label: 'Downtown Brampton' },
    { lat: 43.7000, lon: -79.7500, intensity: 0.3, label: 'Low tree coverage' },
    { lat: 43.6700, lon: -79.7700, intensity: 0.9, label: 'High tree coverage' },
    { lat: 43.6900, lon: -79.7400, intensity: 0.2, label: 'Urban area' },
    { lat: 43.6600, lon: -79.7800, intensity: 0.8, label: 'Park area' },
    { lat: 43.7100, lon: -79.7600, intensity: 0.4, label: 'Residential' },
    { lat: 43.6500, lon: -79.7900, intensity: 0.6, label: 'Mixed zone' },
    { lat: 43.6800, lon: -79.7300, intensity: 0.25, label: 'Industrial' },
    { lat: 43.6950, lon: -79.7800, intensity: 0.7, label: 'Suburban' },
    { lat: 43.6750, lon: -79.7900, intensity: 0.85, label: 'Green space' },
    { lat: 43.7050, lon: -79.7400, intensity: 0.35, label: 'Commercial' },
    { lat: 43.6550, lon: -79.7600, intensity: 0.75, label: 'Residential park' },
  ];

  return (
    <group>
      {heatmapData.map((point, index) => {
        const position = latLonToVector3(point.lat, point.lon, 1.01);
        const color = new THREE.Color();
        
        if (point.intensity < 0.5) {
          color.setRGB(1, 1 - point.intensity * 2, 0);
        } else {
          color.setRGB(1 - (point.intensity - 0.5) * 2, 1, 0);
        }

        return (
          <group key={index} position={position}>
            <mesh>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={2}
                transparent
                opacity={0.9}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.15, 32]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={1.5}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.15, 0.25, 32]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.8}
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Camera controller to zoom to Brampton
function CameraController() {
  const { camera } = useThree();
  const [hasZoomed, setHasZoomed] = useState(false);

  useEffect(() => {
    if (!hasZoomed) {
      const targetPos = latLonToVector3(BRAMPTON_LAT, BRAMPTON_LON, 2.5);
      
      const animate = () => {
        const startPos = camera.position.clone();
        const startTime = Date.now();
        const duration = 3000;

        const animateCamera = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          
          camera.position.lerpVectors(startPos, targetPos, ease);
          const bramptonPos = latLonToVector3(BRAMPTON_LAT, BRAMPTON_LON, 1);
          camera.lookAt(bramptonPos);
          
          if (progress < 1) {
            requestAnimationFrame(animateCamera);
          } else {
            setHasZoomed(true);
          }
        };
        
        animateCamera();
      };
      
      setTimeout(animate, 500);
    }
  }, [camera, hasZoomed]);

  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1.5}
      maxDistance={5}
      autoRotate={false}
    />
  );
}

// Galactic background component
function GalacticBackground() {
  const { scene } = useThree();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      GaiaSkyTextureUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
      },
      undefined,
      () => {
        // Fallback to stars if texture fails
        console.log('Using stars as fallback background');
      }
    );
  }, [scene]);

  return null;
}

// Main Earth Scene
export default function EarthScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: '#000011' }}
        gl={{ outputColorSpace: THREE.SRGBColorSpace }}
      >
        {/* Lighting - Directional light as sun */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[-5, 0, 3]} intensity={1.3} />
        
        <GalacticBackground />
        <Stars radius={300} depth={50} count={5000} factor={4} fade speed={1} />
        
        <Earth />
        <Atmosphere />
        <HeatmapOverlay />
        <CameraController />
        
        {/* Brampton marker */}
        <group position={latLonToVector3(BRAMPTON_LAT, BRAMPTON_LON, 1.02)}>
          <mesh>
            <coneGeometry args={[0.05, 0.15, 8]} />
            <meshStandardMaterial 
              color="#ff0000" 
              emissive="#ff0000" 
              emissiveIntensity={2}
            />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial 
              color="#ff0000" 
              emissive="#ff0000" 
              emissiveIntensity={2}
            />
          </mesh>
        </group>
      </Canvas>
      
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 10,
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>SpaceWatch</h2>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Location:</strong> Brampton, ON
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Heatmap:</strong> Tree Coverage Analysis
        </p>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', margin: '3px 0' }}>
            <div style={{ width: '12px', height: '12px', background: '#ff0000', marginRight: '8px', borderRadius: '50%' }}></div>
            <span>Low tree coverage (hotter)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', margin: '3px 0' }}>
            <div style={{ width: '12px', height: '12px', background: '#ffff00', marginRight: '8px', borderRadius: '50%' }}></div>
            <span>Moderate coverage</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', margin: '3px 0' }}>
            <div style={{ width: '12px', height: '12px', background: '#00ff00', marginRight: '8px', borderRadius: '50%' }}></div>
            <span>High tree coverage (cooler)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
