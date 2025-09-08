"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseFrontendClient";
import { toast } from "sonner";

export default function SigninUp() {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Already signed in");
        router.replace("/dashboard");
      }
    };

    checkSession();

    // Optional: listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        console.log("User signed in (listener)");
        router.replace("/dashboard");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let result;
      if (flow === "signIn") {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) {
        toast.error(result.error.message);
      } else {
        // toast.success(flow === "signIn" ? "Signed in successfully!" : "Account created!");
        router.replace("/dashboard"); // use replace to avoid back navigation
        toast.success(flow === "signIn" ? "Signed in successfully 🎉" : "Account created 🎉" , {
          className: "justify-center text-center"
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // guest idea allows for easy migration if guest wants to became a real user
  const handleGuestSignIn = () => {
    if (!sessionStorage.getItem("guestId")) {
      sessionStorage.setItem("guestId", crypto.randomUUID());
    }
    sessionStorage.setItem("authenticated", "true");
    router.push("/dashboard");
  };

  return (
    <main>
      <div className="min-h-screen overflow-y-auto flex items-center justify-center bg-gradient-to-tr from-blue-100 to-indigo-200 px-4 py-8">
        <div className="transform scale-90 bg-white text-black shadow-lg bg-opacity-90 rounded-xl w-full max-w-md p-6 sm:p-8 overflow-hidden">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-blue-600">The Trading Oasis</h1>
            <p className="text-lg text-gray-600">Your complete trading tool</p>
            <p className="text-gray-500 mt-2">Sign in to access the Oasis</p>
          </div>

          <h1 className="text-2xl font-bold mb-2 text-center">
            {flow === "signIn" ? "Sign In" : "Sign Up"}
          </h1>

          <form onSubmit={handleSubmit} 
            className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border text-black border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full border text-black border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md text-white ${
                submitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={submitting}
            >
              {flow === "signIn" ? "Sign In" : "Sign Up"}
            </button>

            <div className="text-center text-sm text-gray-600">
              <span>
                {flow === "signIn"
                  ? "Don't have an account? "
                  : "Already have an account? "}
              </span>
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
            className="w-full py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
            onClick={handleGuestSignIn}
          >
            Sign in as a guest
          </button>
        </div>
      </div>
    </main>
  );
}
