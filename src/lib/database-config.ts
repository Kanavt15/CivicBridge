export type DatabaseTarget = {
  kind: "Atlas" | "MongoDB";
  database: string;
};

// Errors intentionally omit the input: MongoDB URLs contain database credentials.
export function databaseTarget(connectionString: string | undefined): DatabaseTarget {
  if (!connectionString?.trim()) {
    throw new Error("Set DATABASE_URL in .env or in your deployment host's environment variables.");
  }
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid MongoDB connection URI.");
  }
  if (!["mongodb:", "mongodb+srv:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use mongodb:// or mongodb+srv://.");
  }
  let database: string;
  let username: string;
  let password: string;
  try {
    database = decodeURIComponent(url.pathname.slice(1));
    username = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
  } catch {
    throw new Error(
      "DATABASE_URL has invalid percent encoding. Encode username/password components separately.",
    );
  }
  if (/[<>]/.test(connectionString) || /[<>]/.test(username + password + database)) {
    throw new Error("Replace all Atlas connection URI placeholders before checking the database.");
  }
  if (!database || /[\/\s]/.test(database)) {
    throw new Error(
      "DATABASE_URL must contain an application database name, such as /civicbridge.",
    );
  }
  const atlas = url.hostname.toLowerCase().endsWith(".mongodb.net");
  if (atlas && (!username || !password)) {
    throw new Error(
      "The Atlas URI needs a database username and password, distinct from your Atlas sign-in.",
    );
  }
  return { kind: atlas ? "Atlas" : "MongoDB", database };
}
