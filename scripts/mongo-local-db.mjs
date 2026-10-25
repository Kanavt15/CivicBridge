import { existsSync, mkdirSync, openSync, closeSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import { MongoClient } from "mongodb";

const root = resolve(import.meta.dirname, "..");
const directory = join(root, ".data", "mongo");
const replicaSet = "civicbridge-rs";
const port = 27018;
const directUrl = `mongodb://127.0.0.1:${port}/admin?directConnection=true`;
const mode = process.argv[2];
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

async function connect() {
  const client = new MongoClient(directUrl, { serverSelectionTimeoutMS: 1000 });
  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.close();
    throw error;
  }
}
async function checkOwned(client) {
  const options = await client.db("admin").command({ getCmdLineOpts: 1 });
  const dbPath = options.parsed?.storage?.dbPath;
  const setName = options.parsed?.replication?.replSetName || options.parsed?.replication?.replSet;
  if (
    !dbPath ||
    resolve(dbPath).toLowerCase() !== directory.toLowerCase() ||
    setName !== replicaSet
  ) {
    throw new Error(
      `Port ${port} belongs to another MongoDB server. Its configuration was not changed.`,
    );
  }
}
async function main() {
  if (!["start", "stop"].includes(mode))
    throw new Error("Usage: node scripts/mongo-local-db.mjs start|stop");
  let client;
  try {
    client = await connect();
  } catch {
    /* Start the workspace server if it is stopped. */
  }
  if (mode === "stop") {
    if (!client) {
      console.log("The workspace MongoDB server is stopped.");
      return;
    }
    try {
      await checkOwned(client);
      try {
        await client.db("admin").command({ shutdown: 1 });
      } catch (error) {
        if (!/connection|closed|shutdown|ECONNRESET/i.test(error.message)) throw error;
      }
      console.log("Stopped only the workspace MongoDB server.");
    } finally {
      await client.close();
    }
    return;
  }
  if (!client) {
    let binary = process.env.LOCAL_MONGOD_PATH;
    if (!binary && process.platform === "win32") {
      const serverRoot = "C:/Program Files/MongoDB/Server";
      const versions = existsSync(serverRoot)
        ? readdirSync(serverRoot).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        : [];
      binary = versions
        .map((version) => join(serverRoot, version, "bin", "mongod.exe"))
        .find(existsSync);
    }
    binary ||= "mongod";
    mkdirSync(directory, { recursive: true });
    const stdout = openSync(join(root, ".data", "mongo-stdout.log"), "a");
    const stderr = openSync(join(root, ".data", "mongo-stderr.log"), "a");
    const child = spawn(
      binary,
      [
        "--dbpath",
        directory,
        "--bind_ip",
        "127.0.0.1",
        "--port",
        String(port),
        "--replSet",
        replicaSet,
        "--oplogSize",
        "128",
        "--wiredTigerCacheSizeGB",
        "0.25",
      ],
      { detached: true, windowsHide: true, stdio: ["ignore", stdout, stderr] },
    );
    let launchError;
    child.on("error", (error) => {
      launchError = error;
    });
    child.unref();
    closeSync(stdout);
    closeSync(stderr);
    for (let attempt = 0; attempt < 30 && !client; attempt++) {
      if (launchError)
        throw new Error(
          `Could not launch mongod: ${launchError.message}. Install MongoDB Community Server or set LOCAL_MONGOD_PATH.`,
        );
      try {
        client = await connect();
      } catch {
        await pause(250);
      }
    }
    if (!client)
      throw new Error(
        "MongoDB did not start. Inspect .data/mongo-stderr.log and .data/mongo-stdout.log.",
      );
  }
  try {
    await checkOwned(client);
    const hello = await client.db("admin").command({ hello: 1 });
    if (!hello.setName)
      await client.db("admin").command({
        replSetInitiate: { _id: replicaSet, members: [{ _id: 0, host: `127.0.0.1:${port}` }] },
      });
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const state = await client.db("admin").command({ hello: 1 });
      if (state.isWritablePrimary) {
        ready = true;
        break;
      }
      await pause(250);
    }
    if (!ready)
      throw new Error("MongoDB replica set did not elect a primary. Check the workspace logs.");
    console.log(
      `Workspace MongoDB is ready: mongodb://127.0.0.1:${port}/civicbridge?replicaSet=${replicaSet}`,
    );
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
