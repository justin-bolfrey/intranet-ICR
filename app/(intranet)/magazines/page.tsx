import { BvhLoginSection } from "@/components/magazines/BvhLoginSection";
import { getBvhLoginStatusForCurrentUser } from "./actions";

export default async function MagazinesPage() {
  const bvhStatus = await getBvhLoginStatusForCurrentUser();

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Zeitschriften
          </h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Zugang zu den Zeitschriften des BVH (Bundesverband der Hochschulkommunikatoren).
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <BvhLoginSection
            hasAlreadyRequested={bvhStatus.hasRequested}
            handled={bvhStatus.handled}
          />
        </div>
      </div>
    </div>
  );
}
