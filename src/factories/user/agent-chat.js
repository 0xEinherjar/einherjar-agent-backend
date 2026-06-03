import { MongoDatabase } from "../../database/mongodb.js";
import { Agent } from "../../libraries/agent.js";
import { UserRepository } from "../../repositories/user.js";
import { AgentChatService } from "../../services/user/agent-chat.js";

export const AgentChatFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const agent = new Agent();
  return new AgentChatService({ userRepository, agent });
};
