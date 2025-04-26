"use client";

import React, { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated") {
      router.push("/");
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google");
      router.push("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <div className="flex h-[50rem] items-center justify-center bg-white">
      {/* Left Side */}
      <div className="flex w-[40rem] flex-col items-center justify-center p-10">
        {/* Logo */}
        <img
          src="https://logos-world.net/wp-content/uploads/2021/03/Airtable-Logo.png"
          alt="Airtable Logo"
          className="mb-5 w-32"
        />
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <p className="mt-2 text-gray-500">
          or{" "}
          <a href="#" className="text-blue-500 hover:underline">
            create an account
          </a>
        </p>
        <div className="mt-6 flex w-80 flex-col gap-4">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-3 text-gray-700 transition hover:bg-gray-100"
            onClick={handleGoogleSignIn}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
              alt="Google Logo"
              className="mr-2 h-5 w-5"
            />
            Sign in with Google
          </button>
        </div>
      </div>

      {/* Right Side */}
      <div className="m-[48px] flex max-w-[29rem] flex-col items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-10">
        <h2 className="mb-5 text-4xl font-bold text-gray-800">
          Create an app instantly with AI
        </h2>
        <button className="rounded-lg bg-blue-500 px-6 py-3 text-white transition hover:bg-blue-600">
          Learn More
        </button>
        <div className="mt-10 rounded-lg bg-white p-4 text-gray-700 shadow-md">
          I need to manage the release of a women&apos;s skateboarding shoe in
          time for the Olympics
        </div>
      </div>
    </div>
  );
}
