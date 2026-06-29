-- Agent Orchestrator conversation state and source persistence

ALTER TABLE "Conversation"
  ADD COLUMN "activeSkillId" TEXT,
  ADD COLUMN "activeSkillVersion" TEXT,
  ADD COLUMN "activeSkillSource" TEXT,
  ADD COLUMN "activeSkillStatus" TEXT;

ALTER TABLE "Message"
  ADD COLUMN "sources" JSONB;

ALTER TABLE "Artifact"
  ADD COLUMN "metadata" JSONB;

ALTER TABLE "ConversationSkill"
  ADD COLUMN "source" TEXT,
  ADD COLUMN "statusAtActivation" TEXT,
  ADD COLUMN "confidence" DOUBLE PRECISION,
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "missingInfo" JSONB;

ALTER TABLE "ConversationSkill"
  ADD CONSTRAINT "ConversationSkill_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Conversation_activeSkillId_idx" ON "Conversation"("activeSkillId");
