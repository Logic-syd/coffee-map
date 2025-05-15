import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoritesState = {
  favorites: string[]; // 收藏的店铺ID
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setFavorites: (ids: string[]) => void; // 方便未来云端同步
  syncFavoritesFromCloud: (cloudIds: string[]) => void; // 预留：云端合并
  syncFavoritesToCloud: () => string[]; // 预留：导出本地收藏
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (id) =>
        set((state) =>
          state.favorites.includes(id)
            ? state
            : { favorites: [...state.favorites, id] },
        ),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((fid) => fid !== id),
        })),
      isFavorite: (id) => get().favorites.includes(id),
      setFavorites: (ids) => set({ favorites: ids }),
      syncFavoritesFromCloud: (cloudIds) => {
        // 合并本地和云端收藏，去重
        const merged = Array.from(new Set([...get().favorites, ...cloudIds]));
        set({ favorites: merged });
      },
      syncFavoritesToCloud: () => {
        // 返回本地收藏，供上传到云端
        return get().favorites;
      },
    }),
    {
      name: "favorites", // localStorage key
    },
  ),
);
