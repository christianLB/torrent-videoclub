import Link from "next/link";
import FeaturedPage from "@/components/featured/FeaturedPage";

export default function Home() {
  return (
    <main className="flex flex-col flex-grow"> {/* Removed redundant bg, text, and min-h-screen styles */}

      
      {/* Featured Content Section */}
      <FeaturedPage />
      
      {/* Quick Links */}
      <div className="border-t border-slate-800 mt-8 pt-8 pb-12 px-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h3 className="text-lg font-medium neon-text-cyan">Explora</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/movies" className="text-slate-400 hover:neon-text-cyan transition-colors text-sm">Todas las Películas</Link>
                </li>
                <li>
                  <Link href="/series" className="text-slate-400 hover:neon-text-cyan transition-colors text-sm">Todas las Series</Link>
                </li>
                <li>
                  <Link href="/search" className="text-slate-400 hover:neon-text-cyan transition-colors text-sm">Búsqueda Avanzada</Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium neon-text-cyan">Cómo funciona</h3>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>1. Explora contenido destacado o busca títulos específicos</li>
                <li>2. Filtra por género, año, calificación o resolución</li>
                <li>3. Agrega a tu biblioteca con un solo clic</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium neon-text-cyan">Biblioteca</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/library" className="text-slate-400 hover:neon-text-cyan transition-colors text-sm">Tu Biblioteca</Link>
                </li>
                <li>
                  <Link href="/downloads" className="text-slate-400 hover:neon-text-cyan transition-colors text-sm">Descargas Activas</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
