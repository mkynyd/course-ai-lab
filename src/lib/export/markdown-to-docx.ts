import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import type { Content, PhrasingContent, Root } from "mdast";
import { markdownNodeText, parseMarkdown } from "@/lib/export/markdown-ast";

function inlineRuns(nodes: PhrasingContent[]): TextRun[] {
  return nodes.flatMap((node) => {
    if (node.type === "text") return [new TextRun(node.value)];
    if (node.type === "inlineCode") {
      return [new TextRun({ text: node.value, font: "Courier New" })];
    }
    if (node.type === "strong") {
      return [new TextRun({ text: markdownNodeText(node), bold: true })];
    }
    if (node.type === "emphasis") {
      return [new TextRun({ text: markdownNodeText(node), italics: true })];
    }
    if (node.type === "break") return [new TextRun({ text: "", break: 1 })];
    if ("children" in node) {
      return inlineRuns(node.children as PhrasingContent[]);
    }
    return [new TextRun(markdownNodeText(node as unknown))];
  });
}

function paragraphFromNode(node: Content, prefix = ""): Paragraph {
  const children =
    "children" in node
      ? inlineRuns(node.children as PhrasingContent[])
      : [new TextRun(markdownNodeText(node))];
  if (prefix) children.unshift(new TextRun(prefix));
  return new Paragraph({ children });
}

function blocks(root: Root): Array<Paragraph | Table> {
  const output: Array<Paragraph | Table> = [];

  for (const node of root.children) {
    if (node.type === "heading") {
      const levels = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      } as const;
      output.push(
        new Paragraph({
          heading: levels[node.depth],
          children: inlineRuns(node.children),
        })
      );
    } else if (node.type === "paragraph") {
      output.push(paragraphFromNode(node));
    } else if (node.type === "code") {
      output.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                node.lang === "mermaid"
                  ? `Mermaid 源码\n${node.value}`
                  : node.value,
              font: "Courier New",
            }),
          ],
          shading: { fill: "F3F4F6" },
        })
      );
    } else if (node.type === "blockquote") {
      for (const child of node.children) {
        output.push(paragraphFromNode(child, "引用："));
      }
    } else if (node.type === "list") {
      node.children.forEach((item) => {
        item.children.forEach((child) => {
          output.push(
            new Paragraph({
              children:
                "children" in child
                  ? inlineRuns(child.children as PhrasingContent[])
                  : [new TextRun(markdownNodeText(child))],
              bullet: node.ordered ? undefined : { level: 0 },
              numbering: node.ordered
                ? { reference: "artifact-numbering", level: 0 }
                : undefined,
            })
          );
        });
      });
    } else if (node.type === "table") {
      output.push(
        new Table({
          rows: node.children.map(
            (row) =>
              new TableRow({
                children: row.children.map(
                  (cell) =>
                    new TableCell({
                      children: [paragraphFromNode(cell)],
                    })
                ),
              })
          ),
        })
      );
    } else if (node.type === "thematicBreak") {
      output.push(
        new Paragraph({
          border: {
            bottom: {
              color: "B8B8B8",
              style: BorderStyle.SINGLE,
              size: 4,
            },
          },
        })
      );
    } else {
      output.push(new Paragraph(markdownNodeText(node)));
    }
  }
  return output;
}

export async function markdownToDocx(content: string): Promise<Buffer> {
  const document = new Document({
    numbering: {
      config: [
        {
          reference: "artifact-numbering",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: "start",
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: "Noto Sans SC", size: 22 },
        },
      },
    },
    sections: [{ children: blocks(parseMarkdown(content)) }],
  });
  return Packer.toBuffer(document);
}
