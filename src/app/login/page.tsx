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
        <div className="mb-5 h-auto w-32">
          {" "}
          {/* Added container div for sizing */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            style={{ shapeRendering: "geometricPrecision" }}
            viewBox="0 0 200 170"
          >
            <path
              fill="#FCB400"
              d="M90.039 12.368 24.079 39.66c-3.667 1.519-3.63 6.729.062 8.192l66.235 26.266a24.58 24.58 0 0 0 18.12 0l66.236-26.266c3.69-1.463 3.729-6.673.06-8.191l-65.958-27.293a24.58 24.58 0 0 0-18.795 0"
            ></path>
            <path
              fill="#18BFFF"
              d="M105.312 88.46v65.617c0 3.12 3.147 5.258 6.048 4.108l73.806-28.648a4.42 4.42 0 0 0 2.79-4.108V59.813c0-3.121-3.147-5.258-6.048-4.108l-73.806 28.648a4.42 4.42 0 0 0-2.79 4.108"
            ></path>
            <path
              fill="#F82B60"
              d="m88.078 91.846-21.904 10.576-2.224 1.075-46.238 22.155c-2.93 1.414-6.672-.722-6.672-3.978V60.088c0-1.178.604-2.195 1.414-2.96a5 5 0 0 1 1.12-.84c1.104-.663 2.68-.84 4.02-.31L87.71 83.76c3.564 1.414 3.844 6.408.368 8.087"
            ></path>
            <path
              fill="rgba(0, 0, 0, 0.25)"
              d="m88.078 91.846-21.904 10.576-53.72-45.295a5 5 0 0 1 1.12-.839c1.104-.663 2.68-.84 4.02-.31L87.71 83.76c3.564 1.414 3.844 6.408.368 8.087"
            ></path>
          </svg>
        </div>
        {/* <h2 className="text-2xl font-semibold">Sign in</h2>
        <p className="mt-2 text-gray-500">
          or{" "}
          <a href="#" className="text-blue-500 hover:underline">
            create an account
          </a>
        </p> */}
        <div className="mt-6 flex w-80 flex-col gap-4">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-3 text-gray-700 transition hover:bg-gray-100"
            onClick={handleGoogleSignIn}
          >
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
