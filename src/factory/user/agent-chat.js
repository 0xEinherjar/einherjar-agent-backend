import Database from "../../database/client.js";
import Repository from "../../database/user-repository.js";
import Service from "../../service/user/agent-chat.js";

export const AgentChatFactory = () => {
  const database = new Database();
  const repository = new Repository(database);
  const service = new Service({ repository });
  return service;
};
