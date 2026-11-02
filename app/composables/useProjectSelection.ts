import { projects } from '~/data/projects'

export function useProjectSelection() {
  const selectedId = useState<string>('featured-project', () => 'pastefy')
  const selected = computed(
    () => projects.find((project) => project.id === selectedId.value) ?? projects[0]!,
  )
  return { selectedId, selected }
}
