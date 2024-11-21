"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ required_error: "Please select a customer" }),
  amount: z.coerce.number().gt(0, { message: "Please enter a valid amount" }),
  status: z.enum(["paid", "pending"], {
    message: "Please select an invoice status",
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(_prevState: State, formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = CreateInvoice.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Incorrect fields. Failed to create invoice.",
      };
    }

    const { customerId, amount, status } = validatedFields.data;

    const amountInCents = amount * 100;
    const date = new Intl.DateTimeFormat("sv-SE").format(new Date());

    const data = await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      RETURNING *;
    `;
    console.log("✅ Created Invoice", { ...data.rows[0] });

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.error("🛑 Error creating invoice", error);
    return { message: "Database Error: Failed to create Invoice." };
  }
  redirect("/dashboard/invoices");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = UpdateInvoice.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Incorrect fields. Failed to update invoice.",
      };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    const data = await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
      RETURNING *;
    `;
    console.log("✅ Updated Invoice", { ...data.rows[0] });

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.error("🛑 Error updating invoice", error);
    return { message: "Database Error: Failed to update Invoice." };
  }
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id};
    `;
    console.log("✅ Deleted Invoice", { id });

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.error("🛑 Error deleting invoice", error);
    throw "Database Error: Failed to Delete Invoice.";
  }
}
