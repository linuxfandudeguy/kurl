// Import minimist for parsing command-line arguments
import minimist from "npm:minimist";

// Parse command-line arguments
const args = minimist(Deno.args, {
  string: ["X", "H", "d", "o", "u"],
  boolean: ["v"],
  default: { X: "GET", v: false },
});

// Main function
async function main() {
  const url = args._[0];
  if (!url) {
    console.error("Error: URL is required.");
    Deno.exit(1);
  }

  // Set the HTTP method
  const method = args.X?.toUpperCase() || "GET";

  // Initialize headers
  const headers = new Headers();
  if (args.H) {
    const headersArray = Array.isArray(args.H) ? args.H : [args.H];
    headersArray.forEach((header: string) => {
      const [key, value] = header.split(": ");
      if (key && value) headers.set(key.trim(), value.trim());
    });
  }

  // Handle body data if specified
  const body = args.d ? String(args.d) : undefined;

  // Handle basic auth if specified
  if (args.u) {
    const [username, password] = args.u.split(":");
    const encoded = btoa(`${username}:${password}`);
    headers.set("Authorization", `Basic ${encoded}`);
  }

  // Prepare request options
  const requestOptions: RequestInit = { method, headers };
  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    requestOptions.body = body;
  } else if (body) {
    console.warn(`Warning: Body is ignored for ${method} request.`);
  }

  try {
    // Make the HTTP request
    const response = await fetch(url, requestOptions);
    
    // Verbose output if specified
    if (args.v) {
      console.log("Request:");
      console.log(`Method: ${method}`);
      console.log("Headers:", [...headers.entries()]);
      if (body) console.log("Body:", body);
      console.log("\nResponse:");
      console.log(`Status: ${response.status}`);
      console.log("Response Headers:", [...response.headers.entries()]);
    }

    // Output handling: save to file or print to console
    if (args.o) {
      const file = await Deno.create(args.o);
      await response.body?.pipeTo(file.writable);
      console.log(`Saved response to ${args.o}`);
    } else {
      console.log(await response.text());
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Request failed:", error.message);
    } else {
      console.error("An unknown error occurred.");
    }
  }
}

// Run the main function
main().catch((error) => {
  if (error instanceof Error) {
    console.error("Error:", error.message);
  } else {
    console.error("An unknown error occurred.");
  }
});
