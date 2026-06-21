import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORY_TOOL = {
  name: "suggest_category",
  description: "Suggest a single shopping/household category for this item.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description: "A short category name, e.g. 'Furniture', 'Clothing'.",
      },
    },
    required: ["category"],
  },
};

export async function suggestCategoryForItem(
  itemId: string,
  name: string,
  link?: string | null,
) {
  try {
    const userContent = link ? `${name}\nLink: ${link}` : name;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      tools: [CATEGORY_TOOL],
      tool_choice: { type: "tool", name: "suggest_category" },
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    const category =
      toolUse && toolUse.type === "tool_use"
        ? (toolUse.input as { category?: string }).category
        : undefined;

    if (category) {
      await db.item.update({
        where: { id: itemId },
        data: { suggestedCategory: category },
      });
    }
  } catch (err) {
    // Fire-and-forget: never throw back into the request path that called this.
    console.error(`suggestCategoryForItem failed for item ${itemId}:`, err);
  }
}
