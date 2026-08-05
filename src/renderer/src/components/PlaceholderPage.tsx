interface PlaceholderPageProps {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps): React.JSX.Element {
  return (
    <div>
      <h1 className="text-4xl text-ft-orange">{title}</h1>
      <p className="mt-2 text-white/60">{description}</p>
    </div>
  )
}
