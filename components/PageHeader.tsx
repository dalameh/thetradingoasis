// components/PageHeader.tsx
export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="w-full bg-white shadow-lg px-6 py-5 sticky top-0 z-40">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
    </header>
  );
}