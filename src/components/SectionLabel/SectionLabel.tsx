import './SectionLabel.css';

interface SectionLabelProps {
  number: string;
}

export function SectionLabel({ number }: SectionLabelProps) {
  return (
    <p className="section-label">
      <span className="section-label__bracket">[</span>
      {number}
      <span className="section-label__bracket">]</span>
    </p>
  );
}
