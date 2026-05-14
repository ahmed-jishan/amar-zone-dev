import { useTasbihStore } from '../store/tasbihStore';

export function useTasbih() {
  const items = useTasbihStore((state) => state.items);
  const activeId = useTasbihStore((state) => state.activeId);
  const setActive = useTasbihStore((state) => state.setActive);
  const increment = useTasbihStore((state) => state.increment);
  const decrement = useTasbihStore((state) => state.decrement);
  const reset = useTasbihStore((state) => state.reset);
  const resetAll = useTasbihStore((state) => state.resetAll);
  const addCustom = useTasbihStore((state) => state.addCustom);
  const removeCustom = useTasbihStore((state) => state.removeCustom);

  return {
    items,
    activeId,
    activeItem: items.find((item) => item.id === activeId) ?? items[0],
    setActive,
    increment,
    decrement,
    reset,
    resetAll,
    addCustom,
    removeCustom,
  };
}
