"use client";
import Link from "next/link";
import LandingPage from "./_components/LandingPage";
import { signIn, useSession } from "next-auth/react";
import HomePage from "./_components/home/Homepage/HomePage";

export default function Home() {
  const session = useSession();

  if (session.status !== "authenticated") {
    return <LandingPage />;
  }
  return (
    <div>
      <HomePage />
    </div>
  );
}
