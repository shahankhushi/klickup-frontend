"use client";

import React, { useState } from "react";

// Types
export interface EmployeeTaskItem {
  name: string;
  label: string;
  count: number;
  color?: string;
}

export interface WorkloadStatusItem {
  status: string;
  count: number;
  color: string;
  percent?: number;
}

export interface PriorityItem {
  priority: string;
  count: number;
  color: string;
}

export interface AssigneePieItem {
  name: string;
  percentage: number;
  count: number;
  color: string;
}

// -------------------------------------------------------------
// 1. Employee Wise Tasks Report Bar Chart
// -------------------------------------------------------------
export function EmployeeWiseTasksBarChart({ data }: { data: EmployeeTaskItem[] }) {
  const [hovered, setHovered] = useState<EmployeeTaskItem | null>(null);

  const maxVal = 75;
  const width = 850;
  const height = 300;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 90;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = Math.max(8, Math.min(22, (chartWidth / data.length) * 0.6));
  const step = chartWidth / data.length;

  const gridSteps = [0, 25, 50, 75];

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[650px] font-sans"
        style={{ overflow: "visible" }}
      >
        {/* Y Axis Grid lines & Labels */}
        {gridSteps.map((val) => {
          const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray={val === 0 ? "none" : "3,3"}
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] fill-muted-foreground font-medium"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Y Axis Title */}
        <text
          x={paddingLeft - 10}
          y={paddingTop - 12}
          textAnchor="start"
          className="text-[11px] fill-muted-foreground font-semibold"
        >
          Tasks
        </text>

        {/* Bars */}
        {data.map((item, idx) => {
          const barHeight = Math.max(3, (item.count / maxVal) * chartHeight);
          const x = paddingLeft + idx * step + step / 2 - barWidth / 2;
          const y = paddingTop + chartHeight - barHeight;
          const color = item.color || "#0ea5e9";

          return (
            <g
              key={item.name + idx}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Task count above bar */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-[10px] font-bold fill-foreground"
              >
                {item.count}
              </text>

              {/* Bar Rect */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill={color}
                className="transition-opacity hover:opacity-80"
              />

              {/* X Axis Label */}
              <text
                x={x + barWidth / 2}
                y={paddingTop + chartHeight + 12}
                textAnchor="end"
                transform={`rotate(-55, ${x + barWidth / 2}, ${paddingTop + chartHeight + 12})`}
                className="text-[10px] fill-muted-foreground font-medium hover:fill-foreground"
              >
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hovered && (
        <div className="absolute top-2 right-4 rounded-lg bg-popover/95 border border-border px-3 py-1.5 shadow-md text-xs pointer-events-none z-10 backdrop-blur-xs">
          <p className="font-semibold text-foreground">{hovered.label || hovered.name}</p>
          <p className="text-muted-foreground">
            Tasks: <span className="font-bold text-primary">{hovered.count}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. Workload by Status Donut Chart (Anti-Collision Vertical Spacing)
// -------------------------------------------------------------
export function WorkloadStatusDonutChart({ data }: { data: WorkloadStatusItem[] }) {
  const [hovered, setHovered] = useState<WorkloadStatusItem | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const width = 480;
  const height = 320;
  const cx = 240;
  const cy = 160;
  const rOuter = 80;
  const rInner = 44;

  let currentAngle = -Math.PI / 2;

  // 1. Calculate slice geometry
  const initialSlices = data.map((item, idx) => {
    const sliceAngle = (item.count / total) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = (startAngle + endAngle) / 2;
    currentAngle = endAngle;

    const op1 = { x: cx + rOuter * Math.cos(startAngle), y: cy + rOuter * Math.sin(startAngle) };
    const op2 = { x: cx + rOuter * Math.cos(endAngle), y: cy + rOuter * Math.sin(endAngle) };
    const ip1 = { x: cx + rInner * Math.cos(startAngle), y: cy + rInner * Math.sin(startAngle) };
    const ip2 = { x: cx + rInner * Math.cos(endAngle), y: cy + rInner * Math.sin(endAngle) };

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = `M ${op1.x} ${op1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${op2.x} ${op2.y} L ${ip2.x} ${ip2.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${ip1.x} ${ip1.y} Z`;

    const isRight = Math.cos(midAngle) >= 0;
    const naturalY = cy + (rOuter + 30) * Math.sin(midAngle);
    const pStart = { x: cx + (rOuter + 3) * Math.cos(midAngle), y: cy + (rOuter + 3) * Math.sin(midAngle) };

    return {
      index: idx,
      item,
      path,
      midAngle,
      pStart,
      naturalY,
      adjustedY: naturalY,
      isRight,
      percentage: ((item.count / total) * 100).toFixed(1),
    };
  });

  // 2. Anti-collision algorithm: separate left and right labels, enforce minimum vertical spacing
  const rightLabels = initialSlices.filter((s) => s.isRight);
  const leftLabels = initialSlices.filter((s) => !s.isRight);

  const spreadLabels = (list: typeof initialSlices, minY: number, maxY: number, minGap = 22) => {
    if (list.length <= 1) return;
    list.sort((a, b) => a.naturalY - b.naturalY);

    // Forward pass
    for (let i = 1; i < list.length; i++) {
      if (list[i].adjustedY - list[i - 1].adjustedY < minGap) {
        list[i].adjustedY = list[i - 1].adjustedY + minGap;
      }
    }

    // Backward pass if overshooting maxY
    if (list[list.length - 1].adjustedY > maxY) {
      list[list.length - 1].adjustedY = maxY;
      for (let i = list.length - 2; i >= 0; i--) {
        if (list[i + 1].adjustedY - list[i].adjustedY < minGap) {
          list[i].adjustedY = list[i + 1].adjustedY - minGap;
        }
      }
    }

    // Clamp minY
    for (let i = 0; i < list.length; i++) {
      if (list[i].adjustedY < minY) {
        list[i].adjustedY = minY + i * minGap;
      }
    }
  };

  spreadLabels(rightLabels, 30, height - 30, 22);
  spreadLabels(leftLabels, 30, height - 30, 22);

  // Combine back and calculate elbow + end positions
  const slices = initialSlices.map((slice) => {
    const isRight = slice.isRight;
    const elbowX = cx + (isRight ? rOuter + 34 : -(rOuter + 34));
    const pEnd = { x: isRight ? elbowX + 22 : elbowX - 22, y: slice.adjustedY };

    return {
      ...slice,
      elbowX,
      pEnd,
    };
  });

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[480px] mx-auto font-sans">
        {/* Slices */}
        {slices.map((slice, idx) => (
          <g
            key={slice.item.status + idx}
            className="cursor-pointer transition-transform duration-200"
            onMouseEnter={() => setHovered(slice.item)}
            onMouseLeave={() => setHovered(null)}
          >
            <path
              d={slice.path}
              fill={slice.item.color}
              stroke="var(--background, #fff)"
              strokeWidth={2}
              className="hover:opacity-85 transition-opacity"
            />
          </g>
        ))}

        {/* Center hole text */}
        <circle cx={cx} cy={cy} r={rInner - 2} fill="var(--card, #fff)" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="text-sm font-bold fill-foreground">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="text-[10px] font-medium fill-muted-foreground">
          Total Tasks
        </text>

        {/* Callout lines & text labels for slices with anti-collision spacing */}
        {slices.map((slice, idx) => {
          return (
            <g key={"lbl-" + slice.item.status + idx} className="pointer-events-none">
              <polyline
                points={`${slice.pStart.x},${slice.pStart.y} ${slice.elbowX},${slice.adjustedY} ${slice.pEnd.x},${slice.adjustedY}`}
                fill="none"
                stroke={slice.item.color}
                strokeOpacity="0.8"
                strokeWidth={1.2}
              />
              <text
                x={slice.pEnd.x + (slice.isRight ? 4 : -4)}
                y={slice.adjustedY + 3.5}
                textAnchor={slice.isRight ? "start" : "end"}
                className="text-[10px] font-bold fill-foreground select-none"
              >
                {slice.item.status} <tspan className="font-extrabold text-foreground">{slice.item.count}</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend below */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-medium text-foreground">{item.status}</span>
            <span className="text-muted-foreground">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. Priority Breakdown Stacked/Grouped Bar Chart
// -------------------------------------------------------------
export function PriorityBreakdownChart({ data }: { data: PriorityItem[] }) {
  const maxVal = 75;
  const width = 440;
  const height = 210;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const step = chartWidth / data.length;
  const barWidth = 42;

  const gridSteps = [0, 25, 50, 75];

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[460px] mx-auto font-sans">
        {/* Grid lines */}
        {gridSteps.map((val) => {
          const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray={val === 0 ? "none" : "3,3"}
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-muted-foreground font-medium"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const barHeight = Math.max(4, (item.count / maxVal) * chartHeight);
          const x = paddingLeft + idx * step + step / 2 - barWidth / 2;
          const y = paddingTop + chartHeight - barHeight;

          // Layer styling matching screenshot (layered background & colored bottom)
          const baseColor = "#d1d5db";
          const accentColor = item.color || "#3b82f6";
          const accentHeight = Math.min(barHeight, 14);

          return (
            <g key={item.priority} className="cursor-pointer group">
              {/* Task count on top */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-[11px] font-bold fill-foreground"
              >
                {item.count}
              </text>

              {/* Main bar background */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={baseColor}
                opacity="0.85"
                className="group-hover:opacity-100 transition-opacity"
              />

              {/* Layered accent at bottom of bar */}
              <rect
                x={x}
                y={paddingTop + chartHeight - accentHeight}
                width={barWidth}
                height={accentHeight}
                rx={2}
                fill={accentColor}
              />

              {/* Category label */}
              <text
                x={x + barWidth / 2}
                y={paddingTop + chartHeight + 18}
                textAnchor="middle"
                className="text-[11px] fill-muted-foreground font-medium group-hover:fill-foreground"
              >
                {item.priority}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// -------------------------------------------------------------
// 4. Tasks by Assignee Pie Chart (Anti-Collision & Staggered Labels)
// -------------------------------------------------------------
export function TasksByAssigneePieChart({ data }: { data: AssigneePieItem[] }) {
  const [hovered, setHovered] = useState<AssigneePieItem | null>(null);

  const totalPercentage = data.reduce((acc, curr) => acc + curr.percentage, 0) || 100;
  const width = 740;
  const height = 520;
  const cx = 370;
  const cy = 250;
  const r = 135;

  let currentAngle = -Math.PI / 2;

  // 1. Calculate pie wedge geometry
  const initialSlices = data.map((item, idx) => {
    const sliceAngle = (item.percentage / totalPercentage) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = (startAngle + endAngle) / 2;
    currentAngle = endAngle;

    const p1 = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
    const p2 = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;

    const isRight = Math.cos(midAngle) >= 0;
    const naturalY = cy + (r + 32) * Math.sin(midAngle);
    const pStart = { x: cx + (r + 4) * Math.cos(midAngle), y: cy + (r + 4) * Math.sin(midAngle) };

    return {
      index: idx,
      item,
      path,
      midAngle,
      pStart,
      naturalY,
      adjustedY: naturalY,
      isRight,
    };
  });

  // 2. Anti-collision algorithm: separate left and right labels, enforce minimum vertical spacing
  const rightLabels = initialSlices.filter((s) => s.isRight);
  const leftLabels = initialSlices.filter((s) => !s.isRight);

  const spreadLabels = (list: typeof initialSlices, minY: number, maxY: number, minGap = 26) => {
    if (list.length <= 1) return;
    list.sort((a, b) => a.naturalY - b.naturalY);

    // Forward pass
    for (let i = 1; i < list.length; i++) {
      if (list[i].adjustedY - list[i - 1].adjustedY < minGap) {
        list[i].adjustedY = list[i - 1].adjustedY + minGap;
      }
    }

    // Backward pass if overshooting maxY
    if (list[list.length - 1].adjustedY > maxY) {
      list[list.length - 1].adjustedY = maxY;
      for (let i = list.length - 2; i >= 0; i--) {
        if (list[i + 1].adjustedY - list[i].adjustedY < minGap) {
          list[i].adjustedY = list[i + 1].adjustedY - minGap;
        }
      }
    }

    // Clamp minY
    for (let i = 0; i < list.length; i++) {
      if (list[i].adjustedY < minY) {
        list[i].adjustedY = minY + i * minGap;
      }
    }
  };

  spreadLabels(rightLabels, 30, height - 30, 26);
  spreadLabels(leftLabels, 40, height - 40, 26);

  // Combine back
  const slices = initialSlices.map((slice) => {
    const isRight = slice.isRight;
    const elbowX = cx + (isRight ? r + 38 : -(r + 38));
    const pEnd = { x: isRight ? elbowX + 32 : elbowX - 32, y: slice.adjustedY };

    return {
      ...slice,
      elbowX,
      pEnd,
    };
  });

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-w-[680px] mx-auto font-sans"
        style={{ overflow: "visible" }}
      >
        {/* Slices */}
        {slices.map((slice) => {
          const isHovered = hovered?.name === slice.item.name;
          return (
            <g
              key={slice.item.name}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => setHovered(slice.item)}
              onMouseLeave={() => setHovered(null)}
            >
              <path
                d={slice.path}
                fill={slice.item.color}
                stroke="var(--background, #fff)"
                strokeWidth={1.5}
                className={isHovered ? "brightness-110 filter drop-shadow-md" : "hover:brightness-105 transition-all"}
              />
            </g>
          );
        })}

        {/* Callout Lines & Anti-Collided Labels */}
        {slices.map((slice) => {
          const isHovered = hovered?.name === slice.item.name;
          return (
            <g key={"pie-lbl-" + slice.item.name} className="pointer-events-none">
              <polyline
                points={`${slice.pStart.x},${slice.pStart.y} ${slice.elbowX},${slice.adjustedY} ${slice.pEnd.x},${slice.adjustedY}`}
                fill="none"
                stroke={isHovered ? slice.item.color : "currentColor"}
                strokeOpacity={isHovered ? 1 : 0.4}
                strokeWidth={isHovered ? 1.75 : 1}
              />
              <circle
                cx={slice.pStart.x}
                cy={slice.pStart.y}
                r={isHovered ? 3.5 : 2}
                fill={slice.item.color}
              />
              <text
                x={slice.pEnd.x + (slice.isRight ? 6 : -6)}
                y={slice.adjustedY + 3.5}
                textAnchor={slice.isRight ? "start" : "end"}
                className={`text-[10.5px] ${
                  isHovered ? "font-bold fill-primary" : "font-medium fill-foreground"
                }`}
              >
                {slice.item.name} <span className="font-bold opacity-80">{slice.item.percentage}%</span>
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Indicator */}
      {hovered && (
        <div className="absolute top-2 right-4 rounded-lg bg-popover/95 border border-border px-3.5 py-2 shadow-lg text-xs pointer-events-none z-10 backdrop-blur-xs flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: hovered.color }} />
          <div>
            <p className="font-bold text-foreground">{hovered.name}</p>
            <p className="text-muted-foreground text-[11px]">
              Allocation: <strong className="text-primary">{hovered.percentage}%</strong> ({hovered.count} tasks)
            </p>
          </div>
        </div>
      )}

      {/* Clean Color Legend Grid */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground max-w-[620px]">
        {data.map((item) => (
          <div
            key={item.name}
            className={`flex items-center gap-1.5 cursor-pointer rounded-full px-2 py-0.5 transition-colors ${
              hovered?.name === item.name ? "bg-muted font-bold text-foreground" : "hover:text-foreground"
            }`}
            onMouseEnter={() => setHovered(item)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="truncate max-w-[140px]">{item.name}</span>
            <span className="text-[10px] opacity-75">({item.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
