import { motion } from "framer-motion";

const orbs = [
  { size: 300, x: "10%", y: "20%", colorVar: "--orb-primary", alpha: 0.13, delay: 0, duration: 8 },
  { size: 200, x: "70%", y: "60%", colorVar: "--orb-secondary", alpha: 0.13, delay: 2, duration: 10 },
  { size: 250, x: "80%", y: "10%", colorVar: "--orb-accent", alpha: 0.11, delay: 4, duration: 12 },
  { size: 180, x: "30%", y: "75%", colorVar: "--orb-primary", alpha: 0.1, delay: 1, duration: 9 },
  { size: 150, x: "50%", y: "40%", colorVar: "--orb-secondary", alpha: 0.11, delay: 3, duration: 11 },
];

const AnimatedBackground = () => {
  return (
    <div className="app-background fixed inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, hsl(var(${orb.colorVar}) / ${orb.alpha}), transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
