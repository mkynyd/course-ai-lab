/** Skills Registry — 工具定义 */

export interface SkillDefinition {
  name: string;
  description: string;
  type: "server" | "client";
  inputSchema: Record<string, unknown>;
}

export const SKILL_WEB_SEARCH: SkillDefinition = {
  name: "web_search",
  description: "Search the web for current information.",
  type: "server",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
};

export const SKILL_SEARCH_PROJECT_FILES: SkillDefinition = {
  name: "search_project_files",
  description: "Search within uploaded project files.",
  type: "client",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      maxResults: { type: "number", description: "Max results", default: 5 },
    },
    required: ["query"],
  },
};

export const SKILL_LIST_PROJECT_FILES: SkillDefinition = {
  name: "list_project_files",
  description: "List all files in the current project.",
  type: "client",
  inputSchema: { type: "object", properties: {} },
};

export function getSkillSet(_mode?: string): SkillDefinition[] {
  return [
    SKILL_WEB_SEARCH,
    SKILL_SEARCH_PROJECT_FILES,
    SKILL_LIST_PROJECT_FILES,
  ];
}

export function buildToolsPayload(
  skills: SkillDefinition[]
): Array<{ type: string; name?: string; description?: string; input_schema?: Record<string, unknown> }> {
  return skills.map((s) => {
    if (s.type === "server") return { type: s.name };
    return { type: "custom", name: s.name, description: s.description, input_schema: s.inputSchema };
  });
}
