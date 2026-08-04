import assert from "node:assert/strict";
import test from "node:test";
import { reviewSubmission } from "../lib/ai-review";
import { assessPostQuality } from "../lib/post-quality";
import { hasPii } from "../lib/safety";

test("blocks the reported number-and-insult post deterministically", async () => {
  const title = "02024434686바보";
  const content = "02024434686바보";
  assert.equal(hasPii(`${title} ${content}`), true);
  const quality = assessPostQuality(title, content);
  assert.equal(quality.passed, false);
  assert.ok(quality.detectedIssues.includes("제목과 본문이 같은 내용"));

  const openAiKey = process.env.OPENAI_API_KEY;
  const aiKey = process.env.AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    assert.equal((await reviewSubmission(title, content, "post")).decision, "revise");
  } finally {
    if (openAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = openAiKey;
    if (aiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = aiKey;
  }
});

test("requires enough context but keeps concise meaningful posts", () => {
  assert.equal(assessPostQuality("", "너무 힘들어요.").passed, false);
  assert.equal(assessPostQuality("", "회사에서 제 의견만 계속 빠져 속상했습니다. 다음 회의에서는 어떻게 말하면 좋을까요?").passed, true);
});

test("blocks repeated and number-heavy post bodies", () => {
  assert.equal(assessPostQuality("같은 말", "같은 말 같은 말 같은 말 같은 말 같은 말").passed, false);
  assert.equal(assessPostQuality("번호입니다", "12345678901234567890 번호만 남겨두겠습니다").passed, false);
});
