export const categoryColors: Record<string, { base: string; selected: string }> = {
  'PrePlanning': {
    base: 'bg-purple-100 text-purple-700 border-purple-200',
    selected: 'bg-purple-200 text-purple-800 border-purple-400',
  },
  'Planning': {
    base: 'bg-blue-100 text-blue-700 border-blue-200',
    selected: 'bg-blue-200 text-blue-800 border-blue-400',
  },
  'Fieldwork': {
    base: 'bg-amber-100 text-amber-700 border-amber-200',
    selected: 'bg-amber-200 text-amber-800 border-amber-400',
  },
  'Reporting': {
    base: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    selected: 'bg-emerald-200 text-emerald-800 border-emerald-400',
  },
  'Other': {
    base: 'bg-stone-100 text-stone-600 border-stone-200',
    selected: 'bg-stone-200 text-stone-700 border-stone-400',
  },
}

export const getCategoryColor = (categoryName: string, isSelected = false): string => {
  const colors = categoryColors[categoryName] || categoryColors['Other']
  return isSelected ? colors.selected : colors.base
}
