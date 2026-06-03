import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../libraries/auth.js";

export default async function (request, response, next) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
    if (!session?.user) {
      return response.status(401).json({ error: "Unauthorized" });
    }
    request.user = session.user;
    return next();
  } catch (_) {
    return response.status(401).json({ error: "Unauthorized" });
  }
};
