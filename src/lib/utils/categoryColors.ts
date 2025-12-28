export const categoryColors: Record<string, string> = {
  'PrePlanning': 'bg-purple-100 text-purple-700 border-purple-200',
  'Planning': 'bg-blue-100 text-blue-700 border-blue-200',
  'Fieldwork': 'bg-amber-100 text-amber-700 border-amber-200',
  'Reporting': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Other': 'bg-stone-100 text-stone-600 border-stone-200',
}

const unselectedStyle = 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-700'

export const getCategoryColor = (categoryName: string, isSelected = false): string => {
  if (!isSelected) return unselectedStyle
  return categoryColors[categoryName] || categoryColors['Other']
}
