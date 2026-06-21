ALTER TABLE "Envelope"
  ADD CONSTRAINT "envelope_project_xor_goal"
  CHECK ("projectId" IS NULL OR "goalId" IS NULL);
