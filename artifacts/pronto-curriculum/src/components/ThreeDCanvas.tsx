import { useEffect, useRef } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  ox: number; // Original x
  oy: number; // Original y
  oz: number; // Original z
  color: string;
}

export default function ThreeDCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Generate 3D points on a sphere (globe)
    const points: Point3D[] = [];
    const numPoints = 90;
    const radius = Math.min(width, height) * 0.4; // Larger radius

    for (let i = 0; i < numPoints; i++) {
      // Golden spiral distribution on sphere
      const theta = Math.acos(-1 + (2 * i) / numPoints);
      const phi = Math.sqrt(numPoints * Math.PI) * theta;

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      points.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        color: i % 4 === 0 
          ? "rgba(79, 70, 229, 0.95)" // Neon Indigo
          : i % 4 === 1 
          ? "rgba(139, 92, 246, 0.95)" // Neon Violet
          : i % 4 === 2
          ? "rgba(217, 70, 239, 0.95)" // Neon Magenta
          : "rgba(245, 158, 11, 0.95)", // Neon Gold
      });
    }

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Handle Mouse Move for rotation influence
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      mouseRef.current.tx = x * 0.04;
      mouseRef.current.ty = y * 0.04;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Angles of rotation
    let angleX = 0.002;
    let angleY = 0.003;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Damp mouse coordinates
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.08;

      const currentAngleX = angleX + mouseRef.current.y * 0.0005;
      const currentAngleY = angleY + mouseRef.current.x * 0.0005;

      const radX = currentAngleX;
      const radY = currentAngleY;

      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      // Rotate points
      points.forEach((p) => {
        // Rotate Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate X
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        p.x = x1;
        p.y = y2;
        p.z = z2;
      });

      // Perspective settings
      const focalLength = 400;
      const centerX = width / 2;
      const centerY = height / 2;

      // Project points to 2D
      const projected = points.map((p) => {
        const scale = focalLength / (focalLength + p.z + radius * 1.1);
        return {
          sx: centerX + p.x * scale,
          sy: centerY + p.y * scale,
          sz: p.z,
          scale,
          color: p.color,
        };
      });

      // Sort by depth (render back points first)
      projected.sort((a, b) => b.sz - a.sz);

      // Draw Connections (plexus lines)
      ctx.lineWidth = 0.75; // Thicker lines
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        let connections = 0;

        for (let j = i + 1; j < projected.length; j++) {
          if (connections > 3) break;

          const p2 = projected[j];
          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect if they are visually close
          if (dist < 100) {
            connections++;
            const alpha = (1 - dist / 100) * 0.3 * p1.scale;
            ctx.strokeStyle = p1.color.includes("79")
              ? `rgba(79, 70, 229, ${alpha * 1.5})`
              : p1.color.includes("139")
              ? `rgba(139, 92, 246, ${alpha * 1.5})`
              : p1.color.includes("217")
              ? `rgba(217, 70, 239, ${alpha * 1.5})`
              : `rgba(245, 158, 11, ${alpha * 1.5})`;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }
      }

      // Draw Nodes/Points
      projected.forEach((p) => {
        const size = (p.sz < 0 ? 5.5 : 2.8) * p.scale; // Larger nodes
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.sz < 0 ? 12 * p.scale : 0; // Glowing highlights

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0; // Reset shadow

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
