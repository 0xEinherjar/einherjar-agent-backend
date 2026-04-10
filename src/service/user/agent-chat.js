import { left, right } from "../../shared/either.js";
import { Agent } from "../../lib/agent.js";

export default class AgentChatService {
  constructor({ repository }) {
    this.repository = repository;
    this.agent = new Agent();
  }

  async execute(input) {
    if (!input.message || !input.message.trim()) {
      return left({ type: "VALIDATION", message: "Message is required" });
    }

    const user = await this.repository.loadOne({ userId: input.userId });
    if (!user) {
      return left({ type: "NOT_FOUND", message: "User not found" });
    }

    const response = await this.agent.run(input.userId, input.message.trim(), "web");
    return right({ response });
  }
}
