"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function Dashboard() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [ideas, setIdeas] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [suggesting, setSuggesting] = useState(false);

    const fetchIdeas = async () => {
        try {
            const token = await getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${API_URL}/api/ideas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setIdeas(data.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const brainstorm = async () => {
        setSuggesting(true);
        try {
            const token = await getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${API_URL}/api/suggestions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setSuggestions(data.data);
        } catch (e) {
            console.error(e);
        }
        setSuggesting(false);
    };

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchIdeas();
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || loading) return <div className="container"><h1>Loading your bank...</h1></div>;
    if (!isSignedIn) return <div className="container"><h1>Please sign in to view your bank.</h1></div>;

    return (
        <main className="container">
            <div style={{ marginBottom: '20px' }}>
                <a href="/" style={{ fontSize: '0.9rem', color: 'var(--text-color)', fontWeight: 'bold', textDecoration: 'none' }}>← Back to Home</a>
            </div>
            <h1 style={{ borderBottom: '4px solid var(--accent-color)' }}>Idea Bank</h1>
            
            <section style={{ marginBottom: '40px', padding: '20px', background: 'white', border: '2px solid var(--border-color)', boxShadow: '4px 4px 0px var(--border-color)' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Quick Draft</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        id="quick-idea"
                        type="text" 
                        placeholder="Got a raw thought? Save it here..." 
                        style={{ flexGrow: 1, padding: '10px', border: '2px solid var(--border-color)', fontFamily: 'inherit' }}
                    />
                    <button 
                        onClick={async () => {
                            const input = document.getElementById('quick-idea') as HTMLInputElement;
                            const thought = input.value.trim();
                            if (!thought) return;
                            
                            try {
                                const token = await getToken();
                                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                const res = await fetch(`${API_URL}/api/ideas`, {
                                    method: 'POST',
                                    headers: { 
                                        'Content-Type': 'application/json', 
                                        'Authorization': `Bearer ${token}` 
                                    },
                                    body: JSON.stringify({ title: thought, originalThought: thought })
                                });
                                
                                const data = await res.json();
                                if (data.success) {
                                    input.value = '';
                                    alert("Draft saved!");
                                    fetchIdeas(); // Refresh the list
                                } else {
                                    alert("vibecoded app sorry for the errors");
                                }
                            } catch (e: any) {
                                console.error(e);
                                alert("vibecoded app sorry for the errors");
                            }
                        }}
                        style={{ padding: '10px 20px', background: 'var(--text-color)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Save Draft
                    </button>
                </div>
            </section>

            <section style={{ marginBottom: '50px' }}>
                <h2>Saved Research</h2>
                {ideas.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #ccc' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Your bank is empty!</p>
                        <p style={{ opacity: 0.6 }}>Ideas you map on the home page or save as drafts will appear here.</p>
                        <a href="/" className="auth-btn-primary" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>Start Mapping</a>
                    </div>
                ) : (
                    ideas.map((idea: any) => (
                        <div key={idea._id} style={{ marginBottom: '30px', padding: '20px', border: '2px solid var(--border-color)', background: 'white', boxShadow: '4px 4px 0px var(--border-color)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>{idea.title}</h3>
                                <span className="votes" style={{ height: 'fit-content' }}>{idea.status}</span>
                            </div>
                            <p style={{ fontStyle: 'italic', margin: '15px 0' }}>"{idea.originalThought}"</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                                {idea.aiAnalysis?.products?.length > 0 ? (
                                    <details style={{ flexGrow: 1 }}>
                                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Market Analysis</summary>
                                        <div style={{ marginTop: '15px' }}>
                                            <p><strong>Pivot Strategy:</strong> {idea.aiAnalysis.categoryPivot}</p>
                                            <div className="list-container">
                                                {idea.aiAnalysis.products.map((p: any, i: number) => (
                                                    <div key={i} className="product-row" style={{ cursor: 'default' }}>
                                                        <div className="product-title">{p.name}</div>
                                                        <div className="product-tagline">{p.tagline}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </details>
                                ) : <div style={{ flexGrow: 1 }}></div>}
                                
                                <button 
                                    onClick={async () => {
                                        if (!confirm("Delete this idea?")) return;
                                        const token = await getToken();
                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                        await fetch(`${API_URL}/api/ideas/${idea._id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        fetchIdeas();
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent-color)',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem',
                                        padding: '5px'
                                    }}
                                >
                                    DELETE [X]
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {ideas.length > 0 && (
                <section style={{ padding: '30px', background: 'var(--hover-bg)', border: '2px dashed var(--border-color)', marginBottom: '50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: 'var(--accent-color)', margin: 0 }}>Personalized Brainstorm</h2>
                        <button 
                            onClick={brainstorm} 
                            disabled={suggesting}
                            className="auth-btn-primary"
                        >
                            {suggesting ? 'AI Thinking...' : 'Generate Ideas Based on my Bank'}
                        </button>
                    </div>
                    
                    {suggestions.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            {suggestions.map((s: any, i: number) => (
                                <div key={i} style={{ background: 'white', padding: '20px', border: '2px solid var(--border-color)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase' }}>{s.title}</h4>
                                    <p style={{ margin: 0 }}>{s.thought}</p>
                                    <div style={{ marginTop: '10px', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--accent-color)' }}>
                                        Fit: {s.whyNow}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ opacity: 0.6 }}>Click the button above to let AI find hybrid opportunities between your ideas and market trends.</p>
                    )}
                </section>
            )}
        </main>
    );
}
