import { PageTitleBar } from "@/components/layout/page-title-bar";
import { Icons } from "@/components/icons";

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageTitleBar
        title="Dashboard"
        actions={
          <button className="h-[32px] px-3 rounded-md border border-input text-xs font-medium text-primary hover:bg-accent flex items-center gap-1.5 transition-colors">
            <Icons.refresh className="w-3.5 h-3.5" />
            <span>Aggiorna</span>
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Quota Totale Oggi
            </div>
            <div className="text-2xl font-normal text-foreground mt-2 font-mono">
              2.04
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Win Rate Storico
            </div>
            <div className="text-2xl font-normal text-success mt-2 font-mono">
              58.4%
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Stato Raddoppio
            </div>
            <div className="text-2xl font-normal text-warning mt-2 flex items-center gap-2">
              <Icons.warning className="w-5 h-5 text-warning" />
              <span>In Attesa</span>
            </div>
          </div>
        </div>

        {/* Daily Slip Card */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Icons.layers className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Schedina del Giorno Jev
              </h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-secondary text-foreground">
              2 Evs Selezionati
            </span>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              L&apos;App Shell e l&apos;infrastruttura grafica sono state configurate con
              successo seguendo le regole di <code className="text-foreground">DESIGN.md</code> e{" "}
              <code className="text-foreground">AGENTS.md</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
