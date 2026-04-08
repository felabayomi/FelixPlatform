import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { formatCurrency, getProduct } from "@/lib/api";

type ProductPageProps = {
    params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    const image = product.images?.[0] || product.image || "/products/placeholder-product.svg";

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-lg md:grid-cols-2 md:p-8">
                <div className="overflow-hidden rounded-2xl bg-stone-100 shadow-sm transition hover:shadow-lg">
                    <img src={image} alt={product.title} className="h-full w-full object-cover" />
                </div>

                <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Adrian Store</p>
                    <h1 className="mt-3 text-3xl font-semibold text-stone-900">{product.title}</h1>
                    <p className="mt-2 text-2xl font-semibold text-stone-900">{formatCurrency(product.price)}</p>
                    <p className="mt-4 text-base leading-7 text-stone-600">
                        {product.long_description || product.description}
                    </p>

                    <div className="mt-4 text-sm text-stone-500">
                        Inventory: {product.inventory_count ?? 0} available
                    </div>

                    <AddToCartButton product={product} />

                    <Link
                        href={`/quote?productId=${product.id}&title=${encodeURIComponent(product.title)}`}
                        className="mt-3 inline-flex w-fit items-center rounded-full border border-stone-900 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-900 hover:text-white"
                    >
                        Request a Quote
                    </Link>
                </div>
            </div>
        </div>
    );
}
