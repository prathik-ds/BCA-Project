import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Icosahedron, Octahedron, Environment, Sparkles } from '@react-three/drei'

function RealisticCore() {
  const innerRef = useRef()
  const outerRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (innerRef.current) {
      innerRef.current.rotation.x = t * 0.5
      innerRef.current.rotation.y = t * 0.8
    }
    if (outerRef.current) {
      outerRef.current.rotation.x = t * 0.2
      outerRef.current.rotation.y = t * 0.3
      outerRef.current.position.y = Math.sin(t * 2) * 0.1
    }
  })

  return (
    <group>
      {/* Inner Energy Core */}
      <Octahedron ref={innerRef} args={[0.8, 0]}>
        <meshStandardMaterial 
          color="#06e8e1" 
          emissive="#06e8e1" 
          emissiveIntensity={2} 
          wireframe
        />
      </Octahedron>

      {/* Outer Glass Shell */}
      <Icosahedron ref={outerRef} args={[1.5, 0]}>
        <MeshTransmissionMaterial 
          backside 
          samples={4} 
          thickness={0.5} 
          roughness={0}
          chromaticAberration={0.5} 
          anisotropy={0.3} 
          distortion={0.2} 
          distortionScale={0.5} 
          temporalDistortion={0.2} 
          clearcoat={1} 
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
          color="#f472b6"
        />
      </Icosahedron>
    </group>
  )
}

export default function Hero3D() {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={1} />
        
        {/* Environment map for realistic glass reflection */}
        <Environment preset="city" />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
           <RealisticCore />
        </Float>
        
        {/* Floating dust */}
        <Sparkles count={200} scale={10} size={2} speed={0.4} opacity={0.4} color="#06e8e1" />
      </Canvas>
    </div>
  )
}
