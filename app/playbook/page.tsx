import PageHeader from "@/components/PageHeader";
import SetupsList from "@/components/PlaybookClient/SetupsList";
import { supabaseServer } from "@/lib/supabaseServerSideClient";
export type Setup = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  rules: string[];
  type: string;
  market: string;
  conditions: string;
  created_at: string;
  win_rate?: number;
  avg_return?: number | string;
};

export default async function PlaybookPage() {
  const setups: Setup[] = await fetchUserSetups();

  return (
    <main>
      <PageHeader title="Playbook" />
      <div className="p-4 bg-gray-100 max-w-7xl min-h-screen mx-auto">
        <SetupsList initialSetups={setups} />
      </div>
    </main>
  );
}

// Server-side fetch
async function fetchUserSetups() {
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return [];
  const { data } = await supabaseServer
    .from("playbook_setups")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data || [];
}