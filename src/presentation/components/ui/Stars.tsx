interface StarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function Stars({ value, onChange, size = 'md' }: StarsProps) {
  const sizes = { sm: '1rem', md: '1.25rem', lg: '1.5rem' };

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange?.(i)}
          style={{
            fontSize: sizes[size],
            color: i <= value ? '#F59E0B' : '#E5E5E5',
            cursor: onChange ? 'pointer' : 'default',
            transition: 'color 0.1s',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
