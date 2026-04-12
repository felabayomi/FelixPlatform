'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://felix-platform-backend.onrender.com/api/expedition-america-standalone/content/export',
          {
            headers: {
              'cache-control': 'no-store',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform API format to component format
        const homeSection = data.pages?.home;
        const citiesData = homeSection?.ordered
          ?.map((sectionKey: string) => {
            const section = homeSection.sections[sectionKey];
            return {
              name: section.title || '',
              description: section.subtitle || '',
              image: section.imageUrl || '',
              link: section.ctaUrl || '#',
            };
          })
          .filter((city: any) => city.name && city.image) || [];

        setCities(citiesData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load cities');
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return (
    <main style={{ fontFamily: "Arial", margin: 0 }}>

      {/* HERO */}
      <section
        style={{
          padding: "200px 40px",
          textAlign: "center",
          backgroundImage:
            "url('https://mediahost.app/api/media/serve/ccd43c58e3d59e523a9df8628c11723c?w=1600&h=700&fit=crop&crop=center&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: "56px", marginBottom: "20px" }}>
          Discover America's Cities Like a Local
        </h1>

        <div
          style={{
            marginTop: "40px",
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/deals"
            style={{
              display: "inline-block",
              padding: "16px 30px",
              fontSize: "18px",
              background: "#000",
              color: "#fff",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              textDecoration: "none"
            }}
          >
            Explore Deals
          </a>
          <a
            href="https://plan.citydiscoverer.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "16px 30px",
              fontSize: "18px",
              background: "#0070f3",
              color: "#fff",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              textDecoration: "none"
            }}
          >
            Plan Itinerary
          </a>
        </div>
      </section>

      {/* FEATURED CITIES */}
      <section style={{ padding: "80px 40px" }}>
        <h2
          style={{
            fontSize: "36px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          Featured Cities
        </h2>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <p>Loading featured cities...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "40px", color: "#d32f2f" }}>
            <p>Unable to load cities. Please try again later.</p>
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))",
              gap: "30px",
              maxWidth: "1400px",
              margin: "0 auto",
            }}
          >
            {cities.map((city) => (
              <a
                key={city.name}
                href={city.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    cursor: "pointer"
                  }}
                >
                  <img
                    src={city.image}
                    alt={city.name}
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover"
                    }}
                  />

                  <div style={{ padding: "20px", textAlign: "center" }}>
                    <h3>{city.name}</h3>
                    <p style={{ fontSize: "14px", color: "#666" }}>
                      {city.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
</section>

      {/* EXPERIENCE SECTION */}
      <section
        style={{
          padding: "100px 60px",
          background: "#fafafa",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "36px" }}>Experience Cities Differently</h2>

        <p
          style={{
            maxWidth: "700px",
            margin: "20px auto",
            fontSize: "18px",
            lineHeight: "1.6",
          }}
        >
          Expedition America connects travelers with the energy of each city —
          from rooftop lounges and art districts to hidden cafés, live music,
          street culture, and community-driven experiences.
        </p>

        <a
          href="https://view.citydiscoverer.ai/request"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: "20px",
            padding: "14px 26px",
            fontSize: "16px",
            background: "#27ae60",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Start Exploring with our Team
        </a>
      </section>

    </main>
  );
}