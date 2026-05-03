"use client";

import { useEffect, useState } from 'react';

export default function IdeaSpark() {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/suggestions`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setSuggestions(data.data);
                setLoading(false);
            });
    }, []);

    if (loading || suggestions.length === 0) return null;

    const current = suggestions[index];

    return (
        <div className="idea-spark-box">
            <div className="spark-label">RANDOM MARKET GAP SPARK</div>
            <div className="spark-content">
                <h3 className="spark-title">{current.title}</h3>
                <p className="spark-thought">{current.thought}</p>
                <div className="spark-why">WHY NOW: {current.whyNow}</div>
            </div>
            <button className="spark-next" onClick={() => setIndex((index + 1) % suggestions.length)}>
                GIVE ME ANOTHER
            </button>
            <style jsx>{`
                .idea-spark-box {
                    background: #fdfaf6;
                    border: 3px solid #1a1a1a;
                    padding: 25px;
                    margin-bottom: 40px;
                    position: relative;
                    box-shadow: 8px 8px 0px #e63946;
                }
                .spark-label {
                    position: absolute;
                    top: -12px;
                    left: 20px;
                    background: #e63946;
                    color: white;
                    padding: 2px 10px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
                .spark-title {
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                    font-size: 1.4rem;
                }
                .spark-thought {
                    font-family: serif;
                    font-size: 1.1rem;
                    line-height: 1.4;
                    margin-bottom: 15px;
                    font-style: italic;
                }
                .spark-why {
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: #e63946;
                }
                .spark-next {
                    margin-top: 20px;
                    background: #1a1a1a;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    font-family: inherit;
                    cursor: pointer;
                    font-size: 0.8rem;
                }
                .spark-next:hover {
                    background: #e63946;
                }
            `}</style>
        </div>
    );
}
