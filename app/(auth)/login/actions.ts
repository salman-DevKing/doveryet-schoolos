"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function signInAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.type === "CredentialsSignin" ? "Invalid email or password." : "Sign in failed." };
    }
    throw err; // Next.js redirect error passes through
  }
}
