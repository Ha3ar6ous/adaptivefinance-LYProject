export default function IndiaFlag({ className = "" }) {
  return (
    <svg
      className={`af-india-flag ${className}`}
      viewBox="0 0 90 60"
      role="img"
      aria-label="Indian flag"
    >
      <path fill="#ff9933" d="M0 0h90v20H0z" />
      <path fill="#fff" d="M0 20h90v20H0z" />
      <path fill="#138808" d="M0 40h90v20H0z" />
      <g stroke="#000080" fill="none" strokeWidth="0.55">
        <circle cx="45" cy="30" r="8.3" />
        {Array.from({ length: 24 }, (_, index) => (
          <path
            key={index}
            d="M45 30v-8.3"
            transform={`rotate(${index * 15} 45 30)`}
          />
        ))}
      </g>
      <circle cx="45" cy="30" r="1.3" fill="#000080" />
    </svg>
  );
}
