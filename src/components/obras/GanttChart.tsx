import { differenceInDays } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { useSubetapas } from "@/hooks/useSubetapas";

type Etapa = Tables<"etapas">;

interface GanttBarProps {
  nome: string;
  inicio: string;
  fim: string;
  percentual: number;
  obraStart: Date;
  totalDays: number;
  isSubetapa?: boolean;
  status: string;
}

const statusColorMap: Record<string, string> = {
  nao_iniciada: "bg-muted-foreground/40",
  em_andamento: "bg-primary/70",
  concluida: "bg-success/70",
};

const GanttBar = ({ nome, inicio, fim, percentual, obraStart, totalDays, isSubetapa, status }: GanttBarProps) => {
  const start = differenceInDays(new Date(inicio), obraStart);
  const duration = differenceInDays(new Date(fim), new Date(inicio));
  const leftPct = Math.max((start / totalDays) * 100, 0);
  const widthPct = Math.max((duration / totalDays) * 100, 2);
  const barColor = statusColorMap[status] || "bg-primary/70";

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs text-muted-foreground truncate shrink-0 ${isSubetapa ? "w-36 pl-4" : "w-40"}`}>
        {isSubetapa && "↳ "}{nome}
      </span>
      <div className="flex-1 h-6 bg-muted rounded relative">
        <div
          className={`absolute h-full rounded ${barColor} flex items-center justify-center transition-all`}
          style={{ left: `${leftPct}%`, width: `${Math.min(widthPct, 100 - leftPct)}%` }}
        >
          {widthPct > 8 && (
            <span className="text-[10px] text-primary-foreground font-medium">{percentual}%</span>
          )}
        </div>
        {/* Progress overlay */}
        {percentual > 0 && percentual < 100 && (
          <div
            className="absolute h-full rounded bg-primary/30 pointer-events-none"
            style={{
              left: `${leftPct}%`,
              width: `${Math.min((widthPct * percentual) / 100, 100 - leftPct)}%`,
            }}
          />
        )}
      </div>
    </div>
  );
};

const EtapaGanttRow = ({ etapa, obraStart, totalDays }: { etapa: Etapa; obraStart: Date; totalDays: number }) => {
  const { data: subetapas } = useSubetapas(etapa.id);

  const hasDates = etapa.inicio_previsto && etapa.fim_previsto;
  const subsWithDates = subetapas?.filter(s => s.inicio_previsto && s.fim_previsto) || [];

  return (
    <>
      {hasDates && (
        <GanttBar
          nome={etapa.nome}
          inicio={etapa.inicio_previsto!}
          fim={etapa.fim_previsto!}
          percentual={etapa.percentual_concluido}
          obraStart={obraStart}
          totalDays={totalDays}
          status={etapa.status}
        />
      )}
      {subsWithDates.map(sub => (
        <GanttBar
          key={sub.id}
          nome={sub.nome}
          inicio={sub.inicio_previsto!}
          fim={sub.fim_previsto!}
          percentual={sub.percentual_concluido}
          obraStart={obraStart}
          totalDays={totalDays}
          isSubetapa
          status={sub.status}
        />
      ))}
    </>
  );
};

interface DependencyLineProps {
  etapas: Etapa[];
  obraStart: Date;
  totalDays: number;
}

const DependencyArrows = ({ etapas, obraStart, totalDays }: DependencyLineProps) => {
  const etapasWithDeps = etapas.filter(e => e.dependencia && e.inicio_previsto);
  if (!etapasWithDeps.length) return null;

  return (
    <div className="px-4 py-1">
      {etapasWithDeps.map(etapa => {
        const dep = etapas.find(e => e.id === etapa.dependencia);
        if (!dep || !dep.fim_previsto || !etapa.inicio_previsto) return null;
        return (
          <div key={etapa.id} className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="font-medium">{dep.nome}</span>
            <span>→</span>
            <span className="font-medium">{etapa.nome}</span>
          </div>
        );
      })}
    </div>
  );
};

interface GanttChartProps {
  etapas: Etapa[];
}

const GanttChart = ({ etapas }: GanttChartProps) => {
  if (!etapas.length) return null;

  // Collect all dates from etapas
  const allDates = etapas.flatMap(e =>
    [e.inicio_previsto, e.fim_previsto].filter(Boolean) as string[]
  );

  if (!allDates.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Nenhuma etapa com datas definidas para exibir no Gantt.
      </div>
    );
  }

  const sorted = allDates.sort();
  const obraStart = new Date(sorted[0]);
  const obraEnd = new Date(sorted[sorted.length - 1]);
  const totalDays = Math.max(differenceInDays(obraEnd, obraStart), 1);

  // Month markers
  const months: { label: string; leftPct: number }[] = [];
  const cursor = new Date(obraStart);
  cursor.setDate(1);
  if (cursor < obraStart) cursor.setMonth(cursor.getMonth() + 1);
  while (cursor <= obraEnd) {
    const dayOffset = differenceInDays(cursor, obraStart);
    months.push({
      label: cursor.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      leftPct: (dayOffset / totalDays) * 100,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Gantt</h3>
      <div className="bg-card rounded-md border p-4 space-y-1.5">
        {/* Month header */}
        {months.length > 0 && (
          <div className="flex items-center gap-3 mb-2">
            <span className="w-40 shrink-0" />
            <div className="flex-1 h-5 relative">
              {months.map((m, i) => (
                <span
                  key={i}
                  className="absolute text-[9px] text-muted-foreground font-medium border-l border-muted-foreground/20 pl-1"
                  style={{ left: `${m.leftPct}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {etapas.map(etapa => (
          <EtapaGanttRow key={etapa.id} etapa={etapa} obraStart={obraStart} totalDays={totalDays} />
        ))}

        <DependencyArrows etapas={etapas} obraStart={obraStart} totalDays={totalDays} />
      </div>
    </div>
  );
};

export default GanttChart;
