import Link from "next/link";

export default function Home() {
  return (
    <main className="container py-12">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-6 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            Torrent Videoclub
          </h1>
          <p className="text-xl text-muted-foreground">
            Curador visual para descubrir y agregar películas/series desde trackers conectados a arr-stack
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-bold mb-4">Películas</h2>
            <p className="mb-6 text-muted-foreground">
              Descubre y agrega películas directamente a Radarr. Filtra por género, año, calificación y más.
            </p>
            <Link
              href="/movies"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Explorar Películas
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 ml-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
          
          <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-bold mb-4">Series</h2>
            <p className="mb-6 text-muted-foreground">
              Navega y agrega series de TV a Sonarr. Encuentra contenido según tus preferencias con filtros personalizados.
            </p>
            <Link
              href="/series"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Explorar Series
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 ml-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="mt-12 border rounded-lg p-6 bg-muted/50">
          <h2 className="text-2xl font-bold mb-4">Cómo funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-semibold">Busca contenido</h3>
              <p className="text-muted-foreground">
                Usa el buscador para encontrar películas o series de tu interés.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-semibold">Filtra resultados</h3>
              <p className="text-muted-foreground">
                Aplica filtros por género, año, calificación o resolución para refinar tu búsqueda.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-semibold">Agrega a tu biblioteca</h3>
              <p className="text-muted-foreground">
                Con un clic, agrega el contenido a Radarr o Sonarr para su descarga automática.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
