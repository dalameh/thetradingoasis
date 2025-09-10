"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseFrontendClient";
import { AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function SigninUp() {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace("/dashboard");
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.replace("/dashboard");
    });

    return () => listener?.subscription?.unsubscribe();
  }, [router]);

  useEffect(() => setPassword(""), [flow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    try {
      let result;
      if (flow === "signIn") {
        result = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
      } else {
        result = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
        });
      }

      if (result.error) toast.error(result.error.message);
      else {
        router.replace("/dashboard");
        toast.success(
          flow === "signIn"
            ? "Signed in successfully 🎉"
            : "Account created 🎉",
          { className: "justify-center text-center" }
        );
      }
    } catch (err: unknown) {
      if (err instanceof AuthError || err instanceof Error) toast.error(err.message);
      else toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestSignIn = () => {
    if (!sessionStorage.getItem("guestId")) sessionStorage.setItem("guestId", crypto.randomUUID());
    sessionStorage.setItem("authenticated", "true");
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 
      bg-gradient-to-br from-[#40c0f3] via-[#FFC857] to-[#ff6c44]">
      
      <div className="w-full max-w-md p-6 sm:p-8 bg-white bg-opacity-90 text-black rounded-xl shadow-lg overflow-hidden transform scale-90">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-blue-600">The Trading Oasis</h1>
          <p className="text-lg text-gray-700">Your complete trading tool</p>
          <p className="text-gray-500 mt-2">Sign in to access the Oasis</p>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">
          {flow === "signIn" ? "Sign In" : "Sign Up"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2 px-4 rounded-md font-semibold text-white shadow-md transition-transform ${
              submitting
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-gradient-to-r from-[#0288d1] to-[#4fc3f7] hover:scale-105"
            }`}
          >
            {flow === "signIn" ? "Sign In" : "Sign Up"}
          </button>

          <div className="text-center text-sm text-gray-600">
            {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="text-blue-600 hover:underline font-medium"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center my-4">
          <hr className="grow border-gray-200" />
          <span className="mx-4 text-gray-400">or</span>
          <hr className="grow border-gray-200" />
        </div>

        <button
          className="w-full py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-[#0288d1] to-[#4fc3f7] hover:scale-105 shadow-md"
          onClick={handleGuestSignIn}
        >
          Sign in as a guest
        </button>
      </div>
    </main>
  );
}
