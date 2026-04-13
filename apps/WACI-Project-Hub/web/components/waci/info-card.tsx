export function InfoCard({
    icon,
    title,
    body,
}: {
    icon: string;
    title: string;
    body: string;
}) {
    return (
        <article className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-2xl mb-2">{icon}</p>
            <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{body}</p>
        </article>
    );
}
