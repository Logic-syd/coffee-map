import { useFavoritesStore } from "@/store/favorites";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

export default function FavoriteButton({
  venueId,
  size = 28,
}: {
  venueId: string;
  size?: number;
}) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(venueId));
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);

  return (
    <button
      aria-label={isFavorite ? "取消收藏" : "收藏"}
      onClick={(e) => {
        e.stopPropagation();
        if (isFavorite) {
          removeFavorite(venueId);
        } else {
          addFavorite(venueId);
        }
      }}
      className="p-1 rounded-full transition"
    >
      {isFavorite ? (
        <HeartSolid
          style={{ width: size, height: size }}
          className="text-red-500"
        />
      ) : (
        <HeartOutline
          style={{ width: size, height: size }}
          className="text-pink-400"
        />
      )}
    </button>
  );
}
