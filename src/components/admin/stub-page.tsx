interface StubPageProps {
  title: string;
  description?: string;
  icon?: string;
}

export function StubPage({ title, description, icon = '🚧' }: StubPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-slate-400 max-w-sm">
        {description ?? 'This section is under development. Check back soon!'}
      </p>
    </div>
  );
}
