import { useState } from 'react';

interface CategoryRowProps {
    data: any;
}

export default function CategoryRow({ data }: CategoryRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="product-row" onClick={() => setExpanded(!expanded)}>
            <div className="row-header">
                <div>
                    <div className="product-title">{data.category}</div>
                    <div className="product-tagline" style={{marginTop: '2px'}}>Score: {data.trendScore} • {data.products?.length || 0} top products</div>
                </div>
                <div className="votes" style={{background: '#1a1a1a'}}>Explore ↓</div>
            </div>
            
            {expanded && (
                <div className="details" onClick={e => e.stopPropagation()}>
                    <h4 style={{marginBottom: '5px'}}>Why this space?</h4>
                    <p style={{marginTop: 0, fontStyle: 'italic'}}>{data.insights?.categoryPivot}</p>

                    <h4 style={{marginTop: '20px'}}>Cloneable Indie Products</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px'}}>
                        {data.products?.map((p: any) => (
                            <div key={p._id} style={{borderLeft: '3px solid var(--accent-color)', paddingLeft: '10px'}}>
                                <div style={{fontWeight: 'bold'}}>
                                    <a href={p.url && p.url.startsWith('http') ? p.url : `https://producthunt.com${p.url}`} target="_blank" rel="noreferrer" style={{textDecoration: 'none'}}>
                                        {p.name} <span style={{fontSize: '0.8rem', color: '#666', background: 'none'}}>^{p.votesCount}</span>
                                    </a>
                                </div>
                                <div style={{fontSize: '0.85rem', color: '#555', marginBottom: '5px'}}>{p.tagline}</div>
                                <div style={{fontSize: '0.9rem'}}><strong>How it works:</strong> {p.cloneStrategy}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
