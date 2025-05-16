import { motion, useAnimation } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";

export type CafeCardProps = {
  v: {
    id: string;
    name: string;
    address: string;
    image_url?: string;
    distanceKm?: number;
    isOpenNow?: boolean;
  };
  distanceKm?: number;
  isFav?: boolean;
  onToggleFav?: (id: string) => void;
};

export default function CafeCard({
  v,
  distanceKm,
  isFav = false,
  onToggleFav = () => {},
}: CafeCardProps) {
  const [pulse, setPulse] = useState(false);
  const controls = useAnimation();

  const handleHeart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when heart is clicked
    setPulse(true);
    await controls.start({
      scale: [1, 1.2, 1],
      transition: { duration: 0.35 },
    });
    setPulse(false);
    onToggleFav(v.id);
  };

  // Use the prop distanceKm if provided, otherwise fallback to v.distanceKm
  const displayDistance = distanceKm !== undefined ? distanceKm : v.distanceKm;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-card overflow-hidden transition-transform cursor-pointer"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
    >
      <div className="relative w-full h-44">
        {v.image_url ? (
          <img
            src={v.image_url}
            alt={v.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-pinkcream flex items-center justify-center" />
        )}
        <motion.button
          className="absolute top-2 right-2 bg-white/80 rounded-full p-2 shadow-card"
          onClick={handleHeart}
          animate={pulse ? controls : undefined}
          aria-label="Favorite"
        >
          <Heart
            size={22}
            className={
              isFav ? "text-pinkaccent fill-pinkaccent" : "text-graytext"
            }
          />
        </motion.button>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-inkblack line-clamp-1">
          {v.name}
        </h3>
        <p className="text-sm text-graytext line-clamp-1">📍 {v.address}</p>
        <p className="text-xs text-graytext mt-1">
          {typeof displayDistance === "number" &&
            `• ${displayDistance.toFixed(1)} km`}{" "}
          {v.isOpenNow && "• ⏰ Open"}
        </p>
      </div>
    </motion.div>
  );
}
