// This a sample token privider, in a real application this would be replaced with a more secure implementation

export function tokenProvider() {
  return {
    getToken: () => {
      const token = process.env["MCP_ECHO_PING_ACCESS_TOKEN"];
      if (!token) {
        console.error("MCP_ECHO_PING_ACCESS_TOKEN is not set in environment.");
        throw new Error(
          "Server misconfiguration: MCP_ECHO_PING_ACCESS_TOKEN is not set."
        );
      }
      return token;
    },
  };
}
