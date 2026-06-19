import { redirect } from "next/navigation";
import { PdfConvertClient } from "@/components/tools/pdf-convert-client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const conversions = await prisma.documentConversion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      originalName: true,
      status: true,
      pageCount: true,
      createdAt: true,
    },
  });

  return (
    <PdfConvertClient
      conversions={conversions.map((conversion) => ({
        ...conversion,
        createdAt: conversion.createdAt.toISOString(),
      }))}
    />
  );
}
