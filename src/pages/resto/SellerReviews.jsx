import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import RestoLayout, { EmptyState, ErrorState, RestoAuthGate, Spinner, Card, useRestoUi } from "../../components/restaurant/Shared.jsx";
import { Stars } from "../../components/restaurant/OrderReview.jsx";
import { useLoad } from "../../data/shop.js";
import { useUser } from "../../context/Usercontext.jsx";
import { api } from "../../lib/api.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";

export default function SellerReviews() {
  const ui = useRestoUi(); const t = ui.sellerOrders; const r = t.reviews; const rv = ui.orders.rev;
  const { withAuth } = useUser();
  usePageMeta({ title: `${r.title} · H-Restaurant` });
  const { data, error, loading, reload } = useLoad(() => withAuth((tk) => api.resto.sellerReviews(tk)), []);
  return (
    <RestoAuthGate>
      <RestoLayout width="max-w-3xl">
        <Link to="/restaurant/pro" className="text-sm text-ink-soft underline">{t.back}</Link>
        <h1 className="font-display text-3xl text-ink my-4">{r.title}</h1>
        {loading ? <Spinner label={ui.common.loading} /> : error ? <ErrorState onRetry={reload} /> : (
          <div className="space-y-5">
            <ul className="grid gap-3 sm:grid-cols-2">{(data.restaurants || []).map((x) => (
              <li key={x.id}><Card className="space-y-1"><p className="font-display text-lg text-ink">{x.name}</p>
                {x.rating_count ? <p className="text-sm text-ink-soft"><b className="text-ink">{Number(x.rating_avg).toFixed(1)}</b> / 5 · {x.rating_count} {r.count}</p> : <p className="text-sm text-ink-faint">{r.none}</p>}</Card></li>))}</ul>
            {!data.reviews?.length ? <EmptyState icon={Star} title={r.empty} /> : (
              <ul className="space-y-3">{data.reviews.map((x) => (
                <li key={x.id} className="rounded-2xl border border-line bg-surface p-4"><div className="flex flex-wrap items-center justify-between gap-2 mb-1"><span className="text-sm font-medium text-ink">{x.author} <span className="text-ink-faint font-normal">· {x.restaurant_name}</span></span><Stars value={x.rating} label={rv.stars} /></div>{x.comment && <p className="text-sm text-ink-soft">{x.comment}</p>}</li>))}</ul>
            )}
          </div>
        )}
      </RestoLayout>
    </RestoAuthGate>
  );
}
