import { type ResourceConfiguration, ResourceType } from "@prisma/client";
import Link from "next/link";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type * as z from "zod";

import {
  SplitPageLayout,
  SplitPageLayoutContent,
  SplitPageLayoutSidebar,
} from "@/components/page-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/api";
import { type resourceCreateSchema } from "@/utils/zod";

export const ResourceTypeLabels: Record<ResourceType, string> = {
  EXERCISE: "🚀 Warm-up / Exercise",
  SHORT_FORM: "⚡️ Short Form Game",
  LONG_FORM: "🍿 Long Form Format",
};

export const ResourceConfigurationLabels: Record<
  ResourceConfiguration,
  string
> = {
  SCENE: "🎭 Scenework",
  BACKLINE: "👥 Backline",
  WHOLE_CLASS: "♾️ Whole Group",
  SOLO: "🧍 Solo",
  PAIRS: "👯 Pairs",
  GROUPS: "👨‍👨‍👦 Groups",
  CIRCLE: "⭕️ Circle",
};

type ApiResource = Readonly<RouterOutputs["resource"]["getById"]>;
type CreationResource = z.infer<typeof resourceCreateSchema>;

interface Props {
  isDraft: boolean;
  resource: ApiResource | CreationResource;
  showProposeChanges?: boolean;
}

export const SingleResourceComponent: React.FC<Props> = ({
  isDraft,
  resource,
  showProposeChanges = false,
}) => {
  const alternativeNames = useMemo(() => {
    if (!resource.alternativeNames || resource.alternativeNames === "")
      return [];

    return typeof resource.alternativeNames === "string"
      ? resource.alternativeNames.split(";")
      : resource.alternativeNames.map((name) => name.value);
  }, [resource]);

  return (
    <div>
      {isDraft && (
        <Alert className="mb-4 mt-4" variant="warning">
          <AlertTitle>This Resource is a Draft</AlertTitle>
          <AlertDescription>
            This has not been submitted to the Admins yet. Click "Edit Draft" to
            publish
          </AlertDescription>
        </Alert>
      )}
      <SplitPageLayout>
        <SplitPageLayoutSidebar>
          <div className="space-y-6 md:flex md:min-h-full md:flex-col">
            <h4 className="tracking-tight text-muted-foreground">
              {ResourceTypeLabels[resource.type]}
              <br />
              {resource.type !== ResourceType.LONG_FORM &&
                ResourceConfigurationLabels[resource.configuration]}
            </h4>

            {alternativeNames.length > 0 && (
              <>
                <Separator />
                <div>
                  Also known as:
                  <ul className="ml-6 list-disc [&>li]:mt-0">
                    {alternativeNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {resource.categories && resource.categories.length > 0 && (
              <>
                <Separator />
                <div>
                  Categories:
                  <ul className="ml-6 list-disc [&>li]:mt-0">
                    {resource.categories.map((category) => {
                      const name =
                        "category" in category
                          ? category.category.name
                          : category.label;
                      return <li key={name}>{name}</li>;
                    })}
                  </ul>
                </div>
              </>
            )}

            {resource.relatedResources &&
              resource.relatedResources.length > 0 && (
                <>
                  <Separator />
                  <div>
                    Related Resources:
                    <ul className="ml-6 list-disc [&>li]:mt-0">
                      {resource.relatedResources.map((resource) => {
                        let id;
                        let label;

                        if ("id" in resource) {
                          id = resource.id;
                          label = resource.title;
                        } else {
                          id = resource.value;
                          label = resource.label;
                        }

                        return (
                          <li key={id}>
                            <Link
                              href={`/resource/${id}`}
                              className="underline hover:opacity-80"
                            >
                              {label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              )}
            {"lessonPlans" in resource && resource.lessonPlans.length > 0 && (
              <>
                <Separator />
                <div>
                  Lesson Plans:
                  <ul className="ml-6 list-disc [&>li]:mt-0">
                    {resource.lessonPlans.map(({ id, title }) => {
                      return (
                        <li key={id}>
                          <Link
                            href={`/lesson-plan/${id}`}
                            className="underline hover:opacity-80"
                          >
                            {title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            {resource.showIntroduction && (
              <>
                <Separator />
                <blockquote className="mt-6 border-l-2 pl-6 italic">
                  "{resource.showIntroduction}"
                </blockquote>
              </>
            )}
            {showProposeChanges && (
              <div className="flex w-full flex-row gap-2 md:mt-auto">
                <Link
                  href={`/resource/${resource.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "grow text-center",
                  )}
                >
                  {isDraft ? "Edit Draft" : "Propose Changes"}
                </Link>
                <Link
                  href={`/resource/${resource.id}/clone`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "grow text-center",
                  )}
                >
                  Clone Resource
                </Link>
              </div>
            )}
          </div>
        </SplitPageLayoutSidebar>
        <SplitPageLayoutContent>
          <ReactMarkdown
            // eslint-disable-next-line react/no-children-prop
            children={resource.description}
            className="prose prose-zinc max-w-full rounded-md lg:prose-lg dark:prose-invert prose-headings:my-8 prose-h2:scroll-m-20 prose-h2:border-b prose-h2:pb-2 prose-h2:text-3xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:first:mt-0"
            components={{
              h1: ({ ...props }) => <h2 {...props} />,
              a: ({ href, ref, ...props }) => {
                if (!href || !href.startsWith("resource/")) {
                  return (
                    <a
                      href={href}
                      ref={ref}
                      target="_blank"
                      rel="noreferrer"
                      {...props}
                    />
                  );
                }

                return <Link href={"/" + href} {...props} />;
              },
            }}
          />
          {resource.video && (
            <iframe
              className="video mt-6 aspect-video w-full lg:mt-8"
              title="Youtube player"
              sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-presentation"
              src={`https://youtube.com/embed/${resource.video}?autoplay=0`}
            ></iframe>
          )}
        </SplitPageLayoutContent>
      </SplitPageLayout>
    </div>
  );
};
