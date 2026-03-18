import type { CodeSnippet, EndpointSpec } from "@/shared/types/portal";

function prettyBody(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, null, 2);
}

function escapedJson(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replace(/"/g, '\\"');
}

export function generateCodeSnippets(args: {
  endpoint: EndpointSpec;
  payload: Record<string, unknown>;
  apiKey?: string;
  baseUrl?: string;
}): CodeSnippet[] {
  const { endpoint, payload } = args;
  const apiKey = args.apiKey ?? "hub_sandbox_demo_key";
  const baseUrl = args.baseUrl ?? "https://api.yourhub.com";
  const url = `${baseUrl}${endpoint.path}`;

  return [
    {
      language: "curl",
      content:
        endpoint.method === "GET"
          ? `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${apiKey}"`
          : `curl -X POST "${url}" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d "${escapedJson(payload)}"`,
    },
    {
      language: "javascript",
      content:
        endpoint.method === "GET"
          ? `const response = await fetch("${url}", {\n  headers: { Authorization: "Bearer ${apiKey}" }\n});\nconst data = await response.json();`
          : `const response = await fetch("${url}", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${apiKey}",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${prettyBody(payload)})\n});\nconst data = await response.json();`,
    },
    {
      language: "python",
      content:
        endpoint.method === "GET"
          ? `import requests\n\nresponse = requests.get(\n    "${url}",\n    headers={"Authorization": "Bearer ${apiKey}"}\n)\nprint(response.json())`
          : `import requests\n\npayload = ${prettyBody(payload)}\n\nresponse = requests.post(\n    "${url}",\n    headers={\n        "Authorization": "Bearer ${apiKey}",\n        "Content-Type": "application/json"\n    },\n    json=payload\n)\nprint(response.json())`,
    },
    {
      language: "ruby",
      content:
        endpoint.method === "GET"
          ? `require "net/http"\nrequire "json"\n\nuri = URI("${url}")\nrequest = Net::HTTP::Get.new(uri)\nrequest["Authorization"] = "Bearer ${apiKey}"\n\nresponse = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|\n  http.request(request)\nend\n\nputs JSON.parse(response.body)`
          : `require "net/http"\nrequire "json"\n\nuri = URI("${url}")\nrequest = Net::HTTP::Post.new(uri)\nrequest["Authorization"] = "Bearer ${apiKey}"\nrequest["Content-Type"] = "application/json"\nrequest.body = ${JSON.stringify(prettyBody(payload))}\n\nresponse = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|\n  http.request(request)\nend\n\nputs JSON.parse(response.body)`,
    },
  ];
}
