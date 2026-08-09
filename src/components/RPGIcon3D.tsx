import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// The site's "RPG medallion" brand mark — a small rotating 3D emblem used
// for the loading screen (Loader.tsx) and the Icon Code credit mark
// (Footer.tsx). Upgraded from a flat spinning disc into a proper "تحفة":
// a beveled medallion body + an inner gem that breathes light on and off
// like an enchanted RPG item, plus a slow-turning outer ring of light.
//
// Perf notes (still deliberately light, unlike PastaSection's canvas):
// - No HDRI environment, no shadows — only 3 lights total, all cheap.
// - Low-poly geometry only (icosahedron gem, 8-sided cylinder/torus body).
// - Canvas is only mounted while it's actually on screen (IntersectionObserver)
//   so it costs nothing while scrolled past.
// - dpr capped at 1.5.

function Medallion({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const gem = useRef<THREE.Mesh>(null);
  const gemLight = useRef<THREE.PointLight>(null);
  const ring = useRef<THREE.Mesh>(null);
  const gemMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    // Whole medallion turns steadily, like it's being examined in an
    // inventory screen.
    if (group.current) group.current.rotation.y += delta * 0.6;
    // The gem spins a bit faster on its own axis, independent of the body.
    if (gem.current) {
      gem.current.rotation.y += delta * 1.3;
      gem.current.rotation.x += delta * 0.4;
    }
    // The outer ring drifts the opposite way, so the piece reads as
    // several moving parts rather than one flat spinning sticker.
    if (ring.current) ring.current.rotation.z -= delta * 0.35;

    // "Lights up and turns off" — a smooth breathing pulse between a dim
    // glow and a bright flare, on a ~2.2s cycle, using an eased sine so it
    // doesn't feel like a blinking LED.
    const pulse = (Math.sin(t * 2.8) + 1) / 2; // 0 → 1 → 0
    const eased = pulse * pulse * (3 - 2 * pulse); // smoothstep
    const glow = 0.35 + eased * 2.6;
    if (gemMat.current) gemMat.current.emissiveIntensity = glow;
    if (gemLight.current) gemLight.current.intensity = 0.4 + eased * 3.2;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
      <group ref={group}>
        {/* Body */}
        <mesh>
          <cylinderGeometry args={[1.15, 1.15, 0.28, 8]} />
          <meshStandardMaterial color={color} metalness={0.75} roughness={0.25} />
        </mesh>
        {/* Beveled rim */}
        <mesh position={[0, 0, 0.16]}>
          <torusGeometry args={[0.95, 0.08, 8, 8]} />
          <meshStandardMaterial color="#EEC31C" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Slow counter-rotating outer light ring — reads as an enchanted halo */}
        <mesh ref={ring} position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.28, 0.02, 6, 24]} />
          <meshStandardMaterial
            color="#EEC31C"
            emissive="#EEC31C"
            emissiveIntensity={1.2}
            metalness={0.3}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>
        {/* The gem: this is what actually "lights up and turns off" */}
        <mesh ref={gem} position={[0, 0, 0.32]}>
          <icosahedronGeometry args={[0.34, 0]} />
          <meshStandardMaterial
            ref={gemMat}
            color="#ff5a3c"
            emissive="#ff3b1a"
            emissiveIntensity={1}
            metalness={0.2}
            roughness={0.15}
            toneMapped={false}
          />
        </mesh>
        <pointLight ref={gemLight} position={[0, 0, 0.6]} color="#ff5a3c" distance={2.4} intensity={1} />
      </group>
    </Float>
  );
}

export default function RPGIcon3D({
  letter,
  color = '#750001',
  size = 96,
}: {
  letter: string;
  color?: string;
  size?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '100px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: size, height: size }} className="relative shrink-0">
      {visible && (
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 3, 4]} intensity={1.1} />
          <Suspense fallback={null}>
            <Medallion color={color} />
          </Suspense>
        </Canvas>
      )}
      {(() => {
        // Support a single short glyph ("م", "IC") at a big size, or a
        // longer label ("ICON CODE") split onto stacked lines at a
        // smaller size so it still reads clearly inside the medallion.
        const words = letter.trim().split(/\s+/).filter(Boolean);
        const isLabel = words.length > 1 || letter.trim().length > 3;
        const fontSize = words.length > 1 ? size * 0.155 : isLabel ? size * 0.22 : size * 0.4;
        return (
          <span
            className="absolute inset-0 flex flex-col items-center justify-center font-display font-black italic pointer-events-none text-center leading-[1.15]"
            style={{ color: '#EEC31C', fontSize, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            {words.length > 1 ? words.map((w, i) => <span key={i}>{w}</span>) : letter}
          </span>
        );
      })()}
    </div>
  );
}
