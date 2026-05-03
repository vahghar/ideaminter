"use client";

import { useEffect, useState } from 'react';
import CategoryRow from '../components/CategoryRow';
import IdeaSpark from '../components/IdeaSpark';
import { useAuth } from '@clerk/nextjs';

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
    const { getToken, isSignedIn } = useAuth();
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Idea Bar States
    const [idea, setIdea] = useState("");
    const [mapping, setMapping] = useState(false);
    const [mappedResult, setMappedResult] = useState<TrendData | null>(null);
    const [saving, setSaving] = useState(false);

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
                alert("vibecoded app sorry for the errors");
            }
        } catch (e) {
            console.error(e);
        }
        setMapping(false);
    };

    const saveToBank = async () => {
        if (!isSignedIn) {
            alert("Please sign in to save ideas to your bank.");
            return;
        }
        if (!mappedResult) return;

        setSaving(true);
        try {
            const token = await getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${API_URL}/api/ideas`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: idea,
                    originalThought: idea,
                    aiAnalysis: {
                        categoryPivot: mappedResult.insights.categoryPivot,
                        products: mappedResult.products
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Idea saved to your personal bank!");
            }
        } catch (e) {
            console.error(e);
            alert("vibecoded app sorry for the errors");
        }
        setSaving(false);
    };

    return (
        <main className="container">
            <IdeaSpark />
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
                    <div style={{ marginBottom: '30px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{color: 'var(--accent-color)'}}>Mapped Target Companies</h2>
                            <button 
                                onClick={saveToBank} 
                                disabled={saving}
                                style={{
                                    backgroundColor: 'var(--accent-color)',
                                    padding: '8px 16px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {saving ? 'Saving...' : 'Save to Idea Bank'}
                            </button>
                        </div>
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
