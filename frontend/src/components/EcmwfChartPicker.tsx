import { useEffect, useState } from "react";

import { fetchEcmwfChart, fetchEcmwfProducts } from "../api/client";
import type { EcmwfProductInfo } from "../types";

interface Props {
  onImageChange: (file: File | null) => void;
}

function isoAt(offsetHours: number): string {
  const date = new Date(Date.now() + offsetHours * 3600 * 1000);
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function EcmwfChartPicker({ onImageChange }: Props) {
  const [products, setProducts] = useState<EcmwfProductInfo[]>([]);
  const [productId, setProductId] = useState("medium-mslp-wind850");
  const [baseTime, setBaseTime] = useState(isoAt(0));
  const [validTime, setValidTime] = useState(isoAt(24));
  const [projection, setProjection] = useState("opencharts_central_europe");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEcmwfProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur inconnue"));
  }, []);

  async function handleFetch() {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const blob = await fetchEcmwfChart({ product: productId, baseTime, validTime, projection });
      const file = new File([blob], `${productId}.png`, { type: blob.type || "image/png" });
      onImageChange(file);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      onImageChange(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Carte ECMWF Open Charts</h2>
      <label>
        Produit
        <input
          list="ecmwf-products"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="ex: medium-mslp-wind850"
        />
      </label>
      <datalist id="ecmwf-products">
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </datalist>

      <div className="coords-row">
        <label>
          Base time (UTC)
          <input value={baseTime} onChange={(e) => setBaseTime(e.target.value)} />
        </label>
        <label>
          Valid time (UTC)
          <input value={validTime} onChange={(e) => setValidTime(e.target.value)} />
        </label>
        <label>
          Projection
          <input value={projection} onChange={(e) => setProjection(e.target.value)} />
        </label>
      </div>

      <button onClick={handleFetch} disabled={loading || !productId}>
        {loading ? "Recuperation..." : "Recuperer la carte"}
      </button>

      {error && <p className="error">{error}</p>}
      {previewUrl && <img src={previewUrl} alt="Carte ECMWF" className="map-preview" />}

      <p className="agent-description">
        Liste complete des produits et projections disponibles sur{" "}
        <a href="https://charts.ecmwf.int/" target="_blank" rel="noreferrer">
          charts.ecmwf.int
        </a>{" "}
        (bouton "Download" d'une carte pour voir son identifiant exact).
      </p>
    </div>
  );
}
