import Link from "@/components/ui/Link";
import { NotFoundFigure } from "@/components/ui/NotFoundFigure";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 | Eric Xie",
  description: "Uh oh! This page does not exist",
};

const Custom404 = (): JSX.Element => (
  <div className="flex flex-col gap-2">
    <NotFoundFigure />
    <h1 className="text-primary mt-6 text-3xl font-bold tracking-tight">404</h1>
    <p className="text-secondary">
      Uh oh! Looks like this page doesn’t exist...
    </p>
    <div className="h-2" />
    <Link href="/" underline>
      Return home
    </Link>
  </div>
);

export default Custom404;
