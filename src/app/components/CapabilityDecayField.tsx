"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { View, OrthographicCamera } from "@react-three/drei";
import type { MotionValue } from "framer-motion";

// Fixed frustum the whole grid is authored against (see CapabilitiesGrid's
// hover-coordinate mapping, which must stay in this same space).
export const ASPECT = 1.8;

const GRID_COLS = 9;
const GRID_ROWS = 5;

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// Same token always erodes in the same order: a shuffled rank per point,
// seeded from the capability id, drives when that point disappears.
function buildGrid(seed: string) {
  const rand = mulberry32(hashSeed(seed));
  const count = GRID_COLS * GRID_ROWS;
  const positions = new Float32Array(count * 3);
  const thresholds = new Float32Array(count);

  let i = 0;
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      positions[i * 3] = (col / (GRID_COLS - 1) - 0.5) * 2 * ASPECT * 0.82;
      positions[i * 3 + 1] = (row / (GRID_ROWS - 1) - 0.5) * 2 * 0.78;
      positions[i * 3 + 2] = 0;
      i++;
    }
  }

  const order = Array.from({ length: count }, (_, idx) => idx);
  for (let k = order.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1));
    [order[k], order[j]] = [order[j], order[k]];
  }
  order.forEach((pointIdx, rank) => {
    thresholds[pointIdx] = (rank + 0.5) / count + (rand() - 0.5) * (0.5 / count);
  });

  return { positions, thresholds };
}

const VERTEX_SHADER = `
  attribute float aThreshold;
  uniform float uErosion;
  uniform float uPointSize;
  uniform vec2 uHover;
  uniform float uHoverActive;
  varying float vAlive;
  varying float vGlow;

  void main() {
    float edge = 0.035;
    float alive = 1.0 - smoothstep(uErosion - edge, uErosion + edge, aThreshold);
    vAlive = alive;

    float dist = distance(position.xy, uHover);
    vGlow = uHoverActive * smoothstep(0.55, 0.0, dist);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize * (1.0 + vGlow * 1.6);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uInkColor;
  uniform vec3 uDangerColor;
  uniform float uDanger;
  varying float vAlive;
  varying float vGlow;

  void main() {
    if (vAlive < 0.04) discard;
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float shape = smoothstep(0.5, 0.3, d);

    vec3 color = mix(uInkColor, uDangerColor, uDanger);
    float alpha = shape * vAlive * (0.4 + vGlow * 0.6);
    gl_FragColor = vec4(color, alpha);
  }
`;

interface DecayPointsProps {
  positions: Float32Array;
  thresholds: Float32Array;
  erosion: MotionValue<number>;
  danger: MotionValue<number>;
  hoverX: MotionValue<number>;
  hoverY: MotionValue<number>;
  hoverActive: MotionValue<number>;
}

function DecayPoints({ positions, thresholds, erosion, danger, hoverX, hoverY, hoverActive }: DecayPointsProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uErosion: { value: 0 },
      uPointSize: { value: 5.5 },
      uHover: { value: new THREE.Vector2(0, 0) },
      uHoverActive: { value: 0 },
      uInkColor: { value: new THREE.Color("#17150f") },
      uDangerColor: { value: new THREE.Color("#ef4444") },
      uDanger: { value: 0 },
    }),
    []
  );

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uErosion.value = erosion.get();
    mat.uniforms.uDanger.value = danger.get();
    mat.uniforms.uHover.value.set(hoverX.get(), hoverY.get());
    mat.uniforms.uHoverActive.value = hoverActive.get();
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    mat.uniforms.uInkColor.value.set(isDark ? "#e6e8eb" : "#17150f");
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aThreshold" args={[thresholds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms,
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthWrite: false,
            depthTest: false,
          },
        ]}
      />
    </points>
  );
}

interface DecayFieldViewProps {
  seed: string;
  erosion: MotionValue<number>;
  danger: MotionValue<number>;
  hoverX: MotionValue<number>;
  hoverY: MotionValue<number>;
  hoverActive: MotionValue<number>;
}

export function DecayFieldView({ seed, erosion, danger, hoverX, hoverY, hoverActive }: DecayFieldViewProps) {
  const { positions, thresholds } = useMemo(() => buildGrid(seed), [seed]);

  return (
    <View className="absolute inset-0">
      {/* `manual` stops View's scissor logic from re-deriving the frustum
          from the tracked div's pixel size, so our fixed [-ASPECT, ASPECT]
          plane stays put regardless of the card's actual rendered size. */}
      <OrthographicCamera
        makeDefault
        manual
        left={-ASPECT}
        right={ASPECT}
        top={1}
        bottom={-1}
        near={0.1}
        far={10}
        position={[0, 0, 1]}
      />
      <DecayPoints
        positions={positions}
        thresholds={thresholds}
        erosion={erosion}
        danger={danger}
        hoverX={hoverX}
        hoverY={hoverY}
        hoverActive={hoverActive}
      />
    </View>
  );
}

// One shared WebGL context for every card's decay-field. Mount this once
// per section; individual cards render only a <DecayFieldView> each, which
// tunnels its scene into this canvas via drei's <View> multi-viewport.
export function DecayFieldCanvas({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        // R3F defaults this wrapper to pointer-events: auto (for its own
        // raycasting) which would otherwise let this full-viewport canvas
        // swallow every mouse event on the page. We don't use R3F's pointer
        // events at all (hover is driven by plain DOM listeners on the
        // cards), so it must stay click/hover-through.
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}

// Gate the shader path behind reduced-motion, WebGL support, and
// coarse-pointer+narrow-viewport devices (see fallback bar in CapabilitiesGrid).
export function useCanShowShader() {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const narrowViewport = window.matchMedia("(max-width: 767px)");

    let webglOk = false;
    try {
      const testCanvas = document.createElement("canvas");
      webglOk = !!(testCanvas.getContext("webgl2") || testCanvas.getContext("webgl"));
    } catch {
      webglOk = false;
    }

    const evaluate = () => {
      setCapable(webglOk && !reducedMotion.matches && !(coarsePointer.matches && narrowViewport.matches));
    };

    evaluate();
    reducedMotion.addEventListener("change", evaluate);
    coarsePointer.addEventListener("change", evaluate);
    narrowViewport.addEventListener("change", evaluate);

    return () => {
      reducedMotion.removeEventListener("change", evaluate);
      coarsePointer.removeEventListener("change", evaluate);
      narrowViewport.removeEventListener("change", evaluate);
    };
  }, []);

  return capable;
}
