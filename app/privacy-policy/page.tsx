"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MeshBackground from "@/components/MeshBackground";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { fbDb, firebaseReady } from "@/lib/firebase";
import type { AppConfig } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/types";

export default function PrivacyPolicy() {
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (!firebaseReady) return;
    getDoc(doc(fbDb(), "config", "app")).then((s) => {
      if (s.exists()) {
        const d = s.data() as Partial<AppConfig>;
        setCfg({ ...DEFAULT_CONFIG, ...d });
      }
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden pt-24 pb-12">
      <MeshBackground />
      
      <div className="mx-auto max-w-4xl px-5">
        <Link href="/" className="inline-flex items-center gap-2 font-geist text-sm text-on-surface/60 hover:text-primary transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <div className="glassy-elite rounded-[2rem] p-8 md:p-12">
          <h1 className="font-sora text-3xl font-extrabold text-on-surface md:text-5xl mb-6">Privacy Policy</h1>
          <p className="font-geist text-sm text-on-surface/50 mb-10">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-8 font-hanken text-body-md text-on-surface/80 leading-relaxed">
            <section>
              <h2 className="font-sora text-xl font-bold text-on-surface mb-3">1. Introduction</h2>
              <p>Welcome to {cfg.appName}. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.</p>
            </section>

            <section>
              <h2 className="font-sora text-xl font-bold text-on-surface mb-3">2. The data we collect about you</h2>
              <p>Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-sora text-xl font-bold text-on-surface mb-3">3. How we use your personal data</h2>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal obligation.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-sora text-xl font-bold text-on-surface mb-3">4. Data security</h2>
              <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
            </section>

            <section>
              <h2 className="font-sora text-xl font-bold text-on-surface mb-3">5. Contact us</h2>
              <p>If you have any questions about this privacy policy or our privacy practices, please contact us via our WhatsApp channel available on the home page.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
