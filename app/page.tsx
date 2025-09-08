'use client';

import { useRouter } from "next/navigation";


export default function HomePage() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/signin")
  }

  return (
    <main 
      style={{
        backgroundImage: "url('/favicon.ico')",
        backgroundSize: "900px 900px", // <-- size in px
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        // backgroundSize: "cover",  // make image cover whole background
        backgroundColor: "#ffffff", // fallback color
        width: "100vw",  // full viewport width
        height: "100vh", // full viewport height
  }}
        className="flex items-center justify-center h-screen bg-gradient-to-tr from-blue-100 to-indigo-200"
      >
      <div className="text-center bg-white bg-opacity-80 p-8 rounded-lg shadow-md max-w-md mx-auto">
        <h1 className="text-2xl text-black font-bold">Welcome</h1>
        <h1 className="text-1xl text-black font-bold">to</h1>
        <h1 className="text-3xl text-black font-bold">The Trading Oasis</h1>
        <p className="mt-4 text-gray-500 ">
          Please{" "}
          <button 
            onClick={handleSignIn}
            className = "text-blue-500 underline cursor-pointer"
            type = "button"
          > 
            sign in
          </button>
            {" "}to continue.
        </p>
      </div>
    </main>
  );
}