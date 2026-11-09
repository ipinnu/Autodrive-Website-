import { money, type Quote } from "@/lib/customer-checkout";

export default function PriceBreakdown({ quote }: { quote: Quote }) {
  return <><ul className="customer-price-lines">{quote.selectedDocuments.map((d) => <li key={`${d.carId}/${d.documentId}`}><div><strong>{d.documentId}</strong><span>{d.car}</span></div><strong>{money(d.customerPriceNGN)}</strong></li>)}</ul>
    <div className="customer-price-delivery"><span>Delivery <small>Once for your order</small></span><strong>{money(quote.logisticsFeeNGN)}</strong></div>
    <div className="customer-price-total"><span>Total payable</span><strong>{money(quote.amount)}</strong></div>
  </>;
}
