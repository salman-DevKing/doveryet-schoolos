"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { ArrowRight, ArrowLeft, Check, ImageIcon, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn, formatINR, formatINRCompact } from "@/lib/utils";
import { PLAN_CATALOG, CYCLE_DISCOUNTS, quotePlan, recommendPlan, type PlanCode, type BillingCycleMonths } from "@/lib/plans";
import { createSchool, type RegisterFormState } from "./actions";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const BANKS = [
  "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank",
  "Indian Bank", "Canara Bank", "Punjab National Bank", "Bank of Baroda", "Yes Bank",
  "IndusInd Bank", "IDFC First Bank", "Federal Bank", "Other",
];

export function RegisterWizard() {
  const [state, formAction] = useActionState<RegisterFormState, FormData>(createSchool, undefined);
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<PlanCode>("MINI");
  const [cycle, setCycle] = useState<BillingCycleMonths>(12);
  const [strength, setStrength] = useState(24);
  const [collectionMode, setCollectionMode] = useState<"UPI_ONLY" | "BOTH">("BOTH");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [ifscValid, setIfscValid] = useState<"empty" | "valid" | "invalid">("empty");
  const [pending, setPending] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const recommended = recommendPlan(strength);
    setPlan(recommended);
  }, [strength]);

  const quote = quotePlan(plan, cycle, strength);

  function next() {
    if (step === 1 && !logoPreview) {
      setLogoError(true);
      logoInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
      setLogoError(false);
    };
    reader.readAsDataURL(file);
  }

  function handleIfsc(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    e.target.value = v;
    if (v.length === 0) setIfscValid("empty");
    else if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v)) setIfscValid("valid");
    else setIfscValid("invalid");
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] py-10 px-6">
      <div className="max-w-[820px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <BrandLogo size="lg" />
          <Link href="/login" className="text-sm text-[color:var(--color-text-secondary)]">
            Already registered? <span className="text-[color:var(--color-brand-blue)] font-semibold">Sign in</span>
          </Link>
        </div>

        {/* Launch banner */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-[color:var(--color-border)] rounded-full text-sm mb-6 shadow-[var(--shadow-xs)]">
          <span className="px-2.5 py-1 bg-gradient-brand text-white rounded-full text-[10px] font-bold tracking-wider">LAUNCH</span>
          <span className="text-[color:var(--color-text-secondary)]">Lock in launch pricing from <b className="text-[color:var(--color-text-primary)]">₹349/month</b> for schools under 30 students.</span>
        </div>

        {/* Progress */}
        <ProgressBar step={step} />

        {/* Card */}
        <div className="bg-white border border-[color:var(--color-border)] rounded-[20px] p-10 shadow-[var(--shadow-sm)]">
          {/* Server error */}
          {state && !state.ok && (
            <div className="mb-6 p-4 bg-[color:var(--color-error-bg)] text-[color:var(--color-error)] rounded-[10px] text-sm">
              {state.error}
            </div>
          )}

          <form
            action={(fd) => {
              setPending(true);
              formAction(fd);
            }}
          >
            {/* Hidden plan/cycle/mode */}
            <input type="hidden" name="plan" value={plan} />
            <input type="hidden" name="cycleMonths" value={cycle} />
            <input type="hidden" name="collectionMode" value={collectionMode} />
            <input type="hidden" name="schoolStrength" value={strength} />

            {/* STEP 1 */}
            <div className={step === 1 ? "block" : "hidden"}>
              <StepHead num={1} title="Tell us about your school" sub="We'll set up your branded workspace with these details." />

              {/* Logo upload */}
              <div
                ref={logoInputRef as unknown as React.RefObject<HTMLDivElement>}
                onClick={() => (document.getElementById("school-logo") as HTMLInputElement)?.click()}
                className={cn(
                  "grid grid-cols-[auto_1fr] gap-5 items-center p-5 rounded-[14px] cursor-pointer mb-6 transition-all",
                  logoPreview
                    ? "bg-[rgba(22,160,133,0.04)] border-2 border-solid border-[color:var(--color-success)]"
                    : logoError
                    ? "bg-[color:var(--color-error-bg)] border-2 border-solid border-[color:var(--color-error)]"
                    : "bg-[color:var(--color-surface-alt)] border-2 border-dashed border-[color:var(--color-border-strong)]",
                )}
              >
                <div className="w-24 h-24 rounded-[14px] bg-gradient-brand flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={40} className="text-white opacity-70" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm mb-1">
                    School Logo <span className="text-[color:var(--color-error)]">*</span>
                  </div>
                  <div className="text-xs text-[color:var(--color-text-secondary)] mb-2 leading-relaxed">
                    Appears in the parent app, invoices, payslips, certificates and emails. Upload a square logo (PNG/JPG, min 400×400).
                  </div>
                  <div className="text-[11px] text-[color:var(--color-text-tertiary)]">
                    <b className="text-[color:var(--color-error)]">Required.</b> Replace it any time from Settings.
                  </div>
                </div>
                <input id="school-logo" name="schoolLogo" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="School Name" required colSpan={2}>
                  <input name="schoolName" required defaultValue="Riverside Secondary School" className="input" />
                </Field>
                <Field label="Type of Institution" required>
                  <select name="schoolType" required defaultValue="Secondary (6–10)" className="input">
                    {["Pre-primary / Playschool","Primary (1–5)","Middle (6–8)","Secondary (6–10)","Senior Secondary (11–12)","K–12 Integrated","Multi-campus Trust"].map(t=>
                      <option key={t}>{t}</option>
                    )}
                  </select>
                </Field>
                <Field label="Affiliated Board">
                  <select name="schoolBoard" defaultValue="CBSE" className="input">
                    {["State Board","CBSE","ICSE","IB","IGCSE / Cambridge","Other"].map(b=><option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="City" required>
                  <input name="schoolCity" required defaultValue="Chennai" className="input" />
                </Field>
                <Field label="State" required>
                  <select name="schoolState" required defaultValue="Tamil Nadu" className="input">
                    {STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Established Year">
                  <input name="schoolEstYear" type="number" min={1900} max={2026} defaultValue={1998} className="input" />
                </Field>
                <Field label="Student Strength" required>
                  <input type="number" min={1} value={strength} onChange={(e)=>setStrength(parseInt(e.target.value)||0)} className="input" />
                  <p className="text-[11px] text-[color:var(--color-text-tertiary)] mt-1">Used to recommend your plan — change later.</p>
                </Field>
                <Field label="School Address" colSpan={2}>
                  <input name="schoolAddress" placeholder="Street, locality, pincode" className="input" />
                </Field>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-[color:var(--color-border)]">
                <Button type="button" onClick={next}>Continue <ArrowRight size={16} strokeWidth={2.5}/></Button>
              </div>
            </div>

            {/* STEP 2 */}
            <div className={step === 2 ? "block" : "hidden"}>
              <StepHead num={2} title="Your admin account" sub="Primary administrator for your school workspace." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Your Full Name" required>
                  <input name="adminName" required defaultValue="Dr. R. Vasudevan" className="input" />
                </Field>
                <Field label="Your Role" required>
                  <select name="adminRole" required defaultValue="Principal" className="input">
                    {["Principal","Vice Principal","Correspondent / Secretary","Trustee / Owner","Administrator","IT Admin"].map(r=><option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Work Email" required>
                  <input name="adminEmail" type="email" required defaultValue="principal@riverside.edu" className="input" />
                </Field>
                <Field label="Mobile Number" required>
                  <input name="adminPhone" type="tel" required defaultValue="+91 98400 00001" className="input" />
                </Field>
                <Field label="Create Password" required>
                  <input name="adminPassword" type="password" minLength={8} required placeholder="At least 8 characters" className="input" />
                </Field>
                <Field label="Confirm Password" required>
                  <input name="adminPasswordConfirm" type="password" minLength={8} required className="input" onChange={(e)=>{
                    const pw = (document.querySelector('[name=adminPassword]') as HTMLInputElement)?.value;
                    e.target.setCustomValidity(e.target.value === pw ? '' : 'Passwords do not match');
                  }}/>
                </Field>
                <Field label="GSTIN (optional)" colSpan={2}>
                  <input name="gstin" placeholder="29ABCDE1234F1Z5" className="input" />
                </Field>
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t border-[color:var(--color-border)]">
                <Button type="button" variant="secondary" onClick={back}><ArrowLeft size={16}/> Back</Button>
                <Button type="button" onClick={next}>Continue to Plan <ArrowRight size={16} strokeWidth={2.5}/></Button>
              </div>
            </div>

            {/* STEP 3 */}
            <div className={step === 3 ? "block" : "hidden"}>
              <StepHead num={3} title="Pick your plan" sub={`Based on ${strength} students, we recommend ${PLAN_CATALOG[recommendPlan(strength)].name}.`} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {(Object.keys(PLAN_CATALOG) as PlanCode[]).map((code) => {
                  const p = PLAN_CATALOG[code];
                  const q = quotePlan(code, cycle, strength);
                  const disabled = p.maxStudents !== null && strength > p.maxStudents;
                  const isRec = code === recommendPlan(strength);
                  const isSel = code === plan;
                  return (
                    <div key={code}
                      onClick={() => !disabled && setPlan(code)}
                      className={cn(
                        "p-4 border-2 rounded-[14px] cursor-pointer relative transition-all",
                        isSel ? "border-[color:var(--color-brand-blue)] bg-gradient-to-br from-[rgba(71,117,234,0.04)] to-[rgba(19,181,209,0.04)]" : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)]",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isRec && !disabled && (
                        <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-brand text-white rounded-full text-[10px] font-bold tracking-wider">RECOMMENDED</span>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-base" style={{fontFamily:'var(--font-display)'}}>{p.name}</div>
                        <div className={cn("w-[18px] h-[18px] rounded-full border-2 relative",
                          isSel ? "border-[color:var(--color-brand-blue)]" : "border-[color:var(--color-border-strong)]")}>
                          {isSel && <span className="absolute inset-[3px] bg-[color:var(--color-brand-blue)] rounded-full" />}
                        </div>
                      </div>
                      {p.pricingModel === "custom" ? (
                        <>
                          <div className="text-xl font-bold" style={{fontFamily:'var(--font-display)'}}>Custom</div>
                          <div className="text-[11px] text-[color:var(--color-text-secondary)]">Talk to sales</div>
                        </>
                      ) : p.pricingModel === "per_student_annual" ? (
                        <>
                          <div className="text-xl font-bold" style={{fontFamily:'var(--font-display)'}}>₹{p.basePricePaise/100}</div>
                          <div className="text-[11px] text-[color:var(--color-text-secondary)]">per student / year</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold" style={{fontFamily:'var(--font-display)'}}>{q ? formatINR(q.monthlyPaise) : ""}<span className="text-sm font-medium text-[color:var(--color-text-secondary)]">/mo</span></div>
                          <div className="text-[11px] text-[color:var(--color-text-secondary)]">{CYCLE_DISCOUNTS[cycle].label}</div>
                        </>
                      )}
                      <div className="text-xs text-[color:var(--color-text-secondary)] mt-2">{p.tagline}</div>
                      {p.isLaunchOffer && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-[color:var(--color-success-bg)] text-[color:var(--color-success)] rounded-full text-[10px] font-bold tracking-wider">LAUNCH OFFER</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] font-bold tracking-wider uppercase text-[color:var(--color-text-tertiary)] mb-3">Commitment cycle</div>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {([1,3,6,12] as BillingCycleMonths[]).map((m) => (
                  <div key={m} onClick={()=>setCycle(m)}
                    className={cn("p-3 border-2 rounded-[12px] text-center cursor-pointer relative transition-all",
                      cycle === m ? "border-[color:var(--color-brand-blue)] bg-[color:var(--color-info-bg)]" : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)]")}>
                    {CYCLE_DISCOUNTS[m].discount > 0 && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[color:var(--color-success)] text-white rounded-full text-[10px] font-bold">−{Math.round(CYCLE_DISCOUNTS[m].discount*100)}%</span>
                    )}
                    <div className="font-bold text-sm">{m === 1 ? "Monthly" : m === 3 ? "Quarterly" : m === 6 ? "Half-yearly" : "Annual"}</div>
                    <div className="text-[10px] text-[color:var(--color-text-secondary)]">Billed every {m} month{m>1?'s':''}</div>
                  </div>
                ))}
              </div>

              {quote && (
                <div className="bg-gradient-navy text-white rounded-[16px] p-6">
                  <div className="flex justify-between py-2 text-sm">
                    <span>{PLAN_CATALOG[plan].name} plan</span>
                    <strong>{formatINR(quote.listMonthlyPaise)} / month</strong>
                  </div>
                  <div className="flex justify-between py-2 text-sm"><span>Cycle</span><strong>{CYCLE_DISCOUNTS[cycle].label}</strong></div>
                  {quote.savingsPaise > 0 && (
                    <div className="flex justify-between py-2 text-sm text-[#86EFBD]"><span>You save</span><strong>{formatINRCompact(quote.savingsPaise)}</strong></div>
                  )}
                  <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/15">
                    <span className="font-bold">Billed today after trial</span>
                    <span className="text-[28px] font-bold" style={{fontFamily:'var(--font-display)'}}>{formatINRCompact(quote.totalPaise)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-[color:var(--color-border)]">
                <Button type="button" variant="secondary" onClick={back}><ArrowLeft size={16}/> Back</Button>
                <Button type="button" onClick={next}>Set up payments <ArrowRight size={16} strokeWidth={2.5}/></Button>
              </div>
            </div>

            {/* STEP 4 — Payment Setup */}
            <div className={step === 4 ? "block" : "hidden"}>
              <StepHead num={4} title="How parents pay you fees" sub="Where fees should land. Parents see these in the Parent App." />

              {/* Collection mode */}
              <div className="text-[11px] font-bold tracking-wider uppercase text-[color:var(--color-text-tertiary)] mb-3">Collection mode</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {(["BOTH","UPI_ONLY"] as const).map((m) => (
                  <div key={m} onClick={()=>setCollectionMode(m)}
                    className={cn("p-4 border-2 rounded-[14px] cursor-pointer relative",
                      collectionMode === m ? "border-[color:var(--color-brand-blue)] bg-[color:var(--color-info-bg)]" : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)]")}>
                    {m === "BOTH" && (
                      <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-brand text-white rounded-full text-[10px] font-bold tracking-wider">RECOMMENDED</span>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-sm" style={{fontFamily:'var(--font-display)'}}>{m === "BOTH" ? "Both: UPI + Razorpay" : "UPI only"}</div>
                      <div className={cn("w-[18px] h-[18px] rounded-full border-2 relative",
                        collectionMode === m ? "border-[color:var(--color-brand-blue)]" : "border-[color:var(--color-border-strong)]")}>
                        {collectionMode === m && <span className="absolute inset-[3px] bg-[color:var(--color-brand-blue)] rounded-full" />}
                      </div>
                    </div>
                    <div className="text-xs text-[color:var(--color-text-secondary)]">{m === "BOTH" ? "Parents choose: UPI (zero fees) or Razorpay (card/NetBanking). Auto-reconcile either way." : "Parents pay straight to your UPI. Zero fees. Manual receipt confirmation."}</div>
                  </div>
                ))}
              </div>

              {/* UPI */}
              <div className="text-[11px] font-bold tracking-wider uppercase text-[color:var(--color-text-tertiary)] mb-3 flex items-center gap-2">UPI / GPay <span className="px-2 py-0.5 bg-[color:var(--color-success-bg)] text-[color:var(--color-success)] rounded-full text-[10px]">Zero fees</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
                <Field label="UPI ID / VPA" required>
                  <input name="upiVpa" required defaultValue="riverside@okaxis" placeholder="principal@okaxis" className="input" />
                  <p className="text-[11px] text-[color:var(--color-text-tertiary)] mt-1">Works with GPay, PhonePe, Paytm, BHIM.</p>
                </Field>
                <Field label="UPI-linked Mobile" required>
                  <input name="upiPhone" required defaultValue="+91 98400 00001" type="tel" className="input" />
                </Field>
              </div>

              {/* Bank */}
              <div className="text-[11px] font-bold tracking-wider uppercase text-[color:var(--color-text-tertiary)] mb-3">Bank Account (for settlements)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Account Holder Name" required colSpan={2}>
                  <input name="bankAccountHolder" required defaultValue="Riverside Secondary School Trust" className="input" />
                </Field>
                <Field label="Bank Name" required>
                  <select name="bankName" required defaultValue="HDFC Bank" className="input">
                    {BANKS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Branch"><input name="bankBranch" defaultValue="Anna Nagar, Chennai" className="input" /></Field>
                <Field label="Account Number" required>
                  <input name="bankAccountNumber" required inputMode="numeric" defaultValue="50100012345678" className="input" />
                </Field>
                <Field label="Re-enter Account Number" required>
                  <input name="bankAccountConfirm" required inputMode="numeric" defaultValue="50100012345678" className="input" />
                </Field>
                <Field label="IFSC Code" required>
                  <input name="bankIfsc" required defaultValue="HDFC0001234" maxLength={11} onChange={handleIfsc} className="input uppercase" />
                  <div className={cn("text-[11px] mt-1 font-semibold flex items-center gap-1",
                    ifscValid === "valid" ? "text-[color:var(--color-success)]" : ifscValid === "invalid" ? "text-[color:var(--color-error)]" : "text-[color:var(--color-text-tertiary)]")}>
                    {ifscValid === "valid" ? <><Check size={12} strokeWidth={3}/> IFSC format valid</> : ifscValid === "invalid" ? "Invalid IFSC format" : "Format: HDFC0001234"}
                  </div>
                </Field>
                <Field label="Account Type">
                  <select name="bankAccountType" defaultValue="Savings" className="input">
                    {["Current","Savings","Trust / Society","Nidhi"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <div className="mt-5 p-3.5 bg-[color:var(--color-info-bg)] rounded-[12px] text-sm text-[color:var(--color-navy)] leading-relaxed">
                <b>Your details are encrypted and never shared with parents.</b> Parent App shows UPI ID + QR only — bank account stays hidden.
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t border-[color:var(--color-border)]">
                <Button type="button" variant="secondary" onClick={back}><ArrowLeft size={16}/> Back</Button>
                <Button type="button" onClick={next}>Review <ArrowRight size={16} strokeWidth={2.5}/></Button>
              </div>
            </div>

            {/* STEP 5 — Confirm */}
            <div className={step === 5 ? "block" : "hidden"}>
              <StepHead num={5} title="Review & confirm" sub="We'll set up your workspace in the next 60 seconds." />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                <ReviewItem label="Plan" value={PLAN_CATALOG[plan].name + (PLAN_CATALOG[plan].isLaunchOffer ? " (Launch)" : "")} sub={PLAN_CATALOG[plan].tagline} />
                <ReviewItem label="Billing" value={CYCLE_DISCOUNTS[cycle].label} sub={quote ? `${formatINRCompact(quote.totalPaise)} / cycle` : "Custom quote"} />
                <ReviewItem label="Collection" value={collectionMode === "BOTH" ? "UPI + Razorpay" : "UPI only"} sub="Changeable in Settings" />
                <ReviewItem label="Trial" value="14 days free" sub="No card needed today" />
              </div>

              <label className="flex items-start gap-3 p-4 bg-[color:var(--color-surface-alt)] rounded-[10px] mb-4 text-sm">
                <input type="checkbox" name="agreeTos" defaultChecked required className="w-[18px] h-[18px] accent-[color:var(--color-brand-blue)] mt-0.5"/>
                <span>I agree to the <Link href="#" className="text-[color:var(--color-brand-blue)] font-semibold">Terms of Service</Link>, <Link href="/privacy" target="_blank" className="text-[color:var(--color-brand-blue)] font-semibold">Privacy Policy</Link>, and DPDP Act consent. I'm authorized to register this school.</span>
              </label>

              <div className="flex justify-between mt-8 pt-6 border-t border-[color:var(--color-border)]">
                <Button type="button" variant="secondary" onClick={back}><ArrowLeft size={16}/> Back</Button>
                <Button type="submit" loading={pending}>
                  <Check size={16} strokeWidth={2.5}/> Create My Workspace
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="text-center mt-8 text-xs text-[color:var(--color-text-tertiary)] flex items-center justify-center gap-1.5">
          <Zap size={10}/> Powered by Doveryet Technologies
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          border: 1px solid var(--color-border-strong);
          border-radius: 10px;
          background: #fff;
          color: var(--color-text-primary);
          font-size: 14px;
          font-family: inherit;
        }
        .input:focus { outline: none; border-color: var(--color-brand-blue); box-shadow: 0 0 0 3px rgba(71,117,234,0.12); }
      `}</style>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function ProgressBar({ step }: { step: number }) {
  const labels = ["School", "Account", "Plan", "Payments", "Confirm"];
  return (
    <div className="bg-white border border-[color:var(--color-border)] rounded-[20px] px-7 py-5 mb-6 shadow-[var(--shadow-sm)]">
      <div className="flex gap-2 mb-3.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={cn("flex-1 h-1 rounded-full transition-all",
            i <= step ? "bg-gradient-brand" : "bg-[color:var(--color-border)]"
          )}/>
        ))}
      </div>
      <div className="flex justify-between text-xs font-semibold tracking-wider uppercase">
        {labels.map((l, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={l} className={cn("flex items-center gap-1.5",
              active && "text-[color:var(--color-brand-blue)]",
              done && "text-[color:var(--color-success)]",
              !active && !done && "text-[color:var(--color-text-tertiary)]"
            )}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                active ? "bg-[color:var(--color-brand-blue)] text-white" :
                done ? "bg-[color:var(--color-success)] text-white" :
                "bg-[color:var(--color-border)] text-white"
              )}>{n}</span> {l}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepHead({ num, title, sub }: { num: number; title: string; sub: string }) {
  return (
    <div className="mb-7">
      <div className="text-[11px] font-bold tracking-wider uppercase text-[color:var(--color-brand-blue)] mb-2">Step {num} of 5</div>
      <h1 className="text-[26px] font-bold -tracking-[0.02em] mb-1.5" style={{fontFamily:'var(--font-display)'}}>{title}</h1>
      <p className="text-[color:var(--color-text-secondary)] text-sm">{sub}</p>
    </div>
  );
}

function Field({ label, required, colSpan, children }: { label: string; required?: boolean; colSpan?: 1 | 2; children: React.ReactNode }) {
  return (
    <div className={cn(colSpan === 2 && "md:col-span-2")}>
      <label className="block text-sm font-semibold mb-1.5">
        {label} {required && <span className="text-[color:var(--color-error)]">*</span>}
      </label>
      {children}
    </div>
  );
}

function ReviewItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 bg-[color:var(--color-surface-alt)] rounded-[12px]">
      <div className="text-[11px] font-semibold tracking-wider uppercase text-[color:var(--color-text-tertiary)] mb-1">{label}</div>
      <div className="font-semibold text-sm">{value}</div>
      {sub && <div className="text-xs text-[color:var(--color-text-secondary)] mt-0.5">{sub}</div>}
    </div>
  );
}
