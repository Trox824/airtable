import Link from "next/link";
import React, { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Base } from "@prisma/client";
import { signOut } from "next-auth/react";
import { v4 as uuidv4 } from "uuid"; // Use this for generating UUIDs

interface BaseType {
  id: string;
  name: string;
  tables?: {
    id: string;
    name: string;
    views: {
      id: string;
      name: string;
    }[];
  }[];
}

const HomePage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [localBases, setLocalBases] = useState<BaseType[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOptimisticBase, setIsOptimisticBase] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingBases, setCreatingBases] = useState<string[]>([]);

  const {
    isLoading: apiLoading,
    error,
    data,
    refetch,
  } = api.base.getAll.useQuery();
  console.log(data);
  useEffect(() => {
    if (data) {
      setLocalBases(data);
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    const refetchTimer = setTimeout(() => {
      void refetch();
    }, 1000); // Refetch after 1 second

    return () => clearTimeout(refetchTimer);
  }, [localBases, refetch]);

  const createBase = api.base.create.useMutation({
    onMutate: async (newBase) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["base.getAll"] });

      // Snapshot the previous value
      const previousBases = queryClient.getQueryData(["base.getAll"]);

      // Create an optimistic base
      const optimisticBase = {
        id: "temp-" + uuidv4(), // temporary ID
        name: newBase.name,
        tables: [],
      };

      // Optimistically update the cache
      queryClient.setQueryData(
        ["base.getAll"],
        (old: BaseType[] | undefined) => {
          if (!old) return [optimisticBase];
          return [...old, optimisticBase];
        },
      );

      // Return context with the snapshotted value
      return { previousBases };
    },
    onSuccess: (createdBase) => {
      if (!createdBase) return;

      // Update the cache with the actual created base
      queryClient.setQueryData(
        ["base.getAll"],
        (old: BaseType[] | undefined) => {
          if (!old) return [createdBase];
          // Remove any optimistic base and add the real one
          return [
            ...old.filter((base) => !base.id.startsWith("temp-")),
            createdBase,
          ];
        },
      );

      // Navigate to the new base
      router.push(
        `/${createdBase.id}/${createdBase.firstTableId}/${createdBase.firstViewId}`,
      );
    },
    onError: (error, variables, context) => {
      // On error, roll back to the previous state
      if (context?.previousBases) {
        queryClient.setQueryData(["base.getAll"], context.previousBases);
      }
      console.error("Error creating base:", error);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      void queryClient.invalidateQueries({ queryKey: ["base.getAll"] });
    },
  });

  const deleteBase = api.base.delete.useMutation({
    onMutate: async (deletedBase) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["base.getAll"] });

      // Snapshot the previous value
      const previousBases = queryClient.getQueryData(["base.getAll"]);

      // Optimistically remove the base from the cache
      queryClient.setQueryData(
        ["base.getAll"],
        (old: BaseType[] | undefined) =>
          old?.filter((base) => base.id !== deletedBase.id) ?? [],
      );

      // Optimistically update UI
      setLocalBases((prev) =>
        prev.filter((base) => base.id !== deletedBase.id),
      );

      // Return a context object with the snapshotted value
      return { previousBases };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["base.getAll"] });
    },
    onError: (error, _, context) => {
      // Restore from snapshot on error
      if (context?.previousBases) {
        queryClient.setQueryData(["base.getAll"], context.previousBases);
        setLocalBases(context.previousBases as BaseType[]);
      }
      console.error("Error deleting base:", error);
    },
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching bases:", error);
    }
  }, [error]);

  const LoadingSkeletonCard = () => (
    <div className="mt-1 h-24 rounded-md border bg-white p-4">
      <div className="flex h-full w-full animate-pulse items-center">
        <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200"></div>
        <div className="flex flex-col space-y-2">
          <div className="h-3.5 w-32 rounded bg-gray-200"></div>
          <div className="h-3 w-16 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );

  const handleCreateBase = async (baseName: string) => {
    const tempId = uuidv4();
    setCreatingBases((prev) => [...prev, tempId]);
    try {
      await createBase.mutateAsync({ name: baseName });
    } finally {
      setCreatingBases((prev) => prev.filter((id) => id !== tempId));
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const LoadingSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="shadow-at-main-nav h-24 rounded-md border bg-white p-4"
        >
          <div className="flex h-full w-full animate-pulse items-center">
            <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200"></div>
            <div className="flex flex-col space-y-2">
              <div className="h-3.5 w-32 rounded bg-gray-200"></div>
              <div className="h-3 w-16 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="absolute h-full w-full overflow-hidden bg-[#F9FAFB]">
      {/* Navbar */}
      <div className="z-20 flex h-12 w-full flex-row items-center justify-between border-b-[1px] border-black/10 bg-white px-4">
        {/* Left section */}
        <div className="flex">
          <div className="h-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              style={{ shapeRendering: "geometricPrecision" }}
              viewBox="0 0 200 170"
            >
              <path
                fill="#FCB400"
                d="M90.039 12.368 24.079 39.66c-3.667 1.519-3.63 6.729.062 8.192l66.235 26.266a24.58 24.58 0 0 0 18.12 0l66.236-26.266c3.69-1.463 3.729-6.673.06-8.191l-65.958-27.293a24.58 24.58 0 0 0-18.795 0"
              ></path>
              <path
                fill="#18BFFF"
                d="M105.312 88.46v65.617c0 3.12 3.147 5.258 6.048 4.108l73.806-28.648a4.42 4.42 0 0 0 2.79-4.108V59.813c0-3.121-3.147-5.258-6.048-4.108l-73.806 28.648a4.42 4.42 0 0 0-2.79 4.108"
              ></path>
              <path
                fill="#F82B60"
                d="m88.078 91.846-21.904 10.576-2.224 1.075-46.238 22.155c-2.93 1.414-6.672-.722-6.672-3.978V60.088c0-1.178.604-2.195 1.414-2.96a5 5 0 0 1 1.12-.84c1.104-.663 2.68-.84 4.02-.31L87.71 83.76c3.564 1.414 3.844 6.408.368 8.087"
              ></path>
              <path
                fill="rgba(0, 0, 0, 0.25)"
                d="m88.078 91.846-21.904 10.576-53.72-45.295a5 5 0 0 1 1.12-.839c1.104-.663 2.68-.84 4.02-.31L87.71 83.76c3.564 1.414 3.844 6.408.368 8.087"
              ></path>
            </svg>
          </div>
          <div className="flex items-center pl-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="94"
              height="20"
              fill="none"
              className="Brand-module_brandWordmark__18yEz"
            >
              <path
                fill="#181D26"
                d="m12.143 11.19-2.35-6.255a.299.299 0 0 0-.558 0l-2.35 6.256a.29.29 0 0 0 .279.39h4.72a.28.28 0 0 0 .28-.255.3.3 0 0 0-.021-.135m1.095 3.51H5.79a.3.3 0 0 0-.279.195l-1.474 3.902a.3.3 0 0 1-.278.195H.53a.297.297 0 0 1-.278-.412L7.68.347A.28.28 0 0 1 7.96.17h3.086a.31.31 0 0 1 .28.177l7.427 18.233a.298.298 0 0 1-.279.413H15.25a.3.3 0 0 1-.279-.196l-1.474-3.902a.26.26 0 0 0-.259-.196m7.05-8.138h2.769a.305.305 0 0 1 .299.295V18.7a.303.303 0 0 1-.299.293h-2.768a.303.303 0 0 1-.3-.293V6.857a.29.29 0 0 1 .3-.295m13.146 2.882a.305.305 0 0 1-.299.296h-.08c-1.374 0-2.37.312-3.007.96s-.956 1.706-.956 3.194v4.785a.305.305 0 0 1-.298.295h-2.73a.305.305 0 0 1-.298-.295V6.857a.305.305 0 0 1 .299-.295h2.708a.305.305 0 0 1 .3.295V9.19h.059a4.53 4.53 0 0 1 1.553-2.234 4.3 4.3 0 0 1 2.63-.784h.139v3.273zm7.548-.116a.303.303 0 0 0-.298.292v4.922c-.037.385.069.769.298 1.08.2.214.538.312 1.036.312h.279a.305.305 0 0 1 .298.295v2.47a.303.303 0 0 1-.298.293h-1.174c-1.216 0-2.151-.314-2.808-.922-.658-.626-.976-1.529-.976-2.763V9.62a.303.303 0 0 0-.3-.292h-1.732a.305.305 0 0 1-.298-.296V6.857a.304.304 0 0 1 .298-.295h1.733a.303.303 0 0 0 .299-.293V1.876a.303.303 0 0 1 .299-.293h2.768a.303.303 0 0 1 .299.293v4.393a.303.303 0 0 0 .299.293h1.991a.305.305 0 0 1 .299.295v2.175a.305.305 0 0 1-.299.296zm12.647 5.96a3.44 3.44 0 0 0 .936-2.53 3.52 3.52 0 0 0-.936-2.53 3.657 3.657 0 0 0-4.939 0 3.44 3.44 0 0 0-.936 2.53 3.52 3.52 0 0 0 .936 2.53 3.3 3.3 0 0 0 2.47.96 3.2 3.2 0 0 0 2.47-.96m-6.374 3.314a5.54 5.54 0 0 1-2.19-2.276 8.39 8.39 0 0 1 0-7.137 5.67 5.67 0 0 1 2.19-2.275 6.1 6.1 0 0 1 3.066-.784 5.3 5.3 0 0 1 2.53.57 4.3 4.3 0 0 1 1.673 1.589h.06V6.835a.304.304 0 0 1 .298-.293h2.729a.304.304 0 0 1 .299.293v11.842a.305.305 0 0 1-.3.296h-2.726a.305.305 0 0 1-.299-.296v-1.45h-.06a4.3 4.3 0 0 1-1.674 1.59 5.35 5.35 0 0 1-2.53.569 6.1 6.1 0 0 1-3.066-.784m22.028-3.314a3.44 3.44 0 0 0 .936-2.53 3.52 3.52 0 0 0-.936-2.53 3.657 3.657 0 0 0-4.94 0 3.44 3.44 0 0 0-.935 2.53 3.52 3.52 0 0 0 .936 2.53 3.3 3.3 0 0 0 2.47.96 3.2 3.2 0 0 0 2.47-.96zm-4.142 3.528a4.3 4.3 0 0 1-1.674-1.59h-.06v1.452a.305.305 0 0 1-.298.295H60.34a.305.305 0 0 1-.298-.295V.444A.304.304 0 0 1 60.34.15h2.769a.304.304 0 0 1 .299.293v7.864h.06a4.3 4.3 0 0 1 1.673-1.59 5.35 5.35 0 0 1 2.529-.569 6.1 6.1 0 0 1 3.066.787 5.54 5.54 0 0 1 2.19 2.273 7.4 7.4 0 0 1 .798 3.568 7.7 7.7 0 0 1-.797 3.569c-.5.951-1.26 1.74-2.19 2.275a6.1 6.1 0 0 1-3.067.784 5.5 5.5 0 0 1-2.53-.59m13.244.159h-2.767a.304.304 0 0 1-.299-.296V.445a.304.304 0 0 1 .3-.294h2.767a.305.305 0 0 1 .298.293v18.234a.29.29 0 0 1-.175.271.3.3 0 0 1-.123.024zm6.513-9.549a2.63 2.63 0 0 0-.936 1.53.296.296 0 0 0 .299.353h5.258a.3.3 0 0 0 .299-.334A2.43 2.43 0 0 0 89 9.465a3.08 3.08 0 0 0-2.031-.668c-.74-.02-1.467.2-2.071.628zm6.732-1.529q1.613 1.732 1.612 4.9v.355a.304.304 0 0 1-.299.293h-8.781a.31.31 0 0 0-.3.352 3.1 3.1 0 0 0 1.057 1.883 3.7 3.7 0 0 0 2.45.783 5.13 5.13 0 0 0 3.525-1.47.288.288 0 0 1 .438.06l1.334 1.901a.32.32 0 0 1-.04.393 10.6 10.6 0 0 1-2.17 1.432 7.25 7.25 0 0 1-3.088.627 7.47 7.47 0 0 1-3.585-.825 5.8 5.8 0 0 1-2.37-2.313 6.94 6.94 0 0 1-.856-3.45 7.2 7.2 0 0 1 .817-3.47 5.77 5.77 0 0 1 2.29-2.332 6.9 6.9 0 0 1 3.446-.844c1.951-.023 3.445.566 4.52 1.724zM23.714 2.173A2.032 2.032 0 1 1 21.652.17h.01a2.043 2.043 0 0 1 2.052 2z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex max-w-2xl flex-1 justify-center px-4">
          <div className="flex w-[354px]">
            <div className="undefined flex w-full flex-row items-center">
              <div className="hover:shadow-at-main-nav-hover shadow-at-main-nav flex h-8 w-full flex-row items-center rounded-full border border-black/10 px-4">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="icon flex-none"
                >
                  <use
                    fill="currentColor"
                    href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#MagnifyingGlass"
                  ></use>
                </svg>
                <input
                  id="search-box"
                  placeholder="Search..."
                  className="placeholder-at-half-black/75 ml-2 text-[13px] outline-none"
                  type="text"
                  value=""
                  onChange={(e) => console.log(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-black/60 hover:text-black/80">
            <span className="text-sm">Help</span>
          </button>
          <button className="p-2 text-black/60 hover:text-black/80">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <use href="/icons/icon_definitions.svg#Bell"></use>
            </svg>
          </button>
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#172B4D] text-white">
            <span className="text-sm">N</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Existing content */}
      <div className="z-10 flex h-[calc(100%-48px)] flex-row">
        {/* Sidebar */}
        <div className="z-10 flex h-full w-12 flex-col border-r-[1px] border-black/10 bg-white pt-5">
          <div className="mb-5 flex justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              className="icon flex-none"
            >
              <use
                fill="currentColor"
                href="/icons/icon_definitions.svg#House"
              ></use>
            </svg>
          </div>
          <div className="mb-5 flex justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              className="icon flex-none"
            >
              <use
                fill="currentColor"
                href="/icons/icon_definitions.svg#UsersThree"
              ></use>
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-12 pt-8">
          <h1 className="font-main-content-sans text-at-half-black pb-6 text-[27px] font-[675] leading-[1.26]">
            Home
          </h1>

          {/* Action Cards Grid */}
          <div className="mb-6 grid w-full grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
            {/* Start with AI Card */}
            <a href="">
              <div className="h-full rounded-md border border-black/10 bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="icon flex-none"
                    >
                      <use
                        fill="rgb(221, 4, 168)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#AiFeature"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Start with AI
                  </h2>
                </div>
                <p className="mt-1">
                  Turn your process into an app with data and interfaces using
                  AI.
                </p>
              </div>
            </a>

            {/* Templates Card */}
            <a href="">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md border bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="undefined flex"
                    >
                      <use
                        fill="rgb(99, 73, 141)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#GridFour"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Start with templates
                  </h2>
                </div>
                <p className="mt-1">
                  Select a template to get started and customize as you go.
                </p>
              </div>
            </a>

            {/* Upload Card */}
            <a href="">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md border bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="icon flex-none"
                    >
                      <use
                        fill="rgb(13, 127, 120)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#ArrowUp"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Quickly upload
                  </h2>
                </div>
                <p className="mt-1">
                  Easily migrate your existing projects in just a few minutes.
                </p>
              </div>
            </a>

            {/* Start from scratch Card */}
            <Link href="">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md border bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="icon flex-none"
                    >
                      <use
                        fill="rgb(59, 102, 163)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#Table"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Start from scratch
                  </h2>
                </div>
                <p className="mt-1">
                  Create a new blank base with custom tables, fields, and views.
                </p>
              </div>
            </Link>
          </div>

          {/* Filter Controls */}
          <div className="mb-5 flex flex-row flex-nowrap justify-between">
            <div className="mr-2 flex flex-row">
              <div className="text-at-half-black/70 hover:text-at-half-black mr-3 flex flex-row items-center">
                <p className="mr-1 text-[15px]">Opened by you</p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="icon fill-at-half-black/70 flex-none"
                >
                  <use
                    fill="currentColor"
                    href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#ChevronDown"
                  ></use>
                </svg>
              </div>
              <div className="text-at-half-black/70 hover:text-at-half-black flex flex-row items-center">
                <p className="mr-1 text-[15px]">Show all types</p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="icon fill-at-half-black/70 flex-none"
                >
                  <use
                    fill="currentColor"
                    href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#ChevronDown"
                  ></use>
                </svg>
              </div>
            </div>
            <div className="flex flex-row items-center">
              {/* View Controls */}
              <div className="flex cursor-pointer flex-row p-1">
                <svg
                  width="20px"
                  height="20px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  opacity="0.4"
                  className="fill-at-half-black opacity-55 hover:opacity-70"
                >
                  <path
                    d="M4 18L20 18"
                    stroke="#1f1f1f"
                    strokeWidth="2"
                    strokeLinecap="round"
                  ></path>
                  <path
                    d="M4 12L20 12"
                    stroke="#1f1f1f"
                    strokeWidth="2"
                    strokeLinecap="round"
                  ></path>
                  <path
                    d="M4 6L20 6"
                    stroke="#1f1f1f"
                    strokeWidth="2"
                    strokeLinecap="round"
                  ></path>
                </svg>
              </div>
              <div className="flex cursor-pointer flex-row rounded-full bg-black/5 p-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  className="fill-at-half-black flex opacity-100"
                >
                  <use
                    fill="rgb(99, 73, 141)"
                    href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#GridFour"
                  ></use>
                </svg>
              </div>
            </div>
          </div>

          {/* Base Grid */}
          <div className="grid w-full grid-cols-4 gap-4">
            {isLoading ? (
              <LoadingSkeletons />
            ) : (
              <>
                {localBases?.map((base) => (
                  <div key={base.id} className="group relative">
                    <Link
                      href={`/${base.id}/${base.tables?.[0]?.id}/${base.tables?.[0]?.views?.[0]?.id}`}
                    >
                      <div
                        className={`shadow-at-main-nav hover:shadow-at-main-nav-hover mt-1 h-24 rounded-md border bg-white p-4 ${isOptimisticBase === base.id ? "opacity-70" : ""}`}
                      >
                        <div className="flex h-full w-full items-center">
                          <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-500">
                            {isOptimisticBase === base.id ? (
                              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-white" />
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 16 16">
                                <use
                                  fill="currentColor"
                                  href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#RocketLaunch"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="">
                            <p className="text-[13px] font-medium">
                              {base.name}
                            </p>
                            <p className="mt-2 text-[11px] text-[#666]">
                              {isOptimisticBase === base.id
                                ? "Creating..."
                                : "Base"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                    {/* Only show delete button for non-optimistic bases */}
                    {isOptimisticBase !== base.id && (
                      <button
                        className="absolute right-0 top-1/2 mr-2 flex h-8 w-10 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-black/5 opacity-0 transition-all duration-200 hover:bg-red-500 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBase.mutate({ id: base.id });
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          className="text-black/40 transition-colors duration-200 hover:text-white"
                        >
                          <path
                            d="M4 4L12 12M12 4L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Show skeleton for each creating base */}
                {creatingBases.map((id) => (
                  <LoadingSkeletonCard key={id} />
                ))}

                {/* Create New Base Button/Form */}
                {!isLoading && (
                  <div className="mt-1 h-24">
                    <button
                      onClick={() => handleCreateBase("Untitled Base")}
                      className="shadow-at-main-nav hover:shadow-at-main-nav-hover flex h-full w-full items-center justify-center rounded-md border bg-white"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-gray-400"
                      >
                        <path
                          d="M12 4v16m8-8H4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
