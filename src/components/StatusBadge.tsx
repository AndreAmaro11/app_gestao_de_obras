import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "nao_iniciada"
  | "em_andamento"
  | "concluida"
  | "rascunho"
  | "em_cotacao"
  | "aprovado"
  | "fechado";

const statusMap: Record<StatusType, { label: string; className: string }> = {
  nao_iniciada: { label: "Não Iniciada", className: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em Andamento", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  concluida: { label: "Concluída", className: "bg-success/15 text-success border-success/30" },
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  em_cotacao: { label: "Em Cotação", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  aprovado: { label: "Aprovado", className: "bg-success/15 text-success border-success/30" },
  fechado: { label: "Fechado", className: "bg-primary/15 text-primary border-primary/30" },
};

interface StatusBadgeProps {
  status: StatusType;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusMap[status] || { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
