import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Pencil, Trash2, Building2 } from "lucide-react";
import { useObraCapaUrl } from "@/hooks/useObraImagens";
import EditarObraDialog from "@/components/EditarObraDialog";
import type { Tables } from "@/integrations/supabase/types";

const padraoLabel: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

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
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/obra/${obra.id}`)}>
        <div className="aspect-video bg-muted relative overflow-hidden">
          {capaUrl ? (
            <img src={capaUrl} alt={obra.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Building2 className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow" onClick={() => navigate(`/obra/${obra.id}`)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow text-destructive hover:text-destructive" onClick={() => onDelete(obra.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground truncate">{obra.nome}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{padraoLabel[obra.padrao] || obra.padrao}</span>
            {obra.metragem && <span>{obra.metragem} m²</span>}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Execução</span>
              <span className="font-medium text-foreground">{percentual}%</span>
            </div>
            <Progress value={percentual} className="h-2" />
          </div>
        </CardContent>
      </Card>
      <EditarObraDialog obra={obra} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
};

export default ObraCard;
