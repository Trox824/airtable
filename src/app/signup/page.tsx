"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sign up");
      }

      // After successful signup, sign in the user
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setErrorMessage("Error signing in after signup");
      } else {
        router.push("/");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to sign up",
      );
    }
  };

  return (
    <div className="flex h-[50rem] items-center justify-center bg-white">
      <div className="flex w-[40rem] flex-col items-center justify-center p-10">
        <img
          src="https://logos-world.net/wp-content/uploads/2021/03/Airtable-Logo.png"
          alt="Airtable Logo"
          className="mb-5 w-32"
        />
        <h2 className="text-2xl font-semibold">Create an account</h2>
        <p className="mt-2 text-gray-500">
          or{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            sign in to your account
          </a>
        </p>
        {errorMessage && (
          <div className="mt-4 w-80 rounded bg-red-100 p-2 text-red-700">
            {errorMessage}
          </div>
        )}
        <form className="mt-6 flex w-80 flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full name"
            required
            className="w-full rounded-lg border p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            required
            className="w-full rounded-lg border p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 py-3 text-white transition hover:bg-blue-600"
          >
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
