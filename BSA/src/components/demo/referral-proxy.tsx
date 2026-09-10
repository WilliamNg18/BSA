import { referralFreeProxyDisplay, formatBaselineNumber, type BaselineResult } from "@/lib/domain/baseline";

export function ReferralProxy({ result }: { result: BaselineResult }) {
  return <section aria-label="Referral-free proxy estimate" className="space-y-3 rounded-xl border border-amber-600/40 bg-amber-500/5 p-4">
    <h2 className="font-semibold">Referral-free proxy · Estimate</h2>
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div><dt>Scenario proxy · Not observed accuracy</dt><dd className="text-2xl font-semibold tabular-nums" data-referral-proxy>{referralFreeProxyDisplay(result)}</dd></div>
      <div><dt>Residual risk · All abstained + deficient built</dt><dd className="text-2xl font-semibold tabular-nums" data-risk-residual>{formatBaselineNumber(result.referralRiskResidual, 0)}</dd></div>
    </dl>
    <p className="text-xs text-muted-foreground">Rounded down to 0.1%. Zero residual establishes no accuracy. Deficient abstentions counted once; residual risk differs from assumed referrals.</p>
  </section>;
}