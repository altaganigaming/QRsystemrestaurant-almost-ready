import Link from "next/link";

export default function SiteFooter({ settings }: { settings: any }) {
  const social = settings?.social ?? {};
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
        <div>
          <p className="font-bold">{settings?.restaurant_name}</p>
          {settings?.content?.footer_note ? <p className="mt-1 text-black/60">{settings.content.footer_note}</p> : null}
        </div>
        <div>
          <p className="font-semibold mb-1">Contact</p>
          {settings?.address ? <p className="text-black/60">{settings.address}</p> : null}
          {settings?.phone ? <p className="text-black/60">{settings.phone}</p> : null}
        </div>
        <div>
          <p className="font-semibold mb-1">Links</p>
          <div className="flex flex-col gap-1 text-black/60">
            {Object.entries(social).filter(([, v]) => v).map(([k, v]) => (
              <a key={k} href={String(v)} target="_blank" rel="noreferrer" className="capitalize hover:text-brand">{k}</a>
            ))}
            <Link href="/menu" className="hover:text-brand">Menu</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
