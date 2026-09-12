import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data: s } = await supabase.from("settings").select("*").eq("id", 1).single();
  const { data: gallery } = await supabase.from("gallery").select("*").order("sort_order").limit(6);
  const settings = s as any;
  const h = settings?.headings ?? {};
  const b = settings?.buttons ?? {};
  const c = settings?.content ?? {};

  return (
    <div>
      <section
        className="relative flex min-h-[70vh] items-center justify-center bg-cover bg-center text-center"
        style={settings?.cover_bg_url ? { backgroundImage: `url(${settings.cover_bg_url})` } : { background: "linear-gradient(135deg, rgb(var(--c-secondary)), rgb(var(--c-primary)))" }}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 max-w-2xl px-4 text-white">
          {settings?.logo_url ? <img src={settings.logo_url} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full object-cover ring-4 ring-white/30" /> : null}
          <h1 className="text-4xl font-extrabold sm:text-5xl">{h.home_title ?? settings?.restaurant_name}</h1>
          {h.home_subtitle ? <p className="mt-3 text-lg text-white/85">{h.home_subtitle}</p> : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className="btn bg-white text-ink hover:bg-white/90">{b.order_now ?? "Order Now"}</Link>
            <Link href="/menu" className="btn border-2 border-white/70 text-white hover:bg-white/10">{b.view_menu ?? "View Menu"}</Link>
          </div>
        </div>
      </section>

      {c.about ? (
        <section className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-2xl font-bold">{h.about_title ?? "About Us"}</h2>
          <p className="mt-3 text-black/60">{c.about}</p>
        </section>
      ) : null}

      {gallery && gallery.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="mb-6 text-center text-2xl font-bold">{h.gallery_title ?? "Gallery"}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((g: any) => (
              <img key={g.id} src={g.image_url} alt={g.alt ?? ""} className="aspect-square w-full rounded-2xl object-cover" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-4 pb-16 text-center text-sm text-black/50">
        {settings?.address ? <p>{settings.address}</p> : null}
        {settings?.phone ? <p className="mt-1">{settings.phone}</p> : null}
      </section>
    </div>
  );
}
