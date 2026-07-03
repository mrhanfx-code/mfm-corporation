"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(formData: FormData): Promise<void> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Validate input with zod
  const result = loginSchema.safeParse({ username, password });
  if (!result.success) {
    redirect("/login?error=validation");
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw err;
  }
}
