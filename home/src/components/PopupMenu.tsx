function PopupMenu({
  children,
  open,
  onClose,
  onClick,
}: {
  children?: React.ReactNode
  open: boolean
  onClose: () => void
  onClick?: () => void
}) {
  if (!open) return null
  return (
    <div className="popup-menu-wrapper" onClick={onClose}>
      <div
        className="popup-menu"
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PopupMenu
