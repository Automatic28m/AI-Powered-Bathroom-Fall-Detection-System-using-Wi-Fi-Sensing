// Loading / error / empty rows shared by the admin tables

/**
 * @param {{ colSpan: number, loading: boolean, error: string, empty: boolean, emptyText: string }} props
 */
export default function TableStates({ colSpan, loading, error, empty, emptyText }) {
  let text = ''
  let tone = 'text-[#a3a3a3]'
  if (error) {
    text = error
    tone = 'text-[#e64545]'
  } else if (loading && empty) text = 'กำลังโหลด…'
  else if (!loading && empty) text = emptyText
  if (!text) return null
  return (
    <tr>
      <td colSpan={colSpan} className={`px-6 py-10 text-center ${tone}`}>
        {text}
      </td>
    </tr>
  )
}

/** Table header cell class. Keep in one place so every table looks the same. */
export const TH = 'px-4 py-3 first:pl-6 last:pr-6'
/** Table body cell class */
export const TD = 'px-4 py-4 first:pl-6 last:pr-6'
