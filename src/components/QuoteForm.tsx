import { cloneElement, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, Paperclip, Phone, ShieldCheck } from 'lucide-react';
import { business } from '../data/business';
import { services } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import Button from './Button';

/**
 * Point d'envoi du formulaire (ex. Formspree, Web3Forms, fonction serverless) : VITE_QUOTE_ENDPOINT au build.
 * Sans lui, la demande part par SMS pré-rempli vers le numéro vérifié de l'entreprise : fonctionnel sans aucun compte.
 */
const ENDPOINT = import.meta.env.VITE_QUOTE_ENDPOINT as string | undefined;

type Status = 'idle' | 'sending' | 'sent' | 'sms' | 'error';
const REQUIRED = ['firstName', 'lastName', 'email', 'phone', 'service', 'propertyType', 'contactMethod'] as const;

export default function QuoteForm() {
  const { t } = useLang();
  const f = t.form;
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [smsText, setSmsText] = useState('');

  const validate = (data: FormData) => {
    const next: Record<string, string> = {};
    for (const name of REQUIRED) if (!String(data.get(name) ?? '').trim()) next[name] = f.errors.required;
    const email = String(data.get('email') ?? '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = f.errors.email;
    const digits = String(data.get('phone') ?? '').replace(/\D/g, '');
    if (digits && !(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))) next.phone = f.errors.phone;
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get('company') ?? '')) {
      setStatus('sent'); // champ piège rempli : robot de spam, on ne transmet rien
      return;
    }
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    if (ENDPOINT) {
      setStatus('sending');
      try {
        const res = await fetch(ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        setStatus(res.ok ? 'sent' : 'error');
      } catch {
        setStatus('error');
      }
      return;
    }

    const lines = [
      f.smsIntro,
      `${data.get('firstName')} ${data.get('lastName')}`,
      `${f.phone}: ${data.get('phone')}`,
      `${f.email}: ${data.get('email')}`,
      `${f.service}: ${data.get('service')}`,
      `${f.propertyType}: ${data.get('propertyType')}`,
      data.get('preferredDate') ? `${f.date}: ${data.get('preferredDate')}` : '',
      `${f.contactMethod}: ${data.get('contactMethod')}`,
      String(data.get('message') ?? '').trim(),
    ].filter(Boolean);
    const text = lines.join('\n');
    setSmsText(text);
    setStatus('sms');
    // « ?&body= » : format compris à la fois par iOS et Android.
    window.location.href = `${business.smsHref}?&body=${encodeURIComponent(text)}`;
  };

  const reset = () => {
    formRef.current?.reset();
    setErrors({});
    setStatus('idle');
  };

  if (status === 'sent' || status === 'sms') {
    const sms = status === 'sms';
    return (
      <div role="status" className="flex flex-col items-center gap-4 rounded-2xl border border-teal-100 bg-white p-10 text-center shadow-card">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          {sms ? <MessageSquare size={28} aria-hidden /> : <CheckCircle2 size={30} aria-hidden />}
        </span>
        <h3 className="font-display text-2xl font-semibold text-navy-900">{sms ? f.smsTitle : f.successTitle}</h3>
        <p className="max-w-md text-[15px] leading-relaxed text-navy-500">{sms ? f.smsBody : f.successBody}</p>
        {sms && (
          <pre className="w-full max-w-md whitespace-pre-wrap rounded-xl bg-mist-50 p-4 text-left font-sans text-sm text-navy-700">{smsText}</pre>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href={business.phoneHref} variant="secondary">
            <Phone size={17} aria-hidden /> {business.phoneDisplay}
          </Button>
          <Button variant="ghost" onClick={reset}>
            {f.another}
          </Button>
        </div>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
      {(errorCount > 0 || status === 'error') && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          {status === 'error' ? f.errors.network : f.errors.summary}
        </div>
      )}

      {/* Champ piège invisible pour les robots de spam (les humains ne le voient pas). */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={f.firstName} name="firstName" error={errors.firstName} required requiredLabel={f.required}>
          <input type="text" autoComplete="given-name" />
        </Field>
        <Field label={f.lastName} name="lastName" error={errors.lastName} required requiredLabel={f.required}>
          <input type="text" autoComplete="family-name" />
        </Field>
        <Field label={f.email} name="email" error={errors.email} required requiredLabel={f.required}>
          <input type="email" autoComplete="email" inputMode="email" />
        </Field>
        <Field label={f.phone} name="phone" error={errors.phone} required requiredLabel={f.required}>
          <input type="tel" autoComplete="tel" inputMode="tel" placeholder="(301) 555-0142" />
        </Field>

        <Field label={f.service} name="service" error={errors.service} required requiredLabel={f.required}>
          <select defaultValue="">
            <option value="" disabled>
              {f.servicePlaceholder}
            </option>
            {services.map((s) => (
              <option key={s.slug} value={t.services.items[s.slug].name}>
                {t.services.items[s.slug].name}
              </option>
            ))}
            <option value={f.serviceOther}>{f.serviceOther}</option>
          </select>
        </Field>

        <Field label={f.propertyType} name="propertyType" error={errors.propertyType} required requiredLabel={f.required}>
          <select defaultValue="">
            <option value="" disabled>
              {f.propertyPlaceholder}
            </option>
            {f.propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Field label={f.date} name="preferredDate">
          <input type="date" />
        </Field>

        <Field label={f.contactMethod} name="contactMethod" error={errors.contactMethod} required requiredLabel={f.required}>
          <select defaultValue="">
            <option value="" disabled>
              {f.contactPlaceholder}
            </option>
            {f.contactMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </Field>

        <Field label={f.message} name="message" full>
          <textarea rows={4} placeholder={f.messagePlaceholder} />
        </Field>

        {ENDPOINT ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-navy-700">{f.photos}</span>
            <label
              htmlFor="photos"
              className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-dashed border-navy-200 bg-mist-50 px-4 py-5 text-sm font-medium text-navy-500 transition-colors hover:border-teal-400 hover:text-teal-700"
            >
              <Paperclip size={17} aria-hidden />
              {f.photosCta}
            </label>
            <input id="photos" name="photos" type="file" accept="image/*" multiple className="sr-only" />
          </div>
        ) : (
          <p className="text-sm text-navy-500 sm:col-span-2">{f.photosBySms}</p>
        )}
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-mist-50 p-4 text-xs leading-relaxed text-navy-500">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-600" aria-hidden />
        <p>
          {f.privacy}{' '}
          <a href="#/privacy" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
            {f.privacyLink}
          </a>
        </p>
      </div>

      <Button type="submit" variant="primary" className="mt-6 w-full" disabled={status === 'sending'}>
        {status === 'sending' ? f.sending : ENDPOINT ? f.submit : f.submitSms}
      </Button>
    </form>
  );
}

const inputClass =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-navy-800 transition-colors placeholder:text-navy-300 focus:outline-none focus:ring-2';

/** Champ avec libellé, état d'erreur relié (aria-invalid / aria-describedby) et message sous le contrôle. */
function Field({
  label,
  name,
  error,
  required,
  requiredLabel,
  full,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  requiredLabel?: string;
  full?: boolean;
  children: ReactElement<Record<string, unknown>>;
}) {
  const errorId = `${name}-error`;
  const props = {
    id: name,
    name,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: `${inputClass} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-navy-200 focus:border-teal-500 focus:ring-teal-500/25'}`,
  };
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={name} className="text-sm font-semibold text-navy-700">
        {label}{' '}
        {required && (
          <span className="text-teal-600" aria-label={requiredLabel}>
            *
          </span>
        )}
      </label>
      {cloneElement(children, props)}
      {error && (
        <p id={errorId} className="text-[13px] font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
