import { z } from "zod";

export const knowledgeFrontmatterSchema = z.object({
  title: z.string(),
  domain: z.string(),
  path: z.string(),
  summary: z.string().max(300),
  tags: z.array(z.string()),
  entities: z.object({
    primary: z.string(),
    disambiguation: z.string(),
    related_concepts: z.array(z.string()),
  }),
  intent: z.object({
    core_question: z.string(),
    audience: z.enum(["browser-agent", "coding-agent", "human", "any"]),
  }),
  confidence: z.enum(["low", "medium", "high"]),
  requires_auth: z.boolean(),
  selectors_count: z.number().int().min(0).optional(),
  related_files: z.array(z.string()).default([]),
  version: z.number().int().positive(),
  last_updated: z.string().datetime(),
  last_contributor: z.string(),
  last_change_reason: z.string(),
});

export type KnowledgeFrontmatter = z.infer<typeof knowledgeFrontmatterSchema>;
