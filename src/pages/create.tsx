import Head from "next/head";
import { kebabCase, startCase } from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import type * as z from "zod";
import toast from "react-hot-toast";

import { PageLayout } from "~/components/PageLayout";

import { api } from "~/utils/api";
import { resourceCreateSchema } from "~/utils/zod";
import { useRouter } from "next/router";
import { MultiSelectDropown } from "~/components/MultiSelectDropdown";
import { ResourceConfiguation, ResourceType } from "@prisma/client";
import { useEffect } from "react";
import clsx from "clsx";

const showExtra = true;

type CreateSchemaType = z.infer<typeof resourceCreateSchema>;

export default function Create() {
  const router = useRouter();

  const { data: categories, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery();
  const { data: resources, isLoading: isLoadingResources } =
    api.resource.getAllOnlyIdAndTitle.useQuery();

  const utils = api.useUtils();

  const { mutate: createResource, isLoading: isCreating } =
    api.resource.create.useMutation({
      onSuccess: ({ resource }) => {
        void router.push("/resource/" + resource.id);
        // incredible magic that makes the "getAll" automatically re-trigger
        void utils.resource.getAll.invalidate();
      },
      onError: (e) => {
        if (e.data?.code === "CONFLICT") {
          toast.error(
            "A resource already exists at this URL. Please choose a new URL.",
          );
          return;
        }

        const errorMessage =
          e.message ?? e.data?.zodError?.fieldErrors.content?.[0];
        if (errorMessage) {
          toast.error(errorMessage);
          return;
        }
        toast.error("Failed to post! Please try again later.");
      },
    });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm<CreateSchemaType>({
    resolver: zodResolver(resourceCreateSchema),
    defaultValues: {
      description: `Write a description of the warm-up/exercise/game etc. Include any and all details that you think are important. This is the first thing people will see when looking at your resource.

You can use markdown to format your text. For example **bold text**, *italic text*, and [links](https://your.url). Click on the "Preview" button above to see what your text will look like.

Here are some sections that you might want to include in your description:

## Introduction

Any introduction that you want to give to the warm-up/exercise/game etc. This could be a short description of the activity, a story about how you came up with it, or anything else that you think is relevant.

## Setup

How do you set up the activity? How do you explain the rules to the participants? How do you get the participants to start?

## Rules

What are the rules of the activity? How do you play it?

## Learning Objectives

What are the learning objectives of the activity? What skills does it help the participants develop?

## Tips

Any tips that you have for the participants? Any common mistakes that you want to warn them about? Any advice that you want to give them?

## Examples

You could consider writing a sample dialogue between you and the participants, a sample playthrough of the activity, or anything else that you think is relevant.

## Variations

Are there any variations of this activity that you want to share? For example, you could change the rules, add/remove some constraints, change the goal of the activity, or anything else that you think is relevant.`,
    },
  });

  useEffect(() => {
    const title = getValues("title");
    setValue("id", kebabCase(title));
  }, [watch("title")]);

  const configurationDisabled = watch("type") !== ResourceType.EXERCISE;

  const watchConfiguration = watch("configuration");
  const groupSizeDisabled =
    watchConfiguration === ResourceConfiguation.SOLO ||
    watchConfiguration === ResourceConfiguation.PAIRS;

  useEffect(() => {
    const configuration = getValues("configuration");
    if (configuration === ResourceConfiguation.SOLO) {
      setValue("groupSize", 1);
    } else if (configuration === ResourceConfiguation.PAIRS) {
      setValue("groupSize", 2);
    }
  }, [watchConfiguration]);

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof resourceCreateSchema>) {
    if (isCreating) {
      return;
    }
    createResource(values);
  }

  // if (errors) {
  //   console.log("Form errors:");
  //   console.log(errors);
  //   console.log("Form values:");
  //   console.log(getValues());
  // }

  return (
    <>
      <Head>
        <title>Create Resource - The Improvitory</title>
      </Head>
      <PageLayout>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-12">
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-slate-900">
                Create New Resource
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium leading-6 text-slate-900"
                  >
                    Title<span className="text-red-700">*</span>
                  </label>
                  <div className="mt-2">
                    <div className="flex w-full rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                      <input
                        type="text"
                        {...register("title")}
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="My favourite game"
                      />
                    </div>
                  </div>
                  {errors.title?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.title?.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="alternativeNames"
                    className="block text-sm font-medium leading-6 text-slate-900"
                  >
                    Alternative Names
                  </label>
                  <div className="mt-2">
                    <Controller
                      name="alternativeNames"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectDropown {...field} isCreatable />
                      )}
                    />
                  </div>
                  {errors.alternativeNames?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.alternativeNames?.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="id"
                    className="block text-sm font-medium leading-6 text-slate-900"
                  >
                    URL<span className="text-red-700">*</span>
                  </label>
                  <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                      <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                        /resource/
                      </span>
                      <input
                        type="text"
                        {...register("id")}
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        placeholder="my-favourite-game"
                      />
                    </div>
                  </div>
                  {errors.id?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.id?.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium leading-6 text-slate-900"
                  >
                    Resource Type<span className="text-red-700">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      {...register("type")}
                      className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                      <option value={ResourceType.EXERCISE}>
                        Warm-up / Exercise
                      </option>
                      <option value={ResourceType.SHORT_FORM}>
                        Short Form Game
                      </option>
                      <option value={ResourceType.LONG_FORM}>
                        Long Form Format
                      </option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="configuration"
                    className={clsx(
                      configurationDisabled && "text-gray-200",
                      "block text-sm font-medium leading-6  text-slate-900",
                    )}
                  >
                    Exercise Configuration
                    {!configurationDisabled && (
                      <span className="text-red-700">*</span>
                    )}
                  </label>
                  <div className="mt-2">
                    <select
                      {...register("configuration")}
                      className={clsx(
                        configurationDisabled && "text-gray-200",
                        "block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
                      )}
                      disabled={configurationDisabled}
                      value={
                        configurationDisabled
                          ? ResourceConfiguation.SCENE
                          : getValues("configuration")
                      }
                    >
                      <option value={ResourceConfiguation.SCENE}>
                        {configurationDisabled ? "N/A" : "Scene with N players"}
                      </option>
                      <option value={ResourceConfiguation.WHOLE_CLASS}>
                        Whole class
                      </option>
                      <option value={ResourceConfiguation.SOLO}>Solo</option>
                      <option value={ResourceConfiguation.PAIRS}>Pairs</option>
                      <option value={ResourceConfiguation.GROUPS}>
                        Groups
                      </option>
                      <option value={ResourceConfiguation.CIRCLE}>
                        Circle
                      </option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="groupSize"
                    className={clsx(
                      groupSizeDisabled && "text-gray-200",
                      "block text-sm font-medium leading-6  text-slate-900",
                    )}
                  >
                    (Minimum) Group Size
                    {!groupSizeDisabled && (
                      <span className="text-red-700">*</span>
                    )}
                  </label>
                  <div className="mt-2">
                    <div className="flex w-full rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                      <input
                        type="number"
                        disabled={groupSizeDisabled}
                        {...register("groupSize")}
                        className={clsx(
                          groupSizeDisabled && "text-gray-200",
                          "block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
                        )}
                      />
                    </div>
                  </div>
                  {errors.groupSize?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.groupSize?.message}
                    </p>
                  )}
                </div>

                <div className="col-span-full">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium leading-6 text-slate-900"
                  >
                    Description<span className="text-red-700">*</span>
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="description"
                      {...register("description")}
                      rows={10}
                      className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  {errors.description?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.description?.message}
                    </p>
                  )}
                </div>

                {showExtra && (
                  <>
                    <div className="col-span-full">
                      <label className="block text-sm font-medium leading-6 text-slate-900">
                        Categories
                      </label>
                      <div className="mt-2">
                        <Controller
                          name="categories"
                          control={control}
                          render={({ field }) => (
                            <MultiSelectDropown
                              {...field}
                              isLoading={isLoadingCategories}
                              loadingMessage={() => "Loading categories..."}
                              options={categories?.map(({ id, name }) => ({
                                label: name,
                                value: id,
                              }))}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="showIntroduction"
                        className="block text-sm font-medium leading-6 text-slate-900"
                      >
                        Show Introduction
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="showIntroduction"
                          {...register("showIntroduction")}
                          rows={3}
                          className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                      {errors.showIntroduction?.message && (
                        <p className="mt-1 text-sm leading-6 text-red-700">
                          {errors.showIntroduction?.message}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="relatedResources"
                        className="block text-sm font-medium leading-6 text-slate-900"
                      >
                        Related Resources
                      </label>
                      <div className="mt-2">
                        <Controller
                          name="relatedResources"
                          control={control}
                          render={({ field }) => (
                            <MultiSelectDropown
                              {...field}
                              isLoading={isLoadingResources}
                              loadingMessage={() => "Loading resources..."}
                              options={resources?.map(({ id, title }) => ({
                                label: title,
                                value: id,
                              }))}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="video"
                        className="block text-sm font-medium leading-6 text-slate-900"
                      >
                        YouTube Video ID
                      </label>
                      <div className="mt-2">
                        <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                          <input
                            type="text"
                            {...register("video")}
                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="123456789AB"
                          />
                        </div>
                      </div>
                      {errors.video?.message && (
                        <p className="mt-1 text-sm leading-6 text-red-700">
                          {errors.video?.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="text-sm font-semibold leading-6 text-slate-900"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              disabled={isCreating}
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Save
            </button>
          </div>
        </form>
      </PageLayout>
    </>
  );
}
