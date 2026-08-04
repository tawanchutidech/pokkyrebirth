"use client";

import type { Hero } from "@/data/heroes";

export function HeroChip({
  hero,
  placed,
  onClick,
  className = "hero-chip",
}: {
  hero: Hero;
  placed: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      title={placed ? "กดเพื่อเอาออก" : "กดเพื่อใส่ช่อง HOT"}
      onClick={onClick}
    >
      <img src={hero.img} alt={hero.name} loading="lazy" />
      <span>{hero.name}</span>
    </button>
  );
}

export function ElementFilterRow({
  elements,
  active,
  onToggle,
}: {
  elements: { id: string; label: string; icon: string }[];
  active: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="filter-pills" style={{ marginBottom: 12 }}>
      {elements.map((el) => (
        <button
          key={el.id}
          type="button"
          className={`hero-element-btn${active === el.id ? " active" : ""}`}
          title={el.label}
          onClick={() => onToggle(el.id)}
        >
          <img src={el.icon} alt={el.label} />
        </button>
      ))}
    </div>
  );
}
