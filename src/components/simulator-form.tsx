"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface SimRow {
  age: number;
  assets: number;
  spending: number;
  income: number;
  event?: "retirement" | "childIndep" | "recession" | "doomsday";
}

const formatKRW = (n: number) =>
  (n < 0 ? "-" : "") + "\u20A9" + Math.abs(Math.round(n)).toLocaleString("ko-KR");

const formatMan = (n: number) => {
  const man = Math.round(n / 10000);
  if (Math.abs(man) >= 10000) {
    const eok = (man / 10000).toFixed(1).replace(/\.0$/, "");
    return `${eok}억`;
  }
  return `${man.toLocaleString("ko-KR")}만`;
};

export function SimulatorForm() {
  const [currentAge, setCurrentAge] = useState(35);
  const [netWorth, setNetWorth] = useState(100000000);
  const [returnRate, setReturnRate] = useState(5);
  const [annualSpending, setAnnualSpending] = useState(36000000);
  const [inflationRate, setInflationRate] = useState(3);
  const [annualIncome, setAnnualIncome] = useState(40000000);
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(3);
  const [retirementAge, setRetirementAge] = useState(55);
  const [liquidationCost, setLiquidationCost] = useState(15);
  const [pensionStartAge, setPensionStartAge] = useState(65);
  const [annualPension, setAnnualPension] = useState(12000000);
  const [retirementPayLumpSum, setRetirementPayLumpSum] = useState(30000000);
  const [childIndepAge, setChildIndepAge] = useState(60);
  const [childSpendingReduction, setChildSpendingReduction] = useState(12000000);
  const [recessionCycle, setRecessionCycle] = useState(8);
  const [recessionDropRate, setRecessionDropRate] = useState(35);
  const [doomsdayAge, setDoomsdayAge] = useState(50);
  const [doomsdayDropRate, setDoomsdayDropRate] = useState(50);
  const [doomsdaySpendingReduction, setDoomsdaySpendingReduction] = useState(20);

  const rows = useMemo(() => {
    const result: SimRow[] = [];
    let assets = netWorth;
    let spending = annualSpending;
    let income = annualIncome;
    let childReduced = false;
    let doomsdaySpendingApplied = false;

    for (let age = currentAge; age <= 100; age++) {
      if (age === currentAge) {
        result.push({ age, assets, spending, income });
        continue;
      }

      let event: SimRow["event"] | undefined;
      if (age <= retirementAge) {
        income = income * (1 + incomeGrowthRate / 100);
      } else {
        income = 0;
      }
      if (age === retirementAge + 1) {
        event = "retirement";
        if (retirementPayLumpSum > 0) {
          assets += retirementPayLumpSum;
        }
      }

      if (pensionStartAge > 0 && age >= pensionStartAge && annualPension > 0) {
        income += annualPension;
      }

      if (childIndepAge > 0 && age >= childIndepAge && !childReduced) {
        spending = spending - childSpendingReduction;
        childReduced = true;
        event = "childIndep";
      }

      spending = spending * (1 + inflationRate / 100);

      if (doomsdayAge > 0 && age === doomsdayAge && !doomsdaySpendingApplied) {
        spending = spending * (1 - doomsdaySpendingReduction / 100);
        doomsdaySpendingApplied = true;
      }

      let assetMultiplier: number;
      if (doomsdayAge > 0 && age === doomsdayAge) {
        assetMultiplier = 1 - doomsdayDropRate / 100;
        event = "doomsday";
      } else if (
        recessionCycle > 0 &&
        (age - currentAge) % recessionCycle === 0
      ) {
        assetMultiplier = 1 - recessionDropRate / 100;
        event = "recession";
      } else {
        assetMultiplier = 1 + returnRate / 100;
      }

      const netCashflow = income - spending;
      if (netCashflow >= 0) {
        assets = assets * assetMultiplier + netCashflow;
      } else {
        const deficit = -netCashflow;
        const amountToSell = deficit / (1 - liquidationCost / 100);
        assets = assets * assetMultiplier - amountToSell;
      }

      if (assets < 0) {
        result.push({
          age,
          assets: 0,
          spending: Math.round(spending),
          income: Math.round(income),
          event,
        });
        break;
      }

      result.push({
        age,
        assets: Math.round(assets),
        spending: Math.round(spending),
        income: Math.round(income),
        event,
      });
    }

    return result;
  }, [
    currentAge, netWorth, returnRate, annualSpending, inflationRate,
    annualIncome, incomeGrowthRate, retirementAge, liquidationCost,
    pensionStartAge, annualPension, retirementPayLumpSum,
    childIndepAge, childSpendingReduction,
    recessionCycle, recessionDropRate,
    doomsdayAge, doomsdayDropRate, doomsdaySpendingReduction,
  ]);

  const chartData = useMemo(
    () => rows.map((r) => ({ age: r.age, assets: r.assets, spending: r.spending, income: r.income })),
    [rows],
  );

  const lastRow = rows[rows.length - 1];
  const survived = lastRow?.age === 100 && lastRow?.assets > 0;
  const ruinAge = !survived ? lastRow?.age : null;

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div
        className={`card p-5 text-center animate-fade-up ${survived ? "border-primary/30" : "border-destructive/30"}`}
      >
        {survived ? (
          <>
            <p className="text-sm text-muted-foreground mb-1">100세까지 자산 유지 가능</p>
            <p className="text-2xl font-semibold text-primary tabular-nums">{formatMan(lastRow.assets)}</p>
            <p className="text-xs text-faint mt-1">100세 예상 잔여 자산</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-1">자산 소진 시점</p>
            <p className="text-2xl font-semibold text-destructive tabular-nums">{ruinAge}세</p>
            <p className="text-xs text-faint mt-1">수입과 지출을 조정해보세요</p>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="card p-5 animate-fade-up stagger-1">
        <div className="flex items-center mb-4">
          <span className="text-[11px] text-muted-foreground tracking-wide">자산 추이</span>
          <div className="rule-fade flex-1 ml-4" />
        </div>
        <div className="h-64 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "var(--color-faint)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-faint)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatMan(v)} width={50} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border-light)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  formatKRW(Number(value)),
                  name === "assets" ? "자산" : name === "spending" ? "연 소비" : "연 수입",
                ]}
                labelFormatter={(label) => `${label}세`}
              />
              {retirementAge > currentAge && retirementAge <= 100 && (
                <ReferenceLine x={retirementAge} stroke="var(--color-primary)" strokeDasharray="4 4" strokeOpacity={0.5} />
              )}
              <Area type="monotone" dataKey="assets" stroke="var(--color-primary)" fill="url(#assetGrad)" strokeWidth={2} dot={false} name="assets" />
              <Area type="monotone" dataKey="spending" stroke="var(--color-destructive)" fill="url(#spendGrad)" strokeWidth={1.5} dot={false} name="spending" />
              <Area type="monotone" dataKey="income" stroke="var(--color-primary)" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} name="income" strokeOpacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Input sections */}
      <div className="card p-5 space-y-5 animate-fade-up stagger-2">
        <Section label="기본">
          <InputRow label="나이" value={currentAge} onChange={setCurrentAge} suffix="세" hint="현재 나이" />
          <InputRow label="순자산" value={netWorth} onChange={setNetWorth} isCurrency hint="총 자산 - 총 부채" />
          <InputRow label="자산 연 수익률" value={returnRate} onChange={setReturnRate} suffix="%" hint="투자 포트폴리오의 기대 연간 수익률" />
        </Section>

        <div className="rule-fade" />

        <Section label="소비 / 수입">
          <InputRow label="연 소비" value={annualSpending} onChange={setAnnualSpending} isCurrency hint="1년간 총 지출 (생활비+고정비)" />
          <InputRow label="소비 증가율" value={inflationRate} onChange={setInflationRate} suffix="%" hint="물가상승률 기반 연간 소비 증가" />
          <InputRow label="연 수입" value={annualIncome} onChange={setAnnualIncome} isCurrency hint="세후 연간 총 수입" />
          <InputRow label="수입 증가율" value={incomeGrowthRate} onChange={setIncomeGrowthRate} suffix="%" hint="연봉 인상률 등 수입 성장" />
          <InputRow label="은퇴 나이" value={retirementAge} onChange={setRetirementAge} suffix="세" hint="이 나이 이후 근로수입이 0이 됨" />
          <InputRow label="자산 매각 비용" value={liquidationCost} onChange={setLiquidationCost} suffix="%" hint="적자 시 자산 현금화 비용 (세금+수수료)" />
        </Section>

        <div className="rule-fade" />

        <Section label="연금">
          <InputRow label="퇴직금 수령액" value={retirementPayLumpSum} onChange={setRetirementPayLumpSum} isCurrency hint="은퇴 시 일시금 (퇴직연금 IRP 등)" />
          <InputRow label="연금 수령 나이" value={pensionStartAge} onChange={setPensionStartAge} suffix="세" placeholder="0 = 해당없음" hint="국민연금 + 퇴직연금 수령 시작" />
          <InputRow label="연금 연 수령액" value={annualPension} onChange={setAnnualPension} isCurrency hint="국민연금 + 퇴직연금 합산 연 수령액" />
        </Section>

        <div className="rule-fade" />

        <Section label="자녀">
          <InputRow label="자녀 독립 나이" value={childIndepAge} onChange={setChildIndepAge} suffix="세" placeholder="0 = 해당없음" hint="자녀가 독립하는 내 나이" />
          <InputRow label="독립 시 소비 감소" value={childSpendingReduction} onChange={setChildSpendingReduction} isCurrency hint="독립 후 줄어드는 연간 지출액" />
        </Section>

        <div className="rule-fade" />

        <Section label="리스크">
          <InputRow label="불황 주기" value={recessionCycle} onChange={setRecessionCycle} suffix="년" placeholder="0 = 없음" hint="몇 년마다 경기 침체가 오는지" />
          <InputRow label="불황 하락률" value={recessionDropRate} onChange={setRecessionDropRate} suffix="%" hint="불황 시 자산 하락 폭" />
          <InputRow label="둠스데이 나이" value={doomsdayAge} onChange={setDoomsdayAge} suffix="세" placeholder="0 = 없음" hint="대폭락이 오는 내 나이 (1회성)" />
          <InputRow label="둠스데이 하락률" value={doomsdayDropRate} onChange={setDoomsdayDropRate} suffix="%" hint="대폭락 시 자산 하락 폭" />
          <InputRow label="둠스데이 소비 감소" value={doomsdaySpendingReduction} onChange={setDoomsdaySpendingReduction} suffix="%" hint="대폭락 후 소비를 줄이는 비율" />
        </Section>
      </div>

      {/* Result table */}
      <div className="animate-fade-up stagger-3">
        <div className="flex items-center mb-4">
          <span className="text-[11px] text-muted-foreground tracking-wide">연도별 시뮬레이션</span>
          <div className="rule-fade flex-1 ml-4" />
          <span className="text-xs text-faint tabular-nums">{rows.length}년</span>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-muted-foreground">
                  <th className="text-left px-4 py-3 text-[11px] font-medium tracking-wide">나이</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium tracking-wide">자산</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium tracking-wide">연 소비</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium tracking-wide">연 수입</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isRuin = row.assets === 0 && row.age !== currentAge;
                  let rowBg = "";
                  if (isRuin) rowBg = "bg-destructive-light";
                  else if (row.event === "doomsday") rowBg = "bg-destructive-light";
                  else if (row.event === "recession") rowBg = "bg-destructive-light/50";
                  else if (row.event === "retirement") rowBg = "bg-primary-muted";
                  else if (row.event === "childIndep") rowBg = "bg-primary-muted";

                  return (
                    <tr key={row.age} className={`border-b border-border-light last:border-0 ${rowBg}`}>
                      <td className="px-4 py-2.5 tabular-nums text-foreground">
                        {row.age}
                        {row.event === "retirement" && <span className="ml-1.5 text-[10px] text-primary">은퇴</span>}
                        {row.event === "recession" && <span className="ml-1.5 text-[10px] text-destructive">불황</span>}
                        {row.event === "doomsday" && <span className="ml-1.5 text-[10px] text-destructive">폭락</span>}
                        {row.event === "childIndep" && <span className="ml-1.5 text-[10px] text-primary">독립</span>}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${isRuin ? "text-destructive" : "text-foreground"}`}>
                        {isRuin ? "파산" : formatMan(row.assets)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-destructive">{formatMan(row.spending)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-primary">{row.income > 0 ? formatMan(row.income) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <span className="text-[11px] text-muted-foreground tracking-wide">{label}</span>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InputRow({
  label, value, onChange, suffix, isCurrency, placeholder, hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  isCurrency?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const displayValue = isCurrency
    ? value === 0 ? "" : value.toLocaleString("ko-KR")
    : value === 0 && placeholder ? "" : String(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.-]/g, "");
    if (raw === "" || raw === "-") { onChange(0); return; }
    const num = isCurrency ? parseInt(raw, 10) : parseFloat(raw);
    if (!isNaN(num)) onChange(num);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <label className="text-sm text-foreground min-w-[7rem] flex items-center gap-1.5">{label}</label>
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode={isCurrency ? "numeric" : "decimal"}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder || "0"}
            className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground text-right tabular-nums focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint pointer-events-none">{suffix}</span>
          )}
        </div>
      </div>
      {hint && <p className="text-[11px] text-faint pl-[7.75rem]">{hint}</p>}
    </div>
  );
}
