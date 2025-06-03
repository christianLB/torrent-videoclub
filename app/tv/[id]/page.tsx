// app/tv/[id]/page.tsx
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  // In a real app, you might fetch data here to set metadata dynamically
  return {
    title: `TV Show ${id}`, // Placeholder title
  };
}

async function getTvShowData(id: string) {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
  return {
    id,
    title: `TV Show Details for ID: ${id}`,
    description: `This is a placeholder page for TV show ${id}. Detailed content will be loaded here.`,
  };
}

export default async function TvShowDetailPage({ params }: Props) {
  if (!params.id) {
    return (
      <main className="bg-gray-900 text-white min-h-screen p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Error</h1>
          <p>TV Show ID is missing.</p>
          <a href="/" className="text-green-500 hover:underline mt-4 inline-block">Go back home</a>
        </div>
      </main>
    );
  }

  const tvShowData = await getTvShowData(params.id);

  return (
    <main className="bg-gray-900 text-white min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-4">{tvShowData.title}</h1>
        <p className="mb-2">Displaying details for TV Show ID: {tvShowData.id}</p>
        <p>{tvShowData.description}</p>
        <a href="/" className="text-green-500 hover:underline mt-4 inline-block">Go back home</a>
      </div>
    </main>
  );
}
