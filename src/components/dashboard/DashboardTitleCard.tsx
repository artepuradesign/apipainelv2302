import React from "react";

import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface DashboardTitleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Por padrão volta para /dashboard (como solicitado) */
  backTo?: string;
  right?: React.ReactNode;
}

const DashboardTitleCard = ({
  title,
  subtitle,
  icon,
  backTo = "/dashboard",
  right,
}: DashboardTitleCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
              <span className="truncate">{title}</span>
            </CardTitle>
            {subtitle ? (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {right ? right : null}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(backTo)}
              className="rounded-full h-9 w-9"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default DashboardTitleCard;
