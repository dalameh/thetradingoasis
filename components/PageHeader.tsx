// components/PageHeader.tsx
export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="w-full bg-white shadow-lg sticky top-0 z-40 flex justify-center sm:justify-start px-4 sm:px-6 py-5">
      <h1 className="text-xl font-semibold text-gray-900 text-center sm:text-left">
        {title}
      </h1>
    </header>
  );
}