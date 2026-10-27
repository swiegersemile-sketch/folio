import { capassoCwr, downloadText, packetSlug, samroNotice, sampraNotice } from "@/lib/folio/packets";
import { buttonClass } from "@/components/folio/ui";
import { societiesFor, type Work } from "@/lib/folio/model";

export function PacketButtons({ work }: { work: Work }) {
  const slug = packetSlug(work);
  const open = societiesFor(work);
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className={buttonClass("line")} onClick={() => downloadText(`${slug}-samro.txt`, samroNotice(work))}>
        SAMRO notice
      </button>
      {open.includes("capasso") ? (
        <button type="button" className={buttonClass("line")} onClick={() => downloadText(`${slug}-capasso.cwr`, capassoCwr(work))}>
          CAPASSO CWR
        </button>
      ) : null}
      {open.includes("sampra") ? (
        <button type="button" className={buttonClass("line")} onClick={() => downloadText(`${slug}-sampra.txt`, sampraNotice(work))}>
          SAMPRA list
        </button>
      ) : null}
    </div>
  );
}
