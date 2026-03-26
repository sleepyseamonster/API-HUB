import type { ApiProduct, EndpointSpec } from "@/shared/types/portal";

export const endpointRegistry: EndpointSpec[] = [
  {
    slug: "transcripts-by-id",
    title: "Get Transcript",
    path: "/v1/transcripts/{id}",
    method: "GET",
    category: "resource",
    summary: "Retrieve transcript markdown/JSON for a masterclass session.",
    description:
      "Returns transcript data for a session id in a normalized JSON shape for downstream assistant workflows.",
    creditsPerCall: 1,
    tags: ["transcripts", "curriculum", "search"],
    requestExample: {
      name: "Fetch masterclass 01",
      summary: "Use a session id to fetch markdown and metadata.",
      payload: { id: "masterclass-01", format: "json" },
    },
    responseExample: {
      status: "success",
      data: {
        id: "masterclass-01",
        title: "Masterclass: Offer Architecture",
        markdown: "# Session Notes\\n- Positioning\\n- Offer stack",
      },
      message: "Transcript fetched",
    },
  },
  {
    slug: "curriculum-week",
    title: "Get Curriculum Week",
    path: "/v1/curriculum/week-{id}",
    method: "GET",
    category: "resource",
    summary: "Return syllabus and resources for a cohort week.",
    description:
      "Provides structured curriculum details for one week, including lessons, exercises, and linked assets.",
    creditsPerCall: 1,
    tags: ["curriculum", "cohort"],
    catalogBadge: {
      tone: "warning",
      label: "In development: these API endpoints are currently in development.",
    },
    requestExample: {
      name: "Week 2",
      summary: "Load week-specific syllabus details.",
      payload: { id: 2 },
    },
    responseExample: {
      status: "success",
      data: {
        week: 2,
        title: "Outbound Foundations",
        lessons: ["Lead list quality", "Personalization prompts"],
      },
      message: "Curriculum loaded",
    },
  },
  {
    slug: "knowledge-base-search",
    title: "Knowledge Base Search",
    path: "/v1/knowledge-base/search",
    method: "GET",
    category: "resource",
    summary: "Semantic search across proprietary docs.",
    description:
      "Runs semantic retrieval on indexed curriculum and operations docs and returns scored passages.",
    creditsPerCall: 2,
    tags: ["search", "rag", "knowledge"],
    catalogBadge: {
      tone: "warning",
      label: "In development: these API endpoints are currently in development.",
    },
    requestExample: {
      name: "Find outreach strategy",
      summary: "Search with a semantic query.",
      payload: { query: "cold email opener framework", limit: 5 },
    },
    responseExample: {
      status: "success",
      data: {
        query: "cold email opener framework",
        results: [
          {
            score: 0.92,
            snippet: "Lead with context, then relevance, then one ask.",
          },
        ],
      },
      message: "Search complete",
    },
  },
  {
    slug: "scrape-website",
    title: "Scrape Website",
    path: "/v1/tools/scrape-website",
    method: "POST",
    category: "automation",
    summary: "Extract structured markdown/JSON from any URL.",
    description:
      "Triggers scraping and content normalization workflow for one or more URLs.",
    creditsPerCall: 3,
    tags: ["automation", "scraping"],
    catalogBadge: {
      tone: "warning",
      label: "In development: these API endpoints are currently in development.",
    },
    requestExample: {
      name: "Scrape single URL",
      summary: "Collect markdown output from a product page.",
      payload: {
        url: "https://example.com/pricing",
        output: "markdown",
      },
    },
    responseExample: {
      status: "success",
      data: {
        url: "https://example.com/pricing",
        title: "Pricing",
        markdown: "# Pricing\\nStarter $49...",
      },
      message: "Scrape complete",
    },
  },
  {
    slug: "analyze-doc",
    title: "Analyze Document",
    path: "/v1/tools/analyze-doc",
    method: "POST",
    category: "automation",
    summary: "Extract structured data from PDFs/images.",
    description:
      "Runs OCR + LLM extraction pipeline and returns normalized entities.",
    creditsPerCall: 4,
    tags: ["automation", "ocr", "llm"],
    catalogBadge: {
      tone: "warning",
      label: "In development: these API endpoints are currently in development.",
    },
    requestExample: {
      name: "Invoice extraction",
      summary: "Pull key invoice fields from uploaded document.",
      payload: {
        file_url: "https://cdn.example.com/invoice-1932.pdf",
        extraction_profile: "invoice_v1",
      },
    },
    responseExample: {
      status: "success",
      data: {
        vendor: "Atlas Supplies",
        total: 842.17,
        due_date: "2026-03-29",
      },
      message: "Document analyzed",
    },
  },
  {
    slug: "lead-enrichment",
    title: "Lead Enrichment",
    path: "/v1/tools/lead-enrichment",
    method: "POST",
    category: "automation",
    summary: "Turn email into company and profile attributes.",
    description:
      "Runs enrichment sequence to map contact data into account intelligence.",
    creditsPerCall: 5,
    tags: ["automation", "sales", "enrichment"],
    catalogBadge: {
      tone: "warning",
      label: "In development: these API endpoints are currently in development.",
    },
    requestExample: {
      name: "Enrich by email",
      summary: "Provide email and return profile/company metadata.",
      payload: {
        email: "sara@exampleco.com",
      },
    },
    responseExample: {
      status: "success",
      data: {
        full_name: "Sara Quinn",
        company: "ExampleCo",
        linkedin_url: "https://linkedin.com/in/saraquinn",
      },
      message: "Lead enriched",
    },
  },
  {
    slug: "local-business-search",
    title: "Local Business Search",
    path: "/v1/tools/local-business-search",
    method: "POST",
    category: "automation",
    summary: "Find local businesses by keyword and location.",
    description:
      "Searches for local businesses using a keyword and a simple text location, with optional contact enrichment.",
    creditsPerCall: 4,
    tags: ["automation", "local-search", "places", "lead-gen"],
    requestExample: {
      name: "Find Scottsdale med spas",
      summary: "Search by business keyword and city/state.",
      payload: {
        query: "med spa",
        location: "Scottsdale, AZ",
        limit: 10,
        include_contact_fields: false,
      },
    },
    responseExample: {
      status: "success",
      data: {
        query: "med spa",
        location: "Scottsdale, AZ",
        results: [
          {
            place_id: "ChIJ_example",
            name: "Example Med Spa",
            primary_type: "medical_spa",
            address: "123 Main St, Scottsdale, AZ 85251",
            latitude: 33.4942,
            longitude: -111.9261,
            rating: 4.8,
            review_count: 214,
            business_status: "OPERATIONAL",
            google_maps_uri: "https://maps.google.com/?cid=example",
            phone: null,
            website: null,
            opening_hours: null,
          },
        ],
      },
      message: "Search complete",
    },
  },
];

export const apiProducts: ApiProduct[] = [
  {
    id: "resource-library",
    name: "Resource Library",
    summary: "Programmatic access to curriculum and knowledge assets.",
    category: "resource",
    endpointSlugs: [
      "transcripts-by-id",
      "curriculum-week",
      "knowledge-base-search",
    ],
  },
  {
    id: "automation-engine",
    name: "Automation Engine",
    summary: "Workflow endpoints that trigger scraping and AI processes.",
    category: "automation",
    endpointSlugs: [
      "scrape-website",
      "analyze-doc",
      "lead-enrichment",
      "local-business-search",
    ],
  },
];

export const endpointBySlug = new Map(endpointRegistry.map((item) => [item.slug, item]));
