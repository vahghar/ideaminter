import { useState } from 'react';

interface Product {
    _id: string;
    name: string;
    tagline: string;
    votesCount: number;
    url: string;
}

interface CategoryCardProps {
    data: {
        category: string;
        trendScore: number;
        insights: { whyTrending: string, commonPattern: string, opportunities: string };
        startupIdeas: string[];
        products: Product[];
    }
}

export default function CategoryCard({ data }: CategoryCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="category-card">
            <div className="category-header" onClick={() => setExpanded(!expanded)}>
                <h2 className="category-title">{data.category}</h2>
                <div className="category-score">Score: {Math.round(data.trendScore)}</div>
            </div>
            
            {expanded && (
                <div className="category-content">
                    <div className="section-title">Top Products fueling this</div>
                    {data.products.map(p => (
                        <div key={p._id} className="product-item">
                            <a href={p.url && p.url.startsWith('http') ? p.url : `https://producthunt.com${p.url}`} target="_blank" rel="noreferrer">
                                <div className="product-name">{p.name}</div>
                            </a>
                            <div className="product-tagline">{p.tagline}</div>
                            <div className="product-meta">{p.votesCount} upvotes</div>
                        </div>
                    ))}

                    <div className="section-title" style={{marginTop: '2rem'}}>Analyst Insights</div>
                    <p><strong>Why it's trending:</strong> {data.insights?.whyTrending || 'N/A'}</p>
                    <p><strong>Common Pattern:</strong> {data.insights?.commonPattern || 'N/A'}</p>
                    <p><strong>Gaps:</strong> {data.insights?.opportunities || 'N/A'}</p>

                    <div className="section-title" style={{marginTop: '2rem'}}>Startup Ideas</div>
                    <ul className="idea-list">
                        {data.startupIdeas?.map((idea, idx) => (
                            <li key={idx}>{idea}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
