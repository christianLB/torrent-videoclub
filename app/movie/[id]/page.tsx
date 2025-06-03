// app/movie/[id]/page.tsx
// import type { Metadata, ResolvingMetadata } from 'next'; // Not needed as generateMetadata is commented

// export async function generateMetadata(
//   { params, searchParams }: { params: { id: string }; searchParams: { [key: string]: string | string[] | undefined } },
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const id = params.id;
//   return {
//     title: `Movie ${id}`, // Placeholder title
//   };
// }

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Movie ID: {params.id}</h1>
    </div>
  );
}
