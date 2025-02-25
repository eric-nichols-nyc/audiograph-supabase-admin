import ArtistNav from '@/components/navigation/artist-nav'

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full gap-6 pt-14">
      <div className="w-full border-b">
        <ArtistNav />
      </div>
      <div className="flex w-full px-6">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  )
}