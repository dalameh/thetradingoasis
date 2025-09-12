"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseFrontendClient";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import {
  User,
  Mail,
  Lock,
  LogOut,
  LogIn,
  Trash2,
  UserCircle,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Form states
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        setEmail(data.session.user.email ?? "");
        setUsername(data.session.user.user_metadata?.username ?? "");
        setFullName(data.session.user.user_metadata?.full_name ?? "");
        setIsGuest(false);
      } else {
        const guest = sessionStorage.getItem("authenticated") === "guest";
        if (guest) {
          setIsGuest(true);
          setEmail(sessionStorage.getItem("guest_email") ?? "");
          setUsername(sessionStorage.getItem("guest_username") ?? "");
          setFullName(sessionStorage.getItem("guest_fullname") ?? "");
        }
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

    async function handleStartGuest() {
    sessionStorage.setItem("guestId", crypto.randomUUID());
    sessionStorage.setItem("authenticated", "guest");
    setIsGuest(true);
  }

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;

  // If no user and no guest
  if (!user && !isGuest) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col justify-center items-center px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 max-w-md text-center">
          <UserCircle className="w-12 h-12 mx-auto text-cyan-300 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Not Signed In</h1>
          <p className="text-gray-300 mb-6">
            You are not signed in. Please log in or continue as a guest to access settings.
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push("/signin")}
              className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg transition"
            >
              <LogIn className="w-5 h-5" /> Log In
            </button>
            <button
              onClick={handleStartGuest}
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg shadow-lg transition"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </main>
    );
  }
  
  async function handleUpdateProfile() {
    if (isGuest) {
      sessionStorage.setItem("guest_email", email);
      sessionStorage.setItem("guest_username", username);
      sessionStorage.setItem("guest_fullname", fullName);
      alert("Guest profile updated!");
    } else {
      const { error } = await supabase.auth.updateUser({
        email,
        data: { username, full_name: fullName },
      });
      if (error) alert(error.message);
      else alert("Profile updated!");
    }
  }

  async function handleSignOut() {
    if (isGuest) {
      router.push("/");
    } else {
      const { error } = await supabase.auth.signOut();
      if (!error) router.push("/");
      else alert("Failed to sign out: " + error.message);
    }
  }

  async function handleDeleteAccount() {
    if (isGuest) {
      sessionStorage.clear();
      router.push("/");
    } else {
      alert("Account deletion requires server-side API (not safe on client).");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-400 via-cyan-200 to-cyan-500 flex justify-center py-12 px-4">
      <div className="w-full max-w-3xl space-y-8">
        <h1 className="text-4xl font-extrabold text-teal-700 text-center mb-6">
          Oasis Settings
        </h1>

        {/* Profile Section */}
        <section className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-amber-200">
          <h2 className="text-xl font-bold text-teal-600 flex items-center gap-2 mb-4">
            <UserCircle className="w-6 h-6" /> Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-amber-50 text-gray-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-amber-50 text-gray-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-500 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 mt-1 px-3 py-2 rounded-lg bg-amber-50 text-gray-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleUpdateProfile}
            className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg transition"
          >
            Save Changes
          </button>
        </section>

        {/* Security Section */}
        {!isGuest && (
          <section className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-cyan-200">
            <h2 className="text-xl font-bold text-teal-600 flex items-center gap-2 mb-4">
              <Lock className="w-6 h-6" /> Security
            </h2>
            <p className="text-gray-700 mb-3">
              Reset your password securely with a magic link.
            </p>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.resetPasswordForEmail(
                  email
                );
                if (error) alert(error.message);
                else alert("Password reset email sent!");
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg shadow-lg transition"
            >
              Send Reset Link
            </button>
          </section>
        )}

        {/* Account Section */}
        <section className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-cyan-200">
          <h2 className="text-xl font-bold text-teal-600 flex items-center gap-2 mb-4">
            <User className="w-6 h-6" /> Account
          </h2>
          <div className="flex gap-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg transition"
            >
              <LogOut className="w-5 h-5" /> {isGuest ? "Exit Guest Mode": "Sign Out"}
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
            >
              <Trash2 className="w-5 h-5" /> {isGuest ? "Delete Guest Account" : "Delete Account"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
