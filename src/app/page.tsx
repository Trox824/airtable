"use client";
import Link from "next/link";
import LandingPage from "./_components/LandingPage";
import { signIn, useSession } from "next-auth/react";
import HomePage from "./_components/HomePage";
import { useEffect } from "react";

export default function Home() {
  const session = useSession();

  if (session.status === "authenticated") {
    return <HomePage />;
  }
  return (
    <div>
      <LandingPage />
    </div>
  );
}
