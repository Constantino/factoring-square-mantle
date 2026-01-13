import { useState, useEffect } from "react";
import { CreditScoreGaugeProps } from "@/types/creditScoreGaugeProps";

export function CreditScoreGauge({ score }: CreditScoreGaugeProps) {
    const minScore = 300;
    const [animatedScore, setAnimatedScore] = useState(minScore);
    // Score ranges and categories
    const ranges = [
        { min: 300, max: 560, label: "Very Bad", color: "#ef4444" },
        { min: 560, max: 650, label: "Bad", color: "#f97316" },
        { min: 650, max: 700, label: "Fair", color: "#fbbf24" },
        { min: 700, max: 750, label: "Good", color: "#84cc16" },
        { min: 750, max: 850, label: "Excellent", color: "#22c55e" },
    ];

    const getCategory = (score: number) => {
        return ranges.find(r => score >= r.min && score < r.max) || ranges[ranges.length - 1];
    };

    // Animate score from minScore to target score
    useEffect(() => {
        const duration = 1500; // Animation duration in milliseconds
        const startTime = Date.now();
        const startScore = minScore;
        const targetScore = score;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentScore = startScore + (targetScore - startScore) * eased;
            setAnimatedScore(Math.round(currentScore));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }, [score]);

    const category = getCategory(score);
    const maxScore = 850;
    const scoreRange = maxScore - minScore;

    // SVG dimensions
    const width = 300;
    const height = 160;
    const centerX = width / 2;
    const centerY = height; // Center at bottom for upward-opening arc
    const outerRadius = 120;
    const innerRadius = 80;

    // Helper function to convert score to angle (0° = right, 180° = left)
    const scoreToAngle = (scoreValue: number) => {
        const normalized = (scoreValue - minScore) / scoreRange;
        return 180 - (normalized * 180); // 180° (left) to 0° (right)
    };

    // Helper function to get point on arc
    const getArcPoint = (angle: number, radius: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: centerX + Math.cos(rad) * radius,
            y: centerY - Math.sin(rad) * radius, // Negative for upward
        };
    };

    // Create arc segment path
    const createSegmentPath = (startScore: number, endScore: number) => {
        const startAngle = scoreToAngle(startScore);
        const endAngle = scoreToAngle(endScore);

        const innerStart = getArcPoint(startAngle, innerRadius);
        const innerEnd = getArcPoint(endAngle, innerRadius);
        const outerStart = getArcPoint(startAngle, outerRadius);
        const outerEnd = getArcPoint(endAngle, outerRadius);

        const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

        return `M ${innerStart.x} ${innerStart.y} 
                L ${outerStart.x} ${outerStart.y} 
                A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
                L ${innerEnd.x} ${innerEnd.y}
                A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
                Z`;
    };

    // Calculate indicator position using animated score
    const indicatorAngle = scoreToAngle(animatedScore);
    const indicatorPoint = getArcPoint(indicatorAngle, outerRadius - 20);

    // Score markers
    const markers = [300, 560, 650, 700, 750, 850];

    return (
        <div className="flex flex-col items-center justify-center py-2">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                {/* Colored segments */}
                {ranges.map((range, index) => (
                    <path
                        key={index}
                        d={createSegmentPath(range.min, range.max)}
                        fill={range.color}
                        stroke="white"
                        strokeWidth="2"
                    />
                ))}

                {/* Score markers */}
                {markers.map((markerScore) => {
                    const markerAngle = scoreToAngle(markerScore);
                    const markerPoint = getArcPoint(markerAngle, outerRadius);
                    const textPoint = getArcPoint(markerAngle, outerRadius + 10);

                    return (
                        <g key={markerScore}>
                            <line
                                x1={markerPoint.x}
                                y1={markerPoint.y}
                                x2={textPoint.x}
                                y2={textPoint.y}
                                stroke="#666"
                                strokeWidth="1"
                            />
                            <text
                                x={textPoint.x}
                                y={textPoint.y - 2}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#666"
                                className="font-medium"
                            >
                                {markerScore}
                            </text>
                        </g>
                    );
                })}

                {/* Indicator line */}
                <line
                    x1={centerX}
                    y1={centerY}
                    x2={indicatorPoint.x}
                    y2={indicatorPoint.y}
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                {/* Center circle */}
                <circle cx={centerX} cy={centerY} r="8" fill="#3b82f6" />
            </svg>

            {/* Score display */}
            <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                    {animatedScore}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: category.color }}>
                    {category.label}
                </div>
            </div>
        </div>
    );
}

