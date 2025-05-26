"use client";

import { Navbar } from "@/components/navbar";
import FeaturedPage from "@/components/featured/FeaturedPage";

export default function FeaturedPageRoute() {
  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6 text-green-500">Contenido Destacado</h1>
        <FeaturedPage />
      </div>
    </main>
  );
}
