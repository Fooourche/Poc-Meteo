import { useState } from "react";

interface Props {
  onImageChange: (file: File | null) => void;
}

export function MapUploader({ onImageChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onImageChange(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="panel">
      <h2>Carte meteo (image)</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <p className="agent-description">
        Sur mobile, vous pouvez prendre une photo directement (ex: une carte affichee a la TV ou
        dans un journal) ou choisir une image existante.
      </p>
      {previewUrl && <img src={previewUrl} alt="Apercu de la carte meteo" className="map-preview" />}
    </div>
  );
}
