import ReactMarkdown from "react-markdown";
import { useRouter } from "next/router";
import Link from "next/link";
import type * as z from "zod";

import type { RouterOutputs } from "~/utils/api";
import type { ResourceConfiguation, ResourceType } from "@prisma/client";
import { useMemo } from "react";
import { type resourceCreateSchema } from "~/utils/zod";

import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { LoadingPage } from "~/components/Loading";
import clsx from "clsx";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ExclamationTriangleIcon, EyeClosedIcon } from "@radix-ui/react-icons";

export const ResourceTypeLabels: Record<ResourceType, string> = {
  EXERCISE: "Warm-up / Exercise",
  SHORT_FORM: "Short Form Game",
  LONG_FORM: "Long Form Format",
};

export const ResourceConfiguationLabels: Record<ResourceConfiguation, string> =
  {
    SCENE: "Scene with N players",
    WHOLE_CLASS: "Whole class",
    SOLO: "Solo",
    PAIRS: "Pairs",
    GROUPS: "Groups",
    CIRCLE: "Circle",
  };

type ApiResource = Readonly<RouterOutputs["resource"]["getById"]>;
type CreationResource = z.infer<typeof resourceCreateSchema>;

type Props = {
  resource: ApiResource | CreationResource;
  hideBackToHome?: boolean;
};
export function SingleResourceComponent({ resource, hideBackToHome }: Props) {
  const router = useRouter();

  const subtitle = useMemo(() => {
    let str = ResourceTypeLabels[resource.type];

    if (resource.type === "EXERCISE") {
      const confLabel = ResourceConfiguationLabels[resource.configuration];

      switch (resource.configuration) {
        case "SOLO":
        case "PAIRS":
          str += ` - ${confLabel}`;
          break;
        case "SCENE":
          str += ` - ${resource.groupSize} players`;
          break;
        case "GROUPS":
          str += ` - ${confLabel} of (minimum) ${resource.groupSize} players`;
          break;
        case "WHOLE_CLASS":
        case "CIRCLE":
          str += ` - ${confLabel} (minimum ${resource.groupSize} players)`;
          break;
      }
    } else {
      str += ` - ${resource.groupSize} players`;
    }

    return str;
  }, [resource]);
  return (
    <article className="prose max-w-full lg:prose-lg dark:prose-invert">
      <header className="flex flex-row">
        <h1 className="mb-0 grow lg:mb-0">{resource.title}</h1>
        {!hideBackToHome && (
          <button className="a hover:underline" onClick={() => router.back()}>
            Back
          </button>
        )}
      </header>

      <h4 className="mb-4 mr-0 mt-1 inline-block text-muted-foreground lg:mb-6 lg:mt-2">
        {subtitle}
      </h4>

      <ReactMarkdown
        children={resource.description}
        components={{
          a: ({ href, ref, ...props }) => {
            if (!href || !href.startsWith("resource/")) {
              return <a href={href} ref={ref} target="_blank" {...props} />;
            }

            return <Link href={"/" + href} {...props} />;
          },
        }}
      />

      {resource.categories && resource.categories.length > 0 && (
        <>
          <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Categories</h2>
          <ul>
            {resource.categories.map((category) => {
              const name =
                "category" in category
                  ? category.category.name
                  : category.label;
              return (
                <li key={name} className="my-0 lg:my-0">
                  {name}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {resource.showIntroduction && (
        <>
          <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Show Introduction</h2>
          <blockquote>{resource.showIntroduction}</blockquote>
        </>
      )}

      {resource.video && (
        <>
          <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Example Video</h2>
          <iframe
            className="video aspect-video w-full"
            title="Youtube player"
            sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-presentation"
            src={`https://youtube.com/embed/${resource.video}?autoplay=0`}
          ></iframe>
        </>
      )}

      {resource.alternativeNames && (
        <>
          <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Alternative Names</h2>
          <ul>
            {(typeof resource.alternativeNames === "string"
              ? resource.alternativeNames.split(";")
              : resource.alternativeNames.map((name) => name.value)
            ).map((name) => (
              <li key={name} className="my-0 lg:my-0">
                {name}
              </li>
            ))}
          </ul>
        </>
      )}

      {resource.relatedResources && resource.relatedResources.length > 0 && (
        <>
          <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Related Resources</h2>
          <ul>
            {resource.relatedResources.map((resource) => {
              if ("id" in resource) {
                return (
                  <li className="my-0 lg:my-0" key={resource.id}>
                    <Link href={`/resource/${resource.id}`}>
                      {resource.title}
                    </Link>
                  </li>
                );
              }
              return (
                <li className="my-0 lg:my-0" key={resource.value}>
                  <Link href={`/resource/${resource.value}`}>
                    {resource.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}

export const ResourceList = ({
  filter,
  queryResult,
  noResourcesMessage,
  showPublishedStatus = false,
}: {
  queryResult: UseTRPCQueryResult<RouterOutputs["resource"]["getAll"], unknown>;
  filter?: (resource: RouterOutputs["resource"]["getAll"][0]) => boolean;
  showPublishedStatus?: boolean;
  noResourcesMessage: string;
}) => {
  const { data, isLoading } = queryResult;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Oh no!</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try reloading the page.
        </AlertDescription>
      </Alert>
    );
  }

  const resources = !filter ? data : data.filter(filter);

  if (resources.length === 0) {
    return (
      <Alert>
        <EyeClosedIcon className="h-4 w-4" />
        <AlertTitle>No resources found.</AlertTitle>
        <AlertDescription>{noResourcesMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {resources.map((resource) => (
        <Link
          key={resource.id}
          className="flex w-full flex-row items-center rounded-lg border bg-background px-4 py-3 text-foreground"
          href={`/resource/${resource.id}`}
        >
          <div className="grow">
            <h3 className="font-medium leading-none tracking-tight">
              {resource.title}
            </h3>
            {resource.categories.length > 0 && (
              <p className="mt-1.5 text-sm leading-none text-muted-foreground">{`Categories: ${resource.categories
                .map(({ category }) => category.name)
                .join(", ")}`}</p>
            )}
          </div>
          {showPublishedStatus && (
            <Badge
              className={clsx(
                "self-start text-white",
                resource.published && "bg-green-700",
                !resource.published && "bg-orange-600",
              )}
            >
              {resource.published ? "Published" : "Pending approval"}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
};
