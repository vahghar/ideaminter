"use client";

import { useEffect, useState } from 'react';
import CategoryRow from '../components/CategoryRow';

interface TrendData {
    _id: string;
    category: string;
    trendScore: number;
    insights: {
        categoryPivot: string;
    };
    products: {
        _id: string;
        name: string;
        tagline: string;
        votesCount: number;
        url: string;
        cloneStrategy: string;
    }[];
}

export default function Home() {
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Idea Bar States
    const [idea, setIdea] = useState("");
    const [mapping, setMapping] = useState(false);
    const [mappedResult, setMappedResult] = useState<TrendData | null>(null);

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        fetch(`${API_URL}/api/trends`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setTrends(data.data.slice(0, 15)); 
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed", err);
                setLoading(false);
            });
    }, []);

    const extractIdea = async () => {
        if (!idea.trim()) return;
        setMapping(true);
        setMappedResult(null);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${API_URL}/api/map-idea`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea })
            });
            const data = await res.json();
            if (data.success && data.match.products.length > 0) {
                setMappedResult(data.match);
            } else {
                alert("AI couldn't find any close matches in the database for this specific idea.");
            }
        } catch (e) {
            console.error(e);
        }
        setMapping(false);
    };

    return (
        <main className="container">
            <h1>Idea Mapping & Constraints</h1>
            
            <div className="idea-bar">
                <input 
                    type="text" 
                    value={idea} 
                    onChange={e => setIdea(e.target.value)} 
                    placeholder="E.g. A marketplace for AI generated podcasts..." 
                    onKeyDown={e => e.key === 'Enter' && extractIdea()}
                />
                <button onClick={extractIdea} disabled={mapping || !idea.trim()}>
                    {mapping ? 'Searching AI...' : 'Map Idea'}
                </button>
            </div>

            {loading && <div>Evaluating deep clone batches...</div>}
            
            <div className="list-container">
                {mappedResult && (
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{color: 'var(--accent-color)'}}>Mapped Target Companies</h2>
                        <CategoryRow data={mappedResult} />
                    </div>
                )}
                
                {!loading && trends.map((trend) => (
                    <CategoryRow key={trend._id} data={trend} />
                ))}
            </div>
        </main>
    );
}
