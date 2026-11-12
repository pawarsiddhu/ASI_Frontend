import { Landmark, Layers } from 'lucide-react';
import styles from './SearchTabs.module.css';

/**
 * SearchTabs — segmented control for record type.
 * Controlled via `value` + `onChange('antiquity' | 'bhs')`.
 */
export default function SearchTabs({ value, onChange, counts }) {
  const items = [
    { key: 'bhs', label: 'Built Heritage', icon: <Landmark size={15} /> },
    { key: 'antiquity', label: 'Antiquities', icon: <Layers size={15} /> },
  ];
  return (
    <div className={styles.tabs} role="tablist" aria-label="Record type">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={styles.tab}
            data-active={active ? 'true' : undefined}
            onClick={() => onChange(it.key)}
          >
            {it.icon}
            <span>{it.label}</span>
            {counts?.[it.key] != null && (
              <span className={styles.count}>{counts[it.key]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
