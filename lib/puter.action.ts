import puter from "@heyputer/puter.js";
import {
  getOrCreateHostingConfig,
  uploadImageToHosting,
} from "./puter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constants";

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser();
  } catch {
    return null;
  }
};

const KV_PREFIX = "roomify_project_";
const KV_INDEX_KEY = "roomify_index";

const kvSaveProject = async (payload: DesignItem): Promise<DesignItem | null> => {
  const record = { ...payload, updatedAt: new Date().toISOString() };
  const isBase64 = (s?: string) => typeof s === "string" && s.startsWith("data:");

  // Try full record first; if kv rejects (too large), strip only the optional base64 renderedImage
  const attempts = [record, { ...record, renderedImage: isBase64(record.renderedImage) ? undefined : record.renderedImage }];

  for (const attempt of attempts) {
    try {
      await puter.kv.set(`${KV_PREFIX}${payload.id}`, attempt);
      const index: string[] = (await puter.kv.get<string[]>(KV_INDEX_KEY)) ?? [];
      if (!index.includes(payload.id)) {
        await puter.kv.set(KV_INDEX_KEY, [payload.id, ...index]);
      }
      return attempt;
    } catch {
      // try next attempt
    }
  }

  console.error("Failed to save project to kv after all attempts");
  return null;
};

const kvGetProjects = async (): Promise<DesignItem[]> => {
  try {
    const index: string[] = (await puter.kv.get<string[]>(KV_INDEX_KEY)) ?? [];
    const projects = await Promise.all(
      index.map((id) => puter.kv.get<DesignItem>(`${KV_PREFIX}${id}`)),
    );
    return projects.filter(Boolean) as DesignItem[];
  } catch (e) {
    console.error("Failed to list projects from kv:", e);
    return [];
  }
};

const kvGetProjectById = async (id: string): Promise<DesignItem | null> => {
  try {
    return (await puter.kv.get<DesignItem>(`${KV_PREFIX}${id}`)) ?? null;
  } catch (e) {
    console.error("Failed to get project from kv:", e);
    return null;
  }
};

const resolveProjectImages = async (item: DesignItem) => {
  const projectId = item.id;
  const hosting = await getOrCreateHostingConfig();
  console.log("[createProject] hosting config:", hosting);

  const hostedSource = projectId
    ? await uploadImageToHosting({
        hosting,
        url: item.sourceImage,
        projectId,
        label: "source",
      })
    : null;

  const hostedRender =
    projectId && item.renderedImage
      ? await uploadImageToHosting({
          hosting,
          url: item.renderedImage,
          projectId,
          label: "rendered",
        })
      : null;

  const resolvedSource =
    hostedSource?.url ||
    (isHostedUrl(item.sourceImage) ? item.sourceImage : "");

  let resolvedRender: string | undefined;
  if (hostedRender?.url) {
    resolvedRender = hostedRender.url;
  } else if (item.renderedImage && isHostedUrl(item.renderedImage)) {
    resolvedRender = item.renderedImage;
  }

  console.log("[createProject] resolvedSource:", resolvedSource?.slice(0, 80));
  return { resolvedSource, resolvedRender };
};

export const createProject = async ({
  item,
  visibility = "private",
}: CreateProjectParams): Promise<DesignItem | null | undefined> => {
  const { resolvedSource, resolvedRender } = await resolveProjectImages(item);

  const {
    sourcePath: _sourcePath,
    renderedPath: _renderedPath,
    publicPath: _publicPath,
    ...rest
  } = item;

  const payload = {
    ...rest,
    sourceImage: resolvedSource || item.sourceImage,
    renderedImage: resolvedRender ?? item.renderedImage,
  };

  if (!PUTER_WORKER_URL) {
    return kvSaveProject(payload);
  }

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/save`,
      {
        method: "POST",
        body: JSON.stringify({
          project: payload,
          visibility,
        }),
      },
    );

    if (!response.ok) {
      console.error("failed to save the project", await response.text());
      return kvSaveProject(payload);
    }

    const data = (await response.json()) as { project?: DesignItem | null };

    return data?.project ?? null;
  } catch (e) {
    console.log("Failed to save project", e);
    return kvSaveProject(payload);
  }
};

export const getProjects = async () => {
  if (!PUTER_WORKER_URL) {
    return kvGetProjects();
  }

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/list`,
      { method: "GET" },
    );

    if (!response.ok) {
      console.error("Failed to fetch history", await response.text());
      return kvGetProjects();
    }

    const data = (await response.json()) as { projects?: DesignItem[] | null };

    return Array.isArray(data?.projects) ? data?.projects : [];
  } catch (e) {
    console.error("Failed to get projects", e);
    return kvGetProjects();
  }
};

export const getProjectById = async ({ id }: { id: string }) => {
  if (!PUTER_WORKER_URL) {
    return kvGetProjectById(id);
  }
  console.log("Fetching project with ID:", id);

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    console.log("Fetch project response:", response);

    if (!response.ok) {
      console.error("Failed to fetch project:", await response.text());
      return kvGetProjectById(id);
    }

    const data = (await response.json()) as {
      project?: DesignItem | null;
    };
    console.log("Fetched project data:", data);

    return data?.project ?? null;
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return kvGetProjectById(id);
  }
};
