import { useEffect, useMemo, useRef } from "react";
import "./TradingViewEmbedChart.css";

type TradingViewEmbedChartProps = {
  symbol: string;
  interval: "60" | "D" | "W" | "M";
};

export function TradingViewEmbedChart({ symbol, interval }: TradingViewEmbedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useMemo(() => `tv-widget-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const host = containerRef.current;
    host.innerHTML = "";

    const widgetNode = document.createElement("div");
    widgetNode.id = widgetId;
    widgetNode.className = "tradingview-widget-container__widget";
    host.appendChild(widgetNode);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "es",
      withdateranges: true,
      allow_symbol_change: false,
      hide_side_toolbar: false,
      calendar: false,
      container_id: widgetId,
    });
    host.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [symbol, interval, widgetId]);

  return (
    <div className="tradingview-widget-container">
      <div className="tradingview-widget-host" ref={containerRef} />
    </div>
  );
}
