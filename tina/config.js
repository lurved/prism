import { defineConfig } from "tinacms";

export default defineConfig({
  branch: process.env.GITHUB_BRANCH || "main",
  clientId: process.env.TINA_PUBLIC_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,

  build: {
    outputFolder: "admin",
    publicFolder: "_site",
  },

  media: {
    tina: {
      mediaRoot: "notes/images",
      publicFolder: ".",
    },
  },

  schema: {
    collections: [
      {
        name: "notes",
        label: "Notes",
        path: "notes",
        match: { include: "*.md", exclude: "notes" },
        format: "md",
        fields: [
          {
            name: "title",
            label: "Title",
            type: "string",
            description: "Leave empty for inline notes",
          },
          {
            name: "description",
            label: "Description",
            type: "string",
            ui: { component: "textarea" },
            description: "Excerpt shown in the feed",
          },
          {
            name: "date",
            label: "Date",
            type: "datetime",
            required: true,
          },
          {
            name: "tag",
            label: "Tag",
            type: "string",
            options: ["AI", "Design", "Product", "Data", "Tools"],
          },
          {
            name: "inline",
            label: "Inline note",
            type: "boolean",
            description: "Short thought shown in full on the feed — no title or separate page",
          },
          {
            name: "body",
            label: "Body",
            type: "rich-text",
            isBody: true,
          },
        ],
      },
    ],
  },
});
