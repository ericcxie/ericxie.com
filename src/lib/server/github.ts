const API_BASE = "https://api.github.com/repos/ericcxie/ericxie.ca";

export type TreeEntry = {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string | null; // null deletes the file
};

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json",
});

const github = (token: string, path: string, init?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { ...init, headers: headers(token) });

export const createBlob = async (
  token: string,
  content: string,
  encoding: "utf-8" | "base64" = "utf-8",
): Promise<string> => {
  const res = await github(token, "/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content, encoding }),
  });
  return (await res.json()).sha;
};

// Commits the tree entries on top of main in a single commit
export const commitToMain = async (
  token: string,
  tree: TreeEntry[],
  message: string,
): Promise<string> => {
  const ref = await (await github(token, "/git/ref/heads/main")).json();
  const parent = ref.object.sha;
  const commit = await (await github(token, `/git/commits/${parent}`)).json();

  const newTree = await (
    await github(token, "/git/trees", {
      method: "POST",
      body: JSON.stringify({ base_tree: commit.tree.sha, tree }),
    })
  ).json();

  const newCommit = await (
    await github(token, "/git/commits", {
      method: "POST",
      body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }),
    })
  ).json();

  await github(token, "/git/refs/heads/main", {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  return newCommit.sha;
};

export const deleteFile = async (
  token: string,
  path: string,
  message: string,
): Promise<boolean> => {
  const file = await github(token, `/contents/${path}?ref=main`);
  if (!file.ok) return false;
  const { sha } = await file.json();
  await github(token, `/contents/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: "main" }),
  });
  return true;
};

// Kicks off the action that pulls uploaded photos from Blob into the repo
export const dispatchPhotoSync = (token: string) =>
  github(token, "/actions/workflows/sync-photos.yml/dispatches", {
    method: "POST",
    body: JSON.stringify({ ref: "main" }),
  });
