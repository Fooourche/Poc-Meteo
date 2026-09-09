interface Props {
  onAddImages: (files: File[]) => void;
}

export function MapUploader({ onAddImages }: Props) {
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) {
      onAddImages(files);
    }
    // reinitialise le champ pour pouvoir reselectionner le meme fichier plus tard
    event.target.value = "";
  }

  return (
    <div className="panel">
      <h2>Carte meteo (image)</h2>
      <input type="file" accept="image/*" multiple onChange={handleFileChange} />
      <p className="agent-description">
        Vous pouvez selectionner plusieurs images a la fois (ex: une sequence de cartes a
        differentes echeances). Sur mobile, le selecteur permet aussi de prendre une photo
        directement. Chaque image ajoutee apparait ci-dessous dans la liste des cartes a
        analyser.
      </p>
    </div>
  );
}
