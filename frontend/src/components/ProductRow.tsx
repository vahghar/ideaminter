import { useState } from 'react';

interface ProductRowProps {
    data: any;
}

export default function ProductRow({ data }: ProductRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="product-row" onClick={() => setExpanded(!expanded)}>
            <div className="row-header">
                <div>
                    <div className="product-title">{data.name}</div>
                    <div className="product-tagline">{data.tagline}</div>
                </div>
                <div className="votes">^{data.votesCount}</div>
            </div>
            
            {expanded && (
                <div className="details" onClick={e => e.stopPropagation()}>
                    <h4>Clone Strategy</h4>
                    <p>{data.insights?.cloneStrategy}</p>

                    <h4>Similar Products</h4>
                    <p>{data.insights?.similarProducts}</p>

                    <h4>Pivot Ideas</h4>
                    <ul>
                        {data.pivotIdeas?.map((idea: string, idx: number) => (
                            <li key={idx}>{idea}</li>
                        ))}
                    </ul>
                    <a href={data.url && data.url.startsWith('http') ? data.url : `https://producthunt.com${data.url}`} target="_blank" rel="noreferrer">
                        View Product →
                    </a>
                </div>
            )}
        </div>
    );
}
