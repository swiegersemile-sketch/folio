import { Page } from "@/components/folio/shell";
import { useDesk } from "@/lib/folio/store";

export function Gate() {
  const admit = useDesk((state) => state.admit);
  return (
    <Page width="sheet">
      <img src="/folio-mark-v3.jpg" alt="Folio. Register your rights." className="mt-4 w-full rounded-md" />
      <p className="mt-6 max-w-xl text-lg text-paper">Proceed only if you are a member of SAMRO, CAPASSO, or SAMPRA.</p>
      <p className="mt-2 max-w-xl text-sm text-mist">Folio does not sign into those portals and does not ask for your password.</p>
      <button
        type="button"
        className="key mt-8 inline-flex min-h-11 items-center rounded-md bg-samro px-5 text-sm font-medium text-on-society"
        onClick={admit}
      >
        Proceed
      </button>
    </Page>
  );
}
