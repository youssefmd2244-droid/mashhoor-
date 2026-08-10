import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useDirection } from '../hooks/useDirection';
import { QuickOrderButton } from '../components/ordering/OrderingWidgets';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { onDataChange } from '../lib/store';

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_DESC: TextOverride = {
  ar: 'باستا إيطالية أصلية، تُحضَّر يدوياً كل صباح من أجود أنواع الدقيق. وصفة عائلية عمرها ٨٠ عاماً.',
  en: 'Authentic Italian pasta, hand-rolled every morning from the finest flour. A family recipe 80 years in the making.',
};

function PastaPlate() {
  const plateRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (plateRef.current) {
      plateRef.current.rotation.y += hovered ? 0.015 : 0.005;
    }
    if (lightRef.current) {
      const t = state.clock.elapsedTime;
      lightRef.current.position.x = Math.cos(t * 0.5) * 5;
      lightRef.current.position.z = Math.sin(t * 0.5) * 5;
    }
  });

  return (
    <group
      ref={plateRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main plate */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.18, 64]} />
        <meshStandardMaterial
          color="#F5E9DD"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {/* Plate inner ring */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2.05, 2.05, 0.02, 64]} />
        <meshStandardMaterial color="#EDD8BA" roughness={0.4} />
      </mesh>

      {/* Pasta nest base */}
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.35, 16, 100]} />
        <meshStandardMaterial color="#EEC31C" roughness={0.7} />
      </mesh>

      {/* Pasta strands (rotated) */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2.2, 0.3, 0]}>
        <torusGeometry args={[1.1, 0.18, 12, 80]} />
        <meshStandardMaterial color="#D4A373" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2.5, -0.4, 0]}>
        <torusGeometry args={[0.9, 0.15, 12, 80]} />
        <meshStandardMaterial color="#EEC31C" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[0.7, 0.12, 12, 70]} />
        <meshStandardMaterial color="#CB977F" roughness={0.6} />
      </mesh>

      {/* Tomato sauce dollops */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.8, 0.5, Math.sin(angle) * 0.8]}
          >
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#B3172D" roughness={0.4} />
          </mesh>
        );
      })}

      {/* Basil leaves */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2 + 0.5;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.6, 0.55, Math.sin(angle) * 0.6]}
            rotation={[0.5, angle, 0]}
          >
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#31492D" roughness={0.5} />
          </mesh>
        );
      })}

      {/* Grated cheese */}
      {[...Array(20)].map((_, i) => {
        const a = (i / 20) * Math.PI * 2;
        const r = 0.5 + (i % 3) * 0.3;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, 0.65, Math.sin(a) * r]}
          >
            <boxGeometry args={[0.04, 0.04, 0.04]} />
            <meshStandardMaterial color="#F5E9DD" />
          </mesh>
        );
      })}

      {/* Studio light */}
      <pointLight
        ref={lightRef}
        position={[5, 3, 5]}
        intensity={2}
        color="#FFF8E7"
        distance={15}
      />
    </group>
  );
}

function Particles() {
  const groupRef = useRef<THREE.Points>(null);
  const [positions] = useState(() => {
    const arr = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  });

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      const pos = groupRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        pos.array[i * 3 + 1] += Math.sin(t + i) * 0.002;
      }
      pos.needsUpdate = true;
      groupRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={150}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#CB977F"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default function PastaSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const [desc, setDesc] = useState<TextOverride>(FALLBACK_DESC);
  const [inclDelivery, setInclDelivery] = useState<TextOverride>({ ar: 'يشمل التوصيل', en: 'incl. delivery' });

  useEffect(() => {
    function load() {
      getSiteText('pasta.description', FALLBACK_DESC.ar, FALLBACK_DESC.en).then(setDesc);
      getSiteText('pasta.inclDelivery', inclDelivery.ar, inclDelivery.en).then(setInclDelivery);
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pasta-title',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );
      gsap.fromTo(
        '.pasta-detail',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay: 0.3,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  const isRTL = dir === 'rtl';

  return (
    <section
      id="pasta"
      ref={ref}
      dir={dir}
      className="relative bg-[#B3172D] text-[#F5E9DD] overflow-hidden py-20 lg:py-32"
    >
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3D Canvas */}
          <div className="lg:col-span-7 relative h-[500px] lg:h-[700px]">
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <Canvas
                camera={{ position: [0, 1.5, 6], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
                performance={{ min: 0.4 }}
                onCreated={({ gl }) => {
                  // Recover gracefully instead of leaving a permanently blank
                  // canvas (which reads as "the site just stopped working")
                  // when a low-memory mobile GPU drops the WebGL context —
                  // a known Chrome-on-Android behavior under memory pressure.
                  const canvasEl = gl.domElement;
                  canvasEl.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault(); // tells the browser we intend to restore it
                  });
                  canvasEl.addEventListener('webglcontextrestored', () => {
                    gl.forceContextRestore?.();
                  });
                }}
              >
                <color attach="background" args={['#B3172D']} />
                <ambientLight intensity={0.55} />
                <directionalLight position={[5, 5, 5]} intensity={1} color="#FFF8E7" />
                <directionalLight position={[-5, 3, -5]} intensity={0.5} color="#CB977F" />
                <directionalLight position={[0, -4, 2]} intensity={0.25} color="#F5E9DD" />
                <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
                  <PastaPlate />
                </Float>
                <Particles />
              </Canvas>
            </div>

            {/* Floating label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute top-6 left-6 bg-[#F5E9DD] text-[#B3172D] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
            >
              360° View
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="absolute bottom-6 right-6 bg-[#CB977F] text-[#B3172D] p-3 rounded-full text-2xl"
            >
              🍝
            </motion.div>
          </div>

          {/* Text content */}
          <div className="lg:col-span-5 text-center lg:text-start">
            <div className="inline-block mb-4 text-xs uppercase tracking-widest text-[#CB977F] font-bold">
              — Bambino Pasta Foods
            </div>
            <h2 className="pasta-title font-display text-6xl sm:text-7xl lg:text-8xl font-black italic leading-[0.9] mb-6">
              <span className="block">Bambino</span>
              <span className="block text-[#CB977F] text-stroke">Favorita</span>
            </h2>
            <p
              className="pasta-detail text-base lg:text-lg text-[#F5E9DD]/80 font-light leading-relaxed max-w-md mx-auto lg:mx-0 mb-8"
              style={desc.color ? { color: desc.color } : undefined}
            >
              {isRTL ? desc.ar : desc.en}
            </p>

            {/* Nutrition grid */}
            <div className="grid grid-cols-3 gap-3 pasta-detail mb-8">
              {[
                { v: '480', l: isRTL ? 'سعرة' : 'kcal' },
                { v: '18g', l: isRTL ? 'بروتين' : 'protein' },
                { v: '4.9', l: isRTL ? 'تقييم' : 'rating' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-[#CB977F]/10 border border-[#CB977F]/30 rounded-2xl p-4"
                >
                  <div className="text-2xl lg:text-3xl font-display font-black italic text-[#CB977F]">
                    {s.v}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-[#F5E9DD]/60 mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pasta-detail flex-wrap">
              <div className="[&_button]:!rounded-full max-w-xs">
                <QuickOrderButton item={{ id: 'pasta-bambino', nameAr: 'باستا بامبينو فافوريتا', nameEn: 'Bambino Favorita', price: 95 }} />
              </div>
              <div className="text-start">
                <div className="text-3xl font-display font-black italic">95 EGP</div>
                <div className="text-[10px] uppercase tracking-widest text-[#F5E9DD]/50">
                  {isRTL ? inclDelivery.ar : inclDelivery.en}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
