"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/format";

interface MonthlyData {
    month: string;
    collateralUnderManagement: number;
    totalCapitalLoaned: number;
    realizedYield: number;
    unrealizedYield: number;
    delinquentRecovery: number;
    managementFeeIncome: number;
}

interface PlatformPerformanceAreaChartProps {
    data: MonthlyData[];
}

export function PlatformPerformanceAreaChart({ data }: PlatformPerformanceAreaChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<{ left: number; top: number; transform: string } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Define colors for each metric
    const colors = {
        realizedYield: "#22c55e", // green
        unrealizedYield: "#6b7280", // gray
        delinquentRecovery: "#eab308", // yellow
        managementFeeIncome: "#3b82f6", // blue
    };

    // Find max value for scaling
    const maxValue = Math.max(
        ...data.flatMap(d => [
            d.realizedYield,
            d.unrealizedYield,
            d.delinquentRecovery,
            d.managementFeeIncome,
        ])
    );

    // Scale function
    const scaleY = (value: number) => {
        return chartHeight - (value / maxValue) * chartHeight;
    };

    const scaleX = (index: number) => {
        return (index / (data.length - 1)) * chartWidth;
    };

    // Create path for area chart
    const createAreaPath = (values: number[]) => {
        let path = `M ${padding.left} ${padding.top + chartHeight} `;

        values.forEach((value, index) => {
            const x = padding.left + scaleX(index);
            const y = padding.top + scaleY(value);
            if (index === 0) {
                path += `L ${x} ${y} `;
            } else {
                path += `L ${x} ${y} `;
            }
        });

        path += `L ${padding.left + chartWidth} ${padding.top + chartHeight} Z`;
        return path;
    };

    // Create line path
    const createLinePath = (values: number[]) => {
        let path = "";
        values.forEach((value, index) => {
            const x = padding.left + scaleX(index);
            const y = padding.top + scaleY(value);
            if (index === 0) {
                path = `M ${x} ${y} `;
            } else {
                path += `L ${x} ${y} `;
            }
        });
        return path;
    };

    // Extract data arrays
    const realizedData = data.map(d => d.realizedYield);
    const unrealizedData = data.map(d => d.unrealizedYield);
    const recoveryData = data.map(d => d.delinquentRecovery);
    const feeData = data.map(d => d.managementFeeIncome);

    // Generate month labels (short format)
    const monthLabels = data.map(d => {
        const date = new Date(d.month);
        return date.toLocaleDateString('en-US', { month: 'short' });
    });

    // Handle mouse move to find closest data point
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || !containerRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // Get SVG viewBox scale factor if SVG is scaled
        const svgScaleX = svgRect.width / width;

        // Convert mouse position to SVG coordinates (accounting for viewBox scaling)
        const mouseX = (e.clientX - svgRect.left) / svgScaleX;

        // Check if mouse is within chart area
        if (mouseX < padding.left || mouseX > padding.left + chartWidth) {
            setHoveredIndex(null);
            setTooltipPosition(null);
            return;
        }

        // Find closest data point by calculating distance to each point's X position
        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < data.length; i++) {
            const pointX = padding.left + scaleX(i);
            const distance = Math.abs(mouseX - pointX);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }

        setHoveredIndex(closestIndex);
        // Position tooltip relative to container
        setTooltipPosition({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
        });
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltipPosition(null);
    };

    // Get hovered data point
    const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
    const hoveredMonth = hoveredData ? new Date(hoveredData.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

    // Calculate tooltip position in useEffect to avoid accessing refs during render
    useEffect(() => {
        if (tooltipPosition && containerRef.current) {
            const tooltipWidth = 220;
            const tooltipHeight = 150;
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;

            // Determine if tooltip should be on left or right of cursor
            const spaceOnRight = containerWidth - tooltipPosition.x;
            const spaceOnLeft = tooltipPosition.x;
            const showOnLeft = spaceOnRight < tooltipWidth && spaceOnLeft > tooltipWidth;

            // Calculate horizontal position
            let left: number;
            if (showOnLeft) {
                left = tooltipPosition.x - tooltipWidth - 10;
            } else {
                left = Math.min(tooltipPosition.x + 15, containerWidth - tooltipWidth - 10);
            }
            left = Math.max(10, left);

            // Calculate vertical position
            const spaceAbove = tooltipPosition.y;
            const spaceBelow = containerHeight - tooltipPosition.y;
            const showAbove = spaceBelow < tooltipHeight && spaceAbove > tooltipHeight;

            let top: number;
            let transform = '';
            if (showAbove) {
                top = tooltipPosition.y - tooltipHeight - 10;
                transform = 'translateY(-100%)';
            } else {
                top = tooltipPosition.y + 10;
                transform = 'translateY(0)';
            }
            top = Math.max(10, Math.min(top, containerHeight - tooltipHeight - 10));

            setTooltipStyle({ left, top, transform });
        } else {
            setTooltipStyle(null);
        }
    }, [tooltipPosition]);

    return (
        <div ref={containerRef} className="w-full overflow-x-auto relative">
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible cursor-crosshair"
                style={{ maxWidth: '100%', height: 'auto' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padding.top + chartHeight * ratio;
                    return (
                        <line
                            key={ratio}
                            x1={padding.left}
                            y1={y}
                            x2={padding.left + chartWidth}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                    );
                })}

                {/* Area fills (drawn in order, bottom to top) */}
                <path
                    d={createAreaPath(realizedData)}
                    fill={colors.realizedYield}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(unrealizedData)}
                    fill={colors.unrealizedYield}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(recoveryData)}
                    fill={colors.delinquentRecovery}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(feeData)}
                    fill={colors.managementFeeIncome}
                    fillOpacity="0.2"
                />

                {/* Lines (drawn on top) */}
                <path
                    d={createLinePath(realizedData)}
                    fill="none"
                    stroke={colors.realizedYield}
                    strokeWidth="2"
                />
                <path
                    d={createLinePath(unrealizedData)}
                    fill="none"
                    stroke={colors.unrealizedYield}
                    strokeWidth="2"
                />
                <path
                    d={createLinePath(recoveryData)}
                    fill="none"
                    stroke={colors.delinquentRecovery}
                    strokeWidth="2"
                />
                <path
                    d={createLinePath(feeData)}
                    fill="none"
                    stroke={colors.managementFeeIncome}
                    strokeWidth="2"
                />

                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const value = maxValue * (1 - ratio);
                    const y = padding.top + chartHeight * ratio;
                    return (
                        <text
                            key={ratio}
                            x={padding.left - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#6b7280"
                        >
                            ${(value / 1000).toFixed(0)}k
                        </text>
                    );
                })}

                {/* X-axis labels */}
                {monthLabels.map((label, index) => {
                    const x = padding.left + scaleX(index);
                    return (
                        <text
                            key={index}
                            x={x}
                            y={height - padding.bottom + 15}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#6b7280"
                        >
                            {label}
                        </text>
                    );
                })}

                {/* Y-axis line */}
                <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={padding.top + chartHeight}
                    stroke="#d1d5db"
                    strokeWidth="1"
                />

                {/* X-axis line */}
                <line
                    x1={padding.left}
                    y1={padding.top + chartHeight}
                    x2={padding.left + chartWidth}
                    y2={padding.top + chartHeight}
                    stroke="#d1d5db"
                    strokeWidth="1"
                />

                {/* Hover indicator - vertical line */}
                {hoveredIndex !== null && (
                    <>
                        <line
                            x1={padding.left + scaleX(hoveredIndex)}
                            y1={padding.top}
                            x2={padding.left + scaleX(hoveredIndex)}
                            y2={padding.top + chartHeight}
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            opacity="0.6"
                        />
                        {/* Data point markers */}
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(realizedData[hoveredIndex])}
                            r="4"
                            fill={colors.realizedYield}
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(unrealizedData[hoveredIndex])}
                            r="4"
                            fill={colors.unrealizedYield}
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(recoveryData[hoveredIndex])}
                            r="4"
                            fill={colors.delinquentRecovery}
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(feeData[hoveredIndex])}
                            r="4"
                            fill={colors.managementFeeIncome}
                            stroke="white"
                            strokeWidth="2"
                        />
                    </>
                )}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && hoveredData && tooltipStyle && (
                <div
                    ref={tooltipRef}
                    className="absolute bg-background border border-border rounded-lg shadow-lg p-3 z-50 pointer-events-none min-w-[200px]"
                    style={{
                        left: `${tooltipStyle.left}px`,
                        top: `${tooltipStyle.top}px`,
                        transform: tooltipStyle.transform,
                    }}
                >
                    <div className="text-xs font-semibold text-foreground mb-2 border-b border-border pb-1">
                        {hoveredMonth}
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.realizedYield }} />
                            <span className="text-muted-foreground">Realized Yield:</span>
                            <span className="font-medium text-foreground">{formatCurrency(hoveredData.realizedYield)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.unrealizedYield }} />
                            <span className="text-muted-foreground">Unrealized Yield:</span>
                            <span className="font-medium text-foreground">{formatCurrency(hoveredData.unrealizedYield)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.delinquentRecovery }} />
                            <span className="text-muted-foreground">Delinquent Recovery:</span>
                            <span className="font-medium text-foreground">{formatCurrency(hoveredData.delinquentRecovery)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.managementFeeIncome }} />
                            <span className="text-muted-foreground">Management Fee:</span>
                            <span className="font-medium text-foreground">{formatCurrency(hoveredData.managementFeeIncome)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.realizedYield }} />
                    <span className="text-foreground">Realized Yield</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.unrealizedYield }} />
                    <span className="text-foreground">Unrealized Yield</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.delinquentRecovery }} />
                    <span className="text-foreground">Delinquent Recovery</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.managementFeeIncome }} />
                    <span className="text-foreground">Management Fee Income</span>
                </div>
            </div>
        </div >
    );
}
