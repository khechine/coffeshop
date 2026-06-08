import React, { useState, useEffect } from 'react';

export const DENOMINATIONS = [
  { label: '50 DT', value: 50 },
  { label: '20 DT', value: 20 },
  { label: '10 DT', value: 10 },
  { label: '5 DT', value: 5 },
  { label: '2 DT', value: 2 },
  { label: '1 DT', value: 1 },
  { label: '0.500 DT', value: 0.5 },
  { label: '0.200 DT', value: 0.2 },
  { label: '0.100 DT', value: 0.1 },
  { label: '0.050 DT', value: 0.05 },
];

interface DenominationCounts {
  [key: string]: number;
}

interface Props {
  onChange: (details: DenominationCounts, total: number) => void;
  initialCounts?: DenominationCounts;
}

export function DenominationCounter({ onChange, initialCounts = {} }: Props) {
  const [counts, setCounts] = useState<DenominationCounts>(initialCounts);

  useEffect(() => {
    let total = 0;
    DENOMINATIONS.forEach(denom => {
      const count = counts[denom.value.toString()] || 0;
      total += count * denom.value;
    });
    onChange(counts, total);
  }, [counts, onChange]);

  const handleChange = (value: number, text: string) => {
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setCounts(prev => ({
      ...prev,
      [value.toString()]: isNaN(parsed) ? 0 : parsed
    }));
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        paddingBottom: '8px',
        borderBottom: '2px solid var(--pos-border)',
        marginBottom: '12px',
        fontWeight: 'bold',
        color: 'var(--pos-text-muted)',
        fontSize: '12px',
        textTransform: 'uppercase'
      }}>
        <div style={{ textAlign: 'left' }}>Billet/Pièce</div>
        <div style={{ textAlign: 'center' }}>Quantité</div>
        <div style={{ textAlign: 'right' }}>Total</div>
      </div>
      
      <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
        {DENOMINATIONS.map(denom => {
          const qty = counts[denom.value.toString()] || 0;
          const lineTotal = qty * denom.value;
          return (
            <div key={denom.value} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--pos-text-main)', textAlign: 'left' }}>
                {denom.label}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={qty > 0 ? qty.toString() : ''}
                  onChange={(e) => handleChange(denom.value, e.target.value)}
                  placeholder="0"
                  style={{
                    width: '60px',
                    textAlign: 'center',
                    padding: '6px',
                    borderRadius: '8px',
                    border: '1px solid var(--pos-border)',
                    background: 'var(--pos-bg)',
                    color: 'var(--pos-text-main)',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <div style={{ fontWeight: 800, color: 'var(--pos-primary)', textAlign: 'right' }}>
                {lineTotal.toFixed(3)} DT
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
