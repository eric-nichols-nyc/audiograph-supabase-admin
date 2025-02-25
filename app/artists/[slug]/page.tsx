import { redirect } from 'next/navigation'

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  redirect(`/artists/${params.slug}/overview`)
}
