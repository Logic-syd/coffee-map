import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
import { useFavoritesStore } from "@/store/favorites";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

export default function FavoriteButton({
  venueId,
  size = 28,
  className = "",
}: {
  venueId: string;
  size?: number;
  className?: string;
}) {
  const locale = useLocale();
  const isFavorite = useFavoritesStore((s) => s.isFavorite(venueId));
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);

  return (
    <button
      aria-label={t(
        isFavorite ? "action.removeFavorite" : "action.addFavorite",
        locale,
      )}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.stopPropagation();
        if (isFavorite) {
          removeFavorite(venueId);
        } else {
          addFavorite(venueId);
        }
      }}
      className={`min-h-11 min-w-11 grid place-items-center shrink-0 p-1 rounded-full transition ${className}`}
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
