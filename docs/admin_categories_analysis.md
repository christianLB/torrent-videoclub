# Análisis para Sección de Administración de Categorías

## Estado Actual

Las filas de categorías que se muestran en la sección "Featured" están definidas de manera estática en el frontend. En `components/featured/FeaturedPage.tsx` se obtiene el contenido desde rutas internas y se construye un arreglo fijo de categorías:

```typescript
const newCategoryRows = [
  { id: 'popular-movies', title: 'Popular Movies', items: popularMoviesData?.slice(0, 10) || [] },
  { id: 'trending-tv', title: 'Trending TV Shows', items: trendingTVData?.slice(0, 10) || [] },
  { id: 'upcoming-movies', title: 'Upcoming Movies', items: upcomingMoviesData?.slice(0, 10) || [] },
  { id: 'top-rated-movies', title: 'Top Rated Movies', items: topRatedMoviesData?.slice(0, 10) || [] },
].filter(row => row.items.length > 0);
```
【F:components/featured/FeaturedPage.tsx†L100-L105】

En el servidor, `CuratorService.fetchFreshFeaturedContent` crea un conjunto similar de categorías basadas en resultados de Prowlarr y TMDb:

```typescript
const featuredContent: FeaturedContent = {
  featuredItem,
  categories: [
    { id: 'trending-now', title: 'Trending Now', items: trendingMovies },
    { id: 'popular-tv', title: 'Popular TV Shows', items: popularTV },
    { id: 'new-releases', title: 'New Releases', items: newReleases },
    { id: 'top-4k', title: 'Top 4K Content', items: top4KContent },
    { id: 'documentaries', title: 'Documentaries', items: documentaries },
  ],
};
```
【F:lib/services/curator-service.ts†L283-L291】

El mock de datos también utiliza el mismo esquema de categorías para pruebas locales:

```typescript
categories: [
  { id: CONTENT_CATEGORIES.TRENDING_MOVIES, title: 'Trending Movies', items: generateMockMovies(10, 'trending') },
  { id: CONTENT_CATEGORIES.POPULAR_TV, title: 'Popular TV Shows', items: generateMockTVShows(10, 'popular') },
  { id: CONTENT_CATEGORIES.NEW_RELEASES, title: 'New Releases', items: generateMockMovies(10, 'new') },
  { id: CONTENT_CATEGORIES.FOUR_K, title: '4K Content', items: generateMockMovies(10, '4k') },
  { id: CONTENT_CATEGORIES.DOCUMENTARIES, title: 'Documentaries', items: generateMockDocumentaries(10) }
]
```
【F:lib/data/mock-featured.ts†L46-L70】

La obtención de cada categoría en la interfaz `/category/[id]` se realiza mediante la API `/api/featured/category/[id]`, que delega en `CuratorService.getCategory`:

```typescript
const categoryData = await CuratorService.getCategory(categoryId);
```
【F:app/api/featured/category/[id]/route.ts†L25-L26】

Actualmente no existe un mecanismo de configuración persistente; las categorías están codificadas en el repositorio y sólo pueden modificarse alterando el código.

## Objetivo de la Migración a MongoDB

Se desea habilitar una sección de administración que permita definir qué categorías se muestran en las filas. Esto implica almacenar la definición de cada categoría en una colección de MongoDB. La información básica necesaria para cada registro sería:

- `id`: identificador único utilizado en las rutas.
- `title`: texto mostrado al usuario.
- `type`: "movie" o "tv".
- `tmdbParams` o reglas para obtener los ítems (por ejemplo, parámetros para `discover` de TMDb o filtros para Prowlarr).
- `order` y `enabled` para controlar el despliegue.

Debe proporcionarse un conjunto de categorías por defecto equivalente a las que hoy existen. Al iniciar la aplicación, si la colección está vacía, se insertarán estos valores iniciales.

## Plan de Implementación

1. **Modelo en MongoDB**
   - Crear una colección `featuredCategories` con el esquema anterior.
   - Implementar un servicio `CategoryConfigService` encargado de leer y escribir en esta colección.
   - En su método de inicialización, verificará si la base está vacía y, en tal caso, poblará los valores por defecto.

2. **Actualización de CuratorService**
   - Reemplazar la lista estática por consultas a `CategoryConfigService` para obtener las definiciones.
   - Para cada categoría configurada se generarán los ítems usando los parámetros almacenados.
   - Se mantendrá la lógica actual de enriquecimiento con TMDb.

3. **Sección Admin**
   - Crear nuevas páginas bajo `/admin/categories` que permitan listar, crear, editar y desactivar categorías.
   - Utilizar formularios simples que modifiquen la colección `featuredCategories` mediante rutas internas (por ejemplo `/api/admin/categories`).
   - Reutilizar componentes existentes como `CategoryRow` para previsualizar el resultado de cada configuración.

4. **Pruebas**
   - Añadir pruebas a nivel de API verificando que las rutas de administración manipulan correctamente la colección (usando Mongo en memoria).
   - Cubrir `CuratorService.getFeaturedContent` asegurando que respeta el orden y la habilitación de categorías.
   - Mantener pruebas existentes para `/api/featured`, como las definidas en `test/app/api/featured/route.test.ts`, adaptándolas al nuevo origen de datos.

## Consideraciones

- La migración a MongoDB para la configuración aprovecha la infraestructura ya presente para el caché (ver `docs/mongodb_migration_proposal.md`).
- El uso de valores por defecto evita interrupciones para quienes ya ejecutan la aplicación con las categorías actuales.
- Toda la lógica administrativa deberá protegerse con autenticación básica o algún mecanismo similar para evitar modificaciones no autorizadas.

Con esta implementación se logrará una administración flexible de categorías, manteniendo compatibilidad con el comportamiento previo y respaldando la funcionalidad mediante pruebas automatizadas.
