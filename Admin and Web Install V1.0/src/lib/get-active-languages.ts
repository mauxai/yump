import { prisma } from "./prisma";

export type ActiveLanguage = {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  direction: "ltr" | "rtl";
};

/** Fetch all active languages ordered default-first.
 *  Uses a cast because the TS server may not have picked up the
 *  regenerated Prisma client that includes the Language model. */
export async function getActiveLanguages(): Promise<ActiveLanguage[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).language.findMany({
    where: { isActive: true },
    select: { code: true, name: true, nativeName: true, isDefault: true, direction: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  }) as Promise<ActiveLanguage[]>;
}
