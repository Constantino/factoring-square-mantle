"use client";

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
    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Define colors for each metric
    const colors = {
        collateralUnderManagement: "#3b82f6", // blue
        totalCapitalLoaned: "#22c55e", // green
        realizedYield: "#eab308", // yellow
        unrealizedYield: "#f97316", // orange
        delinquentRecovery: "#ef4444", // red
        managementFeeIncome: "#8b5cf6", // purple
    };

    // Find max value for scaling
    const maxValue = Math.max(
        ...data.flatMap(d => [
            d.collateralUnderManagement,
            d.totalCapitalLoaned,
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
    const createAreaPath = (values: number[], color: string) => {
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
    const collateralData = data.map(d => d.collateralUnderManagement);
    const capitalData = data.map(d => d.totalCapitalLoaned);
    const realizedData = data.map(d => d.realizedYield);
    const unrealizedData = data.map(d => d.unrealizedYield);
    const recoveryData = data.map(d => d.delinquentRecovery);
    const feeData = data.map(d => d.managementFeeIncome);

    // Generate month labels (short format)
    const monthLabels = data.map(d => {
        const date = new Date(d.month);
        return date.toLocaleDateString('en-US', { month: 'short' });
    });

    return (
        <div className="w-full overflow-x-auto">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" style={{ maxWidth: '100%', height: 'auto' }}>
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
                    d={createAreaPath(collateralData, colors.collateralUnderManagement)}
                    fill={colors.collateralUnderManagement}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(capitalData, colors.totalCapitalLoaned)}
                    fill={colors.totalCapitalLoaned}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(realizedData, colors.realizedYield)}
                    fill={colors.realizedYield}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(unrealizedData, colors.unrealizedYield)}
                    fill={colors.unrealizedYield}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(recoveryData, colors.delinquentRecovery)}
                    fill={colors.delinquentRecovery}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(feeData, colors.managementFeeIncome)}
                    fill={colors.managementFeeIncome}
                    fillOpacity="0.2"
                />

                {/* Lines (drawn on top) */}
                <path
                    d={createLinePath(collateralData)}
                    fill="none"
                    stroke={colors.collateralUnderManagement}
                    strokeWidth="2"
                />
                <path
                    d={createLinePath(capitalData)}
                    fill="none"
                    stroke={colors.totalCapitalLoaned}
                    strokeWidth="2"
                />
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
            </svg>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.collateralUnderManagement }} />
                    <span className="text-foreground">Collateral Under Management</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.totalCapitalLoaned }} />
                    <span className="text-foreground">Total Capital Loaned</span>
                </div>
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
        </div>
    );
}
