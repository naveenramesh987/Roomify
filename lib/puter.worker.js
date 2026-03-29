const PROJECT_PREFIX = "roomify_project_";

const jsonError = (status, message, extra = {}) => {
  return new Response(
    JSON.stringify({
      error: {
        message,
        ...(Object.keys(extra).length > 0 && { details: extra }),
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
};

const getUserId = async (userPuter) => {
  try {
    const user = await userPuter.auth.getUser();
    return user?.uuid || null;
  } catch {
    return null;
  }
};

router.get("/api/projects/list", async (_req, user) => {
  try {
    const userPuter = user.puter;

    if (!userPuter) {
      return jsonError(401, "Authentication failed");
    }

    const keys = await userPuter.kv.list(`${PROJECT_PREFIX}*`);
    const projects = await Promise.all(
      keys.map((key) => userPuter.kv.get(key)),
    );

    return { projects };
  } catch (error) {
    return jsonError(500, "Failed to list projects", {
      message: error.message || "Unknown error",
    });
  }
});

router.get("/api/projects/get", async (req, user) => {
  try {
    const userPuter = user.puter;

    if (!userPuter) {
      return jsonError(401, "Authentication failed");
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return jsonError(400, "Missing project id");
    }

    const key = `${PROJECT_PREFIX}${id}`;
    const project = await userPuter.kv.get(key);

    if (!project) {
      return jsonError(404, "Project not found");
    }

    return { project };
  } catch (error) {
    return jsonError(500, "Failed to get project", {
      message: error.message || "Unknown error",
    });
  }
});

router.post("/api/projects/save", async (req, user) => {
  try {
    const userPuter = user.puter;

    if (!userPuter) {
      return jsonError(401, "Authentication failed");
    }

    const body = await req.json();

    if (!body || !body.project) {
      return jsonError(400, "Invalid project data");
    }

    const project = body.project;

    if (!project.id || !project.sourceImage) {
      return jsonError(400, "Invalid project data");
    }

    const payload = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(401, "Authentication failed");
    }

    const key = `${PROJECT_PREFIX}${project.id}`;
    await userPuter.kv.set(key, payload);

    return { saved: true, id: project.id, project: payload };
  } catch (error) {
    return jsonError(500, "Failed to save project", {
      message: error.message || "Unknown error",
    });
  }
});
