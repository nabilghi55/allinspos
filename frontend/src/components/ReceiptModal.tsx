import React, { useEffect } from 'react';
import { ArrowRight, Check, Printer, X } from 'lucide-react';
import type { Transaction } from '../types';
import { formatRupiah } from '../services/api';

interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose, onNewOrder }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  const formattedDate = new Date(transaction.created_at).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="modal-backdrop receipt-backdrop">
      <section className="modal receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <header className="modal-header success-header">
          <div className="success-title"><span><Check size={18} /></span><div><p className="eyebrow">Transaksi selesai</p><h2 id="receipt-title">Pembayaran berhasil</h2></div></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup struk"><X size={19} /></button>
        </header>

        <div className="receipt-scroll">
          <article className="receipt-paper" id="printable-receipt">
            <header className="receipt-store">
              <h3>MJB SPORT</h3>
              <p>Lapai, Padang, Sumatera Barat</p>
              <p>0812-9988-7766</p>
            </header>
            <div className="receipt-rule" />
            <dl className="receipt-meta">
              <div><dt>No. struk</dt><dd>{transaction.id}</dd></div>
              <div><dt>Tanggal</dt><dd>{formattedDate}</dd></div>
              <div><dt>Kasir</dt><dd>{transaction.cashier_name}</dd></div>
              <div><dt>Metode</dt><dd>{transaction.payment_method}</dd></div>
            </dl>
            <div className="receipt-rule" />
            <div className="receipt-items">
              {transaction.items.map((item, index) => (
                <div className="receipt-item" key={`${item.product_id}-${index}`}>
                  <div><strong>{item.name} {item.size ? `(${item.size})` : ''}</strong><span>{item.qty} × {formatRupiah(item.price)}</span>{item.notes && <span>{item.notes}</span>}</div>
                  <b>{formatRupiah(item.subtotal)}</b>
                </div>
              ))}
            </div>
            <div className="receipt-rule" />
            <dl className="receipt-totals">
              <div><dt>Subtotal</dt><dd>{formatRupiah(transaction.subtotal)}</dd></div>
              {transaction.discount > 0 && <div><dt>Diskon</dt><dd>−{formatRupiah(transaction.discount)}</dd></div>}
              {transaction.tax > 0 && <div><dt>Pajak</dt><dd>{formatRupiah(transaction.tax)}</dd></div>}
              <div className="receipt-grand-total"><dt>Total</dt><dd>{formatRupiah(transaction.total)}</dd></div>
              {transaction.payment_method === 'CASH' && <><div><dt>Tunai</dt><dd>{formatRupiah(transaction.cash_amount)}</dd></div><div><dt>Kembali</dt><dd>{formatRupiah(transaction.change_amount)}</dd></div></>}
            </dl>
            <div className="receipt-rule" />
            <footer className="receipt-note"><strong>Terima kasih sudah berbelanja.</strong><span>Simpan struk ini sebagai bukti transaksi.</span></footer>
          </article>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer size={16} /> Cetak struk</button>
          <button type="button" className="btn btn-primary" onClick={onNewOrder}>Transaksi baru <ArrowRight size={16} /></button>
        </footer>
      </section>
    </div>
  );
};
