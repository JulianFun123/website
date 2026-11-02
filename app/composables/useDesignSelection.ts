import { designConfig } from '~/data/design'

export function useDesignSelection() {
  const selectedId = useState<string | null>('design-selected', () => null)
  const hoveredId = useState<string | null>('design-hovered', () => null)
  const activeId = computed(() => hoveredId.value ?? selectedId.value)
  const active = computed(() =>
    designConfig.elements.find((element) => element.id === activeId.value),
  )

  function clearSelection() {
    selectedId.value = null
    hoveredId.value = null
  }

  return { selectedId, hoveredId, activeId, active, clearSelection }
}
