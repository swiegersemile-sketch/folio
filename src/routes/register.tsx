import { createFileRoute } from "@tanstack/react-router";
import { Questions } from "@/components/folio/questions";

type RegisterSearch = {
  id?: string;
  step: number;
};

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 && search.id.length < 80 ? search.id : undefined,
    step: 0,
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { id } = Route.useSearch();
  return <Questions routeId={id} />;
}
