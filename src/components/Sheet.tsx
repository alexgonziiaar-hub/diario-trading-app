import { useEffect, useRef, type ReactNode } from 'react';

/** Panel que sube desde abajo, con fondo oscuro que lo cierra */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-wrap">
      {/* Tocar fuera cierra; con teclado se usa el botón Cerrar o Escape */}
      <div className="sheet-backdrop" aria-hidden="true" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <span className="sheet__grabber" aria-hidden="true" />
        <div className="sheet__head">
          <h2 id="sheet-title">{title}</h2>
          <button ref={closeRef} type="button" className="link-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
