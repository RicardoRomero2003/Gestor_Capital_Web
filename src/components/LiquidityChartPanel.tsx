import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LiquidityRange, LiquiditySeriesPoint } from "../api/financialSettingsApi";
import "./LiquidityChartPanel.css";

type LiquidityChartPanelProps = {
  points: LiquiditySeriesPoint[];
  range: LiquidityRange;
  isLoading: boolean;
  onRangeChange: (nextRange: LiquidityRange) => void;
  title?: string;
  subtitle?: string;
};

const RANGE_OPTIONS: Array<{ value: LiquidityRange; label: string }> = [
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
  { value: "all", label: "Todo" },
];

export function LiquidityChartPanel({
  points,
  range,
  isLoading,
  onRangeChange,
  title = "Evolucion de liquidez",
  subtitle = "Suma de los 4 capitales tras cada transaccion.",
}: LiquidityChartPanelProps) {
  return (
    <section className="liquidity-chart-panel">
      <header className="liquidity-chart-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="liquidity-chart-range-selector">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`liquidity-chart-range-button${option.value === range ? " active" : ""}`}
              onClick={() => onRangeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="liquidity-chart-body">
        {isLoading ? <p className="liquidity-chart-placeholder">Cargando grafica...</p> : null}
        {!isLoading && points.length === 0 ? (
          <p className="liquidity-chart-placeholder">No hay datos para mostrar.</p>
        ) : null}
        {!isLoading && points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="liquidityStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71f5a6" />
                  <stop offset="100%" stopColor="#2fbf77" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatAxisTimestamp(value, range)}
                minTickGap={20}
                stroke="#9f9f9f"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatCompactEuro(Number(value))}
                width={60}
                stroke="#9f9f9f"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f0f0f",
                  border: "1px solid #2f2f2f",
                  borderRadius: "10px",
                  color: "#f2f2f2",
                }}
                cursor={{ stroke: "#4a4a4a", strokeWidth: 1 }}
                labelFormatter={(value) => formatTooltipTimestamp(String(value))}
                formatter={(value) => [formatEuro(Number(value ?? 0)), "Liquidez total"]}
              />
              <Line
                type="monotone"
                dataKey="total_liquido"
                stroke="url(#liquidityStroke)"
                strokeWidth={2.6}
                dot={{ r: 3.2, fill: "#95ffbe", stroke: "#08140d", strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: "#c6ffe0", stroke: "#0e1f15", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </section>
  );
}

function formatAxisTimestamp(value: string, range: LiquidityRange): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (range === "all") {
    return new Intl.DateTimeFormat("es-ES", {
      month: "2-digit",
      year: "2-digit",
    }).format(date);
  }

  if (range === "year") {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatTooltipTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatCompactEuro(value: number): string {
  if (!Number.isFinite(value)) {
    return "0€";
  }

  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M€`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k€`;
  }
  return `${value.toFixed(0)}€`;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
