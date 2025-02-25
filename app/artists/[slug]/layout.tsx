import ArtistNav from '@/components/navigation/artist-nav'

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
        <ArtistNav />
        <div className="flex w-full">
            <div className="w-full p-4">
                {children}
            </div>
        </div>
    </div>
  )
}