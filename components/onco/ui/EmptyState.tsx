import type { ReactNode } from "react";
import { Card } from "./Card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="py-8 text-center">
      <h2 className="onco-display text-xl font-extrabold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-onco-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

