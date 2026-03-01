import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/submit-file",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    const result = await ctx.runMutation(api.files.submit, {
      domain: body.domain,
      path: body.path,
      title: body.title,
      summary: body.summary,
      tags: body.tags,
      entities: body.entities,
      intent: body.intent,
      confidence: body.confidence,
      requiresAuth: body.requiresAuth,
      selectorsCount: body.selectorsCount,
      relatedFiles: body.relatedFiles,
      content: body.content,
      contributorName: body.contributorName,
      changeReason: body.changeReason,
      agentType: body.agentType,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
