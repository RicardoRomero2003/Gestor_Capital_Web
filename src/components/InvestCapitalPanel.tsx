import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  addWatchlistSymbol,
  getInvestmentPerformance,
  getInvestmentPositions,
  getWatchlist,
  removeWatchlistSymbol,
  type InvestmentPerformancePoint,
  type InvestmentPerformanceRange,
  type InvestmentPosition,
  type WatchlistItem,
} from "../api/investmentsApi";
import { MarketsPanel } from "./MarketsPanel";
import { ManualInvestmentForm } from "./ManualInvestmentForm";
import "./InvestCapitalPanel.css";

type InvestCapitalPanelProps = {
  userId: number;
  amount: number;
  onClose: () => void;
};

const RANGE_OPTIONS: Array<{ value: InvestmentPerformanceRange; label: string }> = [
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
  { value: "all", label: "Todo" },
];

export function InvestCapitalPanel({ userId, amount, onClose }: InvestCapitalPanelProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [positions, setPositions] = useState<InvestmentPosition[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [range, setRange] = useState<InvestmentPerformanceRange>("month");
  const [performancePoints, setPerformancePoints] = useState<InvestmentPerformancePoint[]>([]);

  const [watchlistSymbol, setWatchlistSymbol] = useState("");
  const [watchlistName, setWatchlistName] = useState("");
  const [watchlistMarket, setWatchlistMarket] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [performanceErrorMessage, setPerformanceErrorMessage] = useState("");
  const [performanceReloadKey, setPerformanceReloadKey] = useState(0);

  const watchlistSymbols = useMemo(() => {
    const values = new Set<string>();
    for (const item of watchlist) {
      values.add(item.symbol);
    }
    for (const position of positions) {
      values.add(position.symbol);
    }
    return Array.from(values);
  }, [watchlist, positions]);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [watchlistItems, positionItems] = await Promise.all([
          getWatchlist(userId),
          getInvestmentPositions(userId),
        ]);
        if (!active) {
          return;
        }

        setWatchlist(watchlistItems);
        setPositions(positionItems);

        const initialSymbol = watchlistItems[0]?.symbol ?? positionItems[0]?.symbol ?? "";
        setSelectedSymbol(initialSymbol);
      } catch (error) {
        if (!active) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el panel de inversiones.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedSymbol) {
      setPerformancePoints([]);
      setPerformanceErrorMessage("");
      return;
    }

    let active = true;
    const loadPerformance = async () => {
      setIsLoadingPerformance(true);
      try {
        const data = await getInvestmentPerformance(userId, selectedSymbol, range);
        if (!active) {
          return;
        }
        setPerformancePoints(data.points);
        setPerformanceErrorMessage("");
      } catch (error) {
        if (!active) {
          return;
        }
        setPerformancePoints([]);
        setPerformanceErrorMessage(
          error instanceof Error ? error.message : "No se pudo cargar el rendimiento del simbolo.",
        );
      } finally {
        if (active) {
          setIsLoadingPerformance(false);
        }
      }
    };

    void loadPerformance();

    return () => {
      active = false;
    };
  }, [userId, selectedSymbol, range, performanceReloadKey]);

  const handleAddWatchlist = async () => {
    const normalizedSymbol = watchlistSymbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      setErrorMessage("Introduce un simbolo para anadir a la watchlist.");
      return;
    }

    try {
      setIsSavingWatchlist(true);
      setErrorMessage("");
      const created = await addWatchlistSymbol(userId, {
        symbol: normalizedSymbol,
        display_name: watchlistName.trim() || undefined,
        market: watchlistMarket.trim() || undefined,
      });
      setWatchlist((current) => {
        const withoutSymbol = current.filter((item) => item.symbol !== created.symbol);
        return [created, ...withoutSymbol];
      });
      if (!selectedSymbol) {
        setSelectedSymbol(normalizedSymbol);
      }
      setWatchlistSymbol("");
      setWatchlistName("");
      setWatchlistMarket("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el simbolo en watchlist.");
    } finally {
      setIsSavingWatchlist(false);
    }
  };

  const handleRemoveWatchlist = async (item: WatchlistItem) => {
    try {
      setErrorMessage("");
      await removeWatchlistSymbol(userId, item.id);
      setWatchlist((current) => {
        const updated = current.filter((currentItem) => currentItem.id !== item.id);
        if (selectedSymbol === item.symbol) {
          setSelectedSymbol(updated[0]?.symbol ?? "");
        }
        return updated;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar el simbolo de watchlist.");
    }
  };

  return (
    <motion.div
      className="invest-panel-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.section
        layoutId="invest-capital-card"
        className="invest-panel"
        transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.95 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="invest-panel-header">
          <div>
            <h2>Capital a invertir</h2>
            <strong>{formatEuro(amount)}</strong>
          </div>
          <button type="button" className="invest-panel-close" onClick={onClose} aria-label="Cerrar panel">
            x
          </button>
        </header>

        <div className="invest-panel-content">
          <section className="invest-panel-left-column">
            <MarketsPanel
              watchlist={watchlist}
              selectedSymbol={selectedSymbol}
              symbolValue={watchlistSymbol}
              nameValue={watchlistName}
              marketValue={watchlistMarket}
              isSaving={isSavingWatchlist}
              onSymbolChange={setWatchlistSymbol}
              onNameChange={setWatchlistName}
              onMarketChange={setWatchlistMarket}
              onAdd={() => void handleAddWatchlist()}
              onSelectSymbol={(symbol) => {
                setSelectedSymbol(symbol);
              }}
              onRemoveSymbol={(item) => void handleRemoveWatchlist(item)}
            />

            <ManualInvestmentForm
              userId={userId}
              symbols={watchlistSymbols}
              preferredSymbol={selectedSymbol}
              onOperationSaved={async (symbol) => {
                setErrorMessage("");
                const [updatedPositions, updatedWatchlist] = await Promise.all([
                  getInvestmentPositions(userId),
                  getWatchlist(userId),
                ]);
                setPositions(updatedPositions);
                setWatchlist(updatedWatchlist);
                setSelectedSymbol(symbol);
                setPerformanceReloadKey((current) => current + 1);
              }}
            />
          </section>

          <section className="invest-panel-right-column">
            <article className="invest-card invest-chart-card">
              <div className="invest-chart-header">
                <h3>Rendimiento</h3>
                <div className="invest-range-buttons">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={option.value === range ? "active" : ""}
                      onClick={() => setRange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="invest-chart-content">
                {!selectedSymbol ? (
                  <p className="invest-empty">
                    {isLoading ? "Cargando datos de inversiones..." : "Selecciona un simbolo para ver su rendimiento."}
                  </p>
                ) : null}
                {selectedSymbol && isLoadingPerformance ? (
                  <p className="invest-empty">Cargando grafica...</p>
                ) : null}
                {selectedSymbol && !isLoadingPerformance && performanceErrorMessage ? (
                  <p className="invest-error">{performanceErrorMessage}</p>
                ) : null}
                {selectedSymbol && !isLoadingPerformance && !performanceErrorMessage && performancePoints.length === 0 ? (
                  <p className="invest-empty">No hay datos de mercado para este simbolo en el rango seleccionado.</p>
                ) : null}
                {selectedSymbol &&
                !isLoadingPerformance &&
                !performanceErrorMessage &&
                performancePoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performancePoints} margin={{ top: 12, right: 10, left: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="investmentValueStroke" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9dd0ff" />
                          <stop offset="100%" stopColor="#4f8fcc" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="timestamp_utc"
                        stroke="#a7a7a7"
                        tick={{ fontSize: 11 }}
                        minTickGap={20}
                        tickFormatter={(value) => formatAxisTimestamp(String(value), range)}
                      />
                      <YAxis
                        stroke="#a7a7a7"
                        tick={{ fontSize: 11 }}
                        width={68}
                        tickFormatter={(value) => formatCompactEuro(Number(value))}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f0f0f",
                          border: "1px solid #2c2c2c",
                          borderRadius: "10px",
                          color: "#f1f1f1",
                        }}
                        cursor={{ stroke: "#4b4b4b", strokeWidth: 1 }}
                        labelFormatter={(value) => formatTooltipTimestamp(String(value))}
                        formatter={(value, name, item) => {
                          const point = item?.payload as InvestmentPerformancePoint | undefined;
                          if (name === "price") {
                            return [formatEuro(Number(value)), "Precio"];
                          }
                          if (name === "market_value_eur") {
                            return [formatEuro(Number(value)), "Valor de posicion"];
                          }
                          if (name === "pnl_eur") {
                            return [formatSignedEuro(Number(value)), "PnL"];
                          }
                          return [String(value), point?.timestamp_utc ?? "Dato"];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="url(#investmentValueStroke)"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#9dd0ff", stroke: "#0e1620", strokeWidth: 1.3 }}
                        activeDot={{ r: 5, fill: "#d5ecff", stroke: "#17314a", strokeWidth: 1.8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </article>

            <article className="invest-card">
              <h3>Posiciones actuales</h3>
              <div className="invest-positions-table">
                <div className="invest-positions-head">
                  <span>Simbolo</span>
                  <span>Cantidad</span>
                  <span>Valor</span>
                  <span>PnL</span>
                </div>
                {positions.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    className="invest-positions-row"
                    onClick={() => {
                      setSelectedSymbol(item.symbol);
                    }}
                  >
                    <span>{item.symbol}</span>
                    <span>{item.quantity.toFixed(6)}</span>
                    <span>{formatEuro(item.market_value_eur)}</span>
                    <span className={item.unrealized_pnl_eur >= 0 ? "positive" : "negative"}>
                      {formatSignedEuro(item.unrealized_pnl_eur)}
                    </span>
                  </button>
                ))}
                {positions.length === 0 ? <p className="invest-empty">No hay posiciones abiertas.</p> : null}
              </div>
            </article>
          </section>
        </div>
        {errorMessage ? <p className="invest-error">{errorMessage}</p> : null}
      </motion.section>
    </motion.div>
  );
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedEuro(value: number): string {
  const abs = Math.abs(value);
  const formatted = formatEuro(abs);
  return `${value >= 0 ? "+" : "-"}${formatted}`;
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

function formatAxisTimestamp(value: string, range: InvestmentPerformanceRange): string {
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
