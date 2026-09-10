interface Step {
  label: string;
  active: boolean;
}

const STEPS: Step[] = [
  { label: "1. Observation", active: false },
  { label: "2. Calage modeles (satellite/radar)", active: false },
  { label: "3. Analyse synoptique", active: true },
  { label: "4. Comparaison modeles / ensemble", active: false },
];

export function StepNav() {
  return (
    <nav className="step-nav" aria-label="Etapes du processus d'expertise">
      {STEPS.map((step) => (
        <span key={step.label} className={`step-item${step.active ? " active" : ""}`}>
          {step.label}
          {!step.active && <span className="step-badge">bientot</span>}
        </span>
      ))}
    </nav>
  );
}
