import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Pencil, Trash2, Building2, ArrowUpRight } from "lucide-react";
import { useObraCapaUrl } from "@/hooks/useObraImagens";
import EditarObraDialog from "@/components/EditarObraDialog";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

const padraoLabel: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };
const padraoColor: Record<string, string> = {
  baixo: "bg-muted text-muted-foreground",
  medio: "bg-primary/10 text-primary",
  alto: "bg-accent/10 text-accent",
};

interface Props {
  obra: Tables<"obras">;
  onDelete: (id: string) => void;
  percentual?: number;
}

const ObraCard = ({ obra, onDelete, percentual = 0 }: Props) => {
  const navigate = useNavigate();
  const { data: capaUrl } = useObraCapaUrl(obra.id);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card
        className="overflow-hidden hover-lift shadow-premium cursor-pointer group rounded-xl border-border/50"
        onClick={() => navigate(`/obra/${obra.id}`)}
      >
        <div className="aspect-[16/10] bg-muted relative overflow-hidden">
          {capaUrl ? (
            <img src={capaUrl} alt={obra.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full gradient-primary-subtle flex items-center justify-center">
              <Building2 className="h-14 w-14 text-primary/30" />
            </div>
          )}
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div
            className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur shadow-md hover:bg-white" onClick={() => navigate(`/obra/${obra.id}`)}>
              <Eye className="h-3.5 w-3.5 text-foreground" />
            </Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur shadow-md hover:bg-white" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 text-foreground" />
            </Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur shadow-md hover:bg-white hover:text-destructive" onClick={() => onDelete(obra.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {/* Padrao badge */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-md backdrop-blur", padraoColor[obra.padrao] || "bg-muted text-muted-foreground")}>
              {padraoLabel[obra.padrao] || obra.padrao}
            </span>
          </div>
        </div>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-foreground truncate text-base">{obra.nome}</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {obra.metragem && <span className="font-medium">{obra.metragem} m²</span>}
            {obra.data_inicio && (
              <span>{new Date(obra.data_inicio).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-foreground">{percentual}%</span>
            </div>
            <Progress value={percentual} className="h-2 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <EditarObraDialog obra={obra} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
};

export default ObraCard;
