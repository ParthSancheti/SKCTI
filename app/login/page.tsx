"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MeshBackground from "@/components/MeshBackground";

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    // We now handle all Login operations directly on the Landing Page Overlay.
    // Automatically redirect users back to the root to experience the new UI.
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <MeshBackground />
    </div>
  );
}
