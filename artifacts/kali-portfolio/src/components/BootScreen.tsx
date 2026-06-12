import { useState } from "react";
import { motion } from "framer-motion";
import bootVideo from "@assets/boot_1775198015682.mp4";

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [hasInteracted, setHasInteracted] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 select-none"
      style={{ background: "#000000", zIndex: 50 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {!hasInteracted ? (
        <>
          <div
            className="w-screen h-[100dvh] bg-black bg-cover bg-center bg-no-repeat cursor-pointer"
            style={{ backgroundImage: "url('/grub_loader.svg')" }}
            onClick={() => setHasInteracted(true)}
          />
          <video
            src={bootVideo}
            preload="auto"
            muted
            playsInline
            style={{ display: "none", position: "absolute", pointerEvents: "none" }}
            aria-hidden="true"
          />
        </>
      ) : (
        <video
          src={bootVideo}
          autoPlay
          playsInline
          preload="auto"
          onEnded={() => onComplete()}
          onError={() => onComplete()}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            background: "#000000",
            display: "block",
          }}
        />
      )}
    </motion.div>
  );
}
