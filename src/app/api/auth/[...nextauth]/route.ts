import NextAuth from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "~/server/auth";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Add a new handler for logout
export const logoutHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  await NextAuth(req, res, { ...authOptions, pages: { signOut: "/logout" } });
};

// Export the logout handler
export { logoutHandler as DELETE };
