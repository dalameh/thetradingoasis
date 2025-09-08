'use client';

import React, { useCallback, useEffect, useState } from "react";
import SetupItem from "./SetupItem";
import SetupForm from "./SetupFormModal";
import { Setup } from "@/types/Setup";
import { supabase } from "@/lib/supabaseFrontendClient";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type SetupsListProps = {
  initialSetups: Setup[];
};

export default function SetupsList({ initialSetups }: SetupsListProps) {
  const [setups, setSetups] = useState<Setup[]>(initialSetups || []);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSetup, setEditingSetup] = useState<Setup | null>(null);

  const fetchSetups = useCallback(async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error("User not signed in");

      const { data, error } = await supabase
        .from("playbook_setups")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSetups(data || []);
    } catch {
      toast.error("Failed to fetch setups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!initialSetups?.length) fetchSetups(); }, [initialSetups, fetchSetups]);

  const handleSave = useCallback(async (data: Omit<Setup, "id" | "user_id" | "created_at">) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error("User not signed in");

      if (editingSetup) {
        // Update
        const { error } = await supabase
          .from("playbook_setups")
          .update(data)
          .eq("id", editingSetup.id)
          .eq("user_id", user.user.id);
        if (error) throw error;
        toast.success("Setup updated");
      } else {
        // Insert
        const { error } = await supabase
          .from("playbook_setups")
          .insert([{ user_id: user.user.id, ...data }]);
        if (error) throw error;
        toast.success("Setup created");
      }

      setIsCreating(false);
      setEditingSetup(null);
      fetchSetups();
    } catch {
      toast.error("Failed to save setup");
    }
  }, [editingSetup, fetchSetups]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error("User not signed in");

      const { error } = await supabase
        .from("playbook_setups")
        .delete()
        .eq("id", id)
        .eq("user_id", user.user.id);
      if (error) throw error;

      toast.success("Setup deleted");
      fetchSetups();
    } catch {
      toast.error("Failed to delete setup");
    }
  }, [fetchSetups]);

  return (
    <div className="pb-8">
      <div className="flex justify-between items-center mb-2">
         <p className="text-sm text-slate-500">
          Track, Analyze, and Refine Your Personal Trading Strategies
        </p>
        <button
          onClick={() => { setIsCreating(true); setEditingSetup(null); }}
          className="flex items-center text-sm gap-2 p-2 rounded-lg border mr-4.5 h-10 border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>{" "}Add Setup</span>
        </button>
      </div>

      {isCreating && (
        <SetupForm
          onCancel={() => { setIsCreating(false); setEditingSetup(null); }}
          onSave={handleSave}
          initialData={editingSetup || undefined}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="relative w-full bg-white rounded-lg shadow-md p-6 text-gray-500 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))
        ) : setups.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">⚙️</div>
            <p>No trading setups created yet</p>
            <p className="text-sm">Create setups to standardize your trading approach</p>
          </div>
        ) : (
          setups.map(setup => (
            <SetupItem
              key={setup.id}
              setup={setup}
              onEdit={(s) => { setEditingSetup(s); setIsCreating(true); }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}