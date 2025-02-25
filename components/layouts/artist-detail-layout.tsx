import { Sidebar } from "@/components/features/sidebar/sidebar";

export default function ArtistDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-colw-full">
      <div className="w-full">
        <p>top</p>
      </div>
      <div className="flex w-full">
        <div className="w-1/4">
          <p>left</p>
        </div>
        <div className="w-3/4">{children}</div>
      </div>
    </div>
  );
}
