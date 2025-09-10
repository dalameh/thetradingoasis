import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/ChartClient/SearchBar";
import ChartWrapperIsland from "@/components/ChartClient/ChartWrapperIsland";

export default function ChartPage() {
  return (
    <main>
      <PageHeader title="Trading Chart" />
      <div className="min-h-screen p-8 pb-20">
        <SearchBar />
        <ChartWrapperIsland />
      </div>
    </main>
  );
}