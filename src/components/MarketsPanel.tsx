import type { WatchlistItem } from "../api/investmentsApi";

type MarketsPanelProps = {
  watchlist: WatchlistItem[];
  selectedSymbol: string;
  symbolValue: string;
  nameValue: string;
  marketValue: string;
  isSaving: boolean;
  onSymbolChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onMarketChange: (value: string) => void;
  onAdd: () => void;
  onSelectSymbol: (symbol: string) => void;
  onRemoveSymbol: (item: WatchlistItem) => void;
};

export function MarketsPanel({
  watchlist,
  selectedSymbol,
  symbolValue,
  nameValue,
  marketValue,
  isSaving,
  onSymbolChange,
  onNameChange,
  onMarketChange,
  onAdd,
  onSelectSymbol,
  onRemoveSymbol,
}: MarketsPanelProps) {
  return (
    <article className="invest-card markets-panel-card">
      <h3>Mis mercados</h3>
      <div className="markets-panel-content">
        <div className="invest-watchlist-form">
          <input
            type="text"
            placeholder="Simbolo (ej: AAPL)"
            value={symbolValue}
            onChange={(event) => onSymbolChange(event.target.value)}
          />
          <input
            type="text"
            placeholder="Nombre (opcional)"
            value={nameValue}
            onChange={(event) => onNameChange(event.target.value)}
          />
          <input
            type="text"
            placeholder="Mercado (opcional)"
            value={marketValue}
            onChange={(event) => onMarketChange(event.target.value)}
          />
          <button type="button" onClick={onAdd} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Anadir"}
          </button>
        </div>

        <ul className="invest-watchlist-list">
          {watchlist.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`invest-watchlist-item${item.symbol === selectedSymbol ? " active" : ""}`}
                onClick={() => onSelectSymbol(item.symbol)}
              >
                <span>{item.symbol}</span>
                <small>{item.display_name || item.market || "Sin alias"}</small>
              </button>
              <button
                type="button"
                className="invest-watchlist-remove"
                onClick={() => onRemoveSymbol(item)}
                aria-label={`Eliminar ${item.symbol} de watchlist`}
              >
                x
              </button>
            </li>
          ))}
          {watchlist.length === 0 ? <li className="invest-empty">No hay simbolos en watchlist.</li> : null}
        </ul>
      </div>
    </article>
  );
}
