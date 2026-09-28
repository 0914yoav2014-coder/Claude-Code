// Placeholder: the How It's Made agent replaces this file. Keep the props contract.
export type MakingAnimationProps = {
  /** Smaller version for the home-page teaser */
  compact?: boolean
}

export default function MakingAnimation({ compact = false }: MakingAnimationProps) {
  return <div className={compact ? 'making making--compact' : 'making'}>Making animation</div>
}
