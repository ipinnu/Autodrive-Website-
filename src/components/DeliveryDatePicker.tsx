"use client";
import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { CalendarDays, Check } from "lucide-react";
import { track } from "@/lib/customer";

// Dates are calendar days, not instants: keep the same day in every browser timezone.
export function calendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
export function calendarValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const displayDate = (date: Date) => new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(date);

export default function DeliveryDatePicker({ value, min, max, disabled = false, onChange }: {
  value: string; min: string; max: string; disabled?: boolean; onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false); const trigger = useRef<HTMLButtonElement>(null); const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const earliest = calendarDate(min); const latest = calendarDate(max);
  const selected = value && value >= min && value <= max ? calendarDate(value) : undefined;
  useEffect(() => {
    const modal = dialog.current; if (!open || !modal) return;
    const previousOverflow = document.body.style.overflow;
    modal.showModal(); document.body.style.overflow = "hidden";
    modal.querySelector<HTMLButtonElement>(".rdp-selected button, .rdp-day_button:not([disabled])")?.focus({ preventScroll: true });
    return () => { modal.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);
  function close() { dialog.current?.close(); setOpen(false); trigger.current?.focus({ preventScroll: true }); }
  function choose(date: Date | undefined) {
    if (!date || disabled) return;
    const next = calendarValue(date); if (next < min || next > max) return;
    onChange(next); close();
    void track("cta_tapped", { screenName: "web_checkout", ctaLabel: "Choose delivery date", preferredDeliveryDate: next });
  }
  return <div className="customer-delivery-date">
    <span id={`${id}-label`} className="customer-date-label">Preferred delivery date</span>
    <button type="button" ref={trigger} disabled={disabled} className={`customer-date-trigger ${open ? "is-open" : ""}`} aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-calendar`} onClick={() => setOpen(true)}>
      <span className="customer-date-icon"><CalendarDays size={21} /></span><span className="customer-date-copy"><strong id={`${id}-value`}>{selected ? displayDate(selected) : "Choose your delivery date"}</strong><small>{selected && value === min ? "Earliest available delivery" : "Pick a day that works for you"}</small></span>
    </button>
    <dialog ref={dialog} id={`${id}-calendar`} className="customer-calendar-dialog" aria-labelledby={`${id}-title`} onCancel={(e) => { e.preventDefault(); close(); }} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      {open && <div className="customer-delivery-calendar">
      <div className="customer-calendar-heading"><span id={`${id}-title`}>Choose a delivery day</span><button type="button" onClick={close}>Done</button></div>
      <DayPicker mode="single" required autoFocus selected={selected} defaultMonth={selected || earliest}
        startMonth={earliest} endMonth={latest} disabled={disabled ? true : [{ before: earliest }, { after: latest }]}
        disableNavigation={disabled} onSelect={choose} showOutsideDays fixedWeeks weekStartsOn={1} navLayout="after" />
      <div className="customer-calendar-footer"><button type="button" disabled={disabled} onClick={() => choose(earliest)}><Check size={14} />Earliest available</button><span>{new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(earliest)}</span></div>
      </div>}
    </dialog>
    <small className="customer-date-hint">Available from {new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long" }).format(earliest)}.</small>
  </div>;
}
