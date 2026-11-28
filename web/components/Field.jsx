// Form field: label, the control (children), then a hint or an error

/**
 * @param {{
 *   id: string,
 *   label: string,
 *   error?: string,
 *   hint?: React.ReactNode,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function Field({ id, label, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#464255]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-[#e64545]">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-[#a3a3a3]">{hint}</p>
      )}
    </div>
  )
}
