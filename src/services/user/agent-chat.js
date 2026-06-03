import { left, right } from "../../shared/either.js";

export class AgentChatService {
  constructor({ userRepository, agent }) {
    this.userRepository = userRepository;
    this.agent = agent;
  }

  async execute(input) {
    if (!input?.message?.trim()) {
      return left({ type: "VALIDATION", message: "Message is required" });
    }

    const user = await this.userRepository.loadOne({ userId: input.userId });
    if (!user) {
      return left({ type: "NOT_FOUND", message: "User not found" });
    }

    const response = await this.agent.run(
      input.userId,
      input.message.trim(),
      "web",
    );
    return right({ response: response.content });
  }
}
